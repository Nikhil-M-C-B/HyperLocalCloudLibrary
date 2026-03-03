import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.userTint } }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
