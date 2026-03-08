import { Colors } from "@/constants/theme";
import useAppStore from "@/store/useAppStore";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

/** Root entry — hydrates auth state then routes. */
export default function RootIndex() {
  const { hydrate, isAuthenticated, role, isLoading } = useAppStore();

  useEffect(() => {
    const init = async () => {
      // Hydrate auth from storage
      await hydrate();
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
