import type { Href } from "expo-router";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/design-system/colors";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user?.role === "freelancer") {
    return <Redirect href={"/(freelancer)/(tabs)" as Href} />;
  }
  if (user?.role === "admin") {
    return <Redirect href={"/(admin)/(tabs)" as Href} />;
  }

  return <Redirect href={"/(client)/(tabs)" as Href} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
