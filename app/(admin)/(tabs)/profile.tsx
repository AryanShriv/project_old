import type { Href } from "expo-router";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/design-system/colors";
import { radius } from "@/src/design-system/radius";
import { spacing } from "@/src/design-system/spacing";

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.kicker}>Admin</Text>
        <Text style={styles.name}>{user?.name ?? "Platform Admin"}</Text>
        <Text style={styles.email}>{user?.email ?? "admin@demo.com"}</Text>

        <Pressable
          style={styles.button}
          onPress={async () => {
            await logout();
            router.replace("/(client)/(tabs)" as Href);
          }}
        >
          <Text style={styles.buttonText}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.sm },
  kicker: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.textMuted,
    fontWeight: "600",
  },
  name: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  email: { marginTop: 4, fontSize: 15, color: colors.textSecondary },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
});
