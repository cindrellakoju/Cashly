import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme } from '@/constants/theme';
import {
  CashEnvelope,
  Category,
  Income,
  Expense,
  DebtItem,
  InstallmentPayment,
  WishlistItem,
  Account,
  InternalTransfer,
  Transaction,
  SalaryRecord,
} from '@/context/FinancialContext';

const DB_NAME = 'expensetracker.db';
const LEGACY_STORAGE_KEY = '@aesthetic_expense_tracker_state_v1';
export const WELCOME_SHOWN_KEY = '@has_seen_welcome_modal_v1';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

export async function executeRawQuery(sqlQuery: string): Promise<any[]> {
  const db = await getDB();
  return await db.getAllAsync(sqlQuery);
}

export async function listAllTables(): Promise<string[]> {
  const db = await getDB();
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  return tables.map((t) => t.name);
}
export async function clearPINsInDatabase(): Promise<void> {
  const db = await getDB();
  try {
    await db.runAsync("UPDATE app_settings SET value = '1234' WHERE key = 'pin_code'");
    await db.runAsync("UPDATE app_settings SET value = '1234' WHERE key = 'admin_pin'");
    await db.runAsync("UPDATE app_settings SET value = '1234' WHERE key = 'account_pin'");
  } catch (e) { }
}

export async function clearAllDatabaseTables(): Promise<void> {
  const db = await getDB();
  try {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
  } catch (e) { }

  const deleteQueries = [
    'DELETE FROM debt_history;',
    'DELETE FROM debts;',
    'DELETE FROM expenses;',
    'DELETE FROM incomes;',
    'DELETE FROM categories;',
    'DELETE FROM envelopes;',
    'DELETE FROM accounts;',
    'DELETE FROM wishlist;',
    'DELETE FROM transfers;',
    'DELETE FROM transactions;',
    'DELETE FROM salaries;',
    'DELETE FROM app_settings;',
    "INSERT OR REPLACE INTO accounts (id, name, emoji, balance, type) VALUES ('1', 'Cash in Hand', '💵', 0, 'cash');",
    "INSERT OR REPLACE INTO categories (id, name, emoji, color) VALUES ('1', 'Food', '🍔', '#f3b06c');",
    "INSERT OR REPLACE INTO categories (id, name, emoji, color) VALUES ('2', 'Coffee', '☕', '#c45167');",
    "INSERT OR REPLACE INTO categories (id, name, emoji, color) VALUES ('3', 'Transport', '🚗', '#56a76e');",
    "INSERT OR REPLACE INTO categories (id, name, emoji, color) VALUES ('4', 'Shopping', '🛍️', '#f2738a');",
    "INSERT OR REPLACE INTO categories (id, name, emoji, color) VALUES ('5', 'Utilities', '🏠', '#7ab583');",
    "INSERT OR REPLACE INTO categories (id, name, emoji, color) VALUES ('6', 'Fun', '🍿', '#9d7be2');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('theme', 'kawaii');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('currencySymbol', 'Rs.');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('salary', '0');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('pinCode', '1234');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('account_pin', '1234');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('admin_pin', '1234');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('has_base_salary', 'false');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('base_salary_date', '1');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('welcome_shown', 'false');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('has_completed_onboarding', 'false');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('show_monthly_bills', 'false');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('has_purged_default_envelopes_v4', 'true');",
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('is_initialized', 'true');",
  ];

  for (const q of deleteQueries) {
    try {
      await db.runAsync(q);
    } catch (err) {
      console.warn(`Failed query "${q}":`, err);
    }
  }

  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  } catch (e) { }

  try {
    await AsyncStorage.removeItem(WELCOME_SHOWN_KEY);
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    await AsyncStorage.clear();
  } catch (e) {
    // Ignore legacy AsyncStorage cleanup error if any
  }
}

export { resetEverythingToDefault } from './resetDefaults';

export async function markWelcomeAsShown(): Promise<void> {
  try {
    const db = await getDB();
    await db.runAsync("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('welcome_shown', 'true')");
  } catch (e) { }
}

export async function markOnboardingCompleted(): Promise<void> {
  try {
    const db = await getDB();
    await db.runAsync("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('has_completed_onboarding', 'true')");
    await db.runAsync("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('welcome_shown', 'true')");
  } catch (e) { }
  try {
    await AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
  } catch (e) { }
}

export interface AppStateData {
  theme: AppTheme;
  currencySymbol: string;
  salary: number;
  hasBaseSalary?: boolean | null;
  baseSalaryDate?: string;
  pinCode: string;
  adminPin?: string;
  accountPin?: string;
  salaryAccountId?: string | null;
  hasCompletedOnboarding?: boolean;
  manuallyLoadedMonths?: string[];
  creditedSalaryMonths?: string[];
  envelopes: CashEnvelope[];
  categories: Category[];
  incomes: Income[];
  expenses: Expense[];
  debts: DebtItem[];
  wishlist: WishlistItem[];
  accounts: Account[];
  transfers: InternalTransfer[];
  transactions: Transaction[];
  salaries: SalaryRecord[];
  initialCashInHand?: number;
  showMonthlyBills?: boolean;
  recoveryEmail?: string;
}

