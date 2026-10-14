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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 12 &&
    password === confirm &&
    !loading;

  const handleSignUp = async () => {
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Please re-type your password.');
      return;
    }
    if (password.length < 12) {
      Alert.alert('Password too short', 'Use at least 12 characters.');
      return;
    }
    try {
      await signUp(email.trim(), password, name.trim());
      router.replace({ pathname: '/(auth)/confirm', params: { email: email.trim() } });
    } catch (err) {
      Alert.alert('Sign up failed', err instanceof Error ? err.message : 'Please try again.');
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
          <Text style={styles.heroTitle}>Join your neighbors.</Text>
          <Text style={styles.heroBody}>
            Create an account to share updates, report issues, and support community wins.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.label}>Full name</Text>
          <TextInput
            autoComplete="name"
            editable={!loading}
            onChangeText={setName}
            placeholder="Jane Doe"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={name}
          />

          <Text style={[typography.label, styles.labelSpacing]}>Email</Text>
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
          <Text style={styles.hint}>At least 12 characters, with upper and lower case, a number, and a symbol.</Text>
          <TextInput
            autoComplete="password-new"
            editable={!loading}
            onChangeText={setPassword}
            placeholder="Create a strong password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          <Text style={[typography.label, styles.labelSpacing]}>Confirm password</Text>
          <TextInput
            autoComplete="password-new"
            editable={!loading}
            onChangeText={setConfirm}
            placeholder="Re-type your password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={confirm}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={!canSubmit}
            onPress={handleSignUp}
            style={({ pressed }) => [
              styles.primaryBtn,
              !canSubmit && styles.primaryBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Create account</Text>
            )}
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={typography.bodyMuted}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.link}>Sign in</Text>
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
  hint: {
    ...typography.bodyMuted,
    fontSize: 12,
    marginBottom: 2,
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
