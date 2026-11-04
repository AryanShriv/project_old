import { LoadingScreen } from "@/src/components/LoadingScreen/LoadingScreen";
import { AuthProvider } from "@/src/context/AuthContext";
import { ChatProvider } from "@/src/context/ChatContext";
import { ExpertsProvider } from "@/src/context/ExpertsContext";
import { RequestsProvider } from "@/src/context/RequestsContext";
import { SavedProvider } from "@/src/context/SavedContext";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { configureNotificationHandler, subscribeToNotificationTaps } from "@/src/services/notificationsService";
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
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

// Set up foreground notification presentation behaviour once at module load.
configureNotificationHandler();

function RootContent() {
  const { colors } = useTheme();

  // Tapping a notification opens the screen it is about
  useEffect(
    () =>
      subscribeToNotificationTaps((data) => {
        switch (data.type) {
          case "review_prompt":
            if (data.requestId) {
              router.push({ pathname: "/(user)/(tabs)/requests", params: { review: data.requestId } });
            }
            break;
          case "request_updated":
          case "request_expired":
            router.push("/(user)/(tabs)/requests");
            break;
          case "new_request":
          case "application_reviewed":
            // The expert dashboard lists pending requests and shows the application status
            router.push("/(expert)/(tabs)");
            break;
          case "new_message":
            if (data.conversationId) router.push(`/chat/${data.conversationId}`);
            break;
        }
      }),
    []
  );

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(user)" options={{ headerShown: false }} />
      <Stack.Screen name="(expert)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />

      <Stack.Screen
        name="expert/[id]"
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
          title: "Request a Session",
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
      <Stack.Screen
        name="help"
        options={{
          title: "Help & Support",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
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

  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (loaded || error) {
      // Give a brief moment for everything to initialize
      setTimeout(async () => {
        await SplashScreen.hideAsync();
        setAppReady(true);
      }, 100);
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      {!appReady ? (
        <LoadingScreen />
      ) : (
        <AuthProvider>
          <ExpertsProvider>
            <SavedProvider>
              <RequestsProvider>
                <ChatProvider>
                  <RootContent />
                  <Toast />
                </ChatProvider>
              </RequestsProvider>
            </SavedProvider>
          </ExpertsProvider>
        </AuthProvider>
      )}
    </ThemeProvider>
  );
}

