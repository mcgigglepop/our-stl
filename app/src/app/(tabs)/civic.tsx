import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/auth/CognitoContext';
import { Checkbox } from '@/components/Checkbox';
import { Dropdown } from '@/components/Dropdown';
import { Hero } from '@/components/Hero';
import { MyReportsCard } from '@/components/MyReportsCard';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import {
  ALL_ISSUES,
  draftDescription,
  ISSUE_CHIPS,
  routeIssue,
  type CivicIssue,
  type Jurisdiction,
} from '@/services/civicRouting';
import {
  analyzeReport,
  createReport,
  listMyReports,
  requestUploadUrl,
  uploadPhoto,
  type Report,
} from '@/services/reports';
import { colors, heroGradient, radii, spacing, typography } from '@/theme';

const WORKFLOW_STEPS = [
  '1. Identify issue',
  '2. Suggest service',
  '3. Confirm jurisdiction',
  '4. Send to CSB',
  '5. Department follows up',
];

const JURISDICTIONS: { value: Jurisdiction; label: string }[] = [
  { value: 'city', label: 'City of St. Louis' },
  { value: 'other', label: 'St. Louis County / another municipality' },
];

export default function CivicReportingScreen() {
  const { tokens } = useAuth();
  const location = useCurrentLocation();
  const idToken = tokens?.idToken ?? null;

  const [routingIssue, setRoutingIssue] = useState<CivicIssue>('Pothole');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('city');

  const [reportCategory, setReportCategory] = useState<CivicIssue>('Damaged sidewalk');
  const [reportLocation, setReportLocation] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [shareWithCommunity, setShareWithCommunity] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisHint, setAnalysisHint] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const issueOptions = useMemo(() => ALL_ISSUES.map((i) => ({ value: i, label: i })), []);
  const routingResult = useMemo(
    () => routeIssue(routingIssue, jurisdiction),
    [routingIssue, jurisdiction]
  );

  const refreshReports = useCallback(async () => {
    if (!idToken) return;
    setLoadingReports(true);
    setReportsError(null);
    try {
      const res = await listMyReports({ idToken });
      setReports(res.reports);
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : 'Failed to load your reports.');
    } finally {
      setLoadingReports(false);
    }
  }, [idToken]);

  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  const resetForm = () => {
    setPhoto(null);
    setS3Key(null);
    setAnalysisHint(null);
    setRejectReason(null);
    setReportLocation('');
    setReportDescription('');
    setReportCategory('Damaged sidewalk');
    setShareWithCommunity(false);
  };

  const handleHelpDraft = () => {
    setReportDescription(draftDescription(reportCategory));
  };

  const runAnalysis = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!idToken) {
      Alert.alert('Signed out', 'Please sign in again to submit a report.');
      return;
    }
    if (!location.coords) {
      Alert.alert(
        'Location needed',
        'OurSTL needs your location to tag the report. Enable location access and try again.'
      );
      return;
    }
    setAnalyzing(true);
    setRejectReason(null);
    setAnalysisHint(null);
    try {
      const { putUrl, s3Key: newKey } = await requestUploadUrl({ idToken });
      await uploadPhoto(putUrl, asset.uri);
      const result = await analyzeReport({
        idToken,
        s3Key: newKey,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (result.kind === 'rejected') {
        setPhoto(null);
        setS3Key(null);
        setRejectReason(result.reason);
        return;
      }
      setS3Key(newKey);
      if (result.category) setReportCategory(result.category);
      if (result.description) setReportDescription(result.description);
      if (result.locationLabel) setReportLocation(result.locationLabel);
      if (result.confidence === 'low') {
        setAnalysisHint("We're not sure what this is — double-check the category before submitting.");
      }
    } catch (err) {
      Alert.alert(
        'Analysis failed',
        err instanceof Error ? err.message : 'Could not analyze the photo. Fill in the form manually.'
      );
      setPhoto(null);
      setS3Key(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAttachPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access blocked', 'Enable photo library access in Settings to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto(asset);
      setS3Key(null);
      setRejectReason(null);
      runAnalysis(asset);
    }
  };

  const handleSubmitReport = async () => {
    if (!idToken) {
      Alert.alert('Signed out', 'Please sign in again to submit a report.');
      return;
    }
    if (!s3Key || !photo) {
      Alert.alert('Add a photo', 'Attach a photo of the issue — it anchors your report.');
      return;
    }
    if (!location.coords) {
      Alert.alert('Location needed', 'Enable location access so we can tag your report.');
      return;
    }
    if (!reportLocation.trim()) {
      Alert.alert('Add a location', 'Tell us where the issue is before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const { report } = await createReport({
        idToken,
        s3Key,
        category: reportCategory,
        description: reportDescription,
        locationLabel: reportLocation,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        isPublic: shareWithCommunity,
      });
      const sharedBlurb = report.isPublic
        ? ' It will show up in the Community Feed for other neighbors.'
        : '';
      Alert.alert(
        'Report filed',
        `${report.category} at ${report.locationLabel || 'your location'} saved to My requests.${sharedBlurb}\n\nOurSTL doesn’t forward reports to the City automatically — use the official CSB portal for an official 311 service request.`
      );
      resetForm();
      refreshReports();
    } catch (err) {
      Alert.alert(
        'Submission failed',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openCsbPortal = () => Linking.openURL('https://www.stlouis-mo.gov/csb/');
  const openOpen311 = () =>
    Linking.openURL(
      'https://www.stlouis-mo.gov/government/departments/information-technology/web-development/city-api/csb-api.cfm'
    );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Hero
        eyebrow="Civic Reporting"
        title={`See a problem?\nLet's get it reported.`}
        body="Snap a photo, confirm the location, and prepare a clear service request. Follow your neighborhood’s progress."
        gradient={heroGradient}
        eyebrowColor="#b4ece6"
      />

      {/* ───── Smart department routing ───── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏛️ Smart department routing</Text>
        <Text style={styles.cardBody}>
          St. Louis uses a central Citizens’ Service Bureau (CSB) to route many requests. Choose a
          problem below, or let the demo suggest a department.
        </Text>

        <View style={styles.workflow}>
          {WORKFLOW_STEPS.map((step) => (
            <View key={step} style={styles.workflowStep}>
              <Text style={styles.workflowText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chipGrid}>
          {ISSUE_CHIPS.map((chip) => {
            const isSelected = routingIssue === chip.key;
            return (
              <Pressable
                key={chip.key}
                onPress={() => setRoutingIssue(chip.key)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.chipIcon}>{chip.icon}</Text>
                <Text style={styles.chipLabel}>{chip.label}</Text>
                <Text style={styles.chipSubtitle}>{chip.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.twoFields}>
          <View style={styles.field}>
            <Dropdown<CivicIssue>
              label="Issue to route"
              value={routingIssue}
              options={issueOptions}
              onChange={setRoutingIssue}
              sheetTitle="What kind of issue?"
            />
          </View>
          <View style={styles.field}>
            <Dropdown<Jurisdiction>
              label="Municipality"
              value={jurisdiction}
              options={JURISDICTIONS}
              onChange={setJurisdiction}
              sheetTitle="Where is it?"
            />
          </View>
        </View>

        <View style={styles.previewBox}>
          {routingResult.kind === 'city' ? (
            <>
              <Text style={styles.previewLabel}>Suggested receiving service</Text>
              <Text style={styles.previewValue}>{routingResult.service}</Text>
              <Text style={styles.previewLabel}>Next step</Text>
              <Text style={styles.previewValue}>{routingResult.nextStep}.</Text>
              <Text style={styles.previewFootnote}>Routing preview only · Final assignment by CSB.</Text>
            </>
          ) : (
            <>
              <Text style={styles.previewValue}>Different jurisdiction.</Text>
              <Text style={styles.previewFootnote}>
                St. Louis City CSB does not cover every County municipality. Confirm the exact city or
                utility before submitting. No automatic department assignment is shown.
              </Text>
            </>
          )}
        </View>

        <View style={styles.warnNote}>
          <Text style={styles.warnText}>
            Routing is illustrative and must be confirmed against the official CSB service types. The
            prototype does not send cases to a government system. For emergencies call 911.
          </Text>
        </View>

        <View style={styles.linkRow}>
          <Pressable onPress={openCsbPortal} hitSlop={6}>
            <Text style={styles.inlineLink}>Official CSB portal ↗</Text>
          </Pressable>
          <Text style={styles.inlineDivider}>·</Text>
          <Pressable onPress={openOpen311} hitSlop={6}>
            <Text style={styles.inlineLink}>Open311 API documentation ↗</Text>
          </Pressable>
        </View>
      </View>

      {/* ───── My requests ───── */}
      <MyReportsCard
        reports={reports}
        loading={loadingReports}
        error={reportsError}
        onRefresh={refreshReports}
      />

      {/* ───── Report a civic issue ───── */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Report a civic issue</Text>
        <Text style={styles.sectionMeta}>Photo → Review → Report</Text>
      </View>

      <View style={styles.card}>
        <Pressable
          onPress={handleAttachPhoto}
          disabled={analyzing}
          style={({ pressed }) => [styles.upload, pressed && styles.pressed]}
        >
          {photo ? (
            <>
              <Image source={{ uri: photo.uri }} style={styles.uploadPreview} resizeMode="cover" />
              {analyzing ? (
                <View style={styles.analyzeOverlay}>
                  <ActivityIndicator color={colors.white} />
                  <Text style={styles.analyzeOverlayText}>Analyzing photo…</Text>
                </View>
              ) : (
                <Text style={styles.uploadReplace}>Tap to replace photo</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadLabel}>Take or upload a photo</Text>
              <Text style={styles.uploadHint}>We'll auto-fill the form from the photo + your location</Text>
            </>
          )}
        </Pressable>

        {rejectReason && (
          <View style={styles.rejectBanner}>
            <Text style={styles.rejectText}>{rejectReason}</Text>
          </View>
        )}

        {analysisHint && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintText}>{analysisHint}</Text>
          </View>
        )}

        <View style={{ marginTop: spacing.three }}>
          <Dropdown<CivicIssue>
            label="What kind of issue?"
            value={reportCategory}
            options={issueOptions}
            onChange={setReportCategory}
          />
        </View>

        <View style={{ marginTop: spacing.three }}>
          <Text style={styles.inputLabel}>Location / nearby intersection</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lindell Blvd & N Euclid Ave"
            placeholderTextColor={colors.muted}
            value={reportLocation}
            onChangeText={setReportLocation}
          />
        </View>

        <View style={{ marginTop: spacing.three }}>
          <Text style={styles.inputLabel}>Describe what you see</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Tell us what happened..."
            placeholderTextColor={colors.muted}
            value={reportDescription}
            onChangeText={setReportDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Pressable
          onPress={handleHelpDraft}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryBtnText}>✦ Help me write a description</Text>
        </Pressable>

        <View style={styles.shareRow}>
          <Checkbox
            value={shareWithCommunity}
            onChange={setShareWithCommunity}
            label="Also share with the community"
            description="Post this report to the Community Feed so other OurSTL neighbors can see it. Leave off to keep it visible only to you and the city."
          />
        </View>
      </View>

      {/* ───── What happens next? ───── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What happens next?</Text>
        <Text style={styles.stepLine}>
          <Text style={styles.stepNumber}>1. </Text>You review the report and confirm its accuracy.
        </Text>
        <Text style={styles.stepLine}>
          <Text style={styles.stepNumber}>2. </Text>We create a community issue post.
        </Text>
        <Text style={styles.stepLine}>
          <Text style={styles.stepNumber}>3. </Text>For an official service request, we guide you to the
          St. Louis CSB portal.
        </Text>
        <Text style={styles.stepLine}>
          <Text style={styles.stepNumber}>4. </Text>Neighbors can confirm the same issue and follow
          updates.
        </Text>
        <View style={styles.innerNotice}>
          <Text style={styles.innerNoticeText}>
            This prototype is not connected to city systems. Creating a community post does not submit
            an official 311 request.
          </Text>
        </View>
        <Pressable
          onPress={handleSubmitReport}
          disabled={submitting || analyzing}
          style={({ pressed }) => [
            styles.primaryBtn,
            (submitting || analyzing) && styles.primaryBtnDisabled,
            pressed && styles.pressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Review & create community report →</Text>
          )}
        </Pressable>
      </View>

      {/* ───── Already submitted? ───── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Already submitted to the city?</Text>
        <Text style={styles.cardBody}>
          Check an official complaint’s status through the St. Louis Citizens’ Service Bureau.
        </Text>
        <Pressable
          onPress={openCsbPortal}
          style={({ pressed }) => [styles.outlineBtn, pressed && styles.pressed]}
        >
          <Text style={styles.outlineBtnText}>Open official CSB website ↗</Text>
        </Pressable>
      </View>
    </ScrollView>
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

  workflow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  workflowStep: {
    backgroundColor: '#eef5f7',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
  },
  workflowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#213247',
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 9,
    rowGap: 9,
  },
  chip: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#dde7ea',
    borderRadius: 13,
    padding: 13,
    backgroundColor: '#fafcfd',
    gap: 2,
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: '#168a89',
    backgroundColor: '#eaf8f5',
  },
  chipIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  chipLabel: {
    color: '#17334e',
    fontWeight: '800',
    fontSize: 14,
  },
  chipSubtitle: {
    color: colors.muted,
    fontSize: 11,
  },

  twoFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    flexGrow: 1,
    minWidth: 170,
  },

  actionBtn: {
    marginTop: spacing.two,
    backgroundColor: colors.teal,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },

  previewBox: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f0f7f9',
    gap: 4,
  },
  previewPrompt: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3c566b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  previewValue: {
    color: '#17334e',
    fontSize: 14,
    fontWeight: '700',
  },
  previewFootnote: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 6,
  },

  warnNote: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderLeftWidth: 4,
    borderLeftColor: '#e7ad4e',
    backgroundColor: '#fff8e8',
    borderRadius: 6,
  },
  warnText: { color: '#634b24', fontSize: 13, lineHeight: 19 },

  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  inlineLink: {
    color: '#165d95',
    fontWeight: '700',
    fontSize: 13,
  },
  inlineDivider: {
    color: colors.muted,
    fontSize: 13,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.three,
    marginTop: spacing.two,
  },
  sectionTitle: { ...typography.h2, fontSize: 22, color: colors.navy },
  sectionMeta: { color: colors.muted, fontSize: 13 },

  upload: {
    borderWidth: 2,
    borderColor: '#b9d6d8',
    borderStyle: 'dashed',
    borderRadius: 15,
    backgroundColor: '#f4fbfa',
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  uploadIcon: { fontSize: 36 },
  uploadLabel: {
    fontWeight: '800',
    color: '#17334e',
    fontSize: 15,
  },
  uploadHint: {
    color: colors.muted,
    fontSize: 12,
  },
  uploadPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
  },
  uploadReplace: {
    marginTop: 8,
    color: '#17334e',
    fontWeight: '700',
    fontSize: 13,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3c566b',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cedce1',
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#17334e',
    fontSize: 15,
  },
  textarea: {
    minHeight: 100,
  },

  secondaryBtn: {
    marginTop: spacing.two,
    backgroundColor: colors.secondaryBg,
    borderRadius: 11,
    paddingVertical: 11,
    paddingHorizontal: 17,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  secondaryBtnText: {
    color: colors.secondaryText,
    fontWeight: '700',
    fontSize: 13,
  },

  stepLine: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  stepNumber: {
    fontWeight: '800',
    color: colors.navy,
  },

  innerNotice: {
    backgroundColor: '#f1f7fa',
    borderLeftWidth: 3,
    borderLeftColor: '#418ca7',
    padding: 13,
    borderRadius: 8,
  },
  innerNoticeText: {
    color: '#4a687b',
    fontSize: 12,
    lineHeight: 18,
  },

  primaryBtn: {
    marginTop: spacing.two,
    backgroundColor: colors.teal,
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },

  outlineBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#d6e1e8',
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 13,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  outlineBtnText: {
    color: '#244968',
    fontWeight: '700',
    fontSize: 13,
  },

  pressed: { opacity: 0.75 },
  analyzeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#17334ecc',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.two,
    borderRadius: 15,
  },
  analyzeOverlayText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  rejectBanner: {
    marginTop: spacing.two,
    backgroundColor: colors.errorBg,
    padding: 12,
    borderRadius: 8,
  },
  rejectText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  hintBanner: {
    marginTop: spacing.two,
    backgroundColor: '#fff8e8',
    borderLeftWidth: 3,
    borderLeftColor: '#e7ad4e',
    padding: 11,
    borderRadius: 6,
  },
  hintText: {
    color: '#634b24',
    fontSize: 12,
    lineHeight: 17,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  shareRow: {
    marginTop: spacing.three,
    padding: spacing.three,
    borderRadius: 10,
    backgroundColor: '#f0f7f9',
  },
});
