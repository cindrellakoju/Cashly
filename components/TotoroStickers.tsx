import React from 'react';
import { Image, StyleProp, ImageStyle } from 'react-native';
import { useFinancial } from '@/context/FinancialContext';
import { StickerPack } from '@/constants/theme';

export type TotoroStickerType =
  | 'big'
  | 'hero'
  | 'leaf'
  | 'income'
  | 'peek'
  | 'spent'
  | 'salary'
  | 'remaining'
  | 'parade'
  | 'star'
  | 'cat'
  | 'plant'
  | 'curious'
  | 'shout'
  | 'savings'
  | 'vault'
  | 'wishlist'
  | 'borrow_lent'
  | 'debt'
  | 'app_icon';

// 1. Studio Ghibli Totoro Sticker Assets
export const TOTORO_ASSETS: Record<string, any> = {
  big: require('@/assets/images/stickers/totoro_big.png'),
  hero: require('@/assets/images/stickers/totoro_big.png'),
  leaf: require('@/assets/images/stickers/totoro_leaf.png'),
  income: require('@/assets/images/stickers/totoro_leaf.png'),
  peek: require('@/assets/images/stickers/totoro_spent.png'),
  spent: require('@/assets/images/stickers/totoro_spent.png'),
  savings: require('@/assets/images/stickers/totoro_savings.png'),
  salary: require('@/assets/images/stickers/totoro_savings.png'),
  remaining: require('@/assets/images/stickers/totoro_big.png'),
  vault: require('@/assets/images/stickers/totoro_vault.png'),
  wishlist: require('@/assets/images/stickers/totoro_wishlist.png'),
  borrow_lent: require('@/assets/images/stickers/totoro_borrow_lent.png'),
  debt: require('@/assets/images/stickers/totoro_borrow_lent.png'),
  parade: require('@/assets/images/stickers/totoro_parade.png'),
  star: require('@/assets/images/stickers/doodle_star.png'),
  app_icon: require('@/assets/images/stickers/totoro_app_icon.png'),
  curious: require('@/assets/images/stickers/totoro_curious.png'),
  shout: require('@/assets/images/stickers/totoro_shout.png'),
  plant: require('@/assets/images/stickers/hanging_plant_trans.png'),
  cat: require('@/assets/images/stickers/cat_peeking_trans.png'),
};

// 2. Spy x Family (Anya, Bond, Chimera) Sticker Assets
export const SPY_FAMILY_ASSETS: Record<string, any> = {
  big: require('@/assets/images/stickers/spy_anya_hero.png'),
  hero: require('@/assets/images/stickers/spy_anya_hero.png'),
  leaf: require('@/assets/images/stickers/spy_anya_income.png'),
  income: require('@/assets/images/stickers/spy_anya_income.png'),
  peek: require('@/assets/images/stickers/spy_anya_spent.png'),
  spent: require('@/assets/images/stickers/spy_anya_spent.png'),
  savings: require('@/assets/images/stickers/spy_anya_salary.png'),
  salary: require('@/assets/images/stickers/spy_anya_salary.png'),
  remaining: require('@/assets/images/stickers/spy_anya_hero.png'),
  vault: require('@/assets/images/stickers/spy_bond_vault.png'),
  wishlist: require('@/assets/images/stickers/spy_anya_wishlist.png'),
  borrow_lent: require('@/assets/images/stickers/spy_anya_borrow_lent.png'),
  debt: require('@/assets/images/stickers/spy_anya_borrow_lent.png'),
  parade: require('@/assets/images/stickers/spy_parade.png'),
  star: require('@/assets/images/stickers/spy_stella_star.png'),
  app_icon: require('@/assets/images/stickers/spy_anya_icon.png'),
  curious: require('@/assets/images/stickers/spy_anya_hero.png'),
  shout: require('@/assets/images/stickers/spy_anya_spent.png'),
  plant: require('@/assets/images/stickers/hanging_plant_trans.png'),
  cat: require('@/assets/images/stickers/spy_anya_icon.png'),
};

// 3. Kawaii Cat (Neko) Sticker Assets
export const CAT_ASSETS: Record<string, any> = {
  big: require('@/assets/images/stickers/cat_hero.png'),
  hero: require('@/assets/images/stickers/cat_hero.png'),
  leaf: require('@/assets/images/stickers/cat_income.png'),
  income: require('@/assets/images/stickers/cat_income.png'),
  peek: require('@/assets/images/stickers/cat_spent.png'),
  spent: require('@/assets/images/stickers/cat_spent.png'),
  savings: require('@/assets/images/stickers/cat_peeking_trans.png'),
  salary: require('@/assets/images/stickers/cat_peeking_trans.png'),
  remaining: require('@/assets/images/stickers/cat_hero.png'),
  vault: require('@/assets/images/stickers/neko_vault_trans.png'),
  wishlist: require('@/assets/images/stickers/neko_wishlist_trans.png'),
  borrow_lent: require('@/assets/images/stickers/neko_debit_trans.png'),
  debt: require('@/assets/images/stickers/neko_debit_trans.png'),
  parade: require('@/assets/images/stickers/cat_parade.png'),
  star: require('@/assets/images/stickers/cat_paw.png'),
  app_icon: require('@/assets/images/stickers/cat_hero.png'),
  curious: require('@/assets/images/stickers/cat_hero.png'),
  shout: require('@/assets/images/stickers/cat_spent.png'),
  plant: require('@/assets/images/stickers/hanging_plant_trans.png'),
  cat: require('@/assets/images/stickers/cat_peeking_trans.png'),
};

