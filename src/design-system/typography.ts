/**
 * G(Old) Design System - Typography
 * 
 * Fonts:
 * - Fraunces (serif) - Display, headings, emphasis
 * - DM Sans (sans-serif) - UI, body text, labels
 * 
 * Accessibility: All body text ≥16px
 */

import { TextStyle } from "react-native";

// Font Families
export const fontFamily = {
  // Fraunces - Serif for display and headings
  displayBlack: "Fraunces_900Black",
  displayBold: "Fraunces_700Bold",
  displaySemiBold: "Fraunces_600SemiBold",
  displayMedium: "Fraunces_500Medium",
  displayRegular: "Fraunces_400Regular",

  // DM Sans - Sans-serif for UI and body
  sansRegular: "DMSans_400Regular",
  sansMedium: "DMSans_500Medium",
  sansSemiBold: "DMSans_700Bold",
  sansBold: "DMSans_700Bold",
};

// Type Scale (Mobile-first)
export const typography = {
  // Display - Fraunces (for hero sections, major headings)
  displayLarge: {
    fontFamily: fontFamily.displayBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  } as TextStyle,

  displayMedium: {
    fontFamily: fontFamily.displayBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
  } as TextStyle,

  displaySmall: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
  } as TextStyle,

  // Headings - Fraunces
  h1: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  } as TextStyle,

  h2: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  } as TextStyle,

  h3: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.1,
  } as TextStyle,

  // Body - DM Sans (≥16px for accessibility)
  bodyLarge: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0,
  } as TextStyle,

  body: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  bodyMedium: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  // UI Text - DM Sans
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,

  labelSmall: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  } as TextStyle,

  // Buttons - DM Sans
  button: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.1,
  } as TextStyle,

  buttonSmall: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,

  // Caption - DM Sans (use sparingly, minimum 12px)
  caption: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  } as TextStyle,

  // Overline - DM Sans (for labels, kickers)
  overline: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  } as TextStyle,
};

// Font weights (for manual use)
export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  black: "900" as const,
};
