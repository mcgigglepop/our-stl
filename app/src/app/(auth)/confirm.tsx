import { router, useLocalSearchParams } from 'expo-router';
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

export default function ConfirmScreen() {
  const insets = useSafeAreaInsets();
  const { confirmSignUp, resendCode, loading, error } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? '').trim();
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);

  const canSubmit = code.length === 6 && email.length > 0 && !loading;

  const handleConfirm = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Return to sign up and try again.');
      return;
    }
    if (code.length !== 6) {
      Alert.alert('Invalid code', 'Enter the 6-digit code from your email.');
      return;
    }
    try {
      await confirmSignUp(email, code);
      Alert.alert('Email verified', 'You can sign in now.', [
        { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err) {
      Alert.alert('Verification failed', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await resendCode(email);
      Alert.alert('Code sent', 'Check your email for a fresh verification code.');
    } catch (err) {
      Alert.alert('Resend failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setResending(false);
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
          <Text style={styles.heroTitle}>Verify your email.</Text>
          <Text style={styles.heroBody}>
            We sent a 6-digit code to{email ? ` ${email}` : ' your inbox'}.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.label}>Verification code</Text>
          <TextInput
            editable={!loading && !resending}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setCode}
            placeholder="000000"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.codeInput]}
            value={code}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={!canSubmit}
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.primaryBtn,
              !canSubmit && styles.primaryBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Verify email</Text>
            )}
          </Pressable>

          <Pressable
            disabled={resending || !email}
            onPress={handleResend}
            style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
          >
            {resending ? (
              <ActivityIndicator color={colors.teal} />
            ) : (
              <Text style={styles.ghostText}>Resend code</Text>
            )}
          </Pressable>

          <View style={styles.footerRow}>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.link}>Back to sign in</Text>
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
  codeInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
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
  ghostBtn: {
    marginTop: spacing.three,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    color: colors.teal,
    fontWeight: '700',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  footerRow: {
    marginTop: spacing.three,
    alignItems: 'center',
  },
  link: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13,
  },
});
