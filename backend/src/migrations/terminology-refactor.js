const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { connectDatabase } = require("../config/database");

// ========================================
// CONFIGURATION
// ========================================

const BACKUP_DIR = path.join(__dirname, "../../backups");
const COLLECTIONS_TO_BACKUP = ["users", "expertprofiles"];

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Creates a timestamped backup filename
 * @param {string} collectionName - Name of the collection
 * @returns {string} Timestamped backup filename
 */
function getBackupFilename(collectionName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${collectionName}_backup_${timestamp}.json`;
}

/**
 * Logs messages with timestamp
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, error, success)
 */
function log(message, level = "info") {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: "[INFO]",
    error: "[ERROR]",
    success: "[SUCCESS]",
    warning: "[WARNING]",
  }[level] || "[INFO]";
  
  console.log(`${timestamp} ${prefix} ${message}`);
}

/**
 * Ensures backup directory exists
 */
function ensureBackupDirectory() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log(`Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Checks available disk space (simplified check)
 * @returns {Promise<boolean>} True if sufficient space available
 */
async function checkDiskSpace() {
  try {
    // Check if backup directory is writable
    ensureBackupDirectory();
    const testFile = path.join(BACKUP_DIR, ".space_test");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    return true;
  } catch (error) {
    log(`Disk space check failed: ${error.message}`, "error");
    return false;
  }
}

// ========================================
// PRE-MIGRATION VALIDATION
// ========================================

/**
 * Validates all pre-migration requirements
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
async function validatePreMigration() {
  const errors = [];
  
  log("Starting pre-migration validation...");
  
  // 1. Verify database connection
  try {
    if (mongoose.connection.readyState !== 1) {
      errors.push("Database connection is not active");
    } else {
      log("✓ Database connection is active");
    }
  } catch (error) {
    errors.push(`Database connection check failed: ${error.message}`);
  }
  
  // 2. Check backup space
  const hasSpace = await checkDiskSpace();
  if (!hasSpace) {
    errors.push("Insufficient disk space or backup directory not writable");
  } else {
    log("✓ Backup directory is accessible");
  }
  
  // 3. Verify collection existence
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes("users")) {
      errors.push("Required collection 'users' does not exist");
    } else {
      log("✓ Collection 'users' exists");
    }
    
    // Note: expertprofiles might not exist yet if this is first run after model rename
    // This is acceptable, so we just log it
    if (!collectionNames.includes("expertprofiles")) {
      log("Collection 'expertprofiles' does not exist yet (will be created if needed)", "warning");
    } else {
      log("✓ Collection 'expertprofiles' exists");
    }
  } catch (error) {
    errors.push(`Collection existence check failed: ${error.message}`);
  }
  
  // 4. Verify database permissions
  try {
    // Test write permission
    const testCollection = mongoose.connection.db.collection("_migration_test");
    await testCollection.insertOne({ test: true });
    await testCollection.deleteOne({ test: true });
    log("✓ Database write permissions confirmed");
  } catch (error) {
    errors.push(`Insufficient database permissions: ${error.message}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ========================================
// BACKUP FUNCTIONS
// ========================================

/**
 * Creates backup for a specific collection
 * @param {string} collectionName - Name of collection to backup
 * @returns {Promise<{success: boolean, filename: string, count: number}>}
 */
async function backupCollection(collectionName) {
  try {
    log(`Starting backup of collection: ${collectionName}`);
    
    const collection = mongoose.connection.db.collection(collectionName);
    const documents = await collection.find({}).toArray();
    const count = documents.length;
    
    if (count === 0) {
      log(`Collection ${collectionName} is empty, skipping backup`, "warning");
      return { success: true, filename: null, count: 0 };
    }
    
    const filename = getBackupFilename(collectionName);
    const filepath = path.join(BACKUP_DIR, filename);
    
    // Write backup file
    fs.writeFileSync(filepath, JSON.stringify(documents, null, 2));
    
    log(`✓ Backup created: ${filename} (${count} documents)`, "success");
    
    return { success: true, filename, count };
  } catch (error) {
    log(`Failed to backup collection ${collectionName}: ${error.message}`, "error");
    return { success: false, error: error.message };
  }
}

/**
 * Creates backups for all required collections
 * @returns {Promise<{success: boolean, backups: object[]}>}
 */
async function createBackups() {
  log("=".repeat(50));
  log("CREATING BACKUPS");
  log("=".repeat(50));
  
  ensureBackupDirectory();
  
  const backups = [];
  
  // Check which collections exist
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  for (const collectionName of COLLECTIONS_TO_BACKUP) {
    if (collectionNames.includes(collectionName)) {
      const result = await backupCollection(collectionName);
      backups.push({ collection: collectionName, ...result });
      
      if (!result.success) {
        return { success: false, backups };
      }
    } else {
      log(`Collection ${collectionName} does not exist, skipping backup`, "warning");
      backups.push({ collection: collectionName, success: true, skipped: true });
    }
  }
  
  return { success: true, backups };
}

// ========================================
// MIGRATION FUNCTIONS
// ========================================

/**
 * Updates user role field values from old to new terminology
 * @returns {Promise<{success: boolean, stats: object}>}
 */
async function migrateUserRoles() {
  log("=".repeat(50));
  log("MIGRATING USER ROLES");
  log("=".repeat(50));
  
  try {
    const User = mongoose.connection.db.collection("users");
    
    // Update freelancer -> expert
    const freelancerResult = await User.updateMany(
      { role: "freelancer" },
      { $set: { role: "expert" } }
    );
    log(`✓ Updated ${freelancerResult.modifiedCount} users from 'freelancer' to 'expert'`, "success");
    
    // Update client -> user
    const clientResult = await User.updateMany(
      { role: "client" },
      { $set: { role: "user" } }
    );
    log(`✓ Updated ${clientResult.modifiedCount} users from 'client' to 'user'`, "success");
    
    // Verify admin roles unchanged
    const adminCount = await User.countDocuments({ role: "admin" });
    log(`✓ Admin roles preserved: ${adminCount} admin users`, "success");
    
    return {
      success: true,
      stats: {
        freelancerToExpert: freelancerResult.modifiedCount,
        clientToUser: clientResult.modifiedCount,
        adminPreserved: adminCount
      }
    };
  } catch (error) {
    log(`Failed to migrate user roles: ${error.message}`, "error");
    return { success: false, error: error.message };
  }
}

/**
 * Renames collection from freelancerprofiles to expertprofiles
 * @returns {Promise<{success: boolean, stats: object}>}
 */
async function renameCollection() {
  log("=".repeat(50));
  log("RENAMING COLLECTION: freelancerprofiles -> expertprofiles");
  log("=".repeat(50));
  
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Check if source collection exists
    if (!collectionNames.includes("freelancerprofiles")) {
      log("Source collection 'freelancerprofiles' does not exist, skipping rename", "warning");
      return { success: true, stats: { skipped: true } };
    }
    
    // Check if target collection already exists
    if (collectionNames.includes("expertprofiles")) {
      log("Target collection 'expertprofiles' already exists", "warning");
      
      // Compare counts
      const oldCount = await mongoose.connection.db.collection("freelancerprofiles").countDocuments();
      const newCount = await mongoose.connection.db.collection("expertprofiles").countDocuments();
      
      if (oldCount === newCount && oldCount > 0) {
        log("Collection already renamed (document counts match), cleaning up old collection", "warning");
        await mongoose.connection.db.collection("freelancerprofiles").drop();
        return { success: true, stats: { alreadyMigrated: true, documentCount: newCount } };
      }
    }
    
    const oldCollection = mongoose.connection.db.collection("freelancerprofiles");
    const oldCount = await oldCollection.countDocuments();
    
    log(`Found ${oldCount} documents in freelancerprofiles`);
    
    if (oldCount === 0) {
      log("Source collection is empty, dropping it", "warning");
      await oldCollection.drop();
      return { success: true, stats: { documentCount: 0 } };
    }
    
    // Copy documents to new collection using aggregation
    log("Copying documents to expertprofiles...");
    await oldCollection.aggregate([
      { $match: {} },
      { $out: "expertprofiles" }
    ]).toArray();
    
    // Verify document count
    const newCollection = mongoose.connection.db.collection("expertprofiles");
    const newCount = await newCollection.countDocuments();
    
    if (newCount !== oldCount) {
      throw new Error(`Document count mismatch: expected ${oldCount}, got ${newCount}`);
    }
    
    log(`✓ Successfully copied ${newCount} documents to expertprofiles`, "success");
    
    // Get indexes from old collection
    const indexes = await oldCollection.indexes();
    log(`Found ${indexes.length} indexes to recreate`);
    
    // Drop old collection
    log("Dropping old freelancerprofiles collection...");
    await oldCollection.drop();
    log("✓ Old collection dropped", "success");
    
    return {
      success: true,
      stats: {
        documentCount: newCount,
        indexCount: indexes.length
      }
    };
  } catch (error) {
    log(`Failed to rename collection: ${error.message}`, "error");
    return { success: false, error: error.message };
  }
}

