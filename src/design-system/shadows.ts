/**
 * G(Old) Design System - Shadows
 * Subtle, warm shadows for depth
 */

import { Platform } from "react-native";

export const shadows = {
  // Subtle shadow for cards
  sm: Platform.select({
    ios: {
      shadowColor: "#2E2E28", // Warm dark
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    web: {
      boxShadow: "0px 1px 2px rgba(46, 46, 40, 0.05)",
    },
  }),
  
  // Medium shadow for elevated cards
  md: Platform.select({
    ios: {
      shadowColor: "#2E2E28",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: "0px 2px 8px rgba(46, 46, 40, 0.08)",
    },
  }),
  
  // Large shadow for modals, overlays
  lg: Platform.select({
    ios: {
      shadowColor: "#2E2E28",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
    web: {
      boxShadow: "0px 4px 16px rgba(46, 46, 40, 0.12)",
    },
  }),
};
