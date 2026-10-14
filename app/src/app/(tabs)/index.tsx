import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { NewPostModal } from '@/components/NewPostModal';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import {
  createCommunityPost,
  deleteCommunityPost,
  listCommunityReports,
  type CommunityPostKind,
  type FeedItem,
  type FeedPostItem,
  type FeedReportItem,
} from '@/services/reports';
import { colors, heroGradient, spacing, typography } from '@/theme';

type FeedFilter = 'all' | 'issue' | 'good' | 'event';

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All posts' },
  { key: 'issue', label: 'Civic issues' },
  { key: 'good', label: 'Good news' },
  { key: 'event', label: 'Community events' },
];

const KIND_SYMBOL: Record<CommunityPostKind, string> = {
  issue: '🚧',
  good: '🌱',
  event: '🤝',
};

const KIND_STATUS: Record<CommunityPostKind, { label: string; variant: 'issue' | 'good' }> = {
  issue: { label: 'Community report · Not yet verified by city', variant: 'issue' },
  good: { label: 'Community win', variant: 'good' },
  event: { label: 'Community conversation', variant: 'good' },
};

function itemKind(item: FeedItem): CommunityPostKind {
  return item.itemType === 'post' ? item.kind : 'issue';
}

function itemTitle(item: FeedItem): string {
  if (item.itemType === 'post') return item.title;
  return item.category;
}

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

function formatDistance(mi: number | null): string | null {
  if (mi === null) return null;
  if (mi < 0.1) return 'nearby';
  if (mi < 10) return `${mi.toFixed(1)} mi away`;
  return `${Math.round(mi)} mi away`;
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
  const location = useCurrentLocation();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!idToken) return;
    setError(null);
    try {
      const res = await listCommunityReports({ idToken, coords: location.coords });
      setItems(res.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the feed.');
    }
  }, [idToken, location.coords]);

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

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => itemKind(i) === filter);
  }, [items, filter]);

  const handleCreatePost = async ({
    title,
    message,
    kind,
  }: {
    title: string;
    message: string;
    kind: CommunityPostKind;
  }) => {
    if (!idToken) {
      Alert.alert('Signed out', 'Please sign in again to post.');
      return;
    }
    if (!location.coords) {
      Alert.alert('Location needed', 'OurSTL needs your location to tag the post.');
      return;
    }
    setSubmitting(true);
    try {
      await createCommunityPost({
        idToken,
        title,
        message,
        kind,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      Alert.alert('Post failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!idToken) return;
    Alert.alert('Delete post', 'This permanently removes your post from the community feed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCommunityPost({ idToken, postId });
            setItems((prev) => prev.filter((i) => i.reportId !== postId));
          } catch (err) {
            Alert.alert('Delete failed', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <>
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
          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [styles.newPostBtn, pressed && styles.pressed]}
          >
            <Text style={styles.newPostBtnText}>＋ New post</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

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
        ) : filteredItems.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No shared posts yet' : 'Nothing in this filter yet'}
            </Text>
            <Text style={styles.emptyBody}>
              {filter === 'all'
                ? 'Tap "New post" to share something with your neighbors, or share a civic report from the Civic Reporting tab.'
                : 'Switch to "All posts" to see everything, or add a post with this kind.'}
            </Text>
          </View>
        ) : (
          filteredItems.map((item) =>
            item.itemType === 'post' ? (
              <PostCard key={item.reportId} item={item} onDelete={handleDeletePost} />
            ) : (
              <ReportCard key={item.reportId} item={item} />
            )
          )
        )}
      </ScrollView>

      <NewPostModal
        visible={modalOpen}
        submitting={submitting}
        onClose={() => (submitting ? null : setModalOpen(false))}
        onSubmit={handleCreatePost}
      />
    </>
  );
}

function AuthorRow({ item }: { item: FeedItem }) {
  const dist = formatDistance(item.distanceMiles);
  return (
    <View style={styles.authorRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsOf(item.authorDisplay)}</Text>
      </View>
      <View style={styles.authorText}>
        <Text style={styles.authorName}>
          {item.isOwn ? 'You' : item.authorDisplay || 'Neighbor'}
        </Text>
        <Text style={styles.postMeta}>
          {[item.locationLabel || 'Nearby', dist, formatWhen(item.createdAt)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </View>
  );
}

function StatusBadge({ kind }: { kind: CommunityPostKind }) {
  const status = KIND_STATUS[kind];
  const style = status.variant === 'good' ? styles.statusGood : styles.statusIssue;
  return <Text style={[styles.statusBadge, style]}>{status.label}</Text>;
}

function ActionsRow({
  item,
  onDelete,
}: {
  item: FeedItem;
  onDelete?: (postId: string) => void;
}) {
  const directions = () =>
    openMaps(
      item.locationLabel || `${item.latitude},${item.longitude}`,
      item.latitude,
      item.longitude
    );

  return (
    <View style={styles.actionsRow}>
      <View style={styles.actionsLeft}>
        <Pressable onPress={directions} hitSlop={6}>
          <Text style={styles.actionLink}>Directions ↗</Text>
        </Pressable>
      </View>
      <View style={styles.actionsRight}>
        {item.isOwn && item.itemType === 'post' && onDelete ? (
          <Pressable onPress={() => onDelete(item.reportId)} hitSlop={6}>
            <Text style={styles.deleteLink}>Delete</Text>
          </Pressable>
        ) : null}
        {item.isOwn ? <Text style={styles.ownBadge}>Posted by you</Text> : null}
      </View>
    </View>
  );
}

function ReportCard({ item }: { item: FeedReportItem }) {
  return (
    <View style={styles.post}>
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.postImage} resizeMode="cover" />
      ) : (
        <View style={[styles.postImage, styles.postImageEmoji]}>
          <Text style={styles.postImageEmojiText}>{KIND_SYMBOL.issue}</Text>
        </View>
      )}
      <View style={styles.postBody}>
        <AuthorRow item={item} />
        <Text style={styles.postTitle}>{itemTitle(item)}</Text>
        {item.description ? <Text style={styles.postDescription}>{item.description}</Text> : null}
        <StatusBadge kind="issue" />
        <ActionsRow item={item} />
      </View>
    </View>
  );
}

