import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/theme';

interface BrandProps {
  showTagline?: boolean;
  size?: 'default' | 'large';
  onDark?: boolean;
}

export function Brand({ showTagline = true, size = 'default', onDark = false }: BrandProps) {
  const wordmarkSize = size === 'large' ? 36 : typography.brandWordmark.fontSize;
  const asteriskSize = size === 'large' ? 22 : 16;
  const ourColor = onDark ? colors.white : colors.navy;
  const stlColor = onDark ? '#b4ece6' : colors.teal;
  const taglineColor = onDark ? '#d7eceb' : colors.muted;

  return (
    <View>
      <View style={styles.wordmarkRow}>
        <Text style={[typography.brandWordmark, { fontSize: wordmarkSize, color: ourColor }]}>
          Our
          <Text style={{ color: stlColor }}>STL</Text>
          <Text style={[styles.asterisk, { fontSize: asteriskSize, color: stlColor }]}> *</Text>
        </Text>
      </View>
      {showTagline && (
        <Text style={[typography.tagline, { color: taglineColor }]}>ONE CITY. STRONGER TOGETHER.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  asterisk: {
    fontWeight: '900',
  },
});
