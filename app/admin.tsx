import type { Href } from "expo-router";
import { Redirect } from "expo-router";
import { Platform } from "react-native";

export default function AdminEntryRoute() {
  if (Platform.OS !== "web") {
    return <Redirect href={"/" as Href} />;
  }

  return <Redirect href={"/(auth)/login?intent=admin" as Href} />;
}
