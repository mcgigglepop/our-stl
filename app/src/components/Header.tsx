import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/CognitoContext';
import { Brand } from '@/components/Brand';
import { colors, radii, sizes, spacing, typography } from '@/theme';

function initialsFor(user: { email?: string; name?: string } | null): string {
  if (user?.name) {
    const parts = user.name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || 'STL';
  }
  if (user?.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return 'STL';
}

export function Header() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const handleAvatarPress = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut().catch((err) => {
            Alert.alert('Sign out failed', err instanceof Error ? err.message : 'Please try again.');
          });
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <Brand />
        <View style={styles.right}>
          <View style={styles.pill}>
            <Text style={styles.pillDot}>●</Text>
            <Text style={styles.pillText}>Community-powered</Text>
          </View>
          <Pressable
            accessibilityLabel="Account menu, double tap to sign out"
            onPress={handleAvatarPress}
            style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
          >
            <Text style={styles.avatarText}>{initialsFor(user)}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  row: {
    minHeight: sizes.headerHeightCompact,
    paddingHorizontal: spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.three,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.three,
  },
  pill: {
    backgroundColor: colors.tealTint,
    paddingHorizontal: spacing.three,
    paddingVertical: 6,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      web: { display: 'flex' as const },
    }),
  },
  pillDot: {
    color: colors.tealDeep,
    fontSize: 10,
  },
  pillText: {
    color: colors.tealDeep,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.brandWordmark.fontFamily,
  },
  avatar: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.avatar,
    backgroundColor: colors.avatarBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPressed: {
    opacity: 0.7,
  },
  avatarText: {
    color: colors.avatarText,
    fontWeight: '800',
    fontSize: 13,
    fontFamily: typography.brandWordmark.fontFamily,
  },
});
