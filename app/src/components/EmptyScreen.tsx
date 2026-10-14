import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface EmptyScreenProps {
  eyebrow: string;
  title: string;
  symbol: string;
}

export function EmptyScreen({ eyebrow, title, symbol }: EmptyScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.symbol}>{symbol}</Text>
      <Text style={typography.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>This tab is intentionally empty — we&apos;ll build it in the next stage.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.five,
    backgroundColor: colors.shellBackground,
    gap: spacing.three,
  },
  symbol: {
    fontSize: 56,
    marginBottom: spacing.three,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
  },
  body: {
    ...typography.bodyMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
});