function PostCard({
  item,
  onDelete,
}: {
  item: FeedPostItem;
  onDelete: (postId: string) => void;
}) {
  return (
    <View style={styles.post}>
      <View style={[styles.postImage, styles.postImageEmoji, kindBgStyle(item.kind)]}>
        <Text style={styles.postImageEmojiText}>{KIND_SYMBOL[item.kind]}</Text>
      </View>
      <View style={styles.postBody}>
        <AuthorRow item={item} />
        <Text style={styles.postTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.postDescription}>{item.description}</Text> : null}
        <StatusBadge kind={item.kind} />
        <ActionsRow item={item} onDelete={onDelete} />
      </View>
    </View>
  );
}

function kindBgStyle(kind: CommunityPostKind) {
  if (kind === 'good') return { backgroundColor: '#f5e8d5' };
  if (kind === 'event') return { backgroundColor: '#c9e2e1' };
  return { backgroundColor: '#d6e0d7' };
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.shellBackground },
  content: { padding: spacing.four, paddingBottom: spacing.seven, gap: spacing.four },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.three,
    marginTop: spacing.two,
  },
  sectionTitle: { ...typography.h2, fontSize: 22, color: colors.navy, flex: 1 },
  newPostBtn: {
    backgroundColor: colors.teal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 11,
  },
  newPostBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },

  chipRow: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#dce6eb',
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: '#dff2ed',
    borderColor: '#dff2ed',
  },
  chipText: {
    color: '#587086',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#08766f',
  },

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
  postImageEmoji: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImageEmojiText: { fontSize: 64 },
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
  postTitle: {
    ...typography.h3,
    marginTop: 4,
  },
  postDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#526576',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    marginTop: 4,
  },
  statusIssue: {
    backgroundColor: '#fff0da',
    color: '#966021',
  },
  statusGood: {
    backgroundColor: '#e4f5ed',
    color: '#147d5c',
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
  actionsLeft: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  actionsRight: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  actionLink: {
    color: '#165d95',
    fontWeight: '700',
    fontSize: 13,
  },
  deleteLink: {
    color: colors.error,
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