export async function initDatabase(defaultData: AppStateData): Promise<AppStateData> {
  const db = await getDB();

  // Create tables
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS envelopes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL,
      budgeted REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS incomes (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      stored TEXT NOT NULL,
      note TEXT NOT NULL,
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      stored TEXT NOT NULL,
      type TEXT NOT NULL,
      recurring_bill_id TEXT
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      person TEXT NOT NULL,
      emoji TEXT NOT NULL,
      total REAL NOT NULL,
      remaining REAL NOT NULL,
      status TEXT NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      account TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS debt_history (
      id TEXT PRIMARY KEY,
      debt_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      remaining REAL NOT NULL,
      account TEXT NOT NULL,
      themeColorTag TEXT,
      FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      priority TEXT NOT NULL,
      price REAL NOT NULL,
      targetDate TEXT NOT NULL,
      isPurchased INTEGER NOT NULL DEFAULT 0,
      imageUrl TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      balance REAL NOT NULL,
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      from_acc TEXT NOT NULL,
      fromEmoji TEXT NOT NULL,
      to_acc TEXT NOT NULL,
      toEmoji TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      from_acc TEXT NOT NULL,
      to_acc TEXT NOT NULL,
      reference TEXT NOT NULL,
      category TEXT NOT NULL,
      accountId TEXT
    );

    CREATE TABLE IF NOT EXISTS salaries (
      id TEXT PRIMARY KEY,
      month TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      day TEXT NOT NULL,
      account_id TEXT,
      account_name TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Migrate existing databases if missing imageUrl column in wishlist
  try {
    await db.execAsync('ALTER TABLE wishlist ADD COLUMN imageUrl TEXT;');
  } catch (e) {
    // Column may already exist
  }

  // Migrate existing databases if missing reason/account/date columns in debts
  try {
    await db.execAsync('ALTER TABLE debts ADD COLUMN reason TEXT;');
  } catch (e) { }
  try {
    await db.execAsync('ALTER TABLE debts ADD COLUMN account TEXT;');
  } catch (e) { }
  try {
    await db.execAsync('ALTER TABLE debts ADD COLUMN date TEXT;');
  } catch (e) { }

  // Migrate existing databases if missing recurring_bill_id column in expenses
  try {
    await db.execAsync('ALTER TABLE expenses ADD COLUMN recurring_bill_id TEXT;');
  } catch (e) { }

  // Auto-seed salaries table if empty and base salary is active
  try {
    const existingSalaries = await db.getAllAsync<{ id: string }>('SELECT id FROM salaries LIMIT 1');
    if (existingSalaries.length === 0) {
      const settingsRows = await db.getAllAsync<{ key: string; value: string }>(
        "SELECT key, value FROM app_settings WHERE key IN ('salary', 'has_base_salary', 'base_salary_date', 'salary_account_id', 'credited_salary_months')"
      );
      const setMap = new Map(settingsRows.map((r) => [r.key, r.value]));
      const salVal = Number(setMap.get('salary') || 0);
      const hasSal = setMap.get('has_base_salary') === 'true';
      const bDay = setMap.get('base_salary_date') || '1';
      const sAccId = setMap.get('salary_account_id') || null;
      if (hasSal && salVal > 0) {
        let credited: string[] = [];
        try {
          credited = JSON.parse(setMap.get('credited_salary_months') || '[]');
        } catch (e) { }
        const nowMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const monthsToSeed = credited.length > 0 ? credited : [nowMonth];
        for (const m of monthsToSeed) {
          await db.runAsync(
            'INSERT OR REPLACE INTO salaries (id, month, amount, day, account_id, account_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [`salary_rec_${m}`, m, salVal, bDay, sAccId, 'Designated Account', new Date().toISOString()]
          );
        }
      }
    }
  } catch (e) {
    console.warn('Failed to auto-seed salaries from legacy base_salary settings:', e);
  }

  // Backfill transactions for every existing expense and income (excluding initial money)
  try {
    const allExpenses = await db.getAllAsync<{ id: string; date: string; amount: number; stored: string; category: string; reason: string }>('SELECT id, date, amount, stored, category, reason FROM expenses');
    const allIncomes = await db.getAllAsync<{ id: string; date: string; amount: number; stored: string; note: string }>('SELECT id, date, amount, stored, note FROM incomes');
    const existingTxRows = await db.getAllAsync<{ id: string }>('SELECT id FROM transactions');
    const txIdSet = new Set(existingTxRows.map((t) => t.id));

    for (const exp of allExpenses) {
      const expTxId = `tx_exp_${exp.id}`;
      if (!txIdSet.has(expTxId) && !txIdSet.has(exp.id)) {
        await db.runAsync(
          'INSERT OR REPLACE INTO transactions (id, date, type, amount, from_acc, to_acc, reference, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [expTxId, exp.date, 'Expense', exp.amount, exp.stored, exp.category, exp.reason, exp.category]
        );
        txIdSet.add(expTxId);
      }
    }

    for (const inc of allIncomes) {
      const incTxId = `tx_inc_${inc.id}`;
      if (!txIdSet.has(incTxId) && !txIdSet.has(inc.id)) {
        const isSalary = inc.note.toLowerCase().includes('monthly base salary');
        await db.runAsync(
          'INSERT OR REPLACE INTO transactions (id, date, type, amount, from_acc, to_acc, reference, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [incTxId, inc.date, 'Income', inc.amount, isSalary ? 'Employer Base Salary' : (inc.note || 'Income Source'), inc.stored, inc.note, '💼 Income']
        );
        txIdSet.add(incTxId);
      }
    }
  } catch (e) {
    console.warn('Failed to backfill missing transactions for expenses and incomes:', e);
  }

  // One-time migration: Purge default legacy envelopes so envelopes table is completely empty by default
  try {
    const hasPurgedDefaultEnvelopes = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      ['has_purged_default_envelopes_v4']
    );
    if (!hasPurgedDefaultEnvelopes) {
      // Remove any legacy default envelopes matching IDs 1-6 or default category names
      await db.runAsync(
        "DELETE FROM envelopes WHERE id IN ('1', '2', '3', '4', '5', '6') OR name IN ('Food', 'Coffee', 'Transport', 'Shopping', 'Utilities', 'Fun');"
      );
      await db.runAsync(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('has_purged_default_envelopes_v4', 'true');"
      );
    }
  } catch (e) {
    console.warn('Failed to purge legacy default envelopes during migration:', e);
  }

  // Check if database already has settings initialized
  const initializedCheck = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    ['is_initialized']
  );

  // If not initialized, check for legacy AsyncStorage data to migrate or use defaultData
  if (!initializedCheck) {
    let initialToSave = defaultData;
    try {
      const savedLegacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        initialToSave = {
          theme: 'kawaii',
          currencySymbol: parsed.currencySymbol || defaultData.currencySymbol,
          salary: parsed.salary ?? defaultData.salary,
          pinCode: parsed.pinCode || defaultData.pinCode,
          envelopes: [],
          categories: parsed.categories || defaultData.categories,
          incomes: parsed.incomes || defaultData.incomes,
          expenses: parsed.expenses || defaultData.expenses,
          debts: parsed.debts || defaultData.debts,
          wishlist: parsed.wishlist || defaultData.wishlist,
          accounts: parsed.accounts || defaultData.accounts,
          transfers: parsed.transfers || defaultData.transfers,
          transactions: parsed.transactions || defaultData.transactions,
          salaries: [],
          initialCashInHand: 0,
        };
      }
    } catch (e) {
      console.warn('Failed to read legacy AsyncStorage data during SQLite init', e);
    }

    await seedDatabase(initialToSave);
  }

  return await loadAllData(defaultData);
}