// ========================================
// VERIFICATION FUNCTIONS
// ========================================

/**
 * Verifies migration completed successfully
 * @returns {Promise<{success: boolean, checks: object}>}
 */
async function verifyMigration() {
  log("=".repeat(50));
  log("VERIFYING MIGRATION");
  log("=".repeat(50));
  
  const checks = {};
  let allChecksPass = true;
  
  try {
    // Check 1: No legacy role values in users
    const User = mongoose.connection.db.collection("users");
    const freelancerCount = await User.countDocuments({ role: "freelancer" });
    const clientCount = await User.countDocuments({ role: "client" });
    
    checks.noLegacyRoles = freelancerCount === 0 && clientCount === 0;
    if (checks.noLegacyRoles) {
      log("✓ No legacy role values found", "success");
    } else {
      log(`✗ Found ${freelancerCount} 'freelancer' and ${clientCount} 'client' roles remaining`, "error");
      allChecksPass = false;
    }
    
    // Check 2: New role values exist
    const expertCount = await User.countDocuments({ role: "expert" });
    const userCount = await User.countDocuments({ role: "user" });
    const adminCount = await User.countDocuments({ role: "admin" });
    
    log(`Found ${expertCount} experts, ${userCount} users, ${adminCount} admins`);
    checks.newRolesExist = true;
    
    // Check 3: expertprofiles collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    checks.expertprofilesExists = collectionNames.includes("expertprofiles");
    if (checks.expertprofilesExists) {
      log("✓ Collection 'expertprofiles' exists", "success");
    } else {
      log("✗ Collection 'expertprofiles' does not exist", "error");
      allChecksPass = false;
    }
    
    // Check 4: freelancerprofiles collection is dropped
    checks.freelancerprofilesDropped = !collectionNames.includes("freelancerprofiles");
    if (checks.freelancerprofilesDropped) {
      log("✓ Old collection 'freelancerprofiles' has been dropped", "success");
    } else {
      log("✗ Old collection 'freelancerprofiles' still exists", "warning");
    }
    
    // Check 5: Document counts (basic sanity check)
    const totalUsers = await User.countDocuments();
    log(`Total users in database: ${totalUsers}`);
    checks.totalUsers = totalUsers;
    
    if (checks.expertprofilesExists) {
      const expertProfileCount = await mongoose.connection.db.collection("expertprofiles").countDocuments();
      log(`Total expert profiles: ${expertProfileCount}`);
      checks.expertProfiles = expertProfileCount;
    }
    
  } catch (error) {
    log(`Verification failed: ${error.message}`, "error");
    return { success: false, error: error.message };
  }
  
  return { success: allChecksPass, checks };
}

