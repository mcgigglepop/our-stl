import { useCallback, useEffect, useRef, useState } from 'react';
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
import { findHealthCentersNear, type HealthCenter } from '@/services/hrsa';
import { findHygieneNear, type DayFilter, type HygieneResult } from '@/services/hygiene';
import { DAY_LABEL, DAY_ORDER, type DayKey } from '@/services/stlDropIns';
import { findWaterNear, type WaterSource } from '@/services/water';
import { colors, radii, shelterHeroGradient, spacing, typography } from '@/theme';

type NeedKey = 'meal' | 'pantry' | 'shelter' | 'hygiene' | 'water' | 'health';

interface Need {
  key: NeedKey;
  symbol: string;
  label: string;
  resourceLabel: string;
  active: boolean;
}

const NEEDS: Need[] = [
  { key: 'meal', symbol: '🥘', label: 'Free meals', resourceLabel: 'Prepared meals', active: false },
  { key: 'pantry', symbol: '🥫', label: 'Food pantry', resourceLabel: 'Food pantry', active: false },
  { key: 'shelter', symbol: '🏠', label: 'Shelter referrals', resourceLabel: 'Shelter / housing intake', active: false },
  { key: 'hygiene', symbol: '🚿', label: 'Showers & hygiene', resourceLabel: 'Showers / clothing / laundry', active: true },
  { key: 'water', symbol: '💧', label: 'Drinking water', resourceLabel: 'Drinking water', active: true },
  { key: 'health', symbol: '🩺', label: 'Medical assistance', resourceLabel: 'Healthcare / medicine support', active: true },
];

const PAGE_SIZE = 10;

function formatPhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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

