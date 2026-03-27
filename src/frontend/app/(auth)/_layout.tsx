import { Stack, Redirect } from 'expo-router';
import { Colors } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAppStore();

  if (!isLoading && isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
