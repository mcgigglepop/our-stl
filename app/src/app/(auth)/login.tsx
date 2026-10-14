import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/CognitoContext';
import { Brand } from '@/components/Brand';
import { colors, radii, spacing, typography } from '@/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const handleSignIn = async () => {
    if (!canSubmit) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      Alert.alert('Sign in failed', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.four }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Brand size="large" onDark />
          <Text style={styles.heroTitle}>Welcome back.</Text>
          <Text style={styles.heroBody}>
            Sign in to see what&apos;s happening in your neighborhood and support local issues.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />

          <Text style={[typography.label, styles.labelSpacing]}>Password</Text>
          <TextInput
            autoComplete="password"
            editable={!loading}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={!canSubmit}
            onPress={handleSignIn}
            style={({ pressed }) => [
              styles.primaryBtn,
              !canSubmit && styles.primaryBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Sign in</Text>
            )}
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={typography.bodyMuted}>Don&apos;t have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.link}>Create one</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.shellBackground },
  scroll: {
    padding: spacing.four,
    paddingBottom: spacing.seven,
    gap: spacing.four,
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radii.hero,
    padding: spacing.five,
    gap: spacing.three,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.white,
    marginTop: spacing.three,
  },
  heroBody: {
    ...typography.body,
    color: '#d7eceb',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.five,
    gap: spacing.two,
  },
  labelSpacing: {
    marginTop: spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.input,
    paddingHorizontal: spacing.three,
    paddingVertical: 12,
    backgroundColor: colors.inputBackground,
    color: colors.ink,
    fontSize: 15,
  },
  errorBox: {
    marginTop: spacing.three,
    backgroundColor: colors.errorBg,
    padding: spacing.three,
    borderRadius: radii.input,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  primaryBtn: {
    marginTop: spacing.four,
    backgroundColor: colors.teal,
    borderRadius: radii.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    ...typography.button,
  },
  pressed: {
    opacity: 0.85,
  },
  footerRow: {
    marginTop: spacing.four,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  link: {
    color: colors.teal,
    fontWeight: '700',
    fontSize: 13,
  },
});
