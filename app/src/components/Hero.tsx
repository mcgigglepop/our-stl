import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface HeroProps {
  eyebrow: string;
  title: string;
  body: string;
  gradient: readonly [string, string, ...string[]];
  eyebrowColor?: string;
}

export function Hero({ eyebrow, title, body, gradient, eyebrowColor = '#d5edf7' }: HeroProps) {
  return (
    <LinearGradient
      colors={gradient as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <Text style={[typography.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.hero,
    padding: spacing.five,
    gap: spacing.two,
    overflow: 'hidden',
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginTop: spacing.two,
  },
  body: {
    ...typography.body,
    color: '#d7eceb',
    maxWidth: 540,
  },
});
