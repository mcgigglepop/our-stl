import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Dropdown } from '@/components/Dropdown';
import type { CommunityPostKind } from '@/services/reports';
import { colors, radii, spacing, typography } from '@/theme';

interface NewPostModalProps {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; message: string; kind: CommunityPostKind }) => Promise<void>;
}

const KIND_OPTIONS: { value: CommunityPostKind; label: string }[] = [
  { value: 'issue', label: 'Civic issue' },
  { value: 'good', label: 'Good news' },
  { value: 'event', label: 'Community event' },
];

export function NewPostModal({ visible, submitting, onClose, onSubmit }: NewPostModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [kind, setKind] = useState<CommunityPostKind>('good');

  useEffect(() => {
    if (visible) {
      setTitle('');
      setMessage('');
      setKind('good');
    }
  }, [visible]);

  const canSubmit =
    title.trim().length > 0 && message.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Add a title', 'Give your post a short headline.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Add a message', 'Share what you want neighbors to know.');
      return;
    }
    await onSubmit({ title: title.trim(), message: message.trim(), kind });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Create a community post</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
              <View style={styles.field}>
                <Text style={styles.label}>Post title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What would you like to share?"
                  placeholderTextColor={colors.muted}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={120}
                  editable={!submitting}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Your message</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Share a local update or idea…"
                  placeholderTextColor={colors.muted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                  editable={!submitting}
                />
              </View>

              <Dropdown<CommunityPostKind>
                label="Kind"
                value={kind}
                options={KIND_OPTIONS}
                onChange={setKind}
                sheetTitle="What kind of post?"
              />

              <Pressable
                disabled={!canSubmit}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  !canSubmit && styles.primaryBtnDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Publish post</Text>
                )}
              </Pressable>

              <Text style={styles.footnote}>
                Your post will be visible to all OurSTL users. We tag it with your current
                location so neighbors nearby can find it.
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: '#102a3d99',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.four,
    paddingTop: spacing.two,
    paddingBottom: spacing.six,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d8e1e6',
    marginVertical: spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.two,
  },
  title: {
    ...typography.h3,
    color: colors.navy,
  },
  close: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  scroll: {
    gap: spacing.three,
    paddingBottom: spacing.four,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3c566b',
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
  primaryBtn: {
    marginTop: spacing.two,
    backgroundColor: colors.teal,
    borderRadius: radii.button,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  footnote: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
});