export async function seedDatabase(data: AppStateData): Promise<void> {
  const db = await getDB();

  await db.withTransactionAsync(async () => {
    // App Settings
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['theme', data.theme]);
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['currencySymbol', data.currencySymbol]);
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['salary', String(data.salary)]);
    if (data.hasBaseSalary !== undefined && data.hasBaseSalary !== null) {
      await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['has_base_salary', String(data.hasBaseSalary)]);
    } else if (data.hasBaseSalary === null) {
      await db.runAsync('DELETE FROM app_settings WHERE key = ?', ['has_base_salary']);
    }
    if (data.baseSalaryDate !== undefined) {
      await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['base_salary_date', data.baseSalaryDate]);
    }
    const accPin = data.accountPin || data.pinCode || '1234';
    const admPin = data.adminPin || '1234';
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['pinCode', accPin]);
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['account_pin', accPin]);
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['admin_pin', admPin]);
    if (data.salaryAccountId) {
      await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['salary_account_id', data.salaryAccountId]);
    } else if (data.salaryAccountId === null) {
      await db.runAsync('DELETE FROM app_settings WHERE key = ?', ['salary_account_id']);
    }
    if (data.showMonthlyBills !== undefined) {
      await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['show_monthly_bills', data.showMonthlyBills ? 'true' : 'false']);
    }
    if (data.recoveryEmail !== undefined) {
      await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['recovery_email', data.recoveryEmail]);
    }
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['is_initialized', 'true']);

    // Envelopes
    for (const env of data.envelopes) {
      await db.runAsync(
        'INSERT OR REPLACE INTO envelopes (id, name, emoji, color, budgeted) VALUES (?, ?, ?, ?, ?)',
        [env.id, env.name, env.emoji, env.color, env.budgeted]
      );
    }

    // Categories
    for (const cat of data.categories) {
      await db.runAsync(
        'INSERT OR REPLACE INTO categories (id, name, emoji, color) VALUES (?, ?, ?, ?)',
        [cat.id, cat.name, cat.emoji, cat.color]
      );
    }

    // Incomes
    for (const inc of data.incomes) {
      await db.runAsync(
        'INSERT OR REPLACE INTO incomes (id, date, amount, stored, note, type) VALUES (?, ?, ?, ?, ?, ?)',
        [inc.id, inc.date, inc.amount, inc.stored, inc.note, inc.type]
      );
    }

    // Expenses
    for (const exp of data.expenses) {
      await db.runAsync(
        'INSERT OR REPLACE INTO expenses (id, date, category, amount, reason, stored, type, recurring_bill_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [exp.id, exp.date, exp.category, exp.amount, exp.reason, exp.stored, exp.type, exp.recurringBillId || null]
      );
    }

    // Debts & Debt History
    for (const debt of data.debts) {
      await db.runAsync(
        'INSERT OR REPLACE INTO debts (id, person, emoji, total, remaining, status, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [debt.id, debt.person, debt.emoji, debt.total, debt.remaining, debt.status, debt.type]
      );
      if (debt.history) {
        for (const h of debt.history) {
          await db.runAsync(
            'INSERT OR REPLACE INTO debt_history (id, debt_id, date, amount, remaining, account, themeColorTag) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [h.id, debt.id, h.date, h.amount, h.remaining, h.account, h.themeColorTag || null]
          );
        }
      }
    }

    // Wishlist
    for (const w of data.wishlist) {
      await db.runAsync(
        'INSERT OR REPLACE INTO wishlist (id, name, emoji, priority, price, targetDate, isPurchased, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [w.id, w.name, w.emoji, w.priority, w.price, w.targetDate, w.isPurchased ? 1 : 0, w.imageUrl || null]
      );
    }

    // Accounts
    for (const acc of data.accounts) {
      await db.runAsync(
        'INSERT OR REPLACE INTO accounts (id, name, emoji, balance, type) VALUES (?, ?, ?, ?, ?)',
        [acc.id, acc.name, acc.emoji, acc.balance, acc.type]
      );
    }

    // Transfers
    for (const tr of data.transfers) {
      await db.runAsync(
        'INSERT OR REPLACE INTO transfers (id, date, from_acc, fromEmoji, to_acc, toEmoji, amount, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [tr.id, tr.date, tr.from, tr.fromEmoji, tr.to, tr.toEmoji, tr.amount, tr.reason]
      );
    }

    // Transactions
    for (const tx of data.transactions) {
      await db.runAsync(
        'INSERT OR REPLACE INTO transactions (id, date, type, amount, from_acc, to_acc, reference, category, accountId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [tx.id, tx.date, tx.type, tx.amount, tx.from, tx.to, tx.reference, tx.category, tx.accountId || null]
      );
    }

    // Salaries
    if (data.salaries && Array.isArray(data.salaries)) {
      for (const s of data.salaries) {
        await db.runAsync(
          'INSERT OR REPLACE INTO salaries (id, month, amount, day, account_id, account_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [s.id, s.month, s.amount, s.day, s.accountId || null, s.accountName || null, s.createdAt]
        );
      }
    }
  });
}

