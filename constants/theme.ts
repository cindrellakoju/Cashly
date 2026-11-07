import { ImageSourcePropType } from 'react-native';

export type AppTheme = 'paper' | 'paperDark' | 'kawaii' | 'dreamy' | 'fresh' | 'playful' | 'midnight' | 'noir';

export type StickerPack = 'totoro' | 'spy_family' | 'cat';

export interface StickerPackInfo {
  id: StickerPack;
  name: string;
  badge: string;
  tagline: string;
  icon: string;
  previewEmoji: string;
}

export const STICKER_PACKS: StickerPackInfo[] = [
  {
    id: 'totoro',
    name: 'My Neighbor Totoro',
    badge: '🌲 Totoro',
    tagline: 'Forest spirits, leaf umbrellas & soot sprites',
    icon: 'leaf',
    previewEmoji: '🌲',
  },
  {
    id: 'spy_family',
    name: 'Spy x Family',
    badge: '🥜 Spy x Family',
    tagline: 'Waku waku! Anya, Bond doggo & Stella stars',
    icon: 'sparkles',
    previewEmoji: '🥜',
  },
  {
    id: 'cat',
    name: 'Kawaii Cat (Neko)',
    badge: '🐱 Lucky Neko',
    tagline: 'Playful kittens, lucky coins & soft paws',
    icon: 'paw',
    previewEmoji: '🐱',
  },
];

