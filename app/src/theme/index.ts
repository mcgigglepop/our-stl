import { Platform } from 'react-native';

export const colors = {
  navy: '#142a45',
  blue: '#255b8e',
  teal: '#167f80',
  tealDeep: '#157267',
  tealTint: '#e7f5f1',
  cream: '#f5f7f6',
  ink: '#213247',
  muted: '#68798a',
  line: '#e5ebef',
  orange: '#efb566',

  pageBackground: '#e9eff1',
  shellBackground: '#f9fbfb',
  surface: '#ffffff',
  surfaceAlt: '#eef3f6',
  avatarBackground: '#eaf0f5',
  avatarText: '#255b8e',

  inputBorder: '#dce6e9',
  inputBackground: '#ffffff',
  secondaryBg: '#eef3f6',
  secondaryText: '#284966',

  tabBarBorder: '#dae5e8',
  tabInactive: '#778696',

  error: '#b4524b',
  errorBg: '#fde8e6',
  success: '#147d5c',
  successBg: '#e4f5ed',

  white: '#ffffff',
  black: '#000000',
} as const;

export const heroGradient = ['#173d5d', '#176d75'] as const;
export const rehabHeroGradient = ['#17575b', '#16857c'] as const;
export const shelterHeroGradient = ['#243d64', '#547d92'] as const;

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
}) as string;

export const typography = {
  brandWordmark: {
    fontFamily,
    fontSize: 25,
    fontWeight: '900' as const,
    letterSpacing: -1.4,
    color: colors.navy,
  },
  tagline: {
    fontFamily,
    fontSize: 11,
    letterSpacing: 0.66,
    color: colors.muted,
    textTransform: 'uppercase' as const,
  },
  eyebrow: {
    fontFamily,
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1.44,
    color: colors.teal,
    textTransform: 'uppercase' as const,
  },
  h1: {
    fontFamily,
    fontSize: 30,
    fontWeight: '800' as const,
    letterSpacing: -1,
    lineHeight: 34,
    color: colors.ink,
  },
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  h3: {
    fontFamily,
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.ink,
  },
  body: {
    fontFamily,
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
  },
  bodyMuted: {
    fontFamily,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
  },
  label: {
    fontFamily,
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#3c566b',
  },
  button: {
    fontFamily,
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  tabLabel: {
    fontFamily,
    fontSize: 11,
    fontWeight: '700' as const,
  },
} as const;

export const spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
  eight: 64,
} as const;

export const radii = {
  input: 9,
  button: 11,
  card: 17,
  hero: 22,
  pill: 30,
  avatar: 999,
} as const;

export const sizes = {
  headerHeight: 74,
  headerHeightCompact: 65,
  headerPaddingX: 24,
  tabBarHeight: 80,
  avatar: 37,
  touchTarget: 44,
} as const;

export const theme = {
  colors,
  heroGradient,
  rehabHeroGradient,
  shelterHeroGradient,
  typography,
  spacing,
  radii,
  sizes,
  fontFamily,
};

export type Theme = typeof theme;
export default theme;
