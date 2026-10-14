import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/auth/CognitoContext';
import { Hero } from '@/components/Hero';
import {
  listCommunityReports,
  type CommunityReport,
} from '@/services/reports';
import { colors, heroGradient, spacing, typography } from '@/theme';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function initialsOf(name: string | undefined): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function openMaps(label: string, lat: number, lon: number) {
  const q = encodeURIComponent(label);
  const ll = `${lat},${lon}`;
  const url = Platform.select({
    ios: `http://maps.apple.com/?q=${q}&ll=${ll}`,
    android: `geo:${ll}?q=${ll}(${q})`,
    default: `https://www.google.com/maps/search/?api=1&query=${ll}`,
  });
  if (url) Linking.openURL(url);
}

export default function CommunityFeedScreen() {
  const { tokens } = useAuth();
  const idToken = tokens?.idToken ?? null;
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!idToken) return;
    setError(null);
    try {
      const res = await listCommunityReports({ idToken });
      setReports(res.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the feed.');
    }
  }, [idToken]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
    >
      <Hero
        eyebrow="Your neighborhood, your voice"
        title={`Let's make St. Louis\nbetter, together.`}
        body="Discover what's happening nearby, support local issues, and celebrate the people making a difference."
        gradient={heroGradient}
      />

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Community Feed</Text>
        <Text style={styles.sectionMeta}>
          {reports.length} {reports.length === 1 ? 'post' : 'posts'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.stateText}>Loading community posts…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={onRefresh}
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No shared posts yet</Text>
          <Text style={styles.emptyBody}>
            When a neighbor files a civic report and checks "Also share with the community," it will
            show up here. Head to Civic Reporting to post the first one.
          </Text>
        </View>
      ) : (
        reports.map((r) => <CommunityPost key={r.reportId} report={r} />)
      )}
    </ScrollView>
  );
}

function CommunityPost({ report }: { report: CommunityReport }) {
  const directions = () =>
    openMaps(
      report.locationLabel || `${report.latitude},${report.longitude}`,
      report.latitude,
      report.longitude
    );

  return (
    <View style={styles.post}>
      {report.thumbnailUrl ? (
        <Image source={{ uri: report.thumbnailUrl }} style={styles.postImage} resizeMode="cover" />
      ) : (
        <View style={[styles.postImage, styles.postImagePlaceholder]}>
          <Text style={styles.postImagePlaceholderText}>📷</Text>
        </View>
      )}
      <View style={styles.postBody}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(report.authorDisplay)}</Text>
          </View>
          <View style={styles.authorText}>
            <Text style={styles.authorName}>
              {report.isOwn ? 'You' : report.authorDisplay || 'Neighbor'}
            </Text>
            <Text style={styles.postMeta}>
              {report.locationLabel || 'Nearby'} · {formatWhen(report.createdAt)}
            </Text>
          </View>
          <Text style={styles.statusTag}>{report.category}</Text>
        </View>

        <Text style={styles.postTitle}>{report.category}</Text>
        {report.description ? (
          <Text style={styles.postDescription}>{report.description}</Text>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable onPress={directions} hitSlop={6}>
            <Text style={styles.actionLink}>Directions ↗</Text>
          </Pressable>
          {report.isOwn ? <Text style={styles.ownBadge}>Posted by you</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.shellBackground },
  content: { padding: spacing.four, paddingBottom: spacing.seven, gap: spacing.four },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.three,
    marginTop: spacing.two,
  },
  sectionTitle: { ...typography.h2, fontSize: 22, color: colors.navy },
  sectionMeta: { color: colors.muted, fontSize: 13 },

  state: {
    padding: spacing.five,
    alignItems: 'center',
    gap: spacing.two,
  },
  stateText: { color: colors.muted, fontSize: 13 },

  errorBanner: {
    backgroundColor: colors.errorBg,
    padding: 14,
    borderRadius: 10,
    gap: spacing.two,
  },
  errorText: { color: colors.error, fontSize: 13 },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.teal,
    borderRadius: 10,
  },
  retryText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  empty: {
    padding: spacing.five,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    gap: spacing.two,
  },
  emptyIcon: { fontSize: 42 },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 320,
  },

  post: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#d6e0d7',
  },
  postImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImagePlaceholderText: { fontSize: 44 },
  postBody: {
    padding: 18,
    gap: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: 999,
    backgroundColor: '#e4eff3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#28627b',
    fontWeight: '800',
    fontSize: 13,
  },
  authorText: {
    flex: 1,
  },
  authorName: {
    color: '#17334e',
    fontWeight: '800',
    fontSize: 13,
  },
  postMeta: {
    color: '#84919c',
    fontSize: 12,
    marginTop: 2,
  },
  statusTag: {
    backgroundColor: '#fff0da',
    color: '#966021',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  postTitle: {
    ...typography.h3,
    marginTop: 4,
  },
  postDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#526576',
  },
  actionsRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.two,
  },
  actionLink: {
    color: '#165d95',
    fontWeight: '700',
    fontSize: 13,
  },
  ownBadge: {
    color: '#08766f',
    backgroundColor: '#dff2ed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  pressed: { opacity: 0.75 },
});