export interface ThemeColors {
  name: string;
  badge: string;
  subtitle: string;
  paletteDots: string[];
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
  textOnAccent: string;
  borderSoft: string;
  borderAccent: string;
  glassBorder: string;
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
  clayShadow: {
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

const DEFAULT_PASTEL_STICKERS: ThemeStickers = {
  home: require('@/assets/images/stickers/sticker_cat.jpg'),
  debitCredit: require('@/assets/images/stickers/sticker_piggy.jpg'),
  wishlist: require('@/assets/images/stickers/sticker_gift.jpg'),
  vault: require('@/assets/images/stickers/sticker_lock.jpg'),
};

export const THEME_STICKERS: Record<AppTheme, ThemeStickers> = {
  paper: DEFAULT_PASTEL_STICKERS,
  paperDark: DEFAULT_PASTEL_STICKERS,
  kawaii: DEFAULT_PASTEL_STICKERS,
  dreamy: DEFAULT_PASTEL_STICKERS,
  fresh: {
    home: require('@/assets/images/stickers/neko_home.jpg'),
    debitCredit: require('@/assets/images/stickers/neko_debit.jpg'),
    wishlist: require('@/assets/images/stickers/neko_wishlist.jpg'),
    vault: require('@/assets/images/stickers/neko_vault.jpg'),
  },
  playful: {
    home: require('@/assets/images/stickers/op_sunny.jpg'),
    debitCredit: require('@/assets/images/stickers/op_chopper.jpg'),
    wishlist: require('@/assets/images/stickers/op_luffy.jpg'),
    vault: require('@/assets/images/stickers/op_zoro.jpg'),
  },
  midnight: DEFAULT_PASTEL_STICKERS,
  noir: DEFAULT_PASTEL_STICKERS,
};

// 📜 Kraft Memo Pad Theme — Warm cardboard kraft paper, cream grid sheets & hand-drawn ink
export const PAPER_THEME: ThemeColors = {
  name: 'Kraft Memo Pad 📜',
  badge: '📜 Kraft Paper',
  subtitle: 'Cardboard kraft canvas & cream grid notepad',
  paletteDots: ['#2C221D', '#F3CA68', '#6AA35E', '#FAF5EE'],
  bgPrimary: '#FAF5EE',        // Warm cream graph paper canvas (from Account PIN & Image 3)
  bgSecondary: '#F0E6D8',      // Warm parchment & kraft accent
  bgCard: '#FFFFFF',           // Crisp ivory memo sheet
  bgCardAlt: '#F5EFEB',        // Slightly darker cream
  primaryAccent: '#F3CA68',    // Warm butter yellow memo accent
  primaryAccentLight: '#FDF3DA',
  primaryGreen: '#6AA35E',     // Hanging plant green
  primaryGreenLight: '#E8F3E5', // Soft matcha wash
  danger: '#D95B66',           // Strawberry hand-drawn red
  dangerLight: '#FBE8EA',
  warning: '#E69836',          // Warm honey amber
  warningLight: '#FDF1DF',
  textMain: '#2C221D',         // Rich espresso hand-drawn ink
  textMuted: '#6C5545',        // Walnut graphite
  textSubtle: '#8E7665',       // Soft pencil
  textOnAccent: '#2C221D',     // Ink on butter yellow
  borderSoft: 'transparent',   // Clean borderless floating cards
  borderAccent: 'transparent',
  glassBorder: 'transparent',
  tabBarBg: '#FAF5EE',         // Cream notepad bottom bar
  tabBarBorder: 'transparent', // Borderless bottom bar
  activeTabTint: '#2C221D',    // Dark ink active tab
  inactiveTabTint: '#8E7665',  // Pencil grey inactive tab
  statusPendingBg: '#FDF1DF',
  statusPendingText: '#B8721E',
  statusCompletedBg: '#E8F3E5',
  statusCompletedText: '#3D7A32',
  cardShadow: {
    shadowColor: '#2C221D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  clayShadow: {
    shadowColor: '#2C221D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 4,
  },
};

// 🐾 Totoro Craft Grey Theme — Speckled craft grey & cozy cloud paper from Image 2
export const PAPER_DARK_THEME: ThemeColors = {
  name: 'Totoro Craft Grey 🐾',
  badge: '🐾 Totoro Grey',
  subtitle: 'Recycled speckled craft grey & cloud paper',
  paletteDots: ['#262422', '#F5F4EE', '#888782', '#6BA270'],
  bgPrimary: '#888782',        // Speckled craft grey from Image 2
  bgSecondary: '#777671',      // Deep craft grey
  bgCard: '#F5F4EE',           // Cloud cream memo sheet
  bgCardAlt: '#EBEAE3',
  primaryAccent: '#383632',    // Dark soot sprite ink
  primaryAccentLight: '#E8E7E0',
  primaryGreen: '#4D8554',     // Forest Totoro green
  primaryGreenLight: '#E5EFE6',
  danger: '#C7515C',
  dangerLight: '#FAE7E9',
  warning: '#D4892A',
  warningLight: '#FBEEDC',
  textMain: '#262422',         // Dark soot ink
  textMuted: '#5C5A54',        // Soft charcoal
  textSubtle: '#7E7C75',
  textOnAccent: '#FFFFFF',
  borderSoft: 'transparent',
  borderAccent: 'transparent',
  glassBorder: 'transparent',
  tabBarBg: '#F5F4EE',
  tabBarBorder: 'transparent',
  activeTabTint: '#262422',
  inactiveTabTint: '#7E7C75',
  statusPendingBg: '#FBEEDC',
  statusPendingText: '#B36D16',
  statusCompletedBg: '#E5EFE6',
  statusCompletedText: '#2D6B34',
  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  clayShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
};

// 🌸 Kawaii Pastel Theme — Original soft pastel sage grid canvas, sakura pink & forest ink
export const KAWAII_THEME: ThemeColors = {
  name: 'Kawaii Pastel 🌸',
  badge: '🌸 Kawaii',
  subtitle: 'Pastel sage grid canvas, sakura pink & forest ink',
  paletteDots: ['#DDEBDC', '#F4AAB9', '#65A865', '#2C352D'],
  bgPrimary: '#DDEBDC',        // Original soft pastel sage/matcha grid canvas
  bgSecondary: '#EEF5EC',      // Pale matcha accent
  bgCard: '#FFFFFF',           // Crisp white memo sheet
  bgCardAlt: '#FAF7F2',        // Warm pale memo sheet
  primaryAccent: '#F4AAB9',    // Sweet sakura strawberry pink
  primaryAccentLight: '#FDEBEF',
  primaryGreen: '#65A865',     // Fresh matcha green
  primaryGreenLight: '#E4F5E4',
  danger: '#E6536B',           // Soft coral red
  dangerLight: '#FFE4E6',
  warning: '#F59E0B',          // Warm honey amber
  warningLight: '#FEF3C7',
  textMain: '#2C352D',         // Deep forest charcoal hand-drawn ink
  textMuted: '#637365',        // Soft sage graphite
  textSubtle: '#8F9E91',       // Pale pencil grey
  textOnAccent: '#2C352D',     // Ink on sakura pink
  borderSoft: 'transparent',   // Clean borderless floating cards
  borderAccent: 'transparent',
  glassBorder: 'transparent',
  tabBarBg: '#FFFFFF',         // White memo pad bottom bar
  tabBarBorder: 'transparent', // Borderless bottom bar
  activeTabTint: '#D85C72',    // Strawberry pink active tab
  inactiveTabTint: '#829184',  // Pencil sage inactive tab
  statusPendingBg: '#FFE4E6',
  statusPendingText: '#D9384E',
  statusCompletedBg: '#D3F2DB',
  statusCompletedText: '#24783E',
  cardShadow: {
    shadowColor: '#28452D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  clayShadow: {
    shadowColor: '#28452D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
};

// 🍓 Strawberry Milk Theme — Soft blush strawberry milk graph paper & plum ink
const DREAMY_THEME: ThemeColors = {
  name: 'Strawberry Milk 🍓',
  badge: '🍓 Strawberry',
  subtitle: 'Blush pink grid canvas, sakura accents & plum ink',
  paletteDots: ['#FDF3F5', '#F7A8B8', '#7EC8A4', '#38232D'],
  bgPrimary: '#FDF3F5',        // Soft pastel strawberry milk grid canvas
  bgSecondary: '#FCE7EC',      // Soft pastel rose tint
  bgCard: '#FFFFFF',           // Crisp white memo sheet
  bgCardAlt: '#FDF6F8',        // Pale blush memo sheet
  primaryAccent: '#F7A8B8',    // Sweet pastel sakura pink
  primaryAccentLight: '#FDF0F3',
  primaryGreen: '#7EC8A4',     // Pastel matcha mint
  primaryGreenLight: '#EDF9F3',
  danger: '#E57373',           // Soft coral red
  dangerLight: '#FDEDEC',
  warning: '#F5BA67',          // Warm pastel apricot
  warningLight: '#FEF6EC',
  textMain: '#38232D',         // Deep plum espresso hand-drawn ink
  textMuted: '#6E5562',        // Soft mulberry graphite
  textSubtle: '#967F8D',       // Lilac pencil
  textOnAccent: '#38232D',     // Ink on sakura pink
  borderSoft: 'transparent',
  borderAccent: 'transparent',
  glassBorder: 'transparent',
  tabBarBg: '#FFFFFF',         // White memo pad bottom bar
  tabBarBorder: 'transparent',
  activeTabTint: '#38232D',    // Dark plum active tab
  inactiveTabTint: '#967F8D',  // Lilac pencil inactive tab
  statusPendingBg: '#FEF6EC',
  statusPendingText: '#B8721E',
  statusCompletedBg: '#EDF9F3',
  statusCompletedText: '#3D7A32',
  cardShadow: {
    shadowColor: '#38232D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  clayShadow: {
    shadowColor: '#38232D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
};

const FRESH_THEME: ThemeColors = {
  name: 'Matcha & Mint 🌿',
  badge: '🌿 Matcha',
  subtitle: 'Fresh matcha, mint & garden stationery',
  paletteDots: ['#283526', '#E4F0E1', '#5B9C54', '#FAFDF9'],
  bgPrimary: '#C9DBC5',
  bgSecondary: '#B7CEB2',
  bgCard: '#FAFDF9',
  bgCardAlt: '#EEF6EC',
  primaryAccent: '#5B9C54',
  primaryAccentLight: '#E8F4E6',
  primaryGreen: '#4A8744',
  primaryGreenLight: '#E1F0DF',
  danger: '#CE5353',
  dangerLight: '#F9E5E5',
  warning: '#DB9635',
  warningLight: '#FCEFDB',
  textMain: '#283526',
  textMuted: '#586E55',
  textSubtle: '#7B9478',
  textOnAccent: '#FFFFFF',
  borderSoft: '#283526',
  borderAccent: '#283526',
  glassBorder: '#283526',
  tabBarBg: '#FAFDF9',
  tabBarBorder: '#283526',
  activeTabTint: '#283526',
  inactiveTabTint: '#7B9478',
  statusPendingBg: '#FCEFDB',
  statusPendingText: '#AF6C18',
  statusCompletedBg: '#E1F0DF',
  statusCompletedText: '#286823',
  cardShadow: {
    shadowColor: '#283526',
    shadowOffset: { width: 1.5, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 0,
    elevation: 2,
  },
  clayShadow: {
    shadowColor: '#283526',
    shadowOffset: { width: 1.5, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 0,
    elevation: 2,
  },
};

const PLAYFUL_THEME: ThemeColors = {
  name: 'Playful Peach 🍑',
  badge: '🍑 Peach',
  subtitle: 'Peach stationery, butter & warm toast',
  paletteDots: ['#3A241C', '#FDE7DC', '#E88258', '#FFFAF7'],
  bgPrimary: '#ECC8B8',
  bgSecondary: '#DDB6A4',
  bgCard: '#FFFAF7',
  bgCardAlt: '#FCEFE8',
  primaryAccent: '#E88258',
  primaryAccentLight: '#FDEEE6',
  primaryGreen: '#5A9452',
  primaryGreenLight: '#E5F3E2',
  danger: '#DA515A',
  dangerLight: '#FBE4E6',
  warning: '#E29738',
  warningLight: '#FCEFD8',
  textMain: '#3A241C',
  textMuted: '#7A5B50',
  textSubtle: '#9E7E73',
  textOnAccent: '#FFFFFF',
  borderSoft: '#3A241C',
  borderAccent: '#3A241C',
  glassBorder: '#3A241C',
  tabBarBg: '#FFFAF7',
  tabBarBorder: '#3A241C',
  activeTabTint: '#3A241C',
  inactiveTabTint: '#9E7E73',
  statusPendingBg: '#FCEFD8',
  statusPendingText: '#B56E1A',
  statusCompletedBg: '#E5F3E2',
  statusCompletedText: '#2B6824',
  cardShadow: {
    shadowColor: '#3A241C',
    shadowOffset: { width: 1.5, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 0,
    elevation: 2,
  },
  clayShadow: {
    shadowColor: '#3A241C',
    shadowOffset: { width: 1.5, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 0,
    elevation: 2,
  },
};

// 🌙 Midnight Slate — Soft dark notebook theme
const MIDNIGHT_THEME: ThemeColors = {
  name: 'Midnight Ink 🌙',
  badge: '🌙 Midnight',
  subtitle: 'Dark night notebook & parchment glow',
  paletteDots: ['#1C1B22', '#F4F3F8', '#9B8BE2', '#342F42'],
  bgPrimary: '#22202A',
  bgSecondary: '#1C1A23',
  bgCard: '#2E2B38',
  bgCardAlt: '#373444',
  primaryAccent: '#B8A6F8',
  primaryAccentLight: 'rgba(184, 166, 248, 0.16)',
  primaryGreen: '#5CC98A',
  primaryGreenLight: 'rgba(92, 201, 138, 0.16)',
  danger: '#F27988',
  dangerLight: 'rgba(242, 121, 136, 0.16)',
  warning: '#F5B857',
  warningLight: 'rgba(245, 184, 87, 0.16)',
  textMain: '#F4F3F8',
  textMuted: '#A7A3B8',
  textSubtle: '#78748A',
  textOnAccent: '#1C1B22',
  borderSoft: '#454154',
  borderAccent: '#B8A6F8',
  glassBorder: '#454154',
  tabBarBg: '#22202A',
  tabBarBorder: '#454154',
  activeTabTint: '#B8A6F8',
  inactiveTabTint: '#78748A',
  statusPendingBg: 'rgba(245, 184, 87, 0.16)',
  statusPendingText: '#F5B857',
  statusCompletedBg: 'rgba(92, 201, 138, 0.16)',
  statusCompletedText: '#5CC98A',
  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    elevation: 2,
  },
  clayShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    elevation: 2,
  },
};

export const THEMES: Record<AppTheme, ThemeColors> = {
  paper: PAPER_THEME,
  paperDark: PAPER_DARK_THEME,
  kawaii: KAWAII_THEME,
  dreamy: DREAMY_THEME,
  fresh: FRESH_THEME,
  playful: PLAYFUL_THEME,
  midnight: MIDNIGHT_THEME,
  noir: PAPER_DARK_THEME,
};

// Preset Options — Inspired directly by the user's stationery images
export const PRESET_OPTIONS: { id: AppTheme; label: string; badge: string; subtitle: string; dots: string[] }[] = [
  {
    id: 'kawaii',
    label: 'Kawaii Pastel 🌸',
    badge: '🌸 Kawaii',
    subtitle: 'Pastel sage grid canvas, sakura pink & forest ink (Original)',
    dots: ['#DDEBDC', '#F4AAB9', '#65A865', '#2C352D'],
  },
  {
    id: 'paper',
    label: 'Kraft Memo Pad 📜',
    badge: '📜 Kraft',
    subtitle: 'Cardboard kraft canvas & cream grid notepad (Image 1)',
    dots: ['#B59473', '#FAF5EE', '#2C221D', '#F3CA68'],
  },
  {
    id: 'paperDark',
    label: 'Totoro Craft Grey 🐾',
    badge: '🐾 Totoro',
    subtitle: 'Recycled speckled craft grey & cloud paper (Image 2)',
    dots: ['#888782', '#F5F4EE', '#262422', '#6BA270'],
  },
  {
    id: 'dreamy',
    label: 'Strawberry Milk 🍓',
    badge: '🍓 Strawberry',
    subtitle: 'Blush pink grid canvas, sakura accents & plum ink',
    dots: ['#FDF3F5', '#F7A8B8', '#7EC8A4', '#38232D'],
  },
  {
    id: 'playful',
    label: 'Playful Peach 🍑',
    badge: '🍑 Peach',
    subtitle: 'Warm peach stationery & butter accents',
    dots: ['#ECC8B8', '#FFFAF7', '#3A241C', '#E88258'],
  },
  {
    id: 'midnight',
    label: 'Midnight Ink 🌙',
    badge: '🌙 Midnight',
    subtitle: 'Dark night notebook & parchment glow',
    dots: ['#22202A', '#FAF7FD', '#454154', '#B8A6F8'],
  },
];

export const CATEGORY_PALETTES: Record<AppTheme, Record<string, string>> = {
  paper: {
    '🛍️ Shopping': '#D95B66',
    '🏠 Utilities': '#6AA35E',
    '🍔 Food': '#E69836',
    '🚗 Transport': '#5888B5',
    '☕ Coffee': '#7D5843',
    '🍿 Fun': '#9568B8',
    '💼 Salary': '#5A9452',
    '🔄 Transfer': '#4A8BB8',
    Health: '#D9534F',
    Education: '#458588',
  },
  paperDark: {
    '🛍️ Shopping': '#C7515C',
    '🏠 Utilities': '#4D8554',
    '🍔 Food': '#D4892A',
    '🚗 Transport': '#4E7E9E',
    '☕ Coffee': '#6B5445',
    '🍿 Fun': '#875B9E',
    '💼 Salary': '#4D8554',
    '🔄 Transfer': '#4A7F9E',
    Health: '#C7515C',
    Education: '#3E7D80',
  },
  kawaii: {
    '🛍️ Shopping': '#F48295',
    '🏠 Utilities': '#85B885',
    '🍔 Food': '#FFC285',
    '🚗 Transport': '#64AD72',
    '☕ Coffee': '#D85C72',
    '🍿 Fun': '#A685E2',
    '💼 Salary': '#65A865',
    '🔄 Transfer': '#5995E2',
    Health: '#E06D86',
    Education: '#5B9BD5',
  },
  dreamy: {
    '🛍️ Shopping': '#D75B76',
    '🏠 Utilities': '#459E75',
    '🍔 Food': '#DE9939',
    '🚗 Transport': '#5F85BD',
    '☕ Coffee': '#775765',
    '🍿 Fun': '#936EE0',
    '💼 Salary': '#459E75',
    '🔄 Transfer': '#5B7FB8',
    Health: '#D75B76',
    Education: '#487B9C',
  },
  fresh: {
    '🛍️ Shopping': '#CE5353',
    '🏠 Utilities': '#4A8744',
    '🍔 Food': '#DB9635',
    '🚗 Transport': '#4E8AA8',
    '☕ Coffee': '#6E5540',
    '🍿 Fun': '#7E5B98',
    '💼 Salary': '#4A8744',
    '🔄 Transfer': '#457FA0',
    Health: '#CE5353',
    Education: '#3A7C7E',
  },
  playful: {
    '🛍️ Shopping': '#DA515A',
    '🏠 Utilities': '#5A9452',
    '🍔 Food': '#E29738',
    '🚗 Transport': '#4E8CB5',
    '☕ Coffee': '#7A4D3B',
    '🍿 Fun': '#9A63AF',
    '💼 Salary': '#5A9452',
    '🔄 Transfer': '#4683AD',
    Health: '#DA515A',
    Education: '#3B7E80',
  },
  midnight: {
    '🛍️ Shopping': '#F27988',
    '🏠 Utilities': '#5CC98A',
    '🍔 Food': '#F5B857',
    '🚗 Transport': '#7BA5F5',
    '☕ Coffee': '#C49880',
    '🍿 Fun': '#B8A6F8',
    '💼 Salary': '#5CC98A',
    '🔄 Transfer': '#6BA2F0',
    Health: '#F27988',
    Education: '#5EC1C6',
  },
  noir: {
    '🛍️ Shopping': '#C7515C',
    '🏠 Utilities': '#4D8554',
    '🍔 Food': '#D4892A',
    '🚗 Transport': '#4E7E9E',
    '☕ Coffee': '#6B5445',
    '🍿 Fun': '#875B9E',
    '💼 Salary': '#4D8554',
    '🔄 Transfer': '#4A7F9E',
    Health: '#C7515C',
    Education: '#3E7D80',
  },
};

export const Colors = {
  light: {
    text: '#2C221D',
    background: '#B59473',
    tint: '#2C221D',
    icon: '#6C5545',
    tabIconDefault: '#8E7665',
    tabIconSelected: '#2C221D',
  },
  dark: {
    text: '#F4F3F8',
    background: '#22202A',
    tint: '#B8A6F8',
    icon: '#A7A3B8',
    tabIconDefault: '#78748A',
    tabIconSelected: '#B8A6F8',
  },
};

export const Fonts = {
  regular: 'System',
  bold: 'System',
  rounded: 'System',
  mono: 'SpaceMono',
};

export const DESIGN_TOKENS = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 24,
    full: 9999,
  },
  borderWidth: {
    ink: 2,
    fine: 1.5,
    hairline: 1,
  },
  typography: {
    headerTitle: {
      fontSize: 22,
      fontWeight: '800' as const,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 13,
      fontWeight: '600' as const,
      lineHeight: 18,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800' as const,
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    sectionSubtitle: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      lineHeight: 20,
    },
    metricLarge: {
      fontSize: 22,
      fontWeight: '800' as const,
      lineHeight: 28,
    },
    metricMedium: {
      fontSize: 17,
      fontWeight: '800' as const,
      lineHeight: 22,
    },
    body: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    bodyBold: {
      fontSize: 14,
      fontWeight: '700' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '700' as const,
      lineHeight: 16,
    },
    footnote: {
      fontSize: 11,
      fontWeight: '600' as const,
      lineHeight: 14,
    },
  },
  layout: {
    screenPadding: 16,
    cardPadding: 16,
    cardRadius: 20,
    buttonRadius: 14,
    inputRadius: 14,
    buttonHeight: 48,
    inputHeight: 48,
  },
};