export async function loadAllData(defaultData: AppStateData): Promise<AppStateData> {
  const db = await getDB();

  // Settings
  const settingsRows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_settings');
  const settingsMap = new Map(settingsRows.map((r) => [r.key, r.value]));

  const rawTheme = settingsMap.get('theme') as AppTheme;
  const theme: AppTheme = (rawTheme === 'noir' || rawTheme === 'kawaii') ? rawTheme : (defaultData.theme || 'kawaii');
  const currencySymbol = (settingsMap.get('currencySymbol') || defaultData.currencySymbol || 'Rs.').trim();
  const salary = settingsMap.has('salary') ? Number(settingsMap.get('salary')) : defaultData.salary;
  const hasBaseSalaryRaw = settingsMap.get('has_base_salary');
  const hasBaseSalary = hasBaseSalaryRaw !== undefined ? hasBaseSalaryRaw === 'true' : (defaultData.hasBaseSalary ?? null);
  const baseSalaryDate = settingsMap.get('base_salary_date') || defaultData.baseSalaryDate || '1';
  const accountPin = settingsMap.get('account_pin') || settingsMap.get('pinCode') || defaultData.accountPin || defaultData.pinCode || '1234';
  const pinCode = accountPin;
  const adminPin = settingsMap.get('admin_pin') || defaultData.adminPin || '1234';
  const rawRecoveryEmail = settingsMap.get('recovery_email') || defaultData.recoveryEmail || '';
  // The recovery email must be explicitly added by the user themselves, not pre-populated with developer email
  const recoveryEmail = rawRecoveryEmail === 'cindrellakoju@gmail.com' ? '' : rawRecoveryEmail;
  const salaryAccountId = settingsMap.get('salary_account_id') || defaultData.salaryAccountId || null;
  let asyncStorageWelcome = false;
  try {
    const val = await AsyncStorage.getItem(WELCOME_SHOWN_KEY);
    if (val === 'true') asyncStorageWelcome = true;
  } catch (e) { }

  const hasWelcomeFlag =
    settingsMap.get('welcome_shown') === 'true' ||
    settingsMap.get('has_completed_onboarding') === 'true' ||
    asyncStorageWelcome;
  const manuallyLoadedRaw = settingsMap.get('manually_loaded_salary_months');
  let manuallyLoadedMonths: string[] = [];
  try {
    if (manuallyLoadedRaw) manuallyLoadedMonths = JSON.parse(manuallyLoadedRaw);
  } catch (e) { }

  const creditedRaw = settingsMap.get('credited_salary_months');
  let creditedSalaryMonths: string[] = [];
  try {
    if (creditedRaw) creditedSalaryMonths = JSON.parse(creditedRaw);
  } catch (e) { }

  // Envelopes
  const envelopes = await db.getAllAsync<CashEnvelope>('SELECT id, name, emoji, color, budgeted FROM envelopes');

  // Categories
  const categories = await db.getAllAsync<Category>('SELECT id, name, emoji, color FROM categories');

  // Incomes
  const incomes = await db.getAllAsync<Income>('SELECT id, date, amount, stored, note, type FROM incomes');

  // Expenses
  const expenseRows = await db.getAllAsync<{
    id: string;
    date: string;
    category: string;
    amount: number;
    reason: string;
    stored: string;
    type: 'outgoing';
    recurring_bill_id: string | null;
  }>('SELECT id, date, category, amount, reason, stored, type, recurring_bill_id FROM expenses');

  const expenses: Expense[] = expenseRows.map((e) => ({
    id: e.id,
    date: e.date,
    category: e.category,
    amount: e.amount,
    reason: e.reason,
    stored: e.stored,
    type: e.type,
    recurringBillId: e.recurring_bill_id || undefined,
  }));

  // Debts & Debt History
  const debtRows = await db.getAllAsync<{
    id: string;
    person: string;
    emoji: string;
    total: number;
    remaining: number;
    status: 'Pending' | 'Completed';
    type: 'borrowed' | 'lent';
    reason: string | null;
    account: string | null;
    date: string | null;
  }>('SELECT id, person, emoji, total, remaining, status, type, reason, account, date FROM debts');

  const historyRows = await db.getAllAsync<{
    id: string;
    debt_id: string;
    date: string;
    amount: number;
    remaining: number;
    account: string;
    themeColorTag: string | null;
  }>('SELECT id, debt_id, date, amount, remaining, account, themeColorTag FROM debt_history');

  const historyMap = new Map<string, InstallmentPayment[]>();
  for (const h of historyRows) {
    if (!historyMap.has(h.debt_id)) {
      historyMap.set(h.debt_id, []);
    }
    historyMap.get(h.debt_id)!.push({
      id: h.id,
      date: h.date,
      amount: h.amount,
      remaining: h.remaining,
      account: h.account,
      themeColorTag: h.themeColorTag || undefined,
    });
  }

  const debts: DebtItem[] = debtRows.map((d) => ({
    ...d,
    reason: d.reason || undefined,
    account: d.account || undefined,
    date: d.date || undefined,
    history: historyMap.get(d.id) || [],
  }));

  // Wishlist
  const wishlistRows = await db.getAllAsync<{
    id: string;
    name: string;
    emoji: string;
    priority: 'High Priority' | 'Med Priority' | 'Low Priority';
    price: number;
    targetDate: string;
    isPurchased: number;
    imageUrl: string | null;
  }>('SELECT id, name, emoji, priority, price, targetDate, isPurchased, imageUrl FROM wishlist');

  const wishlist: WishlistItem[] = wishlistRows.map((w) => ({
    id: w.id,
    name: w.name,
    emoji: w.emoji,
    priority: w.priority,
    price: w.price,
    targetDate: w.targetDate,
    isPurchased: Boolean(w.isPurchased),
    imageUrl: w.imageUrl || undefined,
  }));

  // Accounts
  let accounts = await db.getAllAsync<Account>('SELECT id, name, emoji, balance, type FROM accounts');
  if (accounts.length === 0) {
    const defaultAcc: Account = { id: '1', name: 'Cash in Hand', emoji: '💵', balance: 0, type: 'cash' };
    await db.runAsync('INSERT OR REPLACE INTO accounts (id, name, emoji, balance, type) VALUES (?, ?, ?, ?, ?)', [
      defaultAcc.id,
      defaultAcc.name,
      defaultAcc.emoji,
      defaultAcc.balance,
      defaultAcc.type,
    ]);
    accounts = [defaultAcc];
  } else {
    const cashAcc = accounts.find((a) => a.name === 'Cash');
    if (cashAcc && !accounts.some((a) => a.name.toLowerCase() === 'cash in hand')) {
      cashAcc.name = 'Cash in Hand';
      await db.runAsync('UPDATE accounts SET name = ? WHERE id = ?', ['Cash in Hand', cashAcc.id]);
    }
  }

  // Transfers
  const transferRows = await db.getAllAsync<{
    id: string;
    date: string;
    from_acc: string;
    fromEmoji: string;
    to_acc: string;
    toEmoji: string;
    amount: number;
    reason: string;
  }>('SELECT id, date, from_acc, fromEmoji, to_acc, toEmoji, amount, reason FROM transfers');

  const transfers: InternalTransfer[] = transferRows.map((t) => ({
    id: t.id,
    date: t.date,
    from: t.from_acc,
    fromEmoji: t.fromEmoji,
    to: t.to_acc,
    toEmoji: t.toEmoji,
    amount: t.amount,
    reason: t.reason,
  }));

  // Transactions
  const transactionRows = await db.getAllAsync<{
    id: string;
    date: string;
    type: any;
    amount: number;
    from_acc: string;
    to_acc: string;
    reference: string;
    category: string;
    accountId: string | null;
  }>('SELECT id, date, type, amount, from_acc, to_acc, reference, category, accountId FROM transactions');

  const transactions: Transaction[] = transactionRows.map((tx) => ({
    id: tx.id,
    date: tx.date,
    type: tx.type,
    amount: tx.amount,
    from: tx.from_acc,
    to: tx.to_acc,
    reference: tx.reference,
    category: tx.category,
    accountId: tx.accountId || undefined,
  }));

  // Salaries
  const salaryRows = await db.getAllAsync<{
    id: string;
    month: string;
    amount: number;
    day: string;
    account_id: string | null;
    account_name: string | null;
    created_at: string;
  }>('SELECT id, month, amount, day, account_id, account_name, created_at FROM salaries ORDER BY month ASC');

  const salaries: SalaryRecord[] = salaryRows.map((s) => ({
    id: s.id,
    month: s.month,
    amount: s.amount,
    day: s.day,
    accountId: s.account_id || undefined,
    accountName: s.account_name || undefined,
    createdAt: s.created_at,
  }));

  const initialCashInHand = Number(settingsMap.get('initial_cash_in_hand') || 0);

  const showMonthlyBillsRaw = settingsMap.get('show_monthly_bills');
  const showMonthlyBills = showMonthlyBillsRaw !== undefined ? showMonthlyBillsRaw === 'true' : true;

  const hasExistingData =
    expenses.length > 0 ||
    incomes.length > 0 ||
    salary > 0 ||
    salaries.length > 0 ||
    hasBaseSalaryRaw !== undefined ||
    accounts.some((a) => a.balance > 0);

  // Onboarding is completed ONLY if the user has completed onboarding AND has a verified recovery email.
  const hasOnboardingFlag = settingsMap.get('has_completed_onboarding') === 'true';
  const hasVerifiedEmail = Boolean(recoveryEmail && recoveryEmail.trim().length > 0);
  const hasCompletedOnboarding = hasOnboardingFlag && hasVerifiedEmail;

  return {
    theme,
    currencySymbol,
    salary,
    hasBaseSalary,
    baseSalaryDate,
    pinCode,
    adminPin,
    accountPin,
    salaryAccountId,
    hasCompletedOnboarding,
    manuallyLoadedMonths,
    creditedSalaryMonths,
    envelopes,
    categories,
    incomes,
    expenses,
    debts,
    wishlist,
    accounts,
    transfers,
    transactions,
    salaries,
    initialCashInHand,
    showMonthlyBills,
    recoveryEmail,
  };
}

