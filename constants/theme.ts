import { ImageSourcePropType } from 'react-native';

export type AppTheme = 'kawaii';

export interface ThemeColors {
  name: string;
  badge: string;
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgCardAlt: string;
  primaryAccent: string;
  primaryAccentLight: string;
  primaryGreen: string;
  primaryGreenLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  textMain: string;
  textMuted: string;
  textSubtle: string;
  borderSoft: string;
  borderAccent: string;
  tabBarBg: string;
  tabBarBorder: string;
  activeTabTint: string;
  inactiveTabTint: string;
  statusPendingBg: string;
  statusPendingText: string;
  statusCompletedBg: string;
  statusCompletedText: string;
  cardShadow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface ThemeStickers {
  home: ImageSourcePropType;
  debitCredit: ImageSourcePropType;
  wishlist: ImageSourcePropType;
  vault: ImageSourcePropType;
}

export const THEME_STICKERS: Record<AppTheme, ThemeStickers> = {
  kawaii: {
    home: require('@/assets/images/stickers/sticker_cat.jpg'),
    debitCredit: require('@/assets/images/stickers/sticker_piggy.jpg'),
    wishlist: require('@/assets/images/stickers/sticker_gift.jpg'),
    vault: require('@/assets/images/stickers/sticker_lock.jpg'),
  },
};

export const THEMES: Record<AppTheme, ThemeColors> = {
  kawaii: {
    name: 'Kawaii Pastel 🌸',
    badge: '🌸 Kawaii',
    bgPrimary: '#ddebdc',
    bgSecondary: '#eef5ec',
    bgCard: '#ffffff',
    bgCardAlt: '#faf7f2',
    primaryAccent: '#f4aab9',
    primaryAccentLight: '#fdebef',
    primaryGreen: '#65a865',
    primaryGreenLight: '#e4f5e4',
    danger: '#e6536b',
    dangerLight: '#ffe4e6',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    textMain: '#2c352d',
    textMuted: '#637365',
    textSubtle: '#8f9e91',
    borderSoft: '#d3e2d2',
    borderAccent: '#f3c2cc',
    tabBarBg: '#ffffff',
    tabBarBorder: '#d3e2d2',
    activeTabTint: '#d85c72',
    inactiveTabTint: '#829184',
    statusPendingBg: '#ffe4e6',
    statusPendingText: '#d9384e',
    statusCompletedBg: '#d3f2db',
    statusCompletedText: '#24783e',
    cardShadow: {
      shadowColor: '#3c5a41',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
  },
};

export const CATEGORY_PALETTES: Record<AppTheme, Record<string, string>> = {
  kawaii: {
    '🛍️ Shopping': '#f48295',
    '🏠 Utilities': '#85b885',
    '🍔 Food': '#ffc285',
    '🚗 Transport': '#64ad72',
    '☕ Coffee': '#d85c72',
    '🍿 Fun': '#a685e2',
    '💼 Salary': '#65a865',
    '🔄 Transfer': '#5995e2',
    'Health': '#e06d86',
    'Education': '#5b9bd5',
  },
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export const Fonts = {
  regular: 'System',
  bold: 'System',
  rounded: 'System',
  mono: 'SpaceMono',
};


