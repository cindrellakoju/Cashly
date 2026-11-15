import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { AppTheme, THEMES, ThemeColors, THEME_STICKERS, ThemeStickers, StickerPack } from '@/constants/theme';
import { sendPinRecoveryEmail } from '@/services/emailService';

export type TransactionType =
  | 'Expense'
  | 'Income'
  | 'Salary'
  | 'Transfer'
  | 'Debt Borrowed'
  | 'Debt Payment'
  | 'Credit Given'
  | 'Credit Received';

export interface CashEnvelope {
  id: string;
  name: string;
  emoji: string;
  color: string;
  budgeted: number;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Income {
  id: string;
  date: string;
  amount: number;
  stored: string;
  note: string;
  type: 'incoming';
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  reason: string;
  stored: string;
  type: 'outgoing';
  recurringBillId?: string;
}

export interface InstallmentPayment {
  id: string;
  date: string;
  amount: number;
  remaining: number;
  account: string;
  themeColorTag?: string;
}

export interface DebtItem {
  id: string;
  person: string;
  emoji: string;
  total: number;
  remaining: number;
  status: 'Pending' | 'Completed';
  type: 'borrowed' | 'lent';
  reason?: string;
  account?: string;
  date?: string;
  history: InstallmentPayment[];
}

export interface WishlistItem {
  id: string;
  name: string;
  emoji: string;
  priority: 'High Priority' | 'Med Priority' | 'Low Priority';
  price: number;
  targetDate: string;
  isPurchased?: boolean;
  imageUrl?: string;
  completedDate?: string;
  sourceAccount?: string;
  expenseId?: string;
}

export interface Account {
  id: string;
  name: string;
  emoji: string;
  balance: number;
  type: 'cash' | 'bank' | 'wallet' | 'credit' | 'savings';
}

export interface InternalTransfer {
  id: string;
  date: string;
  from: string;
  fromEmoji: string;
  to: string;
  toEmoji: string;
  amount: number;
  reason: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  from: string;
  to: string;
  reference: string;
  category: string;
  accountId?: string;
}

export interface SalaryRecord {
  id: string;
  month: string;         // YYYY-MM
  amount: number;
  day: string;
  accountId?: string;
  accountName?: string;
  createdAt: string;
}

export const getCurrentMonthKey = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export const extractDayFromDate = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const str = dateStr.trim();
  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^\d{4}[\-\/]\d{1,2}[\-\/](\d{1,2})/);
  if (isoMatch) {
    const d = parseInt(isoMatch[1], 10);
    return d >= 1 && d <= 31 ? d : null;
  }
  // 2. Format starting with day: DD-MM-YYYY or DD/MM/YYYY or DD Mon YYYY (e.g. 12 Oct 2026)
  const dayStartMatch = str.match(/^(\d{1,2})[\s\/\-]/);
  if (dayStartMatch) {
    const d = parseInt(dayStartMatch[1], 10);
    return d >= 1 && d <= 31 ? d : null;
  }
  // 3. Fallback: DD at the end or standalone
  const endMatch = str.match(/[\s\/\-](\d{1,2})$/);
  if (endMatch) {
    const d = parseInt(endMatch[1], 10);
    return d >= 1 && d <= 31 ? d : null;
  }
  return null;
};

// Initial Defaults - Cash Envelopes (Expected Money to Spend)
// By default, cash envelopes start empty. The 6 default categories are only seeded for Admin Categories.
const INITIAL_ENVELOPES: CashEnvelope[] = [];

// Initial Defaults - General Expense Categories (Tags for Expenses in Admin Access)
const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Food', emoji: '🍔', color: '#f3b06c' },
  { id: '2', name: 'Coffee', emoji: '☕', color: '#c45167' },
  { id: '3', name: 'Transport', emoji: '🚗', color: '#56a76e' },
  { id: '4', name: 'Shopping', emoji: '🛍️', color: '#f2738a' },
  { id: '5', name: 'Utilities', emoji: '🏠', color: '#7ab583' },
  { id: '6', name: 'Fun', emoji: '🍿', color: '#9d7be2' },
  { id: '7', name: 'Money Lent', emoji: '🤝', color: '#38bdf8' },
  { id: '8', name: 'Wishlist', emoji: '🎁', color: '#ec4899' },
];

const INITIAL_INCOMES: Income[] = [];
const INITIAL_EXPENSES: Expense[] = [];
const INITIAL_DEBTS: DebtItem[] = [];
const INITIAL_WISHLIST: WishlistItem[] = [];

const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', name: 'Cash in Hand', emoji: '💵', balance: 0, type: 'cash' },
];

const INITIAL_TRANSFERS: InternalTransfer[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];

interface FinancialContextType {
  theme: AppTheme;
  stickerPack: StickerPack;
  colors: ThemeColors;
  stickers: ThemeStickers;
  salary: number;
  hasBaseSalary: boolean | null;
  baseSalaryDate: string;
  isVaultUnlocked: boolean;
  isPrivacyMasked: boolean;
  pinCode: string;
  adminPin: string;
  accountPin: string;
  salaryAccountId: string | null;

  envelopes: CashEnvelope[];
  categories: Category[];
  incomes: Income[];
  expenses: Expense[];
  debts: DebtItem[];
  wishlist: WishlistItem[];
  accounts: Account[];
  transfers: InternalTransfer[];
  transactions: Transaction[];

  // Metrics
  totalSalary: number;
  totalSpent: number;
  totalIncome: number;
  extraIncome: number;
  remainingBudget: number;
  totalNetWorth: number;
  totalEnvelopesBudgeted: number;
  currencySymbol: string;
  customCurrencies: string[];
  addCustomCurrency: (symbol: string) => Promise<void>;
  removeCustomCurrency: (symbol: string) => Promise<void>;

  // Month Filtering
  selectedMonth: string;
  setSelectedMonth: (monthKey: string) => void;
  availableMonths: { key: string; label: string }[];
  filteredExpenses: Expense[];
  filteredIncomes: Income[];
  filteredTransactions: Transaction[];
  filteredTransfers: InternalTransfer[];

  // Admin Access Control
  isAdminMode: boolean;
  setIsAdminMode: (isAdmin: boolean) => void;
  lockAdminMode: () => void;

  // Actions
  setTheme: (theme: AppTheme) => Promise<void> | void;
  setStickerPack: (pack: StickerPack) => Promise<void>;
  setCurrencySymbol: (symbol: string) => void;
  unlockVault: (pin: string) => boolean;
  lockVault: () => void;
  togglePrivacyMask: () => void;
  setPinCode: (pin: string) => void;
  setAdminPin: (pin: string) => Promise<void>;
  setAccountPin: (pin: string) => Promise<void>;
  verifyAdminPin: (pin: string) => boolean;
  verifyAccountPin: (pin: string) => boolean;
  setSalaryAccountId: (accountId: string | null) => Promise<void>;
  updateSalary: (val: number) => void;
  configureBaseSalary: (amount: number, dayStr: string, effectiveMonthKey?: string, designatedAccountId?: string) => Promise<void>;
  skipBaseSalary: () => Promise<void>;
  salaries: SalaryRecord[];
  salaryLogs: SalaryLog[];
  initialCashInHand: number;
  hasSetInitialCash: boolean;
  showMonthlyBills: boolean;
  setShowMonthlyBills: (show: boolean) => Promise<void>;
  toggleShowMonthlyBills: () => Promise<void>;
  recoveryEmail: string;
  setRecoveryEmail: (email: string) => Promise<void>;
  recoverPinViaEmail: (target: 'admin' | 'account') => Promise<{ success: boolean; newPin?: string; email?: string; error?: string; message?: string }>;
  linkAndRecoverPinViaEmail: (target: 'admin' | 'account', email: string) => Promise<{ success: boolean; newPin?: string; email?: string; error?: string }>;
  activeMonthSalary: number;
  salaryStartDate: string;
  getSalaryForMonth: (monthKey: string) => { amount: number; day: string; accountId?: string; accountName?: string };
  setCashInHandInitialMoney: (amount: number) => Promise<boolean>;
  updateSalaryRecord: (rec: SalaryRecord) => Promise<void>;
  deleteSalaryRecord: (id: string) => Promise<void>;
  isDbLoaded: boolean;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  markWelcomeShown: () => Promise<void>;
  isWelcomeActive: boolean;
  setIsWelcomeActive: (active: boolean) => void;
  isSalaryLoaded: boolean;
  daysUntilPayday: number;
  loadSalaryNow: (monthKey?: string) => Promise<void>;

  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, incomeData: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expenseData: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, catData: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addEnvelope: (env: Omit<CashEnvelope, 'id'>) => void;
  updateEnvelope: (id: string, budget: number) => void;
  deleteEnvelope: (id: string) => void;
  addDebt: (debt: Omit<DebtItem, 'id' | 'remaining' | 'status' | 'history'>) => void;
  updateDebt: (id: string, debtData: Partial<DebtItem>) => void;
  deleteDebt: (id: string) => void;
  recordInstallment: (debtId: string, amount: number, account: string, customDate?: string) => void;
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'isPurchased'>) => void;
  updateWishlistItem: (id: string, itemData: Partial<WishlistItem>) => void;
  toggleWishlistPurchased: (id: string) => void;
  completeWishlistItem: (
    id: string,
    details: {
      completedDate: string;
      sourceAccount: string;
      deductMoney?: boolean;
    }
  ) => void;
  uncompleteWishlistItem: (id: string) => void;
  deleteWishlistItem: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'> & { id?: string }) => Account;
  updateAccount: (id: string, accountData: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addTransfer: (transfer: Omit<InternalTransfer, 'id'>) => void;
  updateTransfer: (id: string, transferData: Partial<InternalTransfer>) => void;
  deleteTransfer: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, txData: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  resetDatabase: () => Promise<void>;
  resetPINs: () => Promise<void>;
  exportDataBackup: () => Promise<string>;
  importDataBackup: (jsonString: string) => Promise<{ success: boolean; message: string; counts?: Record<string, number> }>;
  reloadAllDataFromDB: () => Promise<void>;
  isBackupModalOpen: boolean;
  backupModalMode: 'export' | 'import' | null;
  openBackupModal: (mode: 'export' | 'import') => void;
  closeBackupModal: () => void;
}