// Data Mutation Helpers

export async function saveAppSetting(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
}

export async function insertExpense(expense: Expense): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO expenses (id, date, category, amount, reason, stored, type, recurring_bill_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [expense.id, expense.date, expense.category, expense.amount, expense.reason, expense.stored, expense.type, expense.recurringBillId || null]
  );
}

export async function insertIncome(income: Income): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO incomes (id, date, amount, stored, note, type) VALUES (?, ?, ?, ?, ?, ?)',
    [income.id, income.date, income.amount, income.stored, income.note, income.type]
  );
}

export async function insertCategory(cat: Category): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO categories (id, name, emoji, color) VALUES (?, ?, ?, ?)',
    [cat.id, cat.name, cat.emoji, cat.color]
  );
}

export async function updateCategory(cat: Category): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE categories SET name = ?, emoji = ?, color = ? WHERE id = ?',
    [cat.name, cat.emoji, cat.color, cat.id]
  );
}

export async function removeCategory(id: string): Promise<void> {
  const db = await getDB();
  const idStr = String(id);
  await db.runAsync('DELETE FROM categories WHERE id = ? OR id = CAST(? AS INTEGER)', [idStr, idStr]);
}

export async function insertEnvelope(env: CashEnvelope): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO envelopes (id, name, emoji, color, budgeted) VALUES (?, ?, ?, ?, ?)',
    [env.id, env.name, env.emoji, env.color, env.budgeted]
  );
}

export async function updateEnvelopeBudget(id: string, budget: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('UPDATE envelopes SET budgeted = ? WHERE id = ?', [budget, id]);
}

export async function removeEnvelope(id: string): Promise<void> {
  const db = await getDB();
  const idStr = String(id);
  await db.runAsync('DELETE FROM envelopes WHERE id = ? OR id = CAST(? AS INTEGER)', [idStr, idStr]);
}

export async function insertDebt(debt: DebtItem): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO debts (id, person, emoji, total, remaining, status, type, reason, account, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      debt.id,
      debt.person,
      debt.emoji,
      debt.total,
      debt.remaining,
      debt.status,
      debt.type,
      debt.reason || null,
      debt.account || null,
      debt.date || null,
    ]
  );
}

export async function updateDebtAndHistory(debt: DebtItem, newInstallment: InstallmentPayment): Promise<void> {
  const db = await getDB();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE debts SET remaining = ?, status = ? WHERE id = ?', [
      debt.remaining,
      debt.status,
      debt.id,
    ]);
    await db.runAsync(
      'INSERT OR REPLACE INTO debt_history (id, debt_id, date, amount, remaining, account, themeColorTag) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        newInstallment.id,
        debt.id,
        newInstallment.date,
        newInstallment.amount,
        newInstallment.remaining,
        newInstallment.account,
        newInstallment.themeColorTag || null,
      ]
    );
  });
}

export async function insertWishlistItem(item: WishlistItem): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO wishlist (id, name, emoji, priority, price, targetDate, isPurchased, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [item.id, item.name, item.emoji, item.priority, item.price, item.targetDate, item.isPurchased ? 1 : 0, item.imageUrl || null]
  );
}

export async function updateWishlistPurchased(id: string, isPurchased: boolean): Promise<void> {
  const db = await getDB();
  await db.runAsync('UPDATE wishlist SET isPurchased = ? WHERE id = ?', [isPurchased ? 1 : 0, id]);
}

export async function removeWishlistItem(id: string): Promise<void> {
  const db = await getDB();
  const idStr = String(id);
  await db.runAsync('DELETE FROM wishlist WHERE id = ? OR id = CAST(? AS INTEGER)', [idStr, idStr]);
}

export async function insertAccount(account: Account): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO accounts (id, name, emoji, balance, type) VALUES (?, ?, ?, ?, ?)',
    [account.id, account.name, account.emoji, account.balance, account.type]
  );
}

export async function insertTransfer(transfer: InternalTransfer): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO transfers (id, date, from_acc, fromEmoji, to_acc, toEmoji, amount, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [transfer.id, transfer.date, transfer.from, transfer.fromEmoji, transfer.to, transfer.toEmoji, transfer.amount, transfer.reason]
  );
}

export async function insertTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO transactions (id, date, type, amount, from_acc, to_acc, reference, category, accountId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [tx.id, tx.date, tx.type, tx.amount, tx.from, tx.to, tx.reference, tx.category, tx.accountId || null]
  );
}

export async function updateExpenseInDB(exp: Expense): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE expenses SET date = ?, category = ?, amount = ?, reason = ?, stored = ?, type = ?, recurring_bill_id = ? WHERE id = ?',
    [exp.date, exp.category, exp.amount, exp.reason, exp.stored, exp.type, exp.recurringBillId || null, exp.id]
  );
}

