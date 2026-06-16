/**
 * G(Old) Design System - Colors
 * Philosophy: Warm authority, Accessible first, Trust through restraint
 */

// Brand - Gold Palette (PRIMARY: #BA7517)
export const gold = {
  50: "#FAEEDA",
  100: "#FAC775",
  200: "#EF9F27",
  400: "#BA7517", // PRIMARY BRAND COLOR
  600: "#854F0B",
  800: "#633806",
  900: "#412402",
};

// Neutral - Warm Gray Palette (primary UI colors)
export const neutral = {
  50: "#FAFAF8",   // Warm off-white background
  100: "#F5F5F2",  // Subtle surface
  200: "#E8E8E3",  // Dividers, borders
  300: "#D1D1C9",  // Disabled states
  400: "#A8A89E",  // Placeholder text
  500: "#7A7A6E",  // Muted text (improved from #6B6B61 for better contrast)
  600: "#4A4A42",  // Secondary text
  700: "#2E2E28",  // Headings
  800: "#1C1C18",  // High emphasis
  900: "#0F0F0D",  // Maximum contrast
};

// Semantic Colors
export const semantic = {
  success: "#2D7A3E",      // Green for positive actions
  successMuted: "#E8F5EA", // Light green background
  warning: "#C77A1A",      // Amber for warnings
  warningMuted: "#FEF3E8", // Light amber background
  error: "#C73A1A",        // Red for errors
  errorMuted: "#FDEAE8",   // Light red background
  info: "#1A5C9E",         // Blue for info
  infoMuted: "#E8F1F9",    // Light blue background
};

// Light Theme (Default)
export const light = {
  // Backgrounds
  background: neutral[50],        // #FAFAF8 - Never pure white
  surface: neutral[100],          // #F5F5F2 - Cards, elevated surfaces
  surfaceElevated: "#FFFFFF",     // Only for modals/overlays

  // Brand
  primary: gold[400],             // #BA7517 - PRIMARY BRAND COLOR
  primaryMuted: gold[100],        // #FAC775 - Light gold backgrounds

  // Text
  textPrimary: neutral[700],      // #2E2E28 - Headings, high emphasis
  textSecondary: neutral[600],    // #4A4A42 - Body text (≥16px)
  textMuted: neutral[500],        // #6B6B61 - Supporting text

  // Borders & Dividers
  divider: neutral[200],          // #E8E8E3
  border: neutral[300],           // #D1D1C9

  // Tab Bar
  tabBarActive: "#BA7517",
  tabBarInactive: "#9E9B91",
  tabBarBackground: "#FFFFFF",
  tabBarBorder: "rgba(26, 25, 22, 0.10)",

  // Overlay
  overlay: "rgba(15, 15, 13, 0.5)", // Dark overlay with warmth

  // Semantic
  success: semantic.success,
  successMuted: semantic.successMuted,
  warning: semantic.warning,
  warningMuted: semantic.warningMuted,
  error: semantic.error,
  errorMuted: semantic.errorMuted,
  info: semantic.info,
  infoMuted: semantic.infoMuted,
};

// Dark Theme (Optional - for future)
export const dark = {
  background: "#1C1C18",
  surface: "#2E2E28",
  surfaceElevated: "#3A3A32",

  primary: gold[100],             // #FAC775 - Lighter gold for dark mode
  primaryMuted: "rgba(250, 199, 117, 0.15)",

  textPrimary: "#FAFAF8",         // Light warm white for headings
  textSecondary: "#D1D1C9",       // Light warm gray for body text
  textMuted: "#A8A89E",           // Medium warm gray for muted text

  divider: "rgba(232, 232, 227, 0.1)",
  border: "rgba(232, 232, 227, 0.15)",

  tabBarActive: "#BA7517",        // Gold stays gold
  tabBarInactive: "#5A5750",
  tabBarBackground: "#1A1916",
  tabBarBorder: "rgba(242, 241, 237, 0.10)",

  overlay: "rgba(0, 0, 0, 0.7)",

  success: "#4CAF50",
  successMuted: "rgba(76, 175, 80, 0.15)",
  warning: "#F59E0B",
  warningMuted: "rgba(245, 158, 11, 0.15)",
  error: "#EF4444",
  errorMuted: "rgba(239, 68, 68, 0.15)",
  info: "#3B82F6",
  infoMuted: "rgba(59, 130, 246, 0.15)",
};

export const colors = light;
export type ThemeColors = typeof light;