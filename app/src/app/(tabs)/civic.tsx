import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
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

import { Dropdown } from '@/components/Dropdown';
import { Hero } from '@/components/Hero';
import {
  ALL_ISSUES,
  draftDescription,
  ISSUE_CHIPS,
  routeIssue,
  type CivicIssue,
  type Jurisdiction,
  type RoutingResult,
} from '@/services/civicRouting';
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
  const [routingIssue, setRoutingIssue] = useState<CivicIssue>('Pothole');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('city');
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null);

  const [reportCategory, setReportCategory] = useState<CivicIssue>('Damaged sidewalk');
  const [reportLocation, setReportLocation] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const issueOptions = useMemo(() => ALL_ISSUES.map((i) => ({ value: i, label: i })), []);

  const handleChipPress = (issue: CivicIssue) => {
    setRoutingIssue(issue);
    setRoutingResult(routeIssue(issue, jurisdiction));
  };

  const handleFindService = () => {
    setRoutingResult(routeIssue(routingIssue, jurisdiction));
  };

  const handleHelpDraft = () => {
    setReportDescription(draftDescription(reportCategory));
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
      setPhoto(result.assets[0]);
    }
  };

  const handleSubmitReport = () => {
    if (!reportLocation.trim()) {
      Alert.alert('Add a location', 'Tell us where the issue is before submitting.');
      return;
    }
    Alert.alert(
      'Review your report',
      `Category: ${reportCategory}\nLocation: ${reportLocation}\n\n${reportDescription || 'No description provided'}\n\nThis prototype doesn’t send the report to the City of St. Louis. Use the official CSB portal for a real service request.`,
      [{ text: 'OK' }]
    );
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
                onPress={() => handleChipPress(chip.key)}
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

        <Pressable
          onPress={handleFindService}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        >
          <Text style={styles.actionBtnText}>Find responsible service →</Text>
        </Pressable>

        <View style={styles.previewBox}>
          {routingResult === null ? (
            <Text style={styles.previewPrompt}>
              Select an issue to see the suggested service and responsible department.
            </Text>
          ) : routingResult.kind === 'city' ? (
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

      {/* ───── Report a civic issue ───── */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Report a civic issue</Text>
        <Text style={styles.sectionMeta}>Photo → Review → Report</Text>
      </View>

      <View style={styles.card}>
        <Pressable
          onPress={handleAttachPhoto}
          style={({ pressed }) => [styles.upload, pressed && styles.pressed]}
        >
          {photo ? (
            <>
              <Image source={{ uri: photo.uri }} style={styles.uploadPreview} resizeMode="cover" />
              <Text style={styles.uploadReplace}>Tap to replace photo</Text>
            </>
          ) : (
            <>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadLabel}>Take or upload a photo</Text>
              <Text style={styles.uploadHint}>JPG or PNG · Demo preview</Text>
            </>
          )}
        </Pressable>

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
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.primaryBtnText}>Review & create community report →</Text>
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
});