export async function removeExpense(id: string): Promise<void> {
  const db = await getDB();
  const idStr = String(id);
  await db.runAsync('DELETE FROM expenses WHERE id = ? OR id = CAST(? AS INTEGER)', [idStr, idStr]);
}

export async function updateIncomeInDB(inc: Income): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE incomes SET date = ?, amount = ?, stored = ?, note = ?, type = ? WHERE id = ?',
    [inc.date, inc.amount, inc.stored, inc.note, inc.type, inc.id]
  );
}

export async function removeIncome(id: string): Promise<void> {
  const db = await getDB();
  const idStr = String(id);
  await db.runAsync('DELETE FROM incomes WHERE id = ? OR id = CAST(? AS INTEGER)', [idStr, idStr]);
}

export async function updateAccountInDB(account: Account): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE accounts SET name = ?, emoji = ?, balance = ?, type = ? WHERE id = ?',
    [account.name, account.emoji, account.balance, account.type, account.id]
  );
}

export async function removeAccount(id: string): Promise<void> {
  const db = await getDB();
  const idStr = String(id);
  await db.runAsync('DELETE FROM accounts WHERE id = ? OR id = CAST(? AS INTEGER)', [idStr, idStr]);
}

export async function updateEnvelopeInDB(env: CashEnvelope): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE envelopes SET name = ?, emoji = ?, color = ?, budgeted = ? WHERE id = ?',
    [env.name, env.emoji, env.color, env.budgeted, env.id]
  );
}

export async function updateDebtInDB(debt: DebtItem): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE debts SET person = ?, emoji = ?, total = ?, remaining = ?, status = ?, type = ?, reason = ?, account = ?, date = ? WHERE id = ?',
    [
      debt.person,
      debt.emoji,
      debt.total,
      debt.remaining,
      debt.status,
      debt.type,
      debt.reason || null,
      debt.account || null,
      debt.date || null,
      debt.id,
    ]
  );
}

export async function removeDebt(id: string): Promise<void> {
  const db = await getDB();
  const idStr = String(id);
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM debt_history WHERE debt_id = ? OR debt_id = CAST(? AS INTEGER)', [idStr, idStr]);
    await db.runAsync('DELETE FROM debts WHERE id = ? OR id = CAST(? AS INTEGER)', [idStr, idStr]);
  });
}

export async function updateWishlistItemInDB(item: WishlistItem): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE wishlist SET name = ?, emoji = ?, priority = ?, price = ?, targetDate = ?, isPurchased = ?, imageUrl = ? WHERE id = ?',
    [item.name, item.emoji, item.priority, item.price, item.targetDate, item.isPurchased ? 1 : 0, item.imageUrl || null, item.id]
  );
}

export async function updateTransferInDB(transfer: InternalTransfer): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE transfers SET date = ?, from_acc = ?, fromEmoji = ?, to_acc = ?, toEmoji = ?, amount = ?, reason = ? WHERE id = ?',
    [transfer.date, transfer.from, transfer.fromEmoji, transfer.to, transfer.toEmoji, transfer.amount, transfer.reason, transfer.id]
  );
}

export async function removeTransfer(id: string): Promise<void> {
  const db = await getDB();
  const idStr = String(id);
  await db.runAsync('DELETE FROM transfers WHERE id = ? OR id = CAST(? AS INTEGER)', [idStr, idStr]);
}

export async function updateTransactionInDB(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE transactions SET date = ?, type = ?, amount = ?, from_acc = ?, to_acc = ?, reference = ?, category = ?, accountId = ? WHERE id = ?',
    [tx.date, tx.type, tx.amount, tx.from, tx.to, tx.reference, tx.category, tx.accountId || null, tx.id]
  );
}

export async function removeTransaction(id: string): Promise<void> {
  const db = await getDB();
  const idStr = String(id);
  await db.runAsync('DELETE FROM transactions WHERE id = ? OR id = CAST(? AS INTEGER)', [idStr, idStr]);
}

export async function deleteAppSetting(key: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM app_settings WHERE key = ?', [key]);
}

export async function insertSalaryRecord(rec: SalaryRecord): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO salaries (id, month, amount, day, account_id, account_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [rec.id, rec.month, rec.amount, rec.day, rec.accountId || null, rec.accountName || null, rec.createdAt]
  );
}

export async function updateSalaryRecordInDB(rec: SalaryRecord): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE salaries SET month = ?, amount = ?, day = ?, account_id = ?, account_name = ? WHERE id = ?',
    [rec.month, rec.amount, rec.day, rec.accountId || null, rec.accountName || null, rec.id]
  );
}

export async function removeSalaryRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM salaries WHERE id = ?', [id]);
}

export async function saveInitialCashInHand(amount: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['initial_cash_in_hand', String(amount)]);
}

// ==========================================
// 🔒 Proprietary Backup Security & Encryption
// ==========================================

const APP_VAULT_SECRET = 'AET_VAULT_SECURE_2026_@K4W4II_FINANCE_GUARD_#9876';

function encodeUtf8(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    } else {
      i++;
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f)
      );
    }
  }
  return bytes;
}

function decodeUtf8(bytes: number[] | Uint8Array): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    if (b1 < 0x80) {
      result += String.fromCharCode(b1);
    } else if ((b1 >> 5) === 0x06) {
      const b2 = bytes[i++];
      result += String.fromCharCode(((b1 & 0x1f) << 6) | (b2 & 0x3f));
    } else if ((b1 >> 4) === 0x0e) {
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      result += String.fromCharCode(((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f));
    } else if ((b1 >> 3) === 0x1e) {
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      const b4 = bytes[i++];
      let codePoint = ((b1 & 0x07) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
      codePoint -= 0x10000;
      result += String.fromCharCode(0xd800 + (codePoint >> 10), 0xdc00 + (codePoint & 0x3ff));
    }
  }
  return result;
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: number[] | Uint8Array): string {
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    const triplet = (b1 << 16) | (b2 << 8) | b3;
    result += B64_CHARS[(triplet >> 18) & 0x3f];
    result += B64_CHARS[(triplet >> 12) & 0x3f];
    result += i + 1 < len ? B64_CHARS[(triplet >> 6) & 0x3f] : '=';
    result += i + 2 < len ? B64_CHARS[triplet & 0x3f] : '=';
  }
  return result;
}

function base64ToBytes(b64: string): number[] {
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === '=') break;
    const val = B64_CHARS.indexOf(ch);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytes;
}

