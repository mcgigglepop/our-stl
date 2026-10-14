import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Hero } from '@/components/Hero';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { findRehabNear, type RehabResult } from '@/services/rehab';
import {
  REHAB_FILTER_LABEL,
  REHAB_TYPE_LABEL,
  type RehabFilter,
  type RehabType,
} from '@/services/stlRehab';
import { colors, radii, rehabHeroGradient, spacing, typography } from '@/theme';

const FILTERS: RehabFilter[] = ['all', 'treatment', 'peer', 'crisis'];

function formatPhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits === '988') return '988';
  return raw;
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

export default function RehabHelpScreen() {
  const [filter, setFilter] = useState<RehabFilter>('all');
  const [results, setResults] = useState<RehabResult[]>([]);
  const location = useCurrentLocation();

  const load = useCallback(() => {
    if (!location.coords) return;
    setResults(findRehabNear(location.coords, { type: filter }));
  }, [location.coords, filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Hero
        eyebrow="Private & Supportive"
        title={`Getting help starts\nwith one step.`}
        body="Explore substance-use recovery resources without posting your personal situation to the community feed."
        gradient={rehabHeroGradient}
        eyebrowColor="#c4f6ea"
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>💚 Find local recovery support</Text>
        <Text style={styles.cardBody}>
          Browse published St. Louis services by type of support. This is a reference directory, not
          live appointment availability. Always call to confirm access before traveling.
        </Text>

        <TypePicker value={filter} onChange={setFilter} />

        <ResultsBlock filter={filter} results={results} locationStatus={location.status} />

        <View style={styles.warnNote}>
          <Text style={styles.warnText}>
            Private browsing — your searches don’t appear in the community feed. If someone is
            overdosing or in immediate danger, call 911. For crisis support, call or text 988.
          </Text>
        </View>
      </View>

      <View style={styles.overdoseNotice}>
        <Text style={styles.overdoseText}>
          If someone may be experiencing an overdose, call 911 immediately. This directory is
          informational and does not provide diagnosis or medical advice.
        </Text>
      </View>

      <SupportGuide />
    </ScrollView>
  );
}

function TypePicker({
  value,
  onChange,
}: {
  value: RehabFilter;
  onChange: (f: RehabFilter) => void;
}) {
  return (
    <View>
      <Text style={styles.pickerLabel}>What help do you need?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
        {FILTERS.map((f) => {
          const active = value === f;
          return (
            <Pressable
              key={f}
              onPress={() => onChange(f)}
              style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {REHAB_FILTER_LABEL[f]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ResultsBlock({
  filter,
  results,
  locationStatus,
}: {
  filter: RehabFilter;
  results: RehabResult[];
  locationStatus: ReturnType<typeof useCurrentLocation>['status'];
}) {
  if (locationStatus === 'requesting' || locationStatus === 'idle') {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.teal} />
        <Text style={styles.stateText}>Getting your location…</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>No providers match that filter.</Text>
      </View>
    );
  }

  return (
    <View style={styles.resultsList}>
      <Text style={styles.resultsHeader}>
        {results.length} provider{results.length === 1 ? '' : 's'}
        {filter === 'all' ? ' listed' : ` for ${REHAB_FILTER_LABEL[filter].toLowerCase()}`}.
      </Text>
      {results.map((r) => (
        <RehabCard key={r.provider.id} result={r} />
      ))}
    </View>
  );
}

function RehabCard({ result }: { result: RehabResult }) {
  const { provider } = result;
  const phoneDisplay = formatPhone(provider.phone);
  const altPhoneDisplay = provider.altPhone ? formatPhone(provider.altPhone.number) : null;
  const call = (num: string) => Linking.openURL(`tel:${num.replace(/\D/g, '')}`);
  const openSite = () => Linking.openURL(provider.website);
  const directions = () => {
    if (provider.latitude === null || provider.longitude === null || !provider.address) return;
    openMaps(
      `${provider.name}, ${provider.address}, ${provider.city}, ${provider.state}`,
      provider.latitude,
      provider.longitude
    );
  };

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{provider.name}</Text>
        {result.distanceMiles !== null ? (
          <Text style={styles.distance}>{result.distanceMiles.toFixed(1)} mi</Text>
        ) : (
          <Text style={styles.callOnly}>By phone</Text>
        )}
      </View>
      <View style={styles.tags}>
        {provider.types.map((t: RehabType) => (
          <Text key={t} style={styles.tag}>
            {REHAB_TYPE_LABEL[t]}
          </Text>
        ))}
        {provider.audience === 'women' && (
          <Text style={[styles.tag, styles.tagAudience]}>Women</Text>
        )}
      </View>
      {provider.services.length > 0 && (
        <Text style={styles.extras}>{provider.services.join(' · ')}</Text>
      )}
      <Text style={styles.note}>{provider.note}</Text>
      {provider.address && (
        <Text style={styles.serviceAddress}>
          {provider.address}
          {'\n'}
          {provider.city}, {provider.state}
          {provider.zip ? ` ${provider.zip}` : ''}
        </Text>
      )}
      <View style={styles.serviceActions}>
        {phoneDisplay && (
          <Pressable onPress={() => call(provider.phone)} hitSlop={6}>
            <Text style={styles.serviceLink}>☎ {phoneDisplay}</Text>
          </Pressable>
        )}
        {provider.altPhone && altPhoneDisplay && (
          <Pressable onPress={() => call(provider.altPhone!.number)} hitSlop={6}>
            <Text style={styles.serviceLink}>
              {provider.altPhone.label}: {altPhoneDisplay}
            </Text>
          </Pressable>
        )}
        {provider.latitude !== null && provider.address && (
          <Pressable onPress={directions} hitSlop={6}>
            <Text style={styles.serviceLink}>Directions ↗</Text>
          </Pressable>
        )}
        <Pressable onPress={openSite} hitSlop={6}>
          <Text style={styles.serviceLink}>Website ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface SupportCard {
  icon: string;
  title: string;
  body: string;
  action: () => void;
  actionLabel: string;
  variant: 'primary' | 'secondary' | 'badge';
}

function SupportGuide() {
  const callSamhsa = () => Linking.openURL('tel:18006624357');
  const openFindTreatment = () => Linking.openURL('https://findtreatment.gov/');
  const openSupportModal = () =>
    Alert.alert(
      'Supporting someone you care about',
      'Listen without judgment, ask what kind of support they want, and encourage professional help when appropriate. For treatment referrals, SAMHSA’s National Helpline is available at 1-800-662-HELP.'
    );

  const cards: SupportCard[] = [
    {
      icon: '📞',
      title: 'Talk to someone',
      body: "SAMHSA's National Helpline provides confidential treatment referrals and information.",
      action: callSamhsa,
      actionLabel: 'Call 1-800-662-HELP',
      variant: 'primary',
    },
    {
      icon: '🧭',
      title: 'Find treatment',
      body: 'Search the national treatment locator for programs and services that may fit your needs.',
      action: openFindTreatment,
      actionLabel: 'Explore options ↗',
      variant: 'secondary',
    },
    {
      icon: '💚',
      title: 'Support for a loved one',
      body: 'Learn about seeking help and supporting someone without judgment or pressure.',
      action: openSupportModal,
      actionLabel: 'Read guidance',
      variant: 'secondary',
    },
    {
      icon: '🔒',
      title: 'Your privacy matters',
      body: 'Browsing this page does not create a public post or share personal health information.',
      action: () => {},
      actionLabel: 'No account required',
      variant: 'badge',
    },
  ];

  return (
    <View style={styles.guideSection}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Find the right support</Text>
        <Text style={styles.sectionMeta}>Private browsing</Text>
      </View>
      <View style={styles.resourceGrid}>
        {cards.map((c) => (
          <View key={c.title} style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <Text style={styles.resourceIconText}>{c.icon}</Text>
            </View>
            <Text style={styles.resourceTitle}>{c.title}</Text>
            <Text style={styles.resourceBody}>{c.body}</Text>
            {c.variant === 'badge' ? (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{c.actionLabel}</Text>
              </View>
            ) : (
              <Pressable
                onPress={c.action}
                style={({ pressed }) => [
                  c.variant === 'primary' ? styles.resourceBtnPrimary : styles.resourceBtnSecondary,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={
                    c.variant === 'primary'
                      ? styles.resourceBtnPrimaryText
                      : styles.resourceBtnSecondaryText
                  }
                >
                  {c.actionLabel}
                </Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
      <Text style={styles.footnote}>
        Resource links are starting points, not a verified directory of current St. Louis provider
        capacity. Confirm services and eligibility directly.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.shellBackground },
  content: { padding: spacing.four, paddingBottom: spacing.seven, gap: spacing.four },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: spacing.four,
    gap: spacing.three,
  },
  cardTitle: {
    ...typography.h2,
    fontSize: 20,
    color: colors.navy,
  },
  cardBody: {
    ...typography.bodyMuted,
  },

  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  pillRow: { gap: 8, paddingVertical: 2, paddingRight: 2 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#dce6eb',
    backgroundColor: colors.white,
  },
  pillActive: { backgroundColor: '#dff2ed', borderColor: '#dff2ed' },
  pillText: { color: '#587086', fontSize: 12, fontWeight: '700' },
  pillTextActive: { color: '#08766f' },

  state: { padding: spacing.four, alignItems: 'center', gap: spacing.two },
  stateText: { color: colors.muted, fontSize: 13 },

  resultsList: { gap: spacing.three },
  resultsHeader: { fontSize: 13, color: '#2a4a5a', fontWeight: '700' },

  serviceCard: {
    borderWidth: 1,
    borderColor: '#dde7ea',
    borderRadius: 13,
    padding: 13,
    backgroundColor: colors.white,
    gap: 6,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  serviceName: { flex: 1, color: '#17334e', fontWeight: '800', fontSize: 15 },
  distance: { color: '#176f72', fontWeight: '800', fontSize: 13 },
  callOnly: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: {
    backgroundColor: '#e9f3f4',
    color: '#14656b',
    borderRadius: 50,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  tagAudience: { backgroundColor: '#f3eaf6', color: '#6b3a7a' },
  extras: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  note: { color: '#526576', fontSize: 13, lineHeight: 19, marginTop: 2 },
  serviceAddress: { color: '#526576', fontSize: 13, lineHeight: 19, marginTop: 4 },
  serviceActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 },
  serviceLink: { color: '#165d95', fontWeight: '700', fontSize: 13 },

  warnNote: {
    marginTop: spacing.two,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderLeftWidth: 4,
    borderLeftColor: '#e7ad4e',
    backgroundColor: '#fff8e8',
    borderRadius: 6,
  },
  warnText: { color: '#634b24', fontSize: 13, lineHeight: 19 },

  overdoseNotice: {
    backgroundColor: '#f1f7fa',
    borderLeftWidth: 3,
    borderLeftColor: '#418ca7',
    padding: 13,
    borderRadius: 8,
  },
  overdoseText: { color: '#4a687b', fontSize: 12, lineHeight: 18 },

  guideSection: { gap: spacing.three },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.three,
    marginTop: spacing.two,
  },
  sectionTitle: { ...typography.h2, fontSize: 22, color: colors.navy },
  sectionMeta: { color: colors.muted, fontSize: 13 },

  resourceGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 12 },
  resourceCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.card,
    padding: 20,
    gap: 8,
  },
  resourceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#e6f3f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceIconText: { fontSize: 22 },
  resourceTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  resourceBody: { fontSize: 13, lineHeight: 19, color: '#617284' },
  resourceBtnPrimary: {
    marginTop: spacing.two,
    backgroundColor: colors.teal,
    borderRadius: 11,
    paddingVertical: 11,
    paddingHorizontal: 17,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  resourceBtnPrimaryText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  resourceBtnSecondary: {
    marginTop: spacing.two,
    backgroundColor: colors.secondaryBg,
    borderRadius: 11,
    paddingVertical: 11,
    paddingHorizontal: 17,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  resourceBtnSecondaryText: { color: colors.secondaryText, fontWeight: '700', fontSize: 13 },
  statusBadge: {
    marginTop: spacing.two,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e4f5ed',
    alignSelf: 'flex-start',
  },
  statusBadgeText: { color: '#147d5c', fontWeight: '800', fontSize: 11 },

  footnote: {
    marginTop: spacing.three,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  pressed: { opacity: 0.75 },
});
