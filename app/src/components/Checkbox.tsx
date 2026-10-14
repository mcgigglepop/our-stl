import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

interface CheckboxProps {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Checkbox({ value, onChange, label, description, disabled }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      onPress={() => !disabled && onChange(!value)}
      style={({ pressed }) => [
        styles.row,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={[styles.box, value && styles.boxChecked]}>
        {value && <Text style={styles.check}>✓</Text>}
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.three,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cedce1',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  check: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: '#17334e',
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