function computeVaultHash(dataBytes: number[], salt: string): string {
  const secretBytes = encodeUtf8(APP_VAULT_SECRET + salt);
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x27d4eb2f;
  let h4 = 0x165667b1;
  const combined = [...secretBytes, ...dataBytes];
  for (let i = 0; i < combined.length; i++) {
    const b = combined[i];
    h1 = Math.imul(h1 ^ b, 0x01000193);
    h2 = Math.imul(h2 ^ ((b << 3) | (b >> 5)), 0x5bd1e995);
    h3 = Math.imul(h3 ^ ((b << 5) | (b >> 3)), 0xcc9e2d51);
    h4 = Math.imul(h4 ^ (b * (i + 1)), 0x1b873593);
    h1 ^= h1 >>> 13;
    h2 ^= h2 >>> 15;
    h3 ^= h3 >>> 11;
    h4 ^= h4 >>> 16;
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
}

function generateKeyStream(length: number, salt: string): number[] {
  const keySeed = encodeUtf8(APP_VAULT_SECRET + ':' + salt);
  const s = new Array(256);
  for (let i = 0; i < 256; i++) s[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + keySeed[i % keySeed.length]) & 0xff;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }
  const stream: number[] = new Array(length);
  let i = 0;
  j = 0;
  for (let k = 0; k < length; k++) {
    i = (i + 1) & 0xff;
    j = (j + s[i]) & 0xff;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
    stream[k] = s[(s[i] + s[j]) & 0xff];
  }
  return stream;
}

export function encryptBackupPayload(plainTextJson: string): string {
  const salt = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const plainBytes = encodeUtf8(plainTextJson);
  const keystream = generateKeyStream(plainBytes.length, salt);
  const cipherBytes: number[] = new Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i++) {
    cipherBytes[i] = plainBytes[i] ^ keystream[i] ^ ((i * 17) & 0xff);
  }
  const hash = computeVaultHash(cipherBytes, salt);
  const encryptedBase64 = bytesToBase64(cipherBytes);

  return JSON.stringify(
    {
      vault: 'AET_SECURE_ENCRYPTED_BACKUP',
      version: 1,
      salt,
      hash,
      data: encryptedBase64,
      exportedAt: new Date().toISOString(),
      note: '🔒 Aesthetic Expense Tracker Encrypted Backup. This file is cryptographically protected against theft and cannot be viewed in plain text.',
    },
    null,
    2
  );
}

export function decryptBackupPayload(encryptedString: string): { success: boolean; data?: string; error?: string } {
  try {
    const trimmed = encryptedString.trim();

    // Support backward compatibility with legacy plain JSON backups
    if (
      trimmed.startsWith('{') &&
      (trimmed.includes('"appName"') || trimmed.includes('"tables"') || trimmed.includes('"accounts"')) &&
      !trimmed.includes('"AET_SECURE_ENCRYPTED_BACKUP"')
    ) {
      return { success: true, data: trimmed };
    }

    const parsed = JSON.parse(trimmed);
    if (parsed.vault !== 'AET_SECURE_ENCRYPTED_BACKUP' || !parsed.salt || !parsed.hash || !parsed.data) {
      return { success: false, error: 'Invalid or unsupported backup format.' };
    }

    const { salt, hash, data } = parsed;
    const cipherBytes = base64ToBytes(data);
    const calculatedHash = computeVaultHash(cipherBytes, salt);
    if (calculatedHash !== hash) {
      return {
        success: false,
        error: 'Security hash verification failed! The backup file appears tampered with or corrupted.',
      };
    }

    const keystream = generateKeyStream(cipherBytes.length, salt);
    const plainBytes: number[] = new Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) {
      plainBytes[i] = cipherBytes[i] ^ keystream[i] ^ ((i * 17) & 0xff);
    }

    const decryptedJson = decodeUtf8(plainBytes);
    return { success: true, data: decryptedJson };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to decrypt and verify backup file.' };
  }
}

export async function exportAllDataAsJSON(): Promise<string> {
  const db = await getDB();
  const settings = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_settings');
  const salaries = await db.getAllAsync<any>('SELECT * FROM salaries ORDER BY month ASC');
  const envelopes = await db.getAllAsync<any>('SELECT * FROM envelopes');
  const categories = await db.getAllAsync<any>('SELECT * FROM categories');
  const incomes = await db.getAllAsync<any>('SELECT * FROM incomes');
  const expenses = await db.getAllAsync<any>('SELECT * FROM expenses');
  const debts = await db.getAllAsync<any>('SELECT * FROM debts');
  const debtHistory = await db.getAllAsync<any>('SELECT * FROM debt_history');
  const wishlist = await db.getAllAsync<any>('SELECT * FROM wishlist');
  const accounts = await db.getAllAsync<any>('SELECT * FROM accounts');
  const transfers = await db.getAllAsync<any>('SELECT * FROM transfers');
  const transactions = await db.getAllAsync<any>('SELECT * FROM transactions');

  const exportPayload = {
    appName: 'AestheticExpenseTracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      app_settings: settings,
      salaries,
      envelopes,
      categories,
      incomes,
      expenses,
      debts,
      debt_history: debtHistory,
      wishlist,
      accounts,
      transfers,
      transactions,
    },
  };

  const rawJson = JSON.stringify(exportPayload);
  return encryptBackupPayload(rawJson);
}

