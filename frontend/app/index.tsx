import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';

/** Root entry — hydrates auth state then routes to the correct screen. */
export default function RootIndex() {
  const { hydrate, isAuthenticated, role, isLoading } = useAppStore();

  useEffect(() => { hydrate(); }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accentSage} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;
  if (role === 'LIBRARIAN')  return <Redirect href="/(librarian)" />;
  if (role === 'ADMIN')      return <Redirect href="/(admin)" />;
  return <Redirect href="/(select-profile)" />;
}