export default function FoodShelterScreen() {
  const [selected, setSelected] = useState<NeedKey | null>(null);
  const [centers, setCenters] = useState<HealthCenter[]>([]);
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);
  const [hygieneResults, setHygieneResults] = useState<HygieneResult[]>([]);
  const [dayFilter, setDayFilter] = useState<DayFilter>('any');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const location = useCurrentLocation();

  const resultsCount =
    selected === 'health'
      ? centers.length
      : selected === 'water'
        ? waterSources.length
        : selected === 'hygiene'
          ? hygieneResults.length
          : 0;

  const loadData = useCallback(
    async (need: NeedKey, day: DayFilter) => {
      if (!location.coords) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setFetchError(null);
      try {
        if (need === 'health') {
          const results = await findHealthCentersNear(location.coords, {
            radiusMiles: 15,
            signal: controller.signal,
          });
          if (!controller.signal.aborted) {
            setCenters(results);
            setVisibleCount(PAGE_SIZE);
          }
        } else if (need === 'water') {
          const results = await findWaterNear(location.coords, {
            radiusMiles: 10,
            signal: controller.signal,
          });
          if (!controller.signal.aborted) {
            setWaterSources(results);
            setVisibleCount(PAGE_SIZE);
          }
        } else if (need === 'hygiene') {
          const results = findHygieneNear(location.coords, { day });
          if (!controller.signal.aborted) {
            setHygieneResults(results);
            setVisibleCount(PAGE_SIZE);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load results.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [location.coords]
  );

  useEffect(() => {
    if ((selected === 'health' || selected === 'water' || selected === 'hygiene') && location.coords) {
      loadData(selected, dayFilter);
    }
    return () => abortRef.current?.abort();
  }, [selected, location.coords, loadData, dayFilter]);

  const handleChipPress = (need: Need) => {
    if (!need.active) {
      Alert.alert(need.label, 'This resource type is coming in the next stage.');
      return;
    }
    setSelected((prev) => (prev === need.key ? null : need.key));
  };

  const activeNeed = NEEDS.find((n) => n.key === selected) ?? null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Hero
        eyebrow="Essential Support"
        title={`Food, shelter, and\na place to start.`}
        body="Find pathways to local assistance. Simple information, clear next steps, and support without judgment."
        gradient={shelterHeroGradient}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🍲 Find free essentials in St. Louis</Text>
        <Text style={styles.cardBody}>
          Choose what you need. Listings use published provider schedules; they are not live
          confirmations that food, water, supplies, or shelter beds are available.
        </Text>

        <View style={styles.chipGrid}>
          {NEEDS.map((need) => {
            const isSelected = selected === need.key;
            return (
              <Pressable
                key={need.key}
                onPress={() => handleChipPress(need)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  !need.active && styles.chipMuted,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.chipSymbol}>{need.symbol}</Text>
                <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                  {need.label}
                </Text>
                {!need.active && <Text style={styles.chipSoon}>Coming soon</Text>}
              </Pressable>
            );
          })}
        </View>

        {activeNeed ? (
          <View style={styles.filterSummary}>
            <Text style={styles.filterLabel}>Showing</Text>
            <Text style={styles.filterValue}>{activeNeed.resourceLabel}</Text>
          </View>
        ) : (
          <View style={styles.emptyPrompt}>
            <Text style={styles.emptyPromptText}>Tap a resource type above to see nearby options.</Text>
          </View>
        )}

        {selected === 'hygiene' && (
          <DayPicker value={dayFilter} onChange={setDayFilter} />
        )}

        {(selected === 'health' || selected === 'water' || selected === 'hygiene') && (
          <ResultsSection
            kind={selected}
            loading={loading}
            error={fetchError}
            centers={centers}
            waterSources={waterSources}
            hygieneResults={hygieneResults}
            dayFilter={dayFilter}
            visibleCount={visibleCount}
            totalCount={resultsCount}
            onShowMore={() => setVisibleCount((n) => Math.min(n + PAGE_SIZE, resultsCount))}
            locationStatus={location.status}
            locationError={location.error}
            onRetry={() => {
              if (!location.coords) location.retry();
              else loadData(selected, dayFilter);
            }}
          />
        )}

        <View style={styles.warnNote}>
          <Text style={styles.warnText}>
            For an immediate shelter referral, call 211. Published hours may change — phone ahead when
            possible.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

interface ResultsSectionProps {
  kind: 'health' | 'water' | 'hygiene';
  loading: boolean;
  error: string | null;
  centers: HealthCenter[];
  waterSources: WaterSource[];
  hygieneResults: HygieneResult[];
  dayFilter: DayFilter;
  visibleCount: number;
  totalCount: number;
  onShowMore: () => void;
  locationStatus: ReturnType<typeof useCurrentLocation>['status'];
  locationError: string | null;
  onRetry: () => void;
}

function DayPicker({ value, onChange }: { value: DayFilter; onChange: (d: DayFilter) => void }) {
  const options: { key: DayFilter; label: string }[] = [
    { key: 'any', label: 'Any day' },
    ...DAY_ORDER.map((d: DayKey) => ({ key: d as DayFilter, label: DAY_LABEL[d] })),
  ];
  return (
    <View>
      <Text style={styles.pickerLabel}>Day to visit</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        {options.map((o) => {
          const active = value === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              style={({ pressed }) => [
                styles.dayPill,
                active && styles.dayPillActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.dayPillText, active && styles.dayPillTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ResultsSection({
  kind,
  loading,
  error,
  centers,
  waterSources,
  hygieneResults,
  dayFilter,
  visibleCount,
  totalCount,
  onShowMore,
  locationStatus,
  locationError,
  onRetry,
}: ResultsSectionProps) {
  if (locationStatus === 'requesting' || locationStatus === 'idle') {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.teal} />
        <Text style={styles.stateText}>Getting your location…</Text>
      </View>
    );
  }

  const usingFallback = locationStatus === 'denied' || locationStatus === 'unavailable';

  return (
    <View style={styles.results}>
      {usingFallback && (
        <View style={styles.fallbackBanner}>
          <Text style={styles.fallbackText}>
            {locationError ?? 'Using downtown St. Louis as the search center.'} Enable location in
            Settings for results near you.
          </Text>
        </View>
      )}

      {kind === 'water' && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            Public water sources from OpenStreetMap plus St. Louis Public Library branches. Call public
            buildings ahead to confirm access.
          </Text>
        </View>
      )}

      {kind === 'hygiene' && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            Drop-in centers from the City of St. Louis directory. Published hours shift seasonally — call
            before visiting.
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.state}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.stateText}>
            {kind === 'health' ? 'Finding nearby health centers…' : 'Finding nearby water sources…'}
          </Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && totalCount === 0 && (
        <View style={styles.state}>
          <Text style={styles.stateText}>
            {kind === 'health'
              ? 'No health centers found within 15 miles.'
              : kind === 'water'
                ? 'No water sources found within 10 miles.'
                : 'No drop-in centers match the selected day.'}
          </Text>
        </View>
      )}

      {!loading && !error && totalCount > 0 && kind === 'health' && (
        <>
          <Text style={styles.resultsHeader}>
            {centers.length} federally funded health center{centers.length === 1 ? '' : 's'} nearby —
            all offer sliding-scale or free care.
          </Text>
          {centers.slice(0, visibleCount).map((c) => (
            <HealthCenterCard key={c.id} center={c} />
          ))}
        </>
      )}

      {!loading && !error && totalCount > 0 && kind === 'water' && (
        <>
          <Text style={styles.resultsHeader}>
            {waterSources.length} public water source{waterSources.length === 1 ? '' : 's'} nearby.
          </Text>
          {waterSources.slice(0, visibleCount).map((s) => (
            <WaterCard key={s.id} source={s} />
          ))}
        </>
      )}

      {!loading && !error && totalCount > 0 && kind === 'hygiene' && (
        <>
          <Text style={styles.resultsHeader}>
            {hygieneResults.length} drop-in center{hygieneResults.length === 1 ? '' : 's'}
            {dayFilter === 'any' ? ' nearby' : ` open ${DAY_LABEL[dayFilter]} or hours unposted`}.
          </Text>
          {hygieneResults.slice(0, visibleCount).map((r) => (
            <HygieneCard key={r.center.id} result={r} />
          ))}
        </>
      )}

      {!loading && !error && visibleCount < totalCount && (
        <Pressable
          accessibilityRole="button"
          onPress={onShowMore}
          style={({ pressed }) => [styles.showMoreBtn, pressed && styles.pressed]}
        >
          <Text style={styles.showMoreText}>
            Show {Math.min(PAGE_SIZE, totalCount - visibleCount)} more
          </Text>
          <Text style={styles.showMoreMeta}>
            Showing {visibleCount} of {totalCount}
          </Text>
        </Pressable>
      )}
      {!loading && !error && visibleCount >= totalCount && totalCount > PAGE_SIZE && (
        <Text style={styles.showMoreMetaDone}>Showing all {totalCount} nearby.</Text>
      )}
    </View>
  );
}

function HealthCenterCard({ center }: { center: HealthCenter }) {
  const phoneDisplay = formatPhone(center.phone);
  const callPhone = () => {
    if (!center.phone) return;
    Linking.openURL(`tel:${center.phone.replace(/\D/g, '')}`);
  };
  const openSite = () => {
    if (center.website) Linking.openURL(center.website);
  };
  const directions = () =>
    openMaps(`${center.name}, ${center.address}, ${center.city}, ${center.state} ${center.zip}`, center.latitude, center.longitude);

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{center.name}</Text>
        <Text style={styles.distance}>{center.distanceMiles.toFixed(1)} mi</Text>
      </View>
      {center.parentOrg && <Text style={styles.parentOrg}>{center.parentOrg}</Text>}
      <View style={styles.tags}>
        <Text style={styles.tag}>FQHC</Text>
        <Text style={styles.tag}>Sliding scale</Text>
      </View>
      <Text style={styles.serviceAddress}>
        {center.address}
        {'\n'}
        {center.city}, {center.state} {center.zip}
      </Text>
      <View style={styles.serviceActions}>
        {phoneDisplay && (
          <Pressable onPress={callPhone} hitSlop={6}>
            <Text style={styles.serviceLink}>☎ {phoneDisplay}</Text>
          </Pressable>
        )}
        <Pressable onPress={directions} hitSlop={6}>
          <Text style={styles.serviceLink}>Directions ↗</Text>
        </Pressable>
        {center.website && (
          <Pressable onPress={openSite} hitSlop={6}>
            <Text style={styles.serviceLink}>Website ↗</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function WaterCard({ source }: { source: WaterSource }) {
  const callPhone = () => {
    if (source.phone) Linking.openURL(`tel:${source.phone.replace(/\D/g, '')}`);
  };
  const openSite = () => {
    if (source.website) Linking.openURL(source.website);
  };
  const directions = () =>
    openMaps(source.address ? `${source.name}, ${source.address}` : source.name, source.latitude, source.longitude);
  const kindBadge = source.kind === 'library' ? 'Public library' : 'Public fountain';
  const phoneDisplay = formatPhone(source.phone);

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{source.name}</Text>
        <Text style={styles.distance}>{source.distanceMiles.toFixed(1)} mi</Text>
      </View>
      {source.subtitle && <Text style={styles.parentOrg}>{source.subtitle}</Text>}
      <View style={styles.tags}>
        <Text style={styles.tag}>{kindBadge}</Text>
        {source.notes.map((n) => (
          <Text key={n} style={styles.tag}>
            {n}
          </Text>
        ))}
      </View>
      {source.address && <Text style={styles.serviceAddress}>{source.address}</Text>}
      <View style={styles.serviceActions}>
        {phoneDisplay && (
          <Pressable onPress={callPhone} hitSlop={6}>
            <Text style={styles.serviceLink}>☎ {phoneDisplay}</Text>
          </Pressable>
        )}
        <Pressable onPress={directions} hitSlop={6}>
          <Text style={styles.serviceLink}>Directions ↗</Text>
        </Pressable>
        {source.website && (
          <Pressable onPress={openSite} hitSlop={6}>
            <Text style={styles.serviceLink}>Website ↗</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function HygieneCard({ result }: { result: HygieneResult }) {
  const { center } = result;
  const phoneDisplay = formatPhone(center.phone);
  const callPhone = () => Linking.openURL(`tel:${center.phone.replace(/\D/g, '')}`);
  const openSite = () => Linking.openURL(center.website);
  const directions = () =>
    openMaps(`${center.name}, ${center.address}, ${center.city}, ${center.state} ${center.zip}`, center.latitude, center.longitude);

  const openBadge =
    result.openOnDay === true ? 'Open that day' : result.openOnDay === false ? 'Closed that day' : null;

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{center.name}</Text>
        <Text style={styles.distance}>{result.distanceMiles.toFixed(1)} mi</Text>
      </View>
      <Text style={styles.parentOrg}>
        {center.audience === 'youth' ? 'Youth drop-in' : center.audience === 'adults' ? 'Adults drop-in' : 'Drop-in center'}
      </Text>
      <View style={styles.tags}>
        {center.services.map((s) => (
          <Text key={s} style={styles.tag}>
            {s}
          </Text>
        ))}
        {openBadge && (
          <Text style={[styles.tag, result.openOnDay === false && styles.tagMuted]}>{openBadge}</Text>
        )}
      </View>
      {center.extras.length > 0 && (
        <Text style={styles.extras}>Also: {center.extras.join(' · ')}</Text>
      )}
      <Text style={styles.hoursLine}>🕐 {center.hours.text}</Text>
      <Text style={styles.serviceAddress}>
        {center.address}
        {'\n'}
        {center.city}, {center.state} {center.zip}
      </Text>
      <View style={styles.serviceActions}>
        {phoneDisplay && (
          <Pressable onPress={callPhone} hitSlop={6}>
            <Text style={styles.serviceLink}>☎ {phoneDisplay}</Text>
          </Pressable>
        )}
        <Pressable onPress={directions} hitSlop={6}>
          <Text style={styles.serviceLink}>Directions ↗</Text>
        </Pressable>
        <Pressable onPress={openSite} hitSlop={6}>
          <Text style={styles.serviceLink}>City listing ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.shellBackground,
  },
  content: {
    padding: spacing.four,
    paddingBottom: spacing.seven,
    gap: spacing.four,
  },
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: spacing.two,
  },
  chip: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: '#dde7ea',
    borderRadius: 13,
    padding: 13,
    backgroundColor: '#fafcfd',
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: '#168a89',
    backgroundColor: '#eaf8f5',
  },
  chipMuted: {
    opacity: 0.6,
  },
  chipSymbol: {
    fontSize: 22,
    marginBottom: 4,
  },
  chipLabel: {
    color: '#17334e',
    fontWeight: '700',
    fontSize: 13,
  },
  chipLabelSelected: {
    color: '#0f6a68',
  },
  chipSoon: {
    marginTop: 4,
    fontSize: 10,
    color: colors.muted,
  },
  filterSummary: {
    marginTop: spacing.three,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cedce1',
    borderRadius: 10,
    backgroundColor: colors.surface,
    gap: 2,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  filterValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17334e',
  },
  emptyPrompt: {
    marginTop: spacing.three,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f0f7f9',
  },
  emptyPromptText: {
    color: colors.muted,
    fontSize: 13,
  },
  results: {
    gap: spacing.three,
  },
  resultsHeader: {
    fontSize: 13,
    color: '#2a4a5a',
    fontWeight: '700',
  },
  state: {
    padding: spacing.four,
    alignItems: 'center',
    gap: spacing.two,
  },
  stateText: {
    color: colors.muted,
    fontSize: 13,
  },
  fallbackBanner: {
    backgroundColor: '#fff8e8',
    borderLeftWidth: 4,
    borderLeftColor: '#e7ad4e',
    padding: 11,
    borderRadius: 6,
  },
  fallbackText: {
    color: '#634b24',
    fontSize: 12,
    lineHeight: 17,
  },
  infoBanner: {
    backgroundColor: '#f1f7fa',
    borderLeftWidth: 3,
    borderLeftColor: '#418ca7',
    padding: 11,
    borderRadius: 6,
  },
  infoText: {
    color: '#4a687b',
    fontSize: 12,
    lineHeight: 17,
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    padding: 12,
    borderRadius: 8,
    gap: spacing.two,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.teal,
    borderRadius: radii.button,
  },
  retryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
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
  serviceName: {
    flex: 1,
    color: '#17334e',
    fontWeight: '800',
    fontSize: 15,
  },
  distance: {
    color: '#176f72',
    fontWeight: '800',
    fontSize: 13,
  },
  parentOrg: {
    color: colors.muted,
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
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
  serviceAddress: {
    color: '#526576',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  serviceActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 6,
  },
  serviceLink: {
    color: '#165d95',
    fontWeight: '700',
    fontSize: 13,
  },
  warnNote: {
    marginTop: spacing.three,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderLeftWidth: 4,
    borderLeftColor: '#e7ad4e',
    backgroundColor: '#fff8e8',
    borderRadius: 6,
  },
  warnText: {
    color: '#634b24',
    fontSize: 13,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.75,
  },
  showMoreBtn: {
    marginTop: spacing.two,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: '#d6e1e8',
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 2,
  },
  showMoreText: {
    color: '#244968',
    fontSize: 14,
    fontWeight: '700',
  },
  showMoreMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  showMoreMetaDone: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: spacing.one,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.three,
    marginBottom: 6,
  },
  dayRow: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 2,
  },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#dce6eb',
    backgroundColor: colors.white,
  },
  dayPillActive: {
    backgroundColor: '#dff2ed',
    borderColor: '#dff2ed',
  },
  dayPillText: {
    color: '#587086',
    fontSize: 12,
    fontWeight: '700',
  },
  dayPillTextActive: {
    color: '#08766f',
  },
  extras: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  hoursLine: {
    color: '#2a4a5a',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  tagMuted: {
    backgroundColor: '#f1e4e2',
    color: colors.error,
  },
});
