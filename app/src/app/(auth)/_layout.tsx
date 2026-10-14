import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/CognitoContext';
import { colors } from '@/theme';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.shellBackground } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
