# Terminology Refactor Migration

This migration script refactors the database from "Freelancer/Client" terminology to "Expert/User" terminology.

## Overview

The migration performs the following operations:
1. **Pre-migration validation** - Verifies database connection, backup space, collection existence, and permissions
2. **Backup creation** - Creates timestamped backups of `users` and `expertprofiles` collections
3. **User role migration** - Updates role field values from "freelancer" → "expert" and "client" → "user"
4. **Collection rename** - Renames `freelancerprofiles` collection to `expertprofiles`
5. **Verification** - Confirms all changes were applied successfully

## Requirements

- Node.js environment with MongoDB connection
- `MONGODB_URI` environment variable configured in `.env`
- Sufficient disk space for backup files
- Database user with read/write permissions

## Usage

### 1. Validate Pre-Migration Requirements

Before running the migration, validate that all requirements are met:

```bash
cd backend
node src/migrations/terminology-refactor.js validate
```

This checks:
- ✓ Database connection is active
- ✓ Backup directory is accessible
- ✓ Required collections exist
- ✓ Database write permissions are sufficient

### 2. Run Migration

Execute the full migration process:

```bash
cd backend
node src/migrations/terminology-refactor.js migrate
```

The migration will:
- Create timestamped backups in `backend/backups/`
- Update all user role fields
- Rename the collection
- Verify all changes
- **Automatically rollback if any step fails**

### 3. Rollback (If Needed)

If you need to revert the migration:

```bash
cd backend
node src/migrations/terminology-refactor.js rollback
```

This restores the database to its pre-migration state using the most recent backup files.

## Backup Files

Backups are stored in `backend/backups/` with timestamped filenames:
- `users_backup_YYYY-MM-DDTHH-MM-SS-mmmZ.json`
- `expertprofiles_backup_YYYY-MM-DDTHH-MM-SS-mmmZ.json`

**Important:** Keep backup files until you verify the migration was successful in production.

## Migration Details

### User Role Updates

| Before      | After     | Count |
|-------------|-----------|-------|
| freelancer  | expert    | (logged) |
| client      | user      | (logged) |
| admin       | admin     | (unchanged) |

### Collection Rename

- **Source:** `freelancerprofiles`
- **Target:** `expertprofiles`
- **Process:** Copy all documents → Verify count → Drop source collection

## Error Handling

The migration includes comprehensive error handling:

1. **Pre-migration validation failures** - Migration aborts before making any changes
2. **Backup failures** - Migration aborts without modifying data
3. **Migration failures** - Automatic rollback to pre-migration state
4. **Verification failures** - Automatic rollback and error reporting

## Logging

All operations are logged with timestamps and severity levels:
- `[INFO]` - Normal operation steps
- `[SUCCESS]` - Successful operations
- `[WARNING]` - Non-critical issues
- `[ERROR]` - Failures requiring attention

## Safety Features

✅ **Pre-migration validation** prevents running on unprepared systems
✅ **Timestamped backups** allow point-in-time recovery
✅ **Automatic rollback** on failures
✅ **Document count verification** ensures data integrity
✅ **Idempotent operations** allow safe re-runs

## Testing

The migration script exports functions for testing:

```javascript
const {
  validatePreMigration,
  createBackups,
  migrateUserRoles,
  renameCollection,
  verifyMigration,
  rollback
} = require('./terminology-refactor');
```

## Production Checklist

Before running in production:

- [ ] Run `validate` command successfully
- [ ] Test migration on staging environment
- [ ] Verify backup directory has sufficient space
- [ ] Schedule maintenance window
- [ ] Notify users of downtime
- [ ] Create manual database backup (additional safety)
- [ ] Run migration during low-traffic period
- [ ] Verify application functions correctly after migration
- [ ] Keep backup files for at least 7 days

## Troubleshooting

### "Database connection is not active"
- Verify `MONGODB_URI` is set in `.env`
- Check database server is running
- Verify network connectivity

### "Insufficient disk space"
- Clear old backup files
- Ensure backup directory is writable
- Check available disk space

### "Collection does not exist"
- Verify you're connected to the correct database
- Check collection names (case-sensitive)

### Migration failed with automatic rollback
- Review error logs
- Fix the underlying issue
- Re-run validation
- Retry migration

## Manual Rollback (Emergency)

If automatic rollback fails, manually restore from backup:

```javascript
const fs = require('fs');
const mongoose = require('mongoose');

// Load backup
const backupData = JSON.parse(fs.readFileSync('backend/backups/users_backup_[timestamp].json'));

// Restore to database
await mongoose.connection.db.collection('users').deleteMany({});
await mongoose.connection.db.collection('users').insertMany(backupData);
```

## Related Tasks

This migration script implements:
- **Requirement 7.4** - Database backup before migration
- **Requirement 11.5** - Rollback capability logging

See `tasks.md` for full implementation plan.
