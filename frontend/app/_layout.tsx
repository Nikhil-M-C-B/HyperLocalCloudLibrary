import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export const unstable_settings = {
  anchor: "(auth)",
};

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(select-profile)" />
        <Stack.Screen name="(user)" />
        <Stack.Screen name="(child)" />
        <Stack.Screen name="(librarian)" />
        <Stack.Screen name="(admin)" />
        {/* keep legacy tabs accessible for now */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={Colors.background} />
    </>
  );
}
