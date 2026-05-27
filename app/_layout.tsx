import { AuthProvider } from "@/src/context/AuthContext";
import { FreelancersProvider } from "@/src/context/FreelancersContext";
import { RequestsProvider } from "@/src/context/RequestsContext";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { configureNotificationHandler } from "@/src/services/notificationsService";
import {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
} from "@expo-google-fonts/fraunces";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import { SavedProvider } from "../src/context/SavedContext";

SplashScreen.preventAutoHideAsync();

// Set up foreground notification presentation behaviour once at module load.
configureNotificationHandler();

function RootContent() {
  const { colors } = useTheme();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(client)" options={{ headerShown: false }} />
      <Stack.Screen name="(freelancer)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />

      <Stack.Screen
        name="freelancer/[id]"
        options={{
          title: "Profile",
          headerBackTitle: "Back",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      <Stack.Screen
        name="booking/[id]"
        options={{
          title: "Consultation Request",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          title: "Terms & Conditions",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Fraunces - Serif for display and headings
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
    // DM Sans - Sans-serif for UI and body
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <FreelancersProvider>
          <SavedProvider>
            <RequestsProvider>
            <RootContent />
            <Toast />
            </RequestsProvider>
          </SavedProvider>
        </FreelancersProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

