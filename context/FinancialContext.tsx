import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, THEMES, ThemeColors, THEME_STICKERS, ThemeStickers } from '@/constants/theme';

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
const INITIAL_ENVELOPES: CashEnvelope[] = [
  { id: '1', name: 'Food', emoji: '🍔', color: '#f3b06c', budgeted: 0 },
  { id: '2', name: 'Coffee', emoji: '☕', color: '#c45167', budgeted: 0 },
  { id: '3', name: 'Transport', emoji: '🚗', color: '#56a76e', budgeted: 0 },
  { id: '4', name: 'Shopping', emoji: '🛍️', color: '#f2738a', budgeted: 0 },
  { id: '5', name: 'Utilities', emoji: '🏠', color: '#7ab583', budgeted: 0 },
  { id: '6', name: 'Fun', emoji: '🍿', color: '#9d7be2', budgeted: 0 },
];

// Initial Defaults - General Expense Categories (Tags for Expenses)
const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Food', emoji: '🍔', color: '#f3b06c' },
  { id: '2', name: 'Coffee', emoji: '☕', color: '#c45167' },
  { id: '3', name: 'Transport', emoji: '🚗', color: '#56a76e' },
  { id: '4', name: 'Shopping', emoji: '🛍️', color: '#f2738a' },
  { id: '5', name: 'Utilities', emoji: '🏠', color: '#7ab583' },
  { id: '6', name: 'Fun', emoji: '🍿', color: '#9d7be2' },
  { id: '7', name: 'Salary', emoji: '💼', color: '#65a865' },
  { id: '8', name: 'Health', emoji: '💊', color: '#e06d86' },
  { id: '9', name: 'Education', emoji: '📚', color: '#5b9bd5' },
  { id: '10', name: 'Gaming', emoji: '🎮', color: '#8338ec' },
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
  setTheme: (theme: AppTheme) => void;
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
  configureBaseSalary: (amount: number, dayStr: string, effectiveMonthKey?: string) => Promise<void>;
  skipBaseSalary: () => Promise<void>;
  salaries: SalaryRecord[];
  initialCashInHand: number;
  activeMonthSalary: number;
  getSalaryForMonth: (monthKey: string) => { amount: number; day: string; accountId?: string; accountName?: string };
  setCashInHandInitialMoney: (amount: number) => Promise<void>;
  updateSalaryRecord: (rec: SalaryRecord) => Promise<void>;
  deleteSalaryRecord: (id: string) => Promise<void>;
  isDbLoaded: boolean;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  markWelcomeShown: () => Promise<void>;
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
  recordInstallment: (debtId: string, amount: number, account: string) => void;
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'isPurchased'>) => void;
  updateWishlistItem: (id: string, itemData: Partial<WishlistItem>) => void;
  toggleWishlistPurchased: (id: string) => void;
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
  exportDataBackup: () => Promise<string>;
  importDataBackup: (jsonString: string) => Promise<{ success: boolean; message: string; counts?: Record<string, number> }>;
  reloadAllDataFromDB: () => Promise<void>;
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
  saveInitialCashInHand,
} from '@/services/database';

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);
  const theme: AppTheme = 'kawaii';
  const [currencySymbol, setCurrencySymbolState] = useState<string>('$ ');
  const [salary, setSalary] = useState<number>(0);
  const [hasBaseSalary, setHasBaseSalary] = useState<boolean | null>(null);
  const [baseSalaryDate, setBaseSalaryDate] = useState<string>('1');
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [isPrivacyMasked, setIsPrivacyMasked] = useState<boolean>(false);
  const [pinCode, setPinCodeState] = useState<string>('1234');
  const [adminPin, setAdminPinState] = useState<string>('1234');
  const [accountPin, setAccountPinState] = useState<string>('1234');
  const [salaryAccountId, setSalaryAccountIdState] = useState<string | null>(null);
  const [manuallyLoadedMonths, setManuallyLoadedMonths] = useState<string[]>([]);
  const [creditedSalaryMonths, setCreditedSalaryMonths] = useState<string[]>([]);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  const lockAdminMode = () => {
    setIsAdminMode(false);
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await markWelcomeAsShown();
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
  const [initialCashInHand, setInitialCashInHand] = useState<number>(0);

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
        };
        const loaded = await initDatabase(defaultData);
        setCurrencySymbolState(loaded.currencySymbol);
        setSalary(loaded.salary);
        setHasBaseSalary(loaded.hasBaseSalary ?? null);
        setBaseSalaryDate(loaded.baseSalaryDate || '1');
        setPinCodeState(loaded.accountPin || loaded.pinCode || '1234');
        setAdminPinState(loaded.adminPin || '1234');
        setAccountPinState(loaded.accountPin || loaded.pinCode || '1234');
        setSalaryAccountIdState(loaded.salaryAccountId || null);
        setHasCompletedOnboarding(loaded.hasCompletedOnboarding ?? false);
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
        setIsDbLoaded(true);
      } catch (err) {
        console.warn('Failed to load SQLite database:', err);
      }
    })();
  }, []);

  const isResettingRef = useRef<boolean>(false);

  // Sync to SQLite database when state changes after initial boot load
  useEffect(() => {
    if (!isDbLoaded || isResettingRef.current) return;

    const stateToSave = {
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
    };
    seedDatabase(stateToSave).catch((err) => {
      console.warn('Failed to sync state to SQLite:', err);
    });
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

  const setTheme = (_t?: AppTheme) => {
    // Kawaii Pastel is the permanent fixed theme
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

  const setSalaryAccountId = async (accId: string | null) => {
    setSalaryAccountIdState(accId);
    if (accId) {
      await saveAppSetting('salary_account_id', accId);
    } else {
      await deleteAppSetting('salary_account_id');
    }
  };

  const updateSalary = (val: number) => {
    setSalary(val);
  };

  const setCurrencySymbol = (symbol: string) => {
    setCurrencySymbolState(symbol);
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

  const filteredExpenses = expenses.filter((e) => matchesMonth(e.date));
  const filteredIncomes = incomes.filter((i) => matchesMonth(i.date));
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
  }, [expenses, incomes, transactions]);

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
  }, [hasBaseSalary, salary, activeMonthKey, baseSalaryDate, manuallyLoadedMonths]);

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
    const todayDay = new Date().getDate();
    return Math.max(0, payday - todayDay);
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
    const salaryRec: SalaryRecord = {
      id: `salary_rec_${monthKey}`,
      month: monthKey,
      amount: effectiveAmount,
      day: effectiveDay,
      accountId: salaryAcc?.id,
      accountName: targetAccountName,
      createdAt: new Date().toISOString(),
    };
    insertSalaryRecord(salaryRec);
    setSalaries((prev) => {
      const filtered = prev.filter((s) => s.month !== monthKey);
      return [...filtered, salaryRec].sort((a, b) => a.month.localeCompare(b.month));
    });

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
  }, [isDbLoaded, selectedMonth, hasBaseSalary, salary, baseSalaryDate, salaryAccountId, manuallyLoadedMonths, creditedSalaryMonths, getSalaryForMonth]);

  const configureBaseSalary = async (amount: number, dayStr: string, effectiveMonthKey?: string) => {
    setSalary(amount);
    setHasBaseSalary(true);
    setBaseSalaryDate(dayStr);

    await saveAppSetting('salary', String(amount));
    await saveAppSetting('has_base_salary', 'true');
    await saveAppSetting('base_salary_date', dayStr);

    const targetMonth = effectiveMonthKey || (selectedMonth === 'ALL' ? getCurrentMonthKey() : selectedMonth);
    const targetSalaryAcc = salaryAccountId ? accounts.find((a) => a.id === salaryAccountId) : accounts[0];
    const rec: SalaryRecord = {
      id: `salary_rec_${targetMonth}`,
      month: targetMonth,
      amount,
      day: dayStr,
      accountId: targetSalaryAcc?.id,
      accountName: targetSalaryAcc?.name || 'Cash in Hand',
      createdAt: new Date().toISOString(),
    };
    await insertSalaryRecord(rec);
    setSalaries((prev) => {
      const filtered = prev.filter((s) => s.month !== targetMonth);
      return [...filtered, rec].sort((a, b) => a.month.localeCompare(b.month));
    });

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
      removeIncome(`salary_${target.month}`).catch(() => {});
      setTransactions((prev) => prev.filter((t) => t.id !== `salary_tx_${target.month}`));
      removeTransaction(`salary_tx_${target.month}`).catch(() => {});
    }
  };

  const setCashInHandInitialMoney = async (newInitial: number) => {
    const delta = newInitial - initialCashInHand;
    setInitialCashInHand(newInitial);
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
  };

  const skipBaseSalary = async () => {
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

  const recordInstallment = (debtId: string, amount: number, account: string) => {
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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

  const toggleWishlistPurchased = (id: string) => {
    setWishlist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, isPurchased: !item.isPurchased };
          updateWishlistPurchased(id, updated.isPurchased);
          return updated;
        }
        return item;
      })
    );
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
    const target = incomes.find((item) => item.id === id);
    setIncomes((prev) => prev.filter((item) => String(item.id) !== String(id)));
    removeIncome(id).catch((err) => console.error('Failed to remove income:', err));

    if (target) {
      removeTransaction(`tx_inc_${id}`).catch(() => {});
      removeTransaction(id).catch(() => {});
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
    const target = expenses.find((item) => item.id === id);
    setExpenses((prev) => prev.filter((item) => String(item.id) !== String(id)));
    removeExpense(id).catch((err) => console.error('Failed to remove expense:', err));

    if (target) {
      removeTransaction(`tx_exp_${id}`).catch(() => {});
      removeTransaction(id).catch(() => {});
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

      setSalary(0);
      setHasBaseSalary(null);
      setBaseSalaryDate('1');
      setHasCompletedOnboarding(false);
      setExpenses([]);
      setIncomes([]);
      setCategories([]);
      setEnvelopes([]);
      setAccounts([defaultCashInHand]);
      setDebts([]);
      setWishlist([]);
      setTransfers([]);
      setTransactions([]);
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
    };
    const loaded = await loadAllData(defaultData);
    setCurrencySymbolState(loaded.currencySymbol);
    setSalary(loaded.salary);
    setHasBaseSalary(loaded.hasBaseSalary ?? null);
    setBaseSalaryDate(loaded.baseSalaryDate || '1');
    setPinCodeState(loaded.accountPin || loaded.pinCode || '1234');
    setAdminPinState(loaded.adminPin || '1234');
    setAccountPinState(loaded.accountPin || loaded.pinCode || '1234');
    setSalaryAccountIdState(loaded.salaryAccountId || null);
    setHasCompletedOnboarding(loaded.hasCompletedOnboarding ?? false);
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

  const colors = THEMES[theme];
  const stickers = THEME_STICKERS[theme];

  return (
    <FinancialContext.Provider
      value={{
        theme,
        colors,
        stickers,
        salary,
        hasBaseSalary,
        baseSalaryDate,
        configureBaseSalary,
        skipBaseSalary,
        salaries,
        initialCashInHand,
        activeMonthSalary,
        getSalaryForMonth,
        setCashInHandInitialMoney,
        updateSalaryRecord,
        deleteSalaryRecord,
        isDbLoaded,
        hasCompletedOnboarding,
        completeOnboarding,
        markWelcomeShown,
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
        setTheme,
        unlockVault,
        lockVault,
        togglePrivacyMask,
        setPinCode,
        setAdminPin,
        setAccountPin,
        verifyAdminPin,
        verifyAccountPin,
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
        exportDataBackup,
        importDataBackup,
        reloadAllDataFromDB,
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