export interface TotoroStickerProps {
  type: TotoroStickerType;
  pack?: StickerPack;
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
}

export const TotoroSticker: React.FC<TotoroStickerProps> = ({
  type,
  pack,
  size,
  width,
  height,
  style,
}) => {
  let activePack: StickerPack = 'totoro';
  try {
    const fin = useFinancial();
    if (fin && fin.stickerPack) {
      activePack = fin.stickerPack;
    }
  } catch {
    // Outside FinancialProvider fallback
  }

  const effectivePack = pack || activePack;
  const packMap =
    effectivePack === 'spy_family'
      ? SPY_FAMILY_ASSETS
      : effectivePack === 'cat'
      ? CAT_ASSETS
      : TOTORO_ASSETS;

  const source = packMap[type] || TOTORO_ASSETS[type] || TOTORO_ASSETS.big;

  // Aspect ratio calculations
  let w = size || width || 48;
  let h = size || height || 48;

  if (type === 'parade') {
    h = height || 68;
    const ratio = effectivePack === 'spy_family' ? 2.34 : effectivePack === 'cat' ? 2.63 : 3.02;
    w = width || Math.round(h * ratio);
  } else if (type === 'peek' || type === 'spent') {
    h = height || size || 64;
    const ratio = effectivePack === 'spy_family' ? 1.03 : effectivePack === 'cat' ? 1.01 : 0.93;
    w = width || (size ? Math.round(size * ratio) : 64);
  } else if (type === 'plant') {
    h = height || size || 60;
    w = width || (size ? Math.round(size * 0.64) : 40);
  } else if (type === 'cat') {
    w = width || size || 50;
    h = height || (size ? Math.round(size * 0.93) : 46);
  } else if (type === 'star') {
    w = size || width || 28;
    h = size || height || 28;
  } else if (type === 'leaf' || type === 'income') {
    h = height || size || 60;
    const ratio = effectivePack === 'spy_family' ? 0.98 : effectivePack === 'cat' ? 0.82 : 0.72;
    w = width || (size ? Math.round(size * ratio) : 48);
  } else if (type === 'big' || type === 'hero' || type === 'remaining') {
    h = height || size || 60;
    const ratio = effectivePack === 'spy_family' ? 0.65 : effectivePack === 'cat' ? 0.90 : 0.79;
    w = width || (size ? Math.round(size * ratio) : 48);
  } else if (type === 'curious' || type === 'shout') {
    h = height || size || 46;
    w = width || (size ? Math.round(size * 0.95) : 44);
  } else if (type === 'savings' || type === 'salary') {
    h = height || size || 60;
    const ratio = effectivePack === 'spy_family' ? 0.83 : effectivePack === 'cat' ? 0.95 : 0.85;
    w = width || (size ? Math.round(size * ratio) : 52);
  } else if (type === 'vault') {
    h = height || size || 70;
    const ratio = effectivePack === 'spy_family' ? 1.07 : effectivePack === 'cat' ? 0.66 : 0.81;
    w = width || (size ? Math.round(size * ratio) : 56);
  } else if (type === 'wishlist') {
    h = height || size || 66;
    const ratio = effectivePack === 'spy_family' ? 0.76 : effectivePack === 'cat' ? 0.81 : 0.79;
    w = width || (size ? Math.round(size * ratio) : 52);
  } else if (type === 'borrow_lent' || type === 'debt') {
    h = height || size || 60;
    const ratio = effectivePack === 'spy_family' ? 1.05 : effectivePack === 'cat' ? 0.90 : 1.23;
    w = width || (size ? Math.round(size * ratio) : 74);
  } else if (type === 'app_icon') {
    h = height || size || 72;
    const ratio = effectivePack === 'spy_family' ? 0.99 : effectivePack === 'cat' ? 0.90 : 0.88;
    w = width || (size ? Math.round(size * ratio) : 63);
  }

  return (
    <Image
      source={source}
      style={[{ width: w, height: h }, style]}
      resizeMode="contain"
    />
  );
};

// Universal alias
export const AppSticker = TotoroSticker;