export async function importAllDataFromJSON(jsonString: string): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> {
  try {
    const decryptResult = decryptBackupPayload(jsonString);
    if (!decryptResult.success || !decryptResult.data) {
      return {
        success: false,
        message: decryptResult.error || 'Failed to decrypt backup data. The file may be invalid or tampered with.',
      };
    }

    const parsed = JSON.parse(decryptResult.data);
    if (!parsed || (!parsed.tables && !parsed.accounts && !parsed.expenses)) {
      return { success: false, message: 'Invalid backup file format. Missing tables or data.' };
    }

    const tables = parsed.tables || parsed;
    const db = await getDB();

    try {
      await db.execAsync('PRAGMA foreign_keys = OFF;');
    } catch (e) { }

    await db.withTransactionAsync(async () => {
      // Clear existing records
      await db.runAsync('DELETE FROM debt_history;');
      await db.runAsync('DELETE FROM debts;');
      await db.runAsync('DELETE FROM expenses;');
      await db.runAsync('DELETE FROM incomes;');
      await db.runAsync('DELETE FROM categories;');
      await db.runAsync('DELETE FROM envelopes;');
      await db.runAsync('DELETE FROM accounts;');
      await db.runAsync('DELETE FROM wishlist;');
      await db.runAsync('DELETE FROM transfers;');
      await db.runAsync('DELETE FROM transactions;');
      await db.runAsync('DELETE FROM salaries;');
      await db.runAsync('DELETE FROM app_settings;');

      // Settings
      if (Array.isArray(tables.app_settings)) {
        for (const s of tables.app_settings) {
          if (s.key) {
            await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [s.key, String(s.value ?? '')]);
          }
        }
      }
      await db.runAsync("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('is_initialized', 'true')");

      // Accounts
      if (Array.isArray(tables.accounts)) {
        for (const a of tables.accounts) {
          await db.runAsync(
            'INSERT OR REPLACE INTO accounts (id, name, emoji, balance, type) VALUES (?, ?, ?, ?, ?)',
            [String(a.id), String(a.name), String(a.emoji || '💳'), Number(a.balance || 0), String(a.type || 'bank')]
          );
        }
      }

      // Envelopes
      if (Array.isArray(tables.envelopes)) {
        for (const env of tables.envelopes) {
          await db.runAsync(
            'INSERT OR REPLACE INTO envelopes (id, name, emoji, color, budgeted) VALUES (?, ?, ?, ?, ?)',
            [String(env.id), String(env.name), String(env.emoji || '✉️'), String(env.color || '#56a76e'), Number(env.budgeted || 0)]
          );
        }
      }

      // Categories
      if (Array.isArray(tables.categories)) {
        for (const cat of tables.categories) {
          await db.runAsync(
            'INSERT OR REPLACE INTO categories (id, name, emoji, color) VALUES (?, ?, ?, ?)',
            [String(cat.id), String(cat.name), String(cat.emoji || '🏷️'), String(cat.color || '#f48295')]
          );
        }
      }

      // Incomes
      if (Array.isArray(tables.incomes)) {
        for (const inc of tables.incomes) {
          await db.runAsync(
            'INSERT OR REPLACE INTO incomes (id, date, amount, stored, note, type) VALUES (?, ?, ?, ?, ?, ?)',
            [String(inc.id), String(inc.date), Number(inc.amount || 0), String(inc.stored || 'Cash in Hand'), String(inc.note || ''), String(inc.type || 'incoming')]
          );
        }
      }

      // Expenses
      if (Array.isArray(tables.expenses)) {
        for (const exp of tables.expenses) {
          const recBillId = exp.recurring_bill_id || exp.recurringBillId || null;
          await db.runAsync(
            'INSERT OR REPLACE INTO expenses (id, date, category, amount, reason, stored, type, recurring_bill_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [String(exp.id), String(exp.date), String(exp.category || 'General'), Number(exp.amount || 0), String(exp.reason || ''), String(exp.stored || 'Cash in Hand'), String(exp.type || 'outgoing'), recBillId]
          );
        }
      }

      // Debts
      if (Array.isArray(tables.debts)) {
        for (const d of tables.debts) {
          await db.runAsync(
            'INSERT OR REPLACE INTO debts (id, person, emoji, total, remaining, status, type, reason, account, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              String(d.id),
              String(d.person),
              String(d.emoji || '👤'),
              Number(d.total || 0),
              Number(d.remaining || 0),
              String(d.status || 'Pending'),
              String(d.type || 'borrowed'),
              d.reason || null,
              d.account || null,
              d.date || null,
            ]
          );
        }
      }

      // Debt History
      const debtHist = tables.debt_history || tables.debtHistory;
      if (Array.isArray(debtHist)) {
        for (const h of debtHist) {
          await db.runAsync(
            'INSERT OR REPLACE INTO debt_history (id, debt_id, date, amount, remaining, account, themeColorTag) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [String(h.id), String(h.debt_id), String(h.date), Number(h.amount || 0), Number(h.remaining || 0), String(h.account || 'Cash in Hand'), h.themeColorTag || null]
          );
        }
      }

      // Wishlist
      if (Array.isArray(tables.wishlist)) {
        for (const w of tables.wishlist) {
          await db.runAsync(
            'INSERT OR REPLACE INTO wishlist (id, name, emoji, priority, price, targetDate, isPurchased, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              String(w.id),
              String(w.name),
              String(w.emoji || '🎁'),
              String(w.priority || 'Med Priority'),
              Number(w.price || 0),
              String(w.targetDate || ''),
              w.isPurchased ? 1 : 0,
              w.imageUrl || null,
            ]
          );
        }
      }

      // Transfers
      if (Array.isArray(tables.transfers)) {
        for (const tr of tables.transfers) {
          await db.runAsync(
            'INSERT OR REPLACE INTO transfers (id, date, from_acc, fromEmoji, to_acc, toEmoji, amount, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              String(tr.id),
              String(tr.date),
              String(tr.from_acc || tr.from || 'Cash in Hand'),
              String(tr.fromEmoji || '💳'),
              String(tr.to_acc || tr.to || 'Cash in Hand'),
              String(tr.toEmoji || '💳'),
              Number(tr.amount || 0),
              String(tr.reason || ''),
            ]
          );
        }
      }

      // Transactions
      if (Array.isArray(tables.transactions)) {
        for (const tx of tables.transactions) {
          await db.runAsync(
            'INSERT OR REPLACE INTO transactions (id, date, type, amount, from_acc, to_acc, reference, category, accountId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              String(tx.id),
              String(tx.date),
              String(tx.type || 'Expense'),
              Number(tx.amount || 0),
              String(tx.from_acc || tx.from || ''),
              String(tx.to_acc || tx.to || ''),
              String(tx.reference || ''),
              String(tx.category || ''),
              tx.accountId || null,
            ]
          );
        }
      }

      // Salaries
      if (Array.isArray(tables.salaries)) {
        for (const s of tables.salaries) {
          await db.runAsync(
            'INSERT OR REPLACE INTO salaries (id, month, amount, day, account_id, account_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              String(s.id),
              String(s.month),
              Number(s.amount || 0),
              String(s.day || '1'),
              s.account_id || s.accountId || null,
              s.account_name || s.accountName || null,
              String(s.created_at || s.createdAt || new Date().toISOString()),
            ]
          );
        }
      }
    });

    try {
      await db.execAsync('PRAGMA foreign_keys = ON;');
    } catch (e) { }

    const counts = {
      accounts: Array.isArray(tables.accounts) ? tables.accounts.length : 0,
      salaries: Array.isArray(tables.salaries) ? tables.salaries.length : 0,
      expenses: Array.isArray(tables.expenses) ? tables.expenses.length : 0,
      incomes: Array.isArray(tables.incomes) ? tables.incomes.length : 0,
      debts: Array.isArray(tables.debts) ? tables.debts.length : 0,
      wishlist: Array.isArray(tables.wishlist) ? tables.wishlist.length : 0,
    };

    return { success: true, message: 'All previous data restored successfully!', counts };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to parse and import JSON data.' };
  }
}