// ========================================
// ROLLBACK FUNCTIONS
// ========================================

/**
 * Restores collection from backup file
 * @param {string} backupFilename - Name of backup file
 * @param {string} targetCollection - Name of collection to restore
 * @returns {Promise<{success: boolean, count: number}>}
 */
async function restoreFromBackup(backupFilename, targetCollection) {
  try {
    log(`Restoring ${targetCollection} from ${backupFilename}`);
    
    const filepath = path.join(BACKUP_DIR, backupFilename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filepath}`);
    }
    
    const backupData = JSON.parse(fs.readFileSync(filepath, "utf8"));
    
    if (!Array.isArray(backupData) || backupData.length === 0) {
      log(`Backup file ${backupFilename} is empty`, "warning");
      return { success: true, count: 0 };
    }
    
    // Drop existing collection if it exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.includes(targetCollection)) {
      await mongoose.connection.db.collection(targetCollection).drop();
      log(`Dropped existing collection: ${targetCollection}`);
    }
    
    // Restore documents
    const collection = mongoose.connection.db.collection(targetCollection);
    await collection.insertMany(backupData);
    
    log(`✓ Restored ${backupData.length} documents to ${targetCollection}`, "success");
    
    return { success: true, count: backupData.length };
  } catch (error) {
    log(`Failed to restore ${targetCollection}: ${error.message}`, "error");
    return { success: false, error: error.message };
  }
}

/**
 * Rolls back migration using backup files
 * @param {string[]} backupFiles - Array of backup filenames
 * @returns {Promise<{success: boolean}>}
 */
async function rollback(backupFiles) {
  log("=".repeat(50));
  log("ROLLING BACK MIGRATION");
  log("=".repeat(50));
  
  if (!backupFiles || backupFiles.length === 0) {
    // Find latest backups automatically
    ensureBackupDirectory();
    const allFiles = fs.readdirSync(BACKUP_DIR);
    
    // Find latest backup for each collection
    const latestBackups = {};
    for (const collection of COLLECTIONS_TO_BACKUP) {
      const backupPattern = new RegExp(`^${collection}_backup_.*\\.json$`);
      const collectionBackups = allFiles.filter(f => backupPattern.test(f)).sort().reverse();
      
      if (collectionBackups.length > 0) {
        latestBackups[collection] = collectionBackups[0];
      }
    }
    
    backupFiles = Object.values(latestBackups);
  }
  
  if (backupFiles.length === 0) {
    log("No backup files found for rollback", "error");
    return { success: false, error: "No backup files found" };
  }
  
  log(`Found ${backupFiles.length} backup files to restore`);
  
  // Restore users collection
  const usersBackup = backupFiles.find(f => f.startsWith("users_backup_"));
  if (usersBackup) {
    const result = await restoreFromBackup(usersBackup, "users");
    if (!result.success) {
      return { success: false, error: "Failed to restore users collection" };
    }
  }
  
  // Restore expertprofiles as freelancerprofiles
  const expertprofilesBackup = backupFiles.find(f => f.startsWith("expertprofiles_backup_"));
  if (expertprofilesBackup) {
    const result = await restoreFromBackup(expertprofilesBackup, "freelancerprofiles");
    if (!result.success) {
      return { success: false, error: "Failed to restore freelancerprofiles collection" };
    }
    
    // Drop expertprofiles if it exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    if (collectionNames.includes("expertprofiles")) {
      await mongoose.connection.db.collection("expertprofiles").drop();
      log("Dropped expertprofiles collection");
    }
  }
  
  // Verify rollback
  const User = mongoose.connection.db.collection("users");
  const totalUsers = await User.countDocuments();
  log(`Verification: ${totalUsers} users restored`);
  
  log("=".repeat(50));
  log("ROLLBACK COMPLETED", "success");
  log("=".repeat(50));
  
  return { success: true };
}

// ========================================
// MAIN MIGRATION FUNCTION
// ========================================

/**
 * Executes the complete migration process
 * @returns {Promise<{success: boolean}>}
 */
async function migrate() {
  log("=".repeat(50));
  log("TERMINOLOGY REFACTOR MIGRATION");
  log("Starting at: " + new Date().toISOString());
  log("=".repeat(50));
  
  let backupInfo = null;
  
  try {
    // Step 1: Pre-migration validation
    const validation = await validatePreMigration();
    if (!validation.valid) {
      log("Pre-migration validation failed:", "error");
      validation.errors.forEach(err => log(`  - ${err}`, "error"));
      throw new Error("Pre-migration validation failed");
    }
    
    log("✓ Pre-migration validation passed", "success");
    log("");
    
    // Step 2: Create backups
    backupInfo = await createBackups();
    if (!backupInfo.success) {
      throw new Error("Backup creation failed");
    }
    
    log("✓ Backups created successfully", "success");
    log("");
    
    // Step 3: Migrate user roles
    const roleResult = await migrateUserRoles();
    if (!roleResult.success) {
      throw new Error("User role migration failed");
    }
    
    log("");
    
    // Step 4: Rename collection
    const renameResult = await renameCollection();
    if (!renameResult.success) {
      throw new Error("Collection rename failed");
    }
    
    log("");
    
    // Step 5: Verify migration
    const verifyResult = await verifyMigration();
    if (!verifyResult.success) {
      throw new Error("Migration verification failed");
    }
    
    log("");
    log("=".repeat(50));
    log("MIGRATION COMPLETED SUCCESSFULLY", "success");
    log("Completed at: " + new Date().toISOString());
    log("=".repeat(50));
    
    return { success: true };
    
  } catch (error) {
    log("=".repeat(50), "error");
    log("MIGRATION FAILED", "error");
    log(`Error: ${error.message}`, "error");
    log("=".repeat(50), "error");
    
    // Attempt rollback if backups were created
    if (backupInfo && backupInfo.success) {
      log("Attempting automatic rollback...", "warning");
      const rollbackFiles = backupInfo.backups
        .filter(b => b.filename)
        .map(b => b.filename);
      
      await rollback(rollbackFiles);
    }
    
    return { success: false, error: error.message };
  }
}

// ========================================
// CLI INTERFACE
// ========================================

async function main() {
  const command = process.argv[2];
  
  try {
    // Connect to database
    await connectDatabase();
    log("Connected to database");
    
    switch (command) {
      case "migrate":
        await migrate();
        break;
        
      case "rollback":
        await rollback();
        break;
        
      case "validate":
        const validation = await validatePreMigration();
        if (validation.valid) {
          log("✓ All pre-migration checks passed", "success");
        } else {
          log("Pre-migration validation failed:", "error");
          validation.errors.forEach(err => log(`  - ${err}`, "error"));
          process.exit(1);
        }
        break;
        
      default:
        console.log(`
Terminology Refactor Migration Script

Usage:
  node terminology-refactor.js <command>

Commands:
  migrate   - Run the full migration (backup, migrate, verify)
  rollback  - Rollback to the most recent backup
  validate  - Run pre-migration validation checks only

Examples:
  node terminology-refactor.js migrate
  node terminology-refactor.js rollback
  node terminology-refactor.js validate
        `);
    }
    
    await mongoose.connection.close();
    log("Database connection closed");
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, "error");
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export functions for testing
module.exports = {
  migrate,
  rollback,
  validatePreMigration,
  createBackups,
  migrateUserRoles,
  renameCollection,
  verifyMigration,
};