import {
  initDatabase,
  seedDatabase,
  loadAllData,
  clearAllDatabaseTables,
  saveAppSetting,
  deleteAppSetting,
  markWelcomeAsShown,
  exportAllDataAsJSON,
  importAllDataFromJSON,
  WELCOME_SHOWN_KEY,
  insertExpense,
  updateExpenseInDB,
  removeExpense,
  insertIncome,
  updateIncomeInDB,
  removeIncome,
  insertCategory,
  updateCategory as updateCategoryInDB,
  removeCategory,
  insertEnvelope,
  updateEnvelopeInDB,
  updateEnvelopeBudget,
  removeEnvelope,
  insertDebt,
  updateDebtInDB,
  updateDebtAndHistory,
  removeDebt,
  insertWishlistItem,
  updateWishlistItemInDB,
  updateWishlistPurchased,
  removeWishlistItem,
  insertAccount,
  updateAccountInDB,
  removeAccount,
  insertTransfer,
  updateTransferInDB,
  removeTransfer,
  insertTransaction,
  updateTransactionInDB,
  removeTransaction,
  insertSalaryRecord,
  updateSalaryRecordInDB,
  removeSalaryRecord,
  SalaryLog,
  insertSalaryLog,
  saveInitialCashInHand,
  clearPINsInDatabase,
  markOnboardingCompleted,
} from '@/services/database';

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isWelcomeActive, setIsWelcomeActive] = useState<boolean>(true);
  const [theme, setThemeState] = useState<AppTheme>('kawaii');
  const [stickerPack, setStickerPackState] = useState<StickerPack>('totoro');
  const [currencySymbol, setCurrencySymbolState] = useState<string>('Rs.');
  const [customCurrencies, setCustomCurrencies] = useState<string[]>([]);
  const [salary, setSalary] = useState<number>(0);
  const [hasBaseSalary, setHasBaseSalary] = useState<boolean | null>(null);
  const [baseSalaryDate, setBaseSalaryDate] = useState<string>('1');
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(true);
  const [isPrivacyMasked, setIsPrivacyMasked] = useState<boolean>(false);
  const [pinCode, setPinCodeState] = useState<string>('1234');
  const [adminPin, setAdminPinState] = useState<string>('1234');
  const [accountPin, setAccountPinState] = useState<string>('1234');
  const [recoveryEmail, setRecoveryEmailState] = useState<string>('');
  const [salaryStartDate, setSalaryStartDateState] = useState<string>('');
  const [salaryAccountId, setSalaryAccountIdState] = useState<string | null>(null);
  const [manuallyLoadedMonths, setManuallyLoadedMonths] = useState<string[]>([]);
  const [creditedSalaryMonths, setCreditedSalaryMonths] = useState<string[]>([]);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [backupModalMode, setBackupModalMode] = useState<'export' | 'import' | null>(null);

  const openBackupModal = (mode: 'export' | 'import') => {
    setBackupModalMode(mode);
    setIsBackupModalOpen(true);
  };

  const closeBackupModal = () => {
    setIsBackupModalOpen(false);
    setBackupModalMode(null);
  };

  const lockAdminMode = () => {
    setIsAdminMode(false);
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await markOnboardingCompleted();
  };

  const markWelcomeShown = async () => {
    // Flag persistent storage immediately so next app launch never shows welcome
    await markWelcomeAsShown();
  };


  const [envelopes, setEnvelopes] = useState<CashEnvelope[]>(INITIAL_ENVELOPES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [incomes, setIncomes] = useState<Income[]>(INITIAL_INCOMES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [debts, setDebts] = useState<DebtItem[]>(INITIAL_DEBTS);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(INITIAL_WISHLIST);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transfers, setTransfers] = useState<InternalTransfer[]>(INITIAL_TRANSFERS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [salaryLogs, setSalaryLogs] = useState<SalaryLog[]>([]);
  const [initialCashInHand, setInitialCashInHand] = useState<number>(0);
  const [hasSetInitialCash, setHasSetInitialCash] = useState<boolean>(false);
  const [showMonthlyBills, setShowMonthlyBillsState] = useState<boolean>(true);

  const setShowMonthlyBills = async (show: boolean) => {
    setShowMonthlyBillsState(show);
    await saveAppSetting('show_monthly_bills', show ? 'true' : 'false');
  };

  const toggleShowMonthlyBills = async () => {
    const next = !showMonthlyBills;
    setShowMonthlyBillsState(next);
    await saveAppSetting('show_monthly_bills', next ? 'true' : 'false');
  };

  // Load SQLite database on boot
  useEffect(() => {
    (async () => {
      try {
        const defaultData = {
          theme,
          currencySymbol,
          salary: 0,
          hasBaseSalary: null,
          baseSalaryDate: '1',
          pinCode,
          adminPin: '1234',
          accountPin: '1234',
          salaryAccountId: null,
          hasCompletedOnboarding: false,
          manuallyLoadedMonths: [],
          creditedSalaryMonths: [],
          envelopes: INITIAL_ENVELOPES,
          categories: INITIAL_CATEGORIES,
          incomes: INITIAL_INCOMES,
          expenses: INITIAL_EXPENSES,
          debts: INITIAL_DEBTS,
          wishlist: INITIAL_WISHLIST,
          accounts: INITIAL_ACCOUNTS,
          transfers: INITIAL_TRANSFERS,
          transactions: INITIAL_TRANSACTIONS,
          salaries: [],
          initialCashInHand: 0,
          showMonthlyBills: true,
          recoveryEmail: '',
        };
        const loaded = await initDatabase(defaultData);
        const hasSwitchedToKawaii = await AsyncStorage.getItem('cashly_switched_to_kawaii_v1');
        if (!hasSwitchedToKawaii) {
          await AsyncStorage.setItem('cashly_switched_to_kawaii_v1', 'true');
          await saveAppSetting('theme', 'kawaii');
          setThemeState('kawaii');
        } else if (loaded.theme) {
          const validThemes: AppTheme[] = ['paper', 'paperDark', 'kawaii', 'dreamy', 'fresh', 'playful', 'midnight', 'noir'];
          const t = (loaded.theme === 'noir' || loaded.theme === 'paperDark') ? 'paperDark' : (validThemes.includes(loaded.theme as any) ? loaded.theme : 'kawaii');
          setThemeState(t as AppTheme);
        }
        if (loaded.stickerPack) {
          setStickerPackState(loaded.stickerPack);
        }
        setCurrencySymbolState(loaded.currencySymbol);
        setCustomCurrencies(loaded.customCurrencies || []);
        setSalary(loaded.salary);
        setHasBaseSalary(loaded.hasBaseSalary ?? null);
        setBaseSalaryDate(loaded.baseSalaryDate || '1');
        setPinCodeState(loaded.accountPin || loaded.pinCode || '1234');
        setAdminPinState(loaded.adminPin || '1234');
        setAccountPinState(loaded.accountPin || loaded.pinCode || '1234');
        setRecoveryEmailState(loaded.recoveryEmail || '');
    setSalaryStartDateState(loaded.salaryStartDate || '');
        setSalaryStartDateState(loaded.salaryStartDate || '');
        setSalaryAccountIdState(loaded.salaryAccountId || null);
        const isFinished = loaded.hasCompletedOnboarding ?? false;
        setHasCompletedOnboarding(isFinished);
        setIsWelcomeActive(!isFinished);
        setManuallyLoadedMonths(loaded.manuallyLoadedMonths || []);
        setCreditedSalaryMonths(loaded.creditedSalaryMonths || []);
        setEnvelopes(loaded.envelopes);
        let loadedCats = [...(loaded.categories || [])];
        const hasMoneyLent = loadedCats.some((c) => c.name.toLowerCase().includes('money lent') || c.name.toLowerCase() === 'lent');
        if (!hasMoneyLent) {
          const moneyLentCat: Category = { id: '7', name: 'Money Lent', emoji: '🤝', color: '#38bdf8' };
          loadedCats.push(moneyLentCat);
          insertCategory(moneyLentCat).catch(() => {});
        }
        const hasWishlist = loadedCats.some((c) => c.name.toLowerCase().includes('wishlist'));
        if (!hasWishlist) {
          const wishlistCat: Category = { id: '8', name: 'Wishlist', emoji: '🎁', color: '#ec4899' };
          loadedCats.push(wishlistCat);
          insertCategory(wishlistCat).catch(() => {});
        }
        setCategories(loadedCats);
        setIncomes(loaded.incomes);
        setExpenses(loaded.expenses);
        setDebts(loaded.debts);
        setWishlist(loaded.wishlist);
        setAccounts(loaded.accounts);
        setTransfers(loaded.transfers);
        setTransactions(loaded.transactions);
        const loadedSals = loaded.salaries || [];
        setSalaries(loadedSals);
        let loadedLogs = loaded.salaryLogs || [];
        if (loadedLogs.length === 0 && (loaded.hasBaseSalary && loaded.salary > 0)) {
          const sAcc = loaded.salaryAccountId
            ? (loaded.accounts || []).find((a) => a.id === loaded.salaryAccountId)
            : (loaded.accounts || [])[0];
          const initialLog: SalaryLog = {
            id: `sal_log_init_${Date.now()}`,
            action: 'added',
            amount: loaded.salary,
            day: loaded.baseSalaryDate || '1',
            accountName: sAcc?.name || 'Cash in Hand',
            timestamp: new Date().toISOString(),
            note: 'Current base salary configuration',
          };
          insertSalaryLog(initialLog).catch(() => {});
          loadedLogs = [initialLog];
        }
        setSalaryLogs(loadedLogs);
        if (loaded.hasBaseSalary && loaded.salary > 0) {
          const curMonth = getCurrentMonthKey();
          const hasRecord = loadedSals.some((s) => s.month === curMonth);
          if (!hasRecord) {
            const sAcc = loaded.salaryAccountId
              ? (loaded.accounts || []).find((a) => a.id === loaded.salaryAccountId)
              : (loaded.accounts || [])[0];
            const autoRec: SalaryRecord = {
              id: `salary_rec_${curMonth}`,
              month: curMonth,
              amount: loaded.salary,
              day: loaded.baseSalaryDate || '1',
              accountId: sAcc?.id,
              accountName: sAcc?.name || 'Cash in Hand',
              createdAt: new Date().toISOString(),
            };
            insertSalaryRecord(autoRec).catch(() => {});
            setSalaries((prev) => [...prev, autoRec].sort((a, b) => a.month.localeCompare(b.month)));
          }
        }
        setInitialCashInHand(loaded.initialCashInHand || 0);
        setHasSetInitialCash(loaded.hasSetInitialCash || (loaded.initialCashInHand ? loaded.initialCashInHand > 0 : false));
        if (loaded.showMonthlyBills !== undefined) {
          setShowMonthlyBillsState(loaded.showMonthlyBills);
        }
        setIsDbLoaded(true);
      } catch (err) {
        console.warn('Failed to load SQLite database:', err);
      }
    })();
  }, []);

  const isResettingRef = useRef<boolean>(false);
  const isSyncingRef = useRef<boolean>(false);
  const pendingSyncRef = useRef<boolean>(false);
  const latestStateRef = useRef<any>(null);

  // Sync to SQLite database when state changes after initial boot load (debounced & serialized)
  useEffect(() => {
    if (!isDbLoaded || isResettingRef.current) return;

    latestStateRef.current = {
      theme,
      currencySymbol,
      salary,
      hasBaseSalary,
      baseSalaryDate,
      pinCode: accountPin,
      adminPin,
      accountPin,
      salaryAccountId,
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
    };

    const runSync = async () => {
      if (isSyncingRef.current) {
        pendingSyncRef.current = true;
        return;
      }
      isSyncingRef.current = true;
      try {
        do {
          pendingSyncRef.current = false;
          const toSave = latestStateRef.current;
          if (toSave) {
            await seedDatabase(toSave);
          }
        } while (pendingSyncRef.current);
      } catch (err) {
        console.warn('Failed to sync state to SQLite:', err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    const timer = setTimeout(runSync, 300);
    return () => clearTimeout(timer);
  }, [
    isDbLoaded,
    theme,
    currencySymbol,
    salary,
    hasBaseSalary,
    baseSalaryDate,
    pinCode,
    adminPin,
    accountPin,
    salaryAccountId,
    salaries,
    initialCashInHand,
    showMonthlyBills,
    envelopes,
    categories,
    incomes,
    expenses,
    debts,
    wishlist,
    accounts,
    transfers,
    transactions,
  ]);

  const setTheme = async (newTheme: AppTheme) => {
    setThemeState(newTheme);
    await saveAppSetting('theme', newTheme);
  };

  const setStickerPack = async (newPack: StickerPack) => {
    setStickerPackState(newPack);
    await saveAppSetting('sticker_pack', newPack);
  };

  const verifyAdminPin = (entered: string): boolean => {
    return entered === adminPin;
  };

  const verifyAccountPin = (entered: string): boolean => {
    if (entered === accountPin) {
      setIsVaultUnlocked(true);
      return true;
    }
    return false;
  };

  const unlockVault = (entered: string): boolean => {
    return verifyAccountPin(entered);
  };

  const lockVault = () => {
    setIsVaultUnlocked(false);
  };

  const togglePrivacyMask = () => {
    setIsPrivacyMasked((prev) => !prev);
  };

  const setPinCode = (newPin: string) => {
    setAccountPin(newPin);
  };

  const setAdminPin = async (newPin: string) => {
    setAdminPinState(newPin);
    await saveAppSetting('admin_pin', newPin);
  };

  const setAccountPin = async (newPin: string) => {
    setAccountPinState(newPin);
    setPinCodeState(newPin);
    await saveAppSetting('account_pin', newPin);
    await saveAppSetting('pinCode', newPin);
  };

  const setRecoveryEmail = async (email: string) => {
    const cleaned = email.trim().toLowerCase();
    setRecoveryEmailState(cleaned);
    await saveAppSetting('recovery_email', cleaned);
  };

  const recoverPinViaEmail = async (
    target: 'admin' | 'account'
  ): Promise<{ success: boolean; newPin?: string; email?: string; error?: string; message?: string }> => {
    const cleanEmail = (recoveryEmail && recoveryEmail.trim()) || '';
    if (!cleanEmail) {
      return {
        success: false,
        error: 'NO_EMAIL_LINKED',
        message: 'No recovery email has been linked yet. Please link your email in Admin Settings first.',
      };
    }

    const newPin = Math.floor(1000 + Math.random() * 9000).toString();

    // 1. Update SQLite database with new PIN
    if (target === 'admin') {
      await setAdminPin(newPin);
    } else {
      await setAccountPin(newPin);
    }

    // 2. Dispatch email via system Gmail SMTP service using Google App Password in .env
    const emailResult = await sendPinRecoveryEmail({
      target,
      newPin,
      recipientEmail: cleanEmail,
    });

    if (emailResult.success) {
      return {
        success: true,
        newPin,
        email: cleanEmail,
        message: emailResult.message || 'PIN email dispatched successfully!',
      };
    }

    return {
      success: false,
      newPin,
      email: cleanEmail,
      error: emailResult.error || 'SMTP_FAILED',
      message: emailResult.message || 'Failed to dispatch email',
    };
  };

  const linkAndRecoverPinViaEmail = async (
    target: 'admin' | 'account',
    email: string
  ): Promise<{ success: boolean; newPin?: string; email?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'INVALID_EMAIL' };
    }
    await setRecoveryEmail(cleanEmail);
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();

    if (target === 'admin') {
      await setAdminPin(newPin);
    } else {
      await setAccountPin(newPin);
    }

    const pinLabel = target === 'admin' ? 'Admin Access' : 'Account Vault';
    const subject = encodeURIComponent(`Your New ${pinLabel} PIN - Expense Tracker`);
    const body = encodeURIComponent(
      `Hello,\n\nYour recovery email has been linked and your 4-digit ${pinLabel} PIN for Expense Tracker has been successfully reset upon request.\n\nYour New PIN: ${newPin}\n\nPlease use this new PIN to unlock your ${pinLabel}.\n\n- Expense Tracker Security`
    );
    const mailtoUrl = `mailto:${cleanEmail}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      }
    } catch (e) {
      console.warn('Could not launch email client automatically', e);
    }

    return { success: true, newPin, email: cleanEmail };
  };

  const setSalaryAccountId = async (accId: string | null) => {
    const prevAccId = salaryAccountId;
    setSalaryAccountIdState(accId);
    if (accId) {
      await saveAppSetting('salary_account_id', accId);
      const acc = accounts.find((a) => a.id === accId);
      const prevAcc = accounts.find((a) => a.id === prevAccId);
      const targetMonth = selectedMonth === 'ALL' ? getCurrentMonthKey() : selectedMonth;
      setSalaries((prev) =>
        prev.map((s) => {
          if (s.month === targetMonth) {
            const updated: SalaryRecord = {
              ...s,
              accountId: acc?.id,
              accountName: acc?.name || s.accountName,
            };
            updateSalaryRecordInDB(updated);
            return updated;
          }
          return s;
        })
      );

      // Record audit log if deposit bank changed and base salary is configured
      if (prevAccId !== accId && (hasBaseSalary || salary > 0)) {
        const logItem: SalaryLog = {
          id: `sal_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          action: 'updated',
          amount: salary,
          day: baseSalaryDate || '1',
          accountName: acc?.name || 'Selected Account',
          timestamp: new Date().toISOString(),
          note: prevAcc
            ? `Deposit bank changed from ${prevAcc.name} to ${acc?.name || 'New Account'}`
            : `Deposit bank set to ${acc?.name || 'New Account'}`,
        };
        insertSalaryLog(logItem).catch(() => {});
        setSalaryLogs((prev) => [logItem, ...prev]);
      }
    } else {
      await deleteAppSetting('salary_account_id');
      if (prevAccId && (hasBaseSalary || salary > 0)) {
        const prevAcc = accounts.find((a) => a.id === prevAccId);
        const logItem: SalaryLog = {
          id: `sal_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          action: 'updated',
          amount: salary,
          day: baseSalaryDate || '1',
          accountName: 'None',
          timestamp: new Date().toISOString(),
          note: `Deposit bank removed (was ${prevAcc?.name || 'Account'})`,
        };
        insertSalaryLog(logItem).catch(() => {});
        setSalaryLogs((prev) => [logItem, ...prev]);
      }
    }
  };

  const updateSalary = (val: number) => {
    setSalary(val);
  };

  const setCurrencySymbol = (symbol: string) => {
    const clean = symbol.trim() || 'Rs.';
    setCurrencySymbolState(clean);
    saveAppSetting('currencySymbol', clean).catch((err) => {
      console.warn('Failed to save currencySymbol to SQLite:', err);
    });
  };

  const addCustomCurrency = async (symbol: string) => {
    const clean = symbol.trim();
    if (!clean) return;
    const standard = ['Rs.', '$', '₹', '€'];
    if (standard.includes(clean)) {
      setCurrencySymbol(clean);
      return;
    }
    const updated = Array.from(new Set([...customCurrencies, clean]));
    setCustomCurrencies(updated);
    await saveAppSetting('custom_currencies', JSON.stringify(updated));
    setCurrencySymbol(clean);
  };

  const removeCustomCurrency = async (symbol: string) => {
    const clean = symbol.trim();
    const updated = customCurrencies.filter((c) => c !== clean);
    setCustomCurrencies(updated);
    await saveAppSetting('custom_currencies', JSON.stringify(updated));
    if (currencySymbol === clean) {
      setCurrencySymbol('Rs.');
    }
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());

  // Helper to parse date strings into "YYYY-MM" format
  const parseMonthKey = (dateStr?: string): string | null => {
    if (!dateStr) return null;
    const str = dateStr.trim();
    if (/^\d{4}-\d{2}/.test(str)) {
      return str.substring(0, 7);
    }
    const monthsMap: Record<string, string> = {
      january: '01', jan: '01',
      february: '02', feb: '02',
      march: '03', mar: '03',
      april: '04', apr: '04',
      may: '05',
      june: '06', jun: '06',
      july: '07', jul: '07',
      august: '08', aug: '08',
      september: '09', sep: '09',
      october: '10', oct: '10',
      november: '11', nov: '11',
      december: '12', dec: '12',
    };
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
      const parts = str.split(/[\/\-]/);
      let year = parts[2];
      let month = parts[1];
      if (parts[0].length === 4) {
        year = parts[0];
        month = parts[1];
      }
      if (parseInt(month, 10) > 12) {
        month = parts[0];
      }
      const padM = month.padStart(2, '0');
      return `${year}-${padM}`;
    }
    const tokens = str.toLowerCase().split(/[\s\/\-\,]+/);
    let foundMonth: string | null = null;
    let foundYear: string | null = null;
    for (const t of tokens) {
      if (monthsMap[t]) {
        foundMonth = monthsMap[t];
      } else if (/^\d{4}$/.test(t)) {
        foundYear = t;
      }
    }
    if (foundMonth && foundYear) {
      return `${foundYear}-${foundMonth}`;
    }
    return null;
  };

  // Helper filter function
  const matchesMonth = (dateStr: string) => {
    if (selectedMonth === 'ALL') return true;
    const parsed = parseMonthKey(dateStr);
    return parsed === selectedMonth;
  };

  const parseDateToTimestamp = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const trimmed = dateStr.trim();
    const textMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{4})/);
    if (textMatch) {
      const d = parseInt(textMatch[1], 10);
      const mStr = textMatch[2].slice(0, 3).toLowerCase();
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const mIdx = months.indexOf(mStr);
      const y = parseInt(textMatch[3], 10);
      if (mIdx !== -1 && d >= 1 && d <= 31) {
        return new Date(y, mIdx, d).getTime();
      }
    }
    const isoMatch = trimmed.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (isoMatch) {
      return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10)).getTime();
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  };

  // Derive Money Lent as outgoing expenses and Money Borrowed as incoming incomes
  const lentExpenses: Expense[] = React.useMemo(() => {
    const list: Expense[] = [];
    for (const d of debts) {
      if (d.type === 'lent') {
        list.push({
          id: `debt_lent_${d.id}`,
          date: d.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          category: 'Money Lent',
          amount: d.total,
          reason: d.reason ? `Money Lent to ${d.person}: ${d.reason}` : `Money Lent to ${d.person}`,
          stored: d.account || 'Cash in Hand',
          type: 'outgoing',
        });
      } else if (d.type === 'borrowed' && Array.isArray(d.history)) {
        // User repaying borrowed debt is an outflow
        for (const h of d.history) {
          list.push({
            id: `debt_repay_exp_${h.id}`,
            date: h.date,
            category: '💸 Debt Repaid',
            amount: h.amount,
            reason: `Repayment to ${d.person}`,
            stored: h.account || d.account || 'Cash in Hand',
            type: 'outgoing',
          });
        }
      }
    }
    return list;
  }, [debts]);

  const borrowedIncomes: Income[] = React.useMemo(() => {
    const list: Income[] = [];
    for (const d of debts) {
      if (d.type === 'borrowed') {
        list.push({
          id: `debt_borrowed_${d.id}`,
          date: d.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          amount: d.total,
          stored: d.account || 'Cash in Hand',
          note: d.reason ? `Money Borrowed from ${d.person}: ${d.reason}` : `Money Borrowed from ${d.person}`,
          type: 'incoming',
        });
      } else if (d.type === 'lent' && Array.isArray(d.history)) {
        // Receiving repayment on lent debt is an inflow
        for (const h of d.history) {
          list.push({
            id: `debt_repay_inc_${h.id}`,
            date: h.date,
            amount: h.amount,
            stored: h.account || d.account || 'Cash in Hand',
            note: `Repayment from ${d.person}`,
            type: 'incoming',
          });
        }
      }
    }
    return list;
  }, [debts]);

  const allExpenses = React.useMemo(() => {
    return [...expenses, ...lentExpenses].sort((a, b) => {
      const timeDiff = parseDateToTimestamp(b.date) - parseDateToTimestamp(a.date);
      if (timeDiff !== 0) return timeDiff;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [expenses, lentExpenses]);

  const allIncomes = React.useMemo(() => {
    return [...incomes, ...borrowedIncomes].sort((a, b) => {
      const timeDiff = parseDateToTimestamp(b.date) - parseDateToTimestamp(a.date);
      if (timeDiff !== 0) return timeDiff;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [incomes, borrowedIncomes]);

  const filteredExpenses = allExpenses.filter((e) => matchesMonth(e.date));
  const filteredIncomes = allIncomes.filter((i) => matchesMonth(i.date));
  const filteredTransactions = transactions.filter((t) => matchesMonth(t.date));
  const filteredTransfers = transfers.filter((tr) => matchesMonth(tr.date));

  // Build list of unique available months (restricted to current month onwards)
  const availableMonths = React.useMemo(() => {
    const monthKeysSet = new Set<string>();
    // Always include current active month
    const currentKey = getCurrentMonthKey();
    monthKeysSet.add(currentKey);

    const addDate = (d?: string) => {
      const m = parseMonthKey(d);
      if (m && m >= currentKey) monthKeysSet.add(m);
    };

    expenses.forEach((e) => addDate(e.date));
    incomes.forEach((i) => addDate(i.date));
    debts.forEach((d) => {
      addDate(d.date);
      if (Array.isArray(d.history)) {
        d.history.forEach((h) => addDate(h.date));
      }
    });
    transactions.forEach((t) => addDate(t.date));

    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sortedKeys = Array.from(monthKeysSet)
      .filter((k) => k >= currentKey)
      .sort((a, b) => b.localeCompare(a));

    const list = sortedKeys.map((key) => {
      const [y, m] = key.split('-');
      const monthLabel = monthNames[parseInt(m, 10)] || m;
      return { key, label: `📅 ${monthLabel} ${y}` };
    });

    return [{ key: 'ALL', label: '🌐 All Time' }, ...list];
  }, [expenses, incomes, debts, transactions]);

  const setSelectedMonthSafe = (m: string) => {
    const cur = getCurrentMonthKey();
    if (m !== 'ALL' && m < cur) {
      setSelectedMonth(cur);
    } else {
      setSelectedMonth(m);
    }
  };

  // Calculations based on filtered month
  const totalSpent = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const extraIncome = filteredIncomes
    .filter((item) => item.note.toLowerCase() !== 'monthly base salary')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = filteredIncomes.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = totalIncome - totalSpent;
  const totalEnvelopesBudgeted = envelopes.reduce((sum, item) => sum + item.budgeted, 0);

  const totalNetWorth = accounts.reduce((sum, acc) => {
    return sum + acc.balance;
  }, 0);

  const isSalaryLoadedForMonth = (
    monthKey: string,
    paydayDayStr: string,
    forceList: string[] = []
  ): boolean => {
    if (!monthKey || monthKey === 'ALL') return false;
    if (forceList.includes(monthKey)) return true;

    const [y, m] = monthKey.split('-');
    const paydayDay = (paydayDayStr || '1').padStart(2, '0');
    const salaryDate = `${y}-${m}-${paydayDay}`;

    // If user is using the app for first time and base salary was before today,
    // do not add or consider loaded for anything before today's date!
    if (salaryStartDate && salaryDate < salaryStartDate) {
      return false;
    }

    const currentMonth = getCurrentMonthKey();
    if (monthKey < currentMonth) return true;
    if (monthKey > currentMonth) return false;

    // Current month: check if today's date has reached the payday day
    const payday = parseInt(paydayDayStr || '1', 10);
    const todayDay = new Date().getDate();
    return todayDay >= payday;
  };

  const activeMonthKey = selectedMonth === 'ALL' ? getCurrentMonthKey() : selectedMonth;

  const isSalaryLoaded = useMemo(() => {
    if (!hasBaseSalary || salary <= 0) return false;
    return isSalaryLoadedForMonth(activeMonthKey, baseSalaryDate, manuallyLoadedMonths);
  }, [hasBaseSalary, salary, activeMonthKey, baseSalaryDate, manuallyLoadedMonths, salaryStartDate]);

  const daysUntilPayday = useMemo(() => {
    if (!hasBaseSalary || salary <= 0) return 0;
    const currentMonth = getCurrentMonthKey();
    if (activeMonthKey < currentMonth) return 0;
    if (activeMonthKey > currentMonth) {
      const [y, m] = activeMonthKey.split('-');
      const payday = parseInt(baseSalaryDate || '1', 10);
      const targetDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, payday);
      const diff = targetDate.getTime() - new Date().getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    const payday = parseInt(baseSalaryDate || '1', 10);
    const today = new Date();
    const todayDay = today.getDate();
    if (todayDay <= payday) {
      return payday - todayDay;
    }
    // Payday already passed this month! Next payday is on next month's payday date
    const nextMonthPayday = new Date(today.getFullYear(), today.getMonth() + 1, payday);
    const diff = nextMonthPayday.getTime() - today.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [hasBaseSalary, salary, activeMonthKey, baseSalaryDate]);

  const getSalaryForMonth = useCallback(
    (monthKey: string): { amount: number; day: string; accountId?: string; accountName?: string } => {
      if (!monthKey || monthKey === 'ALL') {
        return {
          amount: salary,
          day: baseSalaryDate,
          accountId: salaryAccountId || undefined,
          accountName: accounts.find((a) => a.id === salaryAccountId)?.name || 'Cash in Hand',
        };
      }
      // 1. Direct match in salaries table for this exact month
      const exact = salaries.find((s) => s.month === monthKey);
      if (exact) {
        return {
          amount: exact.amount,
          day: exact.day,
          accountId: exact.accountId,
          accountName: exact.accountName || accounts.find((a) => a.id === exact.accountId)?.name || 'Cash in Hand',
        };
      }
      // 2. Latest salary record with month <= monthKey (salary progression over time)
      const earlier = salaries
        .filter((s) => s.month <= monthKey)
        .sort((a, b) => b.month.localeCompare(a.month));
      if (earlier.length > 0) {
        const latest = earlier[0];
        return {
          amount: latest.amount,
          day: latest.day,
          accountId: latest.accountId,
          accountName: latest.accountName || accounts.find((a) => a.id === latest.accountId)?.name || 'Cash in Hand',
        };
      }
      // 3. Fallback to current default salary settings
      return {
        amount: salary,
        day: baseSalaryDate,
        accountId: salaryAccountId || undefined,
        accountName: accounts.find((a) => a.id === salaryAccountId)?.name || 'Cash in Hand',
      };
    },
    [salaries, salary, baseSalaryDate, salaryAccountId, accounts]
  );

  const activeMonthSalary = useMemo(() => {
    if (selectedMonth === 'ALL') {
      const loadedSalaryIncomes = incomes.filter((inc) =>
        inc.note.toLowerCase().includes('monthly base salary')
      );
      if (loadedSalaryIncomes.length > 0) {
        return loadedSalaryIncomes.reduce((sum, inc) => sum + inc.amount, 0);
      }
      return salary;
    }
    return getSalaryForMonth(selectedMonth).amount;
  }, [selectedMonth, incomes, salary, getSalaryForMonth]);

  // Auto-deposit base salary into incomes & designated account on payday
  const ensureBaseSalaryIncome = (
    monthKey: string,
    salaryAmount?: number,
    day?: string,
    forceList: string[] = manuallyLoadedMonths
  ) => {
    if (!monthKey || monthKey === 'ALL') return;
    const salaryConfig = getSalaryForMonth(monthKey);
    const effectiveAmount = salaryAmount !== undefined ? salaryAmount : salaryConfig.amount;
    const effectiveDay = day || salaryConfig.day || baseSalaryDate || '1';

    if (effectiveAmount <= 0) return;
    const [y, m] = monthKey.split('-');
    const paddedDay = effectiveDay.padStart(2, '0');
    const salaryDate = `${y}-${m}-${paddedDay}`;

    const designatedAccId = salaryConfig.accountId || salaryAccountId;
    let salaryAcc = designatedAccId ? accounts.find((a) => a.id === designatedAccId) : undefined;
    if (!salaryAcc) {
      salaryAcc =
        accounts.find((a) => a.name.toLowerCase().includes('cash in hand')) ||
        accounts.find((a) => a.name.toLowerCase() === 'cash') ||
        accounts.find((a) => a.type === 'cash') ||
        accounts[0];
    }
    if (!salaryAcc) {
      const defaultCashInHand: Account = {
        id: '1',
        name: 'Cash in Hand',
        emoji: '💵',
        balance: 0,
        type: 'cash',
      };
      insertAccount(defaultCashInHand);
      setAccounts((prev) => [defaultCashInHand, ...prev]);
      salaryAcc = defaultCashInHand;
    }
    const targetAccountName = salaryAcc?.name || 'Cash in Hand';

    const isLoaded = isSalaryLoadedForMonth(monthKey, effectiveDay, forceList);

    if (!isLoaded) {
      // Salary has NOT arrived yet! Ensure NO premature salary income is logged
      setIncomes((prev) => {
        const existing = prev.find((inc) => {
          const incMonth = parseMonthKey(inc.date);
          return incMonth === monthKey && inc.note.toLowerCase().includes('monthly base salary');
        });
        if (existing) {
          removeIncome(existing.id);
          return prev.filter((i) => i.id !== existing.id);
        }
        return prev;
      });

      // If it was previously credited, reverse the account balance addition
      if (creditedSalaryMonths.includes(monthKey)) {
        if (salaryAcc) {
          const updatedAcc: Account = {
            ...salaryAcc,
            balance: Math.max(0, salaryAcc.balance - effectiveAmount),
          };
          updateAccountInDB(updatedAcc);
          setAccounts((prevAccs) =>
            prevAccs.map((a) => (a.id === salaryAcc.id ? updatedAcc : a))
          );
        }
        const txId = `salary_tx_${monthKey}`;
        removeTransaction(txId);
        setTransactions((prevTx) => prevTx.filter((t) => t.id !== txId));

        const updatedCredited = creditedSalaryMonths.filter((mk) => mk !== monthKey);
        setCreditedSalaryMonths(updatedCredited);
        saveAppSetting('credited_salary_months', JSON.stringify(updatedCredited));
      }
      return;
    }

    // Salary HAS arrived (or was force-loaded)
    // 1. Record salary record in salaries table for this month
    const existingSal = salaries.find((s) => s.month === monthKey);
    const isSameSal =
      existingSal &&
      existingSal.amount === effectiveAmount &&
      existingSal.day === effectiveDay &&
      existingSal.accountId === salaryAcc?.id &&
      existingSal.accountName === targetAccountName;

    if (!isSameSal) {
      const salaryRec: SalaryRecord = {
        id: existingSal?.id || `salary_rec_${monthKey}`,
        month: monthKey,
        amount: effectiveAmount,
        day: effectiveDay,
        accountId: salaryAcc?.id,
        accountName: targetAccountName,
        createdAt: existingSal?.createdAt || new Date().toISOString(),
      };
      insertSalaryRecord(salaryRec);
      setSalaries((prev) => {
        const found = prev.find((s) => s.month === monthKey);
        if (
          found &&
          found.amount === effectiveAmount &&
          found.day === effectiveDay &&
          found.accountId === salaryAcc?.id &&
          found.accountName === targetAccountName
        ) {
          return prev;
        }
        const filtered = prev.filter((s) => s.month !== monthKey);
        return [...filtered, salaryRec].sort((a, b) => a.month.localeCompare(b.month));
      });
    }

    // 2. Set income
    setIncomes((prev) => {
      const existing = prev.find((inc) => {
        const incMonth = parseMonthKey(inc.date);
        return incMonth === monthKey && inc.note.toLowerCase().includes('monthly base salary');
      });

      if (existing) {
        if (existing.amount === effectiveAmount && existing.date === salaryDate && existing.stored === targetAccountName) {
          return prev;
        }
        const updatedItem: Income = {
          ...existing,
          amount: effectiveAmount,
          date: salaryDate,
          stored: targetAccountName,
        };
        updateIncomeInDB(updatedItem);
        return prev.map((inc) => (inc.id === existing.id ? updatedItem : inc));
      } else {
        const newSalaryIncome: Income = {
          id: `salary_${monthKey}`,
          date: salaryDate,
          amount: effectiveAmount,
          stored: targetAccountName,
          note: 'Monthly Base Salary',
          type: 'incoming',
        };
        insertIncome(newSalaryIncome);
        return [newSalaryIncome, ...prev];
      }
    });

    // 3. Credit to designated bank account (or Cash in Hand) once per month
    const txId = `salary_tx_${monthKey}`;
    if (!creditedSalaryMonths.includes(monthKey)) {
      if (salaryAcc) {
        const updatedAcc: Account = {
          ...salaryAcc,
          balance: salaryAcc.balance + effectiveAmount,
        };
        updateAccountInDB(updatedAcc);
        setAccounts((prevAccs) =>
          prevAccs.map((a) => (a.id === salaryAcc.id ? updatedAcc : a))
        );
      }
      const newTx: Transaction = {
        id: txId,
        date: salaryDate,
        type: 'Income',
        amount: effectiveAmount,
        from: 'Employer Base Salary',
        to: targetAccountName,
        reference: 'Monthly Base Salary',
        category: '💼 Income',
        accountId: salaryAcc?.id,
      };
      insertTransaction(newTx);
      setTransactions((prevTx) => [newTx, ...prevTx.filter((t) => t.id !== txId)]);

      const newCredited = Array.from(new Set([...creditedSalaryMonths, monthKey]));
      setCreditedSalaryMonths(newCredited);
      saveAppSetting('credited_salary_months', JSON.stringify(newCredited));
    } else {
      // Already credited: if user switched salary account destination or updated amount, update balance & transaction
      const existingTx = transactions.find((t) => t.id === txId);
      if (existingTx) {
        const amtDelta = effectiveAmount - existingTx.amount;
        if (amtDelta !== 0 || existingTx.to !== targetAccountName) {
          const oldAcc = accounts.find((a) => a.name === existingTx.to || a.id === existingTx.accountId);
          if (oldAcc && salaryAcc && oldAcc.id !== salaryAcc.id) {
            const updatedOld = { ...oldAcc, balance: Math.max(0, oldAcc.balance - existingTx.amount) };
            const updatedNew = { ...salaryAcc, balance: salaryAcc.balance + effectiveAmount };
            updateAccountInDB(updatedOld);
            updateAccountInDB(updatedNew);
            setAccounts((prevAccs) =>
              prevAccs.map((a) => (a.id === updatedOld.id ? updatedOld : a.id === updatedNew.id ? updatedNew : a))
            );
          } else if (salaryAcc && amtDelta !== 0) {
            const updatedAcc = { ...salaryAcc, balance: salaryAcc.balance + amtDelta };
            updateAccountInDB(updatedAcc);
            setAccounts((prevAccs) =>
              prevAccs.map((a) => (a.id === salaryAcc.id ? updatedAcc : a))
            );
          }
          const updatedTx: Transaction = {
            ...existingTx,
            amount: effectiveAmount,
            to: targetAccountName,
            accountId: salaryAcc?.id,
          };
          updateTransactionInDB(updatedTx);
          setTransactions((prevTx) => prevTx.map((t) => (t.id === txId ? updatedTx : t)));
        }
      }
    }
  };

  const loadSalaryNow = async (targetMonthKey?: string) => {
    const mKey = targetMonthKey || activeMonthKey;
    if (!mKey || mKey === 'ALL' || salary <= 0) return;

    const updatedList = Array.from(new Set([...manuallyLoadedMonths, mKey]));
    setManuallyLoadedMonths(updatedList);
    await saveAppSetting('manually_loaded_salary_months', JSON.stringify(updatedList));

    const cfg = getSalaryForMonth(mKey);
    ensureBaseSalaryIncome(mKey, cfg.amount, cfg.day, updatedList);
  };

  useEffect(() => {
    if (isDbLoaded && hasBaseSalary && salary > 0 && selectedMonth) {
      const targetMonth = selectedMonth === 'ALL' ? getCurrentMonthKey() : selectedMonth;
      const cfg = getSalaryForMonth(targetMonth);
      ensureBaseSalaryIncome(targetMonth, cfg.amount, cfg.day, manuallyLoadedMonths);
    }
  }, [isDbLoaded, selectedMonth, hasBaseSalary, salary, baseSalaryDate, salaryAccountId, manuallyLoadedMonths, creditedSalaryMonths, salaryStartDate]);

  const configureBaseSalary = async (
    amount: number,
    dayStr: string,
    effectiveMonthKey?: string,
    designatedAccountId?: string
  ) => {
    const isEditing = hasBaseSalary === true && salary > 0;
    const previousSalary = salary;
    const previousAcc = accounts.find((a) => a.id === salaryAccountId);
    setSalary(amount);
    setHasBaseSalary(true);
    setBaseSalaryDate(dayStr);

    await saveAppSetting('salary', String(amount));
    await saveAppSetting('has_base_salary', 'true');
    await saveAppSetting('base_salary_date', dayStr);

    // If salary_start_date is not yet set, this is first-time configuration: record today's date!
    let effectiveStartDate = salaryStartDate;
    if (!effectiveStartDate) {
      const today = new Date();
      effectiveStartDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setSalaryStartDateState(effectiveStartDate);
      await saveAppSetting('salary_start_date', effectiveStartDate);
    }

    const accIdToUse = designatedAccountId || salaryAccountId;
    if (accIdToUse) {
      setSalaryAccountIdState(accIdToUse);
      await saveAppSetting('salary_account_id', accIdToUse);
    }

    const targetMonth = effectiveMonthKey || (selectedMonth === 'ALL' ? getCurrentMonthKey() : selectedMonth);
    const targetSalaryAcc = accIdToUse ? accounts.find((a) => a.id === accIdToUse) : accounts[0];
    const targetAccName = targetSalaryAcc?.name || 'Cash in Hand';
    const rec: SalaryRecord = {
      id: `salary_rec_${targetMonth}`,
      month: targetMonth,
      amount,
      day: dayStr,
      accountId: targetSalaryAcc?.id,
      accountName: targetAccName,
      createdAt: new Date().toISOString(),
    };
    await insertSalaryRecord(rec);
    setSalaries((prev) => {
      const filtered = prev.filter((s) => s.month !== targetMonth);
      return [...filtered, rec].sort((a, b) => a.month.localeCompare(b.month));
    });

    const bankChanged = isEditing && previousAcc && previousAcc.name !== targetAccName;
    const amountChanged = isEditing && previousSalary !== amount;
    let logNote = 'Base salary configured';
    if (isEditing) {
      if (amountChanged && bankChanged) {
        logNote = `Adjusted from ${currencySymbol} ${previousSalary.toLocaleString()} • Bank changed from ${previousAcc?.name || 'Account'} to ${targetAccName}`;
      } else if (bankChanged) {
        logNote = `Deposit bank changed from ${previousAcc?.name || 'Account'} to ${targetAccName}`;
      } else if (amountChanged) {
        logNote = `Adjusted from ${currencySymbol} ${previousSalary.toLocaleString()}`;
      } else {
        logNote = 'Base salary configuration updated';
      }
    }

    // Record audit log entry
    const logItem: SalaryLog = {
      id: `sal_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: isEditing ? 'updated' : 'added',
      amount,
      day: dayStr,
      accountName: targetAccName,
      timestamp: new Date().toISOString(),
      note: logNote,
    };
    insertSalaryLog(logItem).catch(() => {});
    setSalaryLogs((prev) => [logItem, ...prev]);

    ensureBaseSalaryIncome(targetMonth, amount, dayStr);
  };

  const updateSalaryRecord = async (rec: SalaryRecord) => {
    await updateSalaryRecordInDB(rec);
    setSalaries((prev) => prev.map((s) => (s.id === rec.id ? rec : s)));
    ensureBaseSalaryIncome(rec.month, rec.amount, rec.day);
  };

  const deleteSalaryRecord = async (id: string) => {
    const target = salaries.find((s) => s.id === id);
    await removeSalaryRecord(id);
    setSalaries((prev) => prev.filter((s) => s.id !== id));
    if (target) {
      setIncomes((prev) => prev.filter((i) => i.id !== `salary_${target.month}`));
      removeIncome(`salary_${target.month}`).catch(() => { });
      setTransactions((prev) => prev.filter((t) => t.id !== `salary_tx_${target.month}`));
      removeTransaction(`salary_tx_${target.month}`).catch(() => { });
    }
  };

  const setCashInHandInitialMoney = async (newInitial: number): Promise<boolean> => {
    if (hasSetInitialCash) {
      Alert.alert('Initial Money Already Set', 'Initial opening balance can only be added once.');
      return false;
    }
    const delta = newInitial - initialCashInHand;
    setInitialCashInHand(newInitial);
    setHasSetInitialCash(true);
    await saveInitialCashInHand(newInitial);

    // Directly adjust Cash in Hand account balance by the initial money delta WITHOUT creating any transaction
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.name.toLowerCase() === 'cash in hand' || acc.type === 'cash') {
          const updated = { ...acc, balance: acc.balance + delta };
          updateAccountInDB(updated);
          return updated;
        }
        return acc;
      })
    );
    return true;
  };

  const skipBaseSalary = async () => {
    const prevSalary = salary;
    const prevDay = baseSalaryDate;
    const targetSalaryAcc = accounts.find((a) => a.id === salaryAccountId) || accounts[0];
    const targetAccName = targetSalaryAcc?.name || 'Cash in Hand';

    setHasBaseSalary(false);
    setSalary(0);
    setManuallyLoadedMonths([]);
    setCreditedSalaryMonths([]);
    await saveAppSetting('has_base_salary', 'false');
    await saveAppSetting('salary', '0');
    await deleteAppSetting('manually_loaded_salary_months');
    await deleteAppSetting('credited_salary_months');

    setIncomes((prev) => {
      const toRemove = prev.filter((i) => i.note.toLowerCase().includes('monthly base salary'));
      toRemove.forEach((r) => removeIncome(r.id));
      return prev.filter((i) => !i.note.toLowerCase().includes('monthly base salary'));
    });

    // Record audit log entry for removal
    const logItem: SalaryLog = {
      id: `sal_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'removed',
      amount: prevSalary,
      day: prevDay,
      accountName: targetAccName,
      timestamp: new Date().toISOString(),
      note: 'Base salary removed by user',
    };
    insertSalaryLog(logItem).catch(() => {});
    setSalaryLogs((prev) => [logItem, ...prev]);
  };

  // Mutations
  const addIncome = (income: Omit<Income, 'id'>) => {
    const newId = Date.now().toString();
    const item: Income = { ...income, id: newId };
    setIncomes((prev) => [item, ...prev]);
    insertIncome(item);

    // Also record master transaction (every incoming money is logged in transactions)
    const targetAcc = accounts.find((a) => a.name.toLowerCase() === item.stored.toLowerCase());
    addTransaction({
      id: `tx_inc_${newId}`,
      date: item.date,
      type: 'Income',
      amount: item.amount,
      from: item.note || 'Income Source',
      to: item.stored,
      reference: item.note,
      category: '💼 Income',
      accountId: targetAcc?.id,
    });

    // Update account balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.name.toLowerCase() === item.stored.toLowerCase()) {
          const updated = { ...acc, balance: acc.balance + item.amount };
          updateAccountInDB(updated);
          return updated;
        }
        return acc;
      })
    );
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newId = Date.now().toString();
    const item: Expense = { ...expense, id: newId };
    setExpenses((prev) => [item, ...prev]);
    insertExpense(item);

    // Also record master transaction (every outgoing money is logged in transactions)
    const sourceAcc = accounts.find((a) => a.name.toLowerCase() === item.stored.toLowerCase());
    addTransaction({
      id: `tx_exp_${newId}`,
      date: item.date,
      type: 'Expense',
      amount: item.amount,
      from: item.stored,
      to: item.category,
      reference: item.reason,
      category: item.category,
      accountId: sourceAcc?.id,
    });

    // Deduct from account balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.name.toLowerCase() === item.stored.toLowerCase()) {
          const updated = { ...acc, balance: acc.balance - item.amount };
          updateAccountInDB(updated);
          return updated;
        }
        return acc;
      })
    );
  };

  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newId = Date.now().toString();
    const item = { ...cat, id: newId };
    setCategories((prev) => [...prev, item]);
    insertCategory(item);
  };

  const updateCategory = (id: string, catData: Omit<Category, 'id'>) => {
    const item = { ...catData, id };
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? item : c))
    );
    updateCategoryInDB(item);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => String(c.id) !== String(id)));
    removeCategory(id).catch((err) => console.error('Failed to remove category:', err));
  };

  const addEnvelope = (env: Omit<CashEnvelope, 'id'>) => {
    const newId = Date.now().toString();
    const item = { ...env, id: newId };
    setEnvelopes((prev) => [...prev, item]);
    insertEnvelope(item);
  };

  const updateEnvelope = (id: string, budget: number) => {
    setEnvelopes((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, budgeted: budget };
          updateEnvelopeInDB(updated);
          return updated;
        }
        return e;
      })
    );
  };

  const deleteEnvelope = (id: string) => {
    setEnvelopes((prev) => prev.filter((e) => String(e.id) !== String(id)));
    removeEnvelope(id).catch((err) => console.error('Failed to remove envelope:', err));
  };

  const addDebt = (debt: Omit<DebtItem, 'id' | 'remaining' | 'status' | 'history'>) => {
    const newId = Date.now().toString();
    const dateStr = debt.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const sourceAccount = debt.account?.trim() || accounts[0]?.name || 'Cash';
    const isLent = debt.type === 'lent';

    const item: DebtItem = {
      ...debt,
      id: newId,
      remaining: debt.total,
      status: 'Pending',
      account: sourceAccount,
      date: dateStr,
      history: [],
    };
    setDebts((prev) => [item, ...prev]);
    insertDebt(item);

    // 1. Update Account Balance:
    // When money is lent, subtract from source account!
    // When money is borrowed, add to source account!
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.name.toLowerCase() === sourceAccount.toLowerCase()) {
          const delta = isLent ? -debt.total : debt.total;
          const updated = { ...acc, balance: acc.balance + delta };
          updateAccountInDB(updated);
          return updated;
        }
        return acc;
      })
    );

    // 2. Master transaction
    const txType: TransactionType = isLent ? 'Credit Given' : 'Debt Borrowed';
    const txFrom = isLent ? sourceAccount : debt.person;
    const txTo = isLent ? debt.person : sourceAccount;
    const txReference = debt.reason?.trim()
      ? `${isLent ? 'Lent: ' : 'Borrowed: '}${debt.reason.trim()}`
      : `${isLent ? 'Money Lent to ' : 'Money Borrowed from '}${debt.person}`;
    const txCategory = isLent ? '🤝 Money Lent' : '💰 Money Borrowed';

    const sourceAccObj = accounts.find((a) => a.name.toLowerCase() === sourceAccount.toLowerCase());

    addTransaction({
      date: dateStr,
      type: txType,
      amount: debt.total,
      from: txFrom,
      to: txTo,
      reference: txReference,
      category: txCategory,
      accountId: sourceAccObj?.id,
    });
  };

  const recordInstallment = (debtId: string, amount: number, account: string, customDate?: string) => {
    const dateStr = customDate && customDate.trim()
      ? customDate.trim()
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const targetDebt = debts.find((d) => d.id === debtId);
    if (!targetDebt) return;

    const isLent = targetDebt.type === 'lent';

    // Update account balance:
    // If lent, user receives installment repayment into account -> add amount!
    // If borrowed, user pays installment out from account -> subtract amount!
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.name.toLowerCase() === account.toLowerCase()) {
          const delta = isLent ? amount : -amount;
          const updated = { ...acc, balance: acc.balance + delta };
          updateAccountInDB(updated);
          return updated;
        }
        return acc;
      })
    );

    setDebts((prev) =>
      prev.map((debt) => {
        if (debt.id !== debtId) return debt;
        const newRemaining = Math.max(0, debt.remaining - amount);
        const newStatus = newRemaining === 0 ? 'Completed' : 'Pending';
        const newPayment: InstallmentPayment = {
          id: Date.now().toString(),
          date: dateStr,
          amount,
          remaining: newRemaining,
          account,
          themeColorTag: isLent ? '#d3f2db' : '#fce4ec',
        };

        const updatedDebt = {
          ...debt,
          remaining: newRemaining,
          status: newStatus as any,
          history: [newPayment, ...debt.history],
        };
        updateDebtAndHistory(updatedDebt, newPayment);

        // Master transaction
        const sourceAccObj = accounts.find((a) => a.name.toLowerCase() === account.toLowerCase());
        addTransaction({
          date: dateStr,
          type: isLent ? 'Credit Received' : 'Debt Payment',
          amount,
          from: isLent ? debt.person : account,
          to: isLent ? account : debt.person,
          reference: `Repayment for ${debt.person}`,
          category: isLent ? '🤝 Repayment Received' : '💸 Debt Repaid',
          accountId: sourceAccObj?.id,
        });

        return updatedDebt;
      })
    );
  };

  const addWishlistItem = (item: Omit<WishlistItem, 'id' | 'isPurchased'>) => {
    const newId = Date.now().toString();
    const newItem = { ...item, id: newId, isPurchased: false };
    setWishlist((prev) => [newItem, ...prev]);
    insertWishlistItem(newItem);
  };

  const completeWishlistItem = (
    id: string,
    details: {
      completedDate: string;
      sourceAccount: string;
      deductMoney?: boolean;
    }
  ) => {
    const item = wishlist.find((w) => w.id === id);
    if (!item) return;

    let createdExpenseId: string | undefined = undefined;

    // Deduct money & log in transactions
    if (details.deductMoney !== false && item.price > 0 && details.sourceAccount) {
      const newExpId = `wish_${Date.now()}`;
      createdExpenseId = newExpId;
      const expenseItem: Expense = {
        id: newExpId,
        date: details.completedDate,
        category: 'Wishlist',
        amount: item.price,
        reason: `Wishlist: ${item.name}`,
        stored: details.sourceAccount,
        type: 'outgoing',
      };
      setExpenses((prev) => [expenseItem, ...prev]);
      insertExpense(expenseItem);

      // Log master transaction
      const sourceAcc = accounts.find((a) => a.name.toLowerCase() === details.sourceAccount.toLowerCase());
      addTransaction({
        id: `tx_exp_${newExpId}`,
        date: details.completedDate,
        type: 'Expense',
        amount: item.price,
        from: details.sourceAccount,
        to: 'Wishlist',
        reference: `Wishlist: ${item.name}`,
        category: 'Wishlist',
        accountId: sourceAcc?.id,
      });

      // Deduct account balance
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.name.toLowerCase() === details.sourceAccount.toLowerCase()) {
            const updated = { ...acc, balance: acc.balance - item.price };
            updateAccountInDB(updated);
            return updated;
          }
          return acc;
        })
      );
    }

    setWishlist((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated: WishlistItem = {
            ...w,
            isPurchased: true,
            completedDate: details.completedDate,
            sourceAccount: details.sourceAccount,
            expenseId: createdExpenseId || w.expenseId,
          };
          updateWishlistPurchased(id, true, updated.completedDate, updated.sourceAccount, updated.expenseId);
          return updated;
        }
        return w;
      })
    );
  };

  const uncompleteWishlistItem = (id: string) => {
    const item = wishlist.find((w) => w.id === id);
    if (!item) return;

    if (item.expenseId) {
      deleteExpense(item.expenseId);
    }

    setWishlist((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated: WishlistItem = {
            ...w,
            isPurchased: false,
            completedDate: undefined,
            sourceAccount: undefined,
            expenseId: undefined,
          };
          updateWishlistPurchased(id, false, undefined, undefined, undefined);
          return updated;
        }
        return w;
      })
    );
  };

  const toggleWishlistPurchased = (id: string) => {
    const item = wishlist.find((w) => w.id === id);
    if (!item) return;
    if (item.isPurchased) {
      uncompleteWishlistItem(id);
    } else {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      completeWishlistItem(id, {
        completedDate: today,
        sourceAccount: accounts[0]?.name || 'Cash in Hand',
        deductMoney: true,
      });
    }
  };

  const deleteWishlistItem = (id: string) => {
    setWishlist((prev) => prev.filter((item) => String(item.id) !== String(id)));
    removeWishlistItem(id).catch((err) => console.error('Failed to remove wishlist item:', err));
  };

  const addAccount = (account: Omit<Account, 'id'> & { id?: string }): Account => {
    const newId = account.id || Date.now().toString();
    const newItem: Account = { ...account, id: newId };
    setAccounts((prev) => [...prev, newItem]);
    insertAccount(newItem);
    return newItem;
  };

  const addTransfer = (transfer: Omit<InternalTransfer, 'id'>) => {
    const newId = Date.now().toString();
    const item: InternalTransfer = { ...transfer, id: newId };
    setTransfers((prev) => [item, ...prev]);
    insertTransfer(item);

    // Record master transaction
    addTransaction({
      date: item.date,
      type: 'Transfer',
      amount: item.amount,
      from: item.from,
      to: item.to,
      reference: item.reason,
      category: '🔄 Transfer',
    });

    // Update account balances
    setAccounts((prev) =>
      prev.map((acc) => {
        let updated = acc;
        if (acc.name.toLowerCase() === item.from.toLowerCase()) {
          updated = { ...acc, balance: acc.balance - item.amount };
        } else if (acc.name.toLowerCase() === item.to.toLowerCase()) {
          updated = { ...acc, balance: acc.balance + item.amount };
        }
        if (updated !== acc) {
          updateAccountInDB(updated);
        }
        return updated;
      })
    );
  };

  const addTransaction = (tx: Omit<Transaction, 'id'> & { id?: string }) => {
    const newId = tx.id || Date.now().toString();
    const newItem: Transaction = { ...tx, id: newId };
    setTransactions((prev) => [newItem, ...prev.filter((t) => t.id !== newId)]);
    insertTransaction(newItem);
  };

  const updateIncome = (id: string, data: Partial<Income>) => {
    const oldInc = incomes.find((i) => i.id === id);
    setIncomes((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data };
          updateIncomeInDB(updated);
          return updated;
        }
        return item;
      })
    );
    if (oldInc) {
      const newInc = { ...oldInc, ...data };
      const amtDiff = newInc.amount - oldInc.amount;
      if (amtDiff !== 0) {
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.name.toLowerCase() === newInc.stored.toLowerCase()) {
              const updated = { ...acc, balance: acc.balance + amtDiff };
              updateAccountInDB(updated);
              return updated;
            }
            return acc;
          })
        );
      }
      const txObj = transactions.find((t) => t.id === `tx_inc_${id}` || t.id === id);
      if (txObj) {
        const targetAcc = accounts.find((a) => a.name.toLowerCase() === newInc.stored.toLowerCase());
        const updatedTx: Transaction = {
          ...txObj,
          date: newInc.date,
          amount: newInc.amount,
          from: newInc.note || 'Income Source',
          to: newInc.stored,
          reference: newInc.note,
          accountId: targetAcc?.id,
        };
        updateTransactionInDB(updatedTx);
        setTransactions((prev) => prev.map((t) => (t.id === txObj.id ? updatedTx : t)));
      }
    }
  };

  const deleteIncome = (id: string) => {
    if (id.startsWith('debt_borrowed_')) {
      const debtId = id.replace('debt_borrowed_', '');
      deleteDebt(debtId);
      return;
    }
    const target = incomes.find((item) => item.id === id);
    setIncomes((prev) => prev.filter((item) => String(item.id) !== String(id)));
    removeIncome(id).catch((err) => console.error('Failed to remove income:', err));

    if (target) {
      removeTransaction(`tx_inc_${id}`).catch(() => { });
      removeTransaction(id).catch(() => { });
      setTransactions((prev) => prev.filter((t) => t.id !== `tx_inc_${id}` && t.id !== id));

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.name.toLowerCase() === target.stored.toLowerCase()) {
            const updated = { ...acc, balance: acc.balance - target.amount };
            updateAccountInDB(updated);
            return updated;
          }
          return acc;
        })
      );
    }
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    const oldExp = expenses.find((e) => e.id === id);
    setExpenses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data };
          updateExpenseInDB(updated);
          return updated;
        }
        return item;
      })
    );
    if (oldExp) {
      const newExp = { ...oldExp, ...data };
      const amtDiff = newExp.amount - oldExp.amount;
      if (amtDiff !== 0) {
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.name.toLowerCase() === newExp.stored.toLowerCase()) {
              const updated = { ...acc, balance: acc.balance - amtDiff };
              updateAccountInDB(updated);
              return updated;
            }
            return acc;
          })
        );
      }
      const txObj = transactions.find((t) => t.id === `tx_exp_${id}` || t.id === id);
      if (txObj) {
        const sourceAcc = accounts.find((a) => a.name.toLowerCase() === newExp.stored.toLowerCase());
        const updatedTx: Transaction = {
          ...txObj,
          date: newExp.date,
          amount: newExp.amount,
          from: newExp.stored,
          to: newExp.category,
          reference: newExp.reason,
          category: newExp.category,
          accountId: sourceAcc?.id,
        };
        updateTransactionInDB(updatedTx);
        setTransactions((prev) => prev.map((t) => (t.id === txObj.id ? updatedTx : t)));
      }
    }
  };

  const deleteExpense = (id: string) => {
    if (id.startsWith('debt_lent_')) {
      const debtId = id.replace('debt_lent_', '');
      deleteDebt(debtId);
      return;
    }
    const target = expenses.find((item) => item.id === id);
    setExpenses((prev) => prev.filter((item) => String(item.id) !== String(id)));
    removeExpense(id).catch((err) => console.error('Failed to remove expense:', err));

    if (target) {
      removeTransaction(`tx_exp_${id}`).catch(() => { });
      removeTransaction(id).catch(() => { });
      setTransactions((prev) => prev.filter((t) => t.id !== `tx_exp_${id}` && t.id !== id));

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.name.toLowerCase() === target.stored.toLowerCase()) {
            const updated = { ...acc, balance: acc.balance + target.amount };
            updateAccountInDB(updated);
            return updated;
          }
          return acc;
        })
      );
    }
  };

  const updateDebt = (id: string, data: Partial<DebtItem>) => {
    setDebts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data };
          updateDebtInDB(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((item) => String(item.id) !== String(id)));
    removeDebt(id).catch((err) => console.error('Failed to remove debt:', err));
  };

  const updateWishlistItem = (id: string, data: Partial<WishlistItem>) => {
    setWishlist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data };
          updateWishlistItemInDB(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const updateAccount = (id: string, data: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data };
          updateAccountInDB(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((item) => String(item.id) !== String(id)));
    if (String(salaryAccountId) === String(id)) {
      setSalaryAccountIdState(null);
      deleteAppSetting('salary_account_id').catch((err) => console.error('Failed to clear salary_account_id:', err));
    }
    removeAccount(id).catch((err) => console.error('Failed to remove account:', err));
  };

  const updateTransfer = (id: string, data: Partial<InternalTransfer>) => {
    setTransfers((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data };
          updateTransferInDB(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteTransfer = (id: string) => {
    setTransfers((prev) => prev.filter((item) => String(item.id) !== String(id)));
    removeTransfer(id).catch((err) => console.error('Failed to remove transfer:', err));
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data };
          updateTransactionInDB(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((item) => String(item.id) !== String(id)));
    removeTransaction(id).catch((err) => console.error('Failed to remove transaction:', err));
  };

  const resetPINs = async () => {
    isResettingRef.current = true;
    try {
      await clearPINsInDatabase();
      setPinCodeState('1234');
      setAdminPinState('1234');
      setAccountPinState('1234');
      setIsVaultUnlocked(false);
      setIsAdminMode(false);
      setRecoveryEmailState('');
    } finally {
      setTimeout(() => {
        isResettingRef.current = false;
      }, 500);
    }
  }

  const resetDatabase = async () => {
    isResettingRef.current = true;
    try {
      await clearAllDatabaseTables();

      const defaultCashInHand: Account = {
        id: '1',
        name: 'Cash in Hand',
        emoji: '💵',
        balance: 0,
        type: 'cash',
      };
      await insertAccount(defaultCashInHand);

      // Reset Security PINs to factory default ('1234')
      setPinCodeState('1234');
      setAdminPinState('1234');
      setAccountPinState('1234');
      setIsVaultUnlocked(false);
      setIsAdminMode(false);
      setRecoveryEmailState('');

      // Reset Appearance & Preferences
      setThemeState('kawaii');
      setStickerPackState('totoro');
      setCurrencySymbolState('Rs.');
      setCustomCurrencies([]);
      setShowMonthlyBillsState(true);

      // Reset Financial States
      setSalary(0);
      setHasBaseSalary(null);
      setBaseSalaryDate('1');
      setHasCompletedOnboarding(false);
      setIsWelcomeActive(true);
      setExpenses([]);
      setIncomes([]);
      for (const cat of INITIAL_CATEGORIES) {
        await insertCategory(cat);
      }
      setCategories(INITIAL_CATEGORIES);
      setEnvelopes([]);
      setAccounts([defaultCashInHand]);
      setDebts([]);
      setWishlist([]);
      setTransfers([]);
      setTransactions([]);
      setSalaries([]);
      setInitialCashInHand(0);
      setHasSetInitialCash(false);
      setSalaryAccountIdState(null);
      setManuallyLoadedMonths([]);
      setCreditedSalaryMonths([]);
      setSelectedMonth(getCurrentMonthKey());
    } finally {
      setTimeout(() => {
        isResettingRef.current = false;
      }, 500);
    }
  };

  const reloadAllDataFromDB = async () => {
    const defaultData = {
      theme,
      currencySymbol,
      salary: 0,
      hasBaseSalary: null,
      baseSalaryDate: '1',
      pinCode,
      adminPin: '1234',
      accountPin: '1234',
      salaryAccountId: null,
      hasCompletedOnboarding: false,
      manuallyLoadedMonths: [],
      creditedSalaryMonths: [],
      envelopes: INITIAL_ENVELOPES,
      categories: INITIAL_CATEGORIES,
      incomes: INITIAL_INCOMES,
      expenses: INITIAL_EXPENSES,
      debts: INITIAL_DEBTS,
      wishlist: INITIAL_WISHLIST,
      accounts: INITIAL_ACCOUNTS,
      transfers: INITIAL_TRANSFERS,
      transactions: INITIAL_TRANSACTIONS,
      salaries: [],
      initialCashInHand: 0,
      recoveryEmail: '',
    };
    const loaded = await loadAllData(defaultData);
    if (loaded.theme) {
      const validThemes: AppTheme[] = ['paper', 'paperDark', 'kawaii', 'dreamy', 'fresh', 'playful', 'midnight', 'noir'];
      const t = (loaded.theme === 'noir' || loaded.theme === 'paperDark') ? 'paperDark' : (validThemes.includes(loaded.theme as any) ? loaded.theme : 'kawaii');
      setThemeState(t as AppTheme);
    }
    setCurrencySymbolState(loaded.currencySymbol);
    setSalary(loaded.salary);
    setHasBaseSalary(loaded.hasBaseSalary ?? null);
    setBaseSalaryDate(loaded.baseSalaryDate || '1');
    setPinCodeState(loaded.accountPin || loaded.pinCode || '1234');
    setAdminPinState(loaded.adminPin || '1234');
    setAccountPinState(loaded.accountPin || loaded.pinCode || '1234');
    setRecoveryEmailState(loaded.recoveryEmail || '');
    setSalaryStartDateState(loaded.salaryStartDate || '');
    setSalaryAccountIdState(loaded.salaryAccountId || null);
    const isFinished = loaded.hasCompletedOnboarding ?? false;
    setHasCompletedOnboarding(isFinished);
    setIsWelcomeActive(!isFinished);
    setManuallyLoadedMonths(loaded.manuallyLoadedMonths || []);
    setCreditedSalaryMonths(loaded.creditedSalaryMonths || []);
    setEnvelopes(loaded.envelopes);
    setCategories(loaded.categories);
    setIncomes(loaded.incomes);
    setExpenses(loaded.expenses);
    setDebts(loaded.debts);
    setWishlist(loaded.wishlist);
    setAccounts(loaded.accounts);
    setTransfers(loaded.transfers);
    setTransactions(loaded.transactions);
    setSalaries(loaded.salaries || []);
    setInitialCashInHand(loaded.initialCashInHand || 0);
    setHasSetInitialCash(loaded.hasSetInitialCash || (loaded.initialCashInHand ? loaded.initialCashInHand > 0 : false));
  };

  const exportDataBackup = async (): Promise<string> => {
    return await exportAllDataAsJSON();
  };

  const importDataBackup = async (
    jsonStr: string
  ): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> => {
    const res = await importAllDataFromJSON(jsonStr);
    if (res.success) {
      await reloadAllDataFromDB();
    }
    return res;
  };

  const colors = THEMES[theme] || THEMES.kawaii;
  const stickers = THEME_STICKERS[theme] || THEME_STICKERS.kawaii;

  return (
    <FinancialContext.Provider
      value={{
        theme,
        stickerPack,
        colors,
        stickers,
        salary,
        hasBaseSalary,
        baseSalaryDate,
        salaryStartDate,
        configureBaseSalary,
        skipBaseSalary,
        salaries,
        salaryLogs,
        initialCashInHand,
        hasSetInitialCash,
        showMonthlyBills,
        setShowMonthlyBills,
        toggleShowMonthlyBills,
        activeMonthSalary,
        getSalaryForMonth,
        setCashInHandInitialMoney,
        updateSalaryRecord,
        deleteSalaryRecord,
        isDbLoaded,
        hasCompletedOnboarding,
        completeOnboarding,
        markWelcomeShown,
        isWelcomeActive,
        setIsWelcomeActive,
        isVaultUnlocked,
        isPrivacyMasked,
        pinCode,
        adminPin,
        accountPin,
        salaryAccountId,
        envelopes,
        categories,
        incomes,
        expenses,
        debts,
        wishlist,
        accounts,
        transfers,
        transactions,
        selectedMonth,
        setSelectedMonth: setSelectedMonthSafe,
        availableMonths,
        filteredExpenses,
        filteredIncomes,
        filteredTransactions,
        filteredTransfers,
        isAdminMode,
        setIsAdminMode,
        lockAdminMode,
        totalSalary: salary,
        totalSpent,
        totalIncome,
        extraIncome,
        remainingBudget,
        totalNetWorth,
        totalEnvelopesBudgeted,
        currencySymbol,
        setCurrencySymbol,
        customCurrencies,
        addCustomCurrency,
        removeCustomCurrency,
        setTheme,
        setStickerPack,
        unlockVault,
        lockVault,
        togglePrivacyMask,
        setPinCode,
        setAdminPin,
        setAccountPin,
        verifyAdminPin,
        verifyAccountPin,
        recoveryEmail,
        setRecoveryEmail,
        recoverPinViaEmail,
        linkAndRecoverPinViaEmail,
        setSalaryAccountId,
        isSalaryLoaded,
        daysUntilPayday,
        loadSalaryNow,
        updateSalary,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        addCategory,
        updateCategory,
        deleteCategory,
        addEnvelope,
        updateEnvelope,
        deleteEnvelope,
        addDebt,
        updateDebt,
        deleteDebt,
        recordInstallment,
        addWishlistItem,
        updateWishlistItem,
        toggleWishlistPurchased,
        completeWishlistItem,
        uncompleteWishlistItem,
        deleteWishlistItem,
        addAccount,
        updateAccount,
        deleteAccount,
        addTransfer,
        updateTransfer,
        deleteTransfer,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        resetDatabase,
        resetPINs,
        exportDataBackup,
        importDataBackup,
        reloadAllDataFromDB,
        isBackupModalOpen,
        backupModalMode,
        openBackupModal,
        closeBackupModal,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
