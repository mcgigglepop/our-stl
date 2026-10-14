import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Report } from '@/services/reports';
import { colors, radii, spacing, typography } from '@/theme';

interface MyReportsCardProps {
  reports: Report[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MyReportsCard({ reports, loading, error, onRefresh }: MyReportsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My requests</Text>
          <Text style={styles.subtitle}>
            {reports.length === 0 ? 'No reports yet' : `${reports.length} on file`}
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}
          accessibilityLabel="Refresh requests"
        >
          {loading ? (
            <ActivityIndicator color={colors.teal} />
          ) : (
            <Text style={styles.refreshText}>Refresh</Text>
          )}
        </Pressable>
      </View>

      {error && !loading && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {reports.length === 0 && !loading && !error && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Reports you file here will show up in this list with their status.
          </Text>
        </View>
      )}

      {reports.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowList}
        >
          {reports.map((r) => (
            <View key={r.reportId} style={styles.reportCard}>
              {r.thumbnailUrl ? (
                <Image source={{ uri: r.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Text style={styles.thumbPlaceholderIcon}>📷</Text>
                </View>
              )}
              <View style={styles.statusRow}>
                <Text style={styles.category}>{r.category}</Text>
                <View style={styles.badgeRow}>
                  {r.isPublic ? <Text style={styles.sharedBadge}>Shared</Text> : null}
                  <Text style={styles.statusPill}>{r.status}</Text>
                </View>
              </View>
              <Text style={styles.locationLabel} numberOfLines={1}>
                📍 {r.locationLabel || 'Location pending'}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {r.description || 'No description provided.'}
              </Text>
              <Text style={styles.timestamp}>{formatWhen(r.createdAt)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: spacing.four,
    gap: spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    color: colors.navy,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: 2,
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.button,
    backgroundColor: colors.secondaryBg,
  },
  refreshText: {
    color: colors.secondaryText,
    fontWeight: '700',
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  empty: {
    padding: spacing.three,
    borderRadius: 12,
    backgroundColor: '#f0f7f9',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  rowList: {
    gap: 12,
    paddingRight: 4,
  },
  reportCard: {
    width: 220,
    borderWidth: 1,
    borderColor: '#dde7ea',
    borderRadius: 13,
    backgroundColor: colors.white,
    padding: 10,
    gap: 6,
  },
  thumb: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: '#eef3f6',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderIcon: {
    fontSize: 28,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 2,
  },
  category: {
    flex: 1,
    color: '#17334e',
    fontWeight: '800',
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  sharedBadge: {
    backgroundColor: '#dff2ed',
    color: '#08766f',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
  statusPill: {
    backgroundColor: '#e4f5ed',
    color: '#147d5c',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  locationLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    color: '#526576',
    fontSize: 12,
    lineHeight: 17,
  },
  timestamp: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
