import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string> {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  sheetTitle?: string;
}

export function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  sheetTitle,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label ?? '';

  const select = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.box, pressed && styles.pressed]}
      >
        <Text style={styles.value}>{currentLabel}</Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{sheetTitle ?? label}</Text>
            {options.map((o) => {
              const active = value === o.value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => select(o.value)}
                  style={({ pressed }) => [
                    styles.row,
                    active && styles.rowActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>{o.label}</Text>
                  {active && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3c566b',
    marginBottom: 6,
  },
  box: {
    borderWidth: 1,
    borderColor: '#cedce1',
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    color: '#17334e',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  caret: {
    color: colors.muted,
    fontSize: 14,
    marginLeft: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#102a3d80',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.four,
    paddingTop: spacing.two,
    paddingBottom: spacing.six,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d8e1e6',
    marginVertical: spacing.two,
  },
  sheetTitle: {
    ...typography.h3,
    marginBottom: spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowActive: {
    backgroundColor: '#eaf8f5',
    marginHorizontal: -spacing.four,
    paddingHorizontal: spacing.four,
    borderBottomColor: 'transparent',
    borderRadius: radii.input,
  },
  rowText: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: '600',
  },
  rowTextActive: {
    color: '#0f6a68',
    fontWeight: '800',
  },
  check: {
    color: colors.teal,
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
