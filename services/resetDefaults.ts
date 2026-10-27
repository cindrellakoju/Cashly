/**
 * In-Code Database Reset Utility for Aesthetic Expense Tracker
 * ============================================================
 * Use this module to completely reset all SQLite tables and persistent
 * state back to clean factory defaults directly from application code.
 *
 * NOTE: This is available strictly in code (no user-facing UI button).
 *
 * Usage:
 *   import { resetEverythingToDefault } from '@/services/resetDefaults';
 *   await resetEverythingToDefault();
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDB, WELCOME_SHOWN_KEY } from './database';

export const DEFAULT_INITIAL_CATEGORIES = [
  { id: '1', name: 'Food', emoji: '🍔', color: '#f3b06c' },
  { id: '2', name: 'Coffee', emoji: '☕', color: '#c45167' },
  { id: '3', name: 'Transport', emoji: '🚗', color: '#56a76e' },
  { id: '4', name: 'Shopping', emoji: '🛍️', color: '#f2738a' },
  { id: '5', name: 'Utilities', emoji: '🏠', color: '#7ab583' },
  { id: '6', name: 'Fun', emoji: '🍿', color: '#9d7be2' },
];

export const DEFAULT_INITIAL_ACCOUNT = {
  id: '1',
  name: 'Cash in Hand',
  emoji: '💵',
  balance: 0,
  type: 'cash' as const,
};

export const DEFAULT_APP_SETTINGS: [string, string][] = [
  ['theme', 'kawaii'],
  ['currencySymbol', 'Rs.'],
  ['salary', '0'],
  ['has_base_salary', 'false'],
  ['base_salary_date', '1'],
  ['pinCode', '1234'],
  ['account_pin', '1234'],
  ['admin_pin', '1234'],
  ['is_initialized', 'true'],
  ['welcome_shown', 'false'],
  ['has_completed_onboarding', 'false'],
  ['show_monthly_bills', 'true'],
  ['has_purged_default_envelopes_v4', 'true'],
  ['recovery_email', ''],
  ['credited_salary_months', '[]'],
  ['manually_loaded_months', '[]'],
];

/**
 * Completely wipes user records from all 12 SQLite tables and restores
 * initial factory defaults (Cash in Hand, 6 categories, default settings, default PIN 1234).
 */
export async function resetEverythingToDefault(): Promise<{ success: boolean; message: string }> {
  const db = await getDB();

  try {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
  } catch (e) {
    // Ignore PRAGMA failure if any
  }

  const tablesToClear = [
    'debt_history',
    'debts',
    'expenses',
    'incomes',
    'categories',
    'envelopes',
    'accounts',
    'wishlist',
    'transfers',
    'transactions',
    'salaries',
    'app_settings',
  ];

  for (const table of tablesToClear) {
    try {
      await db.runAsync(`DELETE FROM ${table};`);
    } catch (err) {
      console.warn(`[Reset] Failed to clear ${table}:`, err);
    }
  }

  // 1. Seed Default Account
  try {
    await db.runAsync(
      'INSERT OR REPLACE INTO accounts (id, name, emoji, balance, type) VALUES (?, ?, ?, ?, ?);',
      [
        DEFAULT_INITIAL_ACCOUNT.id,
        DEFAULT_INITIAL_ACCOUNT.name,
        DEFAULT_INITIAL_ACCOUNT.emoji,
        DEFAULT_INITIAL_ACCOUNT.balance,
        DEFAULT_INITIAL_ACCOUNT.type,
      ]
    );
  } catch (err) {
    console.error('[Reset] Failed to seed default account:', err);
  }

  // 2. Seed Default 6 Categories
  for (const cat of DEFAULT_INITIAL_CATEGORIES) {
    try {
      await db.runAsync(
        'INSERT OR REPLACE INTO categories (id, name, emoji, color) VALUES (?, ?, ?, ?);',
        [cat.id, cat.name, cat.emoji, cat.color]
      );
    } catch (err) {
      console.error(`[Reset] Failed to seed category ${cat.name}:`, err);
    }
  }

  // 3. Seed Default App Settings
  for (const [key, value] of DEFAULT_APP_SETTINGS) {
    try {
      await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', [key, value]);
    } catch (err) {
      console.error(`[Reset] Failed to seed setting ${key}:`, err);
    }
  }

  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  } catch (e) {
    // Ignore PRAGMA failure
  }

  // 4. Clear AsyncStorage storage keys
  try {
    await AsyncStorage.removeItem(WELCOME_SHOWN_KEY);
    await AsyncStorage.removeItem('@aesthetic_expense_tracker_state_v1');
    await AsyncStorage.clear();
  } catch (e) {
    // Ignore legacy AsyncStorage cleanup error
  }

  console.log('✅ [Reset] Successfully reset entire Expense Tracker database & state to factory defaults!');
  return { success: true, message: 'Expense Tracker reset to default factory state.' };
}

export default resetEverythingToDefault;
