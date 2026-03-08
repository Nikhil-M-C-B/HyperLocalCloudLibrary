import { Colors } from "@/constants/theme";
import useAppStore from "@/store/useAppStore";
import * as Location from "expo-location";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

/** Root entry — hydrates auth state, requests location, then routes. */
export default function RootIndex() {
  const { hydrate, isAuthenticated, role, isLoading } = useAppStore();

  useEffect(() => {
    const init = async () => {
      // 1. Hydrate auth from storage
      await hydrate();
      // 2. Pre-request location permission so the map is ready later
      await Location.requestForegroundPermissionsAsync();
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={Colors.accentSage} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;
  if (role === "LIBRARIAN") return <Redirect href="/(librarian)" />;
  if (role === "ADMIN") return <Redirect href="/(admin)" />;
  return <Redirect href="/(select-profile)" />;
}
