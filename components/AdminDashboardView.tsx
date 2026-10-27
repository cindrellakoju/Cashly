import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useFinancial, Category, SalaryRecord } from '@/context/FinancialContext';
import { ThemeHeader } from './ThemeHeader';
import { AestheticModal } from './AestheticModal';
import { DatePickerFieldModal } from './DatePickerFieldModal';
import { BaseSalarySetupModal } from './BaseSalarySetupModal';
import { EmailVerificationModal } from './EmailVerificationModal';

const CURRENCY_PRESETS = [
  { symbol: 'Rs.', label: 'Rs.' },
  { symbol: '$', label: '$' },
  { symbol: '₹', label: '₹' },
  { symbol: '€', label: '€' },
  { symbol: '£', label: '£' },
  { symbol: '¥', label: '¥' },
];

export const AdminDashboardView: React.FC = () => {
  const [isAdminDatePickerOpen, setIsAdminDatePickerOpen] = useState(false);
  const [isSalaryAdminModalOpen, setIsSalaryAdminModalOpen] = useState(false);

  // Initial Money Modal State
  const [isInitialCashAdminModalOpen, setIsInitialCashAdminModalOpen] = useState(false);
  const [initialCashAdminInput, setInitialCashAdminInput] = useState('');

  // PIN Change Modal State
  const [pinChangeTarget, setPinChangeTarget] = useState<'admin' | 'account' | null>(null);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [showAdminPin, setShowAdminPin] = useState<boolean>(false);
  const [showAccountPin, setShowAccountPin] = useState<boolean>(false);
  const [pinChangeError, setPinChangeError] = useState<string>('');

  // Recovery Email Modal State
  const [isLinkEmailModalOpen, setIsLinkEmailModalOpen] = useState<boolean>(false);
  const [linkEmailInput, setLinkEmailInput] = useState<string>('');
  const [linkEmailError, setLinkEmailError] = useState<string>('');

  // Salary Bank Selection Modal State
  const [isSalaryBankModalOpen, setIsSalaryBankModalOpen] = useState<boolean>(false);

  // Currency customization states
  const [isCustomAdminCurrency, setIsCustomAdminCurrency] = useState<boolean>(false);
  const [customAdminCurrencyInput, setCustomAdminCurrencyInput] = useState<string>('');

  const {
    theme,
    setTheme,
    colors,
    selectedMonth,
    setSelectedMonth,
    salary,
    hasBaseSalary,
    baseSalaryDate,
    currencySymbol,
    setCurrencySymbol,
    adminPin,
    accountPin,
    setAdminPin,
    setAccountPin,
    salaryAccountId,
    setSalaryAccountId,
    configureBaseSalary,
    skipBaseSalary,
    salaries,
    initialCashInHand,
    setCashInHandInitialMoney,
    updateSalaryRecord,
    deleteSalaryRecord,
    expenses,
    filteredExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    incomes,
    filteredIncomes,
    addIncome,
    updateIncome,
    deleteIncome,
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    envelopes,
    addEnvelope,
    updateEnvelope,
    deleteEnvelope,
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    wishlist,
    addWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    transfers,
    addTransfer,
    updateTransfer,
    deleteTransfer,
    transactions,
    filteredTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    resetDatabase,
    exportDataBackup,
    importDataBackup,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    lockAdminMode,
    showMonthlyBills,
    setShowMonthlyBills,
    toggleShowMonthlyBills,
    recoveryEmail,
    setRecoveryEmail,
  } = useFinancial();

  const handleOpenChangePin = (target: 'admin' | 'account') => {
    setPinChangeTarget(target);
    setNewPinInput('');
    setPinChangeError('');
  };

  const handleSavePin = async () => {
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setPinChangeError('PIN must be exactly 4 digits');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (pinChangeTarget === 'admin') {
      await setAdminPin(newPinInput);
      Alert.alert('Admin PIN Updated ✨', `Your Admin Access PIN has been changed to ${newPinInput}.`);
    } else if (pinChangeTarget === 'account') {
      await setAccountPin(newPinInput);
      Alert.alert('Account PIN Updated ✨', `Your Account Vault PIN has been changed to ${newPinInput}.`);
    }

    setPinChangeTarget(null);
    setNewPinInput('');
    setPinChangeError('');
  };

  const handleWipeAllData = () => {
    const doWipe = async () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await resetDatabase();
        Alert.alert(
          'Record Wiped',
          `All records have been completely wiped.`
        );
      } catch (err: any) {
        console.error('Failed to wipe database:', err);
        Alert.alert('Wipe Failed ❌', err?.message || 'Failed to wipe database records.');
      }
    };


    Alert.alert(
      ' Wipe All Database Data?',
      'Are you sure you want to permanently delete all records?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe All Data',
          style: 'destructive',
          onPress: doWipe,
        },
      ]
    );
  };

  // JSON Backup & Restore States
  const [isExportSuccessModalOpen, setIsExportSuccessModalOpen] = useState(false);
  const [exportSummaryText, setExportSummaryText] = useState('');
  const [exportedJsonString, setExportedJsonString] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonInput, setImportJsonInput] = useState('');
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportBackup = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const jsonStr = await exportDataBackup();
      setExportedJsonString(jsonStr);

      const accCount = accounts.length;
      const expCount = expenses.length;
      const incCount = incomes.length;
      const debtCount = debts.length;
      const salCount = salaries.length;
      setExportSummaryText(`${accCount} accounts, ${expCount} expenses, ${incCount} incomes, ${salCount} salaries, ${debtCount} debts (🔒 Encrypted & Signed)`);

      const now = new Date();
      const dateTag = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `cashly_backup_${dateTag}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonStr, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Expense Tracker Backup (JSON)',
            UTI: 'public.json',
          });
        }
      }

      setIsExportSuccessModalOpen(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not export backup data.');
    }
  };

  const handlePickBackupFile = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/*', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        let fileContent = '';
        if (Platform.OS === 'web' && (asset as any).file) {
          fileContent = await (asset as any).file.text();
        } else {
          fileContent = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
        }
        setImportJsonInput(fileContent);
        setImportStatusMessage(`Loaded file: ${asset.name} (${Math.round((asset.size || fileContent.length) / 1024)} KB)`);
      }
    } catch (err: any) {
      Alert.alert('File Read Error', err?.message || 'Could not read selected file.');
    }
  };

  const handleConfirmImport = async () => {
    if (!importJsonInput.trim()) {
      Alert.alert('Empty Input', 'Please select a backup file or paste JSON data to restore.');
      return;
    }

    try {
      setIsImporting(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const result = await importDataBackup(importJsonInput.trim());

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsImportModalOpen(false);
        setImportJsonInput('');
        setImportStatusMessage(null);
        Alert.alert(
          '🎉 Restore Successful!',
          `All your previous data has been restored!\n\n${result.counts ? `${result.counts.accounts} accounts, ${result.counts.expenses} expenses, ${result.counts.incomes} incomes restored.` : ''}`
        );
      } else {
        Alert.alert('Import Failed', result.message || 'Invalid JSON backup format.');
      }
    } catch (err: any) {
      Alert.alert('Import Error', err?.message || 'Failed to restore database.');
    } finally {
      setIsImporting(false);
    }
  };
  const [activeTableTab, setActiveTableTab] = useState<
    'categories' | 'envelopes' | 'accounts' | 'expenses' | 'incomes' | 'debts' | 'wishlist' | 'transfers' | 'transactions' | 'salaries'
  >('categories');

  // Category CRUD Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('🏷️');
  const [catColor, setCatColor] = useState('#f48295');

  const colorSwatches = [
    '#f48295', '#85b885', '#ffc285', '#64ad72', '#d85c72',
    '#a685e2', '#5995e2', '#ff4d6d', '#38ef7d', '#ffd100',
  ];

  const emojiList = ['🍔', '☕', '🚗', '🛍️', '🏠', '🍿', '🎮', '✈️', '🐾', '💊', '📚', '💪', '🏷️', '💼', '💰'];

  // Generic Edit / Add Modal State
  const [genericEditModalOpen, setGenericEditModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{
    type: 'envelope' | 'account' | 'expense' | 'income' | 'debt' | 'wishlist' | 'transfer' | 'transaction' | 'salary';
    id?: string;
    isAdd?: boolean;
  } | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLabel1, setEditLabel1] = useState('Name');
  const [editField1, setEditField1] = useState('');
  const [editLabel2, setEditLabel2] = useState('Amount');
  const [editField2, setEditField2] = useState('');
  const [editLabel3, setEditLabel3] = useState('Details');
  const [editField3, setEditField3] = useState('');
  const [editLabel4, setEditLabel4] = useState('Date');
  const [editField4, setEditField4] = useState('');

  // ---------- RECURRING BILL / UTILITY ADD/EDIT ----------
  const handleOpenAddEnvelope = () => {
    setEditingTarget({ type: 'envelope', isAdd: true });
    setEditTitle('Create Recurring Monthly Bill');
    setEditLabel1('Bill / Utility Name (e.g. Electricity, Rent, Groceries)');
    setEditField1('');
    setEditLabel2(`Expected Monthly Budget (${currencySymbol})`);
    setEditField2('');
    setEditLabel3('Icon Emoji');
    setEditField3('⚡');
    setEditLabel4('');
    setEditField4('');
    setGenericEditModalOpen(true);
  };
  const handleOpenEditEnvelope = (env: any) => {
    setEditingTarget({ type: 'envelope', id: env.id, isAdd: false });
    setEditTitle(`Edit Recurring Bill: ${env.name}`);
    setEditLabel1('Bill / Utility Name');
    setEditField1(env.name);
    setEditLabel2(`Expected Monthly Budget (${currencySymbol})`);
    setEditField2(env.budgeted.toString());
    setEditLabel3('Icon Emoji');
    setEditField3(env.emoji);
    setEditLabel4('');
    setEditField4('');
    setGenericEditModalOpen(true);
  };

  // ---------- ACCOUNT ADD/EDIT ----------
  const handleOpenAddAccount = () => {
    setEditingTarget({ type: 'account', isAdd: true });
    setEditTitle('Create New Account');
    setEditLabel1('Account Name');
    setEditField1('');
    setEditLabel2(`Initial Balance (${currencySymbol})`);
    setEditField2('10000');
    setEditLabel3('Emoji Icon');
    setEditField3('💳');
    setEditLabel4('');
    setEditField4('');
    setGenericEditModalOpen(true);
  };
  const handleOpenEditAccount = (acc: any) => {
    setEditingTarget({ type: 'account', id: acc.id, isAdd: false });
    setEditTitle(`Edit Account: ${acc.name}`);
    setEditLabel1('Account Name');
    setEditField1(acc.name);
    setEditLabel2(`Current Balance (${currencySymbol})`);
    setEditField2(acc.balance.toString());
    setEditLabel3('Emoji Icon');
    setEditField3(acc.emoji);
    setEditLabel4('');
    setEditField4('');
    setGenericEditModalOpen(true);
  };

  // ---------- EXPENSE ADD/EDIT ----------
  const handleOpenAddExpense = () => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    setEditingTarget({ type: 'expense', isAdd: true });
    setEditTitle('Create New Expense Record');
    setEditLabel1('Reason / Description');
    setEditField1('');
    setEditLabel2(`Amount (${currencySymbol})`);
    setEditField2('250');
    setEditLabel3('Category Tag');
    setEditField3(categories[0]?.name || '🍔 Food & Dining');
    setEditLabel4('Date (e.g. 15 Jul 2026 or 2026-07-15)');
    setEditField4(today);
    setGenericEditModalOpen(true);
  };
  const handleOpenEditExpense = (exp: any) => {
    setEditingTarget({ type: 'expense', id: exp.id, isAdd: false });
    setEditTitle(`Edit Expense: ${exp.reason}`);
    setEditLabel1('Reason / Note');
    setEditField1(exp.reason);
    setEditLabel2(`Amount (${currencySymbol})`);
    setEditField2(exp.amount.toString());
    setEditLabel3('Category Tag');
    setEditField3(exp.category);
    setEditLabel4('Date (e.g. 15 Jul 2026 or 2026-07-15)');
    setEditField4(exp.date || '');
    setGenericEditModalOpen(true);
  };

  // ---------- INCOME ADD/EDIT ----------
  const handleOpenAddIncome = () => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    setEditingTarget({ type: 'income', isAdd: true });
    setEditTitle('Create New Income Record');
    setEditLabel1('Income Note / Source');
    setEditField1('');
    setEditLabel2(`Amount (${currencySymbol})`);
    setEditField2('5000');
    setEditLabel3('Stored Account');
    setEditField3(accounts[0]?.name || 'Bank Account');
    setEditLabel4('Date (e.g. 15 Jul 2026 or 2026-07-15)');
    setEditField4(today);
    setGenericEditModalOpen(true);
  };
  const handleOpenEditIncome = (inc: any) => {
    setEditingTarget({ type: 'income', id: inc.id, isAdd: false });
    setEditTitle(`Edit Income: ${inc.note}`);
    setEditLabel1('Income Note / Source');
    setEditField1(inc.note);
    setEditLabel2(`Amount (${currencySymbol})`);
    setEditField2(inc.amount.toString());
    setEditLabel3('Stored Account');
    setEditField3(inc.stored);
    setEditLabel4('Date (e.g. 15 Jul 2026 or 2026-07-15)');
    setEditField4(inc.date || '');
    setGenericEditModalOpen(true);
  };

  // ---------- DEBT ADD/EDIT ----------
  const handleOpenAddDebt = () => {
    setEditingTarget({ type: 'debt', isAdd: true });
    setEditTitle('Create New Debt Record');
    setEditLabel1('Person Name');
    setEditField1('');
    setEditLabel2(`Total Debt (${currencySymbol})`);
    setEditField2('1000');
    setEditLabel3('Debt Type (borrowed / lent)');
    setEditField3('lent');
    setEditLabel4('');
    setEditField4('');
    setGenericEditModalOpen(true);
  };
  const handleOpenEditDebt = (debt: any) => {
    setEditingTarget({ type: 'debt', id: debt.id, isAdd: false });
    setEditTitle(`Edit Debt: ${debt.person}`);
    setEditLabel1('Person Name');
    setEditField1(debt.person);
    setEditLabel2(`Total Amount (${currencySymbol})`);
    setEditField2(debt.total.toString());
    setEditLabel3(`Remaining Balance (${currencySymbol})`);
    setEditField3(debt.remaining.toString());
    setEditLabel4('');
    setEditField4('');
    setGenericEditModalOpen(true);
  };

  // ---------- WISHLIST ADD/EDIT ----------
  const handleOpenAddWishlist = () => {
    setEditingTarget({ type: 'wishlist', isAdd: true });
    setEditTitle('Create Wishlist Item');
    setEditLabel1('Item Name');
    setEditField1('');
    setEditLabel2(`Target Price (${currencySymbol})`);
    setEditField2('3000');
    setEditLabel3('Priority (High Priority / Med Priority / Low Priority)');
    setEditField3('Med Priority');
    setEditLabel4('');
    setEditField4('');
    setGenericEditModalOpen(true);
  };
  const handleOpenEditWishlist = (item: any) => {
    setEditingTarget({ type: 'wishlist', id: item.id, isAdd: false });
    setEditTitle(`Edit Wishlist: ${item.name}`);
    setEditLabel1('Item Name');
    setEditField1(item.name);
    setEditLabel2(`Target Price (${currencySymbol})`);
    setEditField2(item.price.toString());
    setEditLabel3('Priority Tag');
    setEditField3(item.priority);
    setEditLabel4('');
    setEditField4('');
    setGenericEditModalOpen(true);
  };

  // ---------- TRANSFER ADD/EDIT ----------
  const handleOpenAddTransfer = () => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    setEditingTarget({ type: 'transfer', isAdd: true });
    setEditTitle('Create Account Transfer');
    setEditLabel1('Reason / Memo');
    setEditField1('Internal Savings Transfer');
    setEditLabel2(`Transfer Amount (${currencySymbol})`);
    setEditField2('2000');
    setEditLabel3('From Account');
    setEditField3(accounts[0]?.name || 'Bank Account');
    setEditLabel4('Date (e.g. 15 Jul 2026 or 2026-07-15)');
    setEditField4(today);
    setGenericEditModalOpen(true);
  };
  const handleOpenEditTransfer = (tr: any) => {
    setEditingTarget({ type: 'transfer', id: tr.id, isAdd: false });
    setEditTitle(`Edit Transfer: ${tr.reason}`);
    setEditLabel1('Reason / Memo');
    setEditField1(tr.reason);
    setEditLabel2(`Transfer Amount (${currencySymbol})`);
    setEditField2(tr.amount.toString());
    setEditLabel3('From Account');
    setEditField3(tr.from);
    setEditLabel4('Date (e.g. 15 Jul 2026 or 2026-07-15)');
    setEditField4(tr.date || '');
    setGenericEditModalOpen(true);
  };

  // ---------- TRANSACTION ADD/EDIT ----------
  const handleOpenAddTransaction = () => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    setEditingTarget({ type: 'transaction', isAdd: true });
    setEditTitle('Create Transaction Record');
    setEditLabel1('Reference / Description');
    setEditField1('Manual Entry Log');
    setEditLabel2(`Amount (${currencySymbol})`);
    setEditField2('500');
    setEditLabel3('Category Tag');
    setEditField3('General');
    setEditLabel4('Date (e.g. 15 Jul 2026 or 2026-07-15)');
    setEditField4(today);
    setGenericEditModalOpen(true);
  };
  const handleOpenEditTransaction = (tx: any) => {
    setEditingTarget({ type: 'transaction', id: tx.id, isAdd: false });
    setEditTitle(`Edit Transaction Log`);
    setEditLabel1('Reference / Description');
    setEditField1(tx.reference || tx.type);
    setEditLabel2(`Amount (${currencySymbol})`);
    setEditField2(tx.amount.toString());
    setEditLabel3('Category Tag');
    setEditField3(tx.category);
    setEditLabel4('Date (e.g. 15 Jul 2026 or 2026-07-15)');
    setEditField4(tx.date || '');
    setGenericEditModalOpen(true);
  };

  // ---------- SALARY RECORD ADD/EDIT ----------
  const handleOpenAddSalary = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    setEditingTarget({ type: 'salary', isAdd: true });
    setEditTitle('Record Monthly Salary');
    setEditLabel1('Month (YYYY-MM)');
    setEditField1(currentMonth);
    setEditLabel2(`Salary Amount (${currencySymbol})`);
    setEditField2(salary > 0 ? String(salary) : '50000');
    setEditLabel3('Payday Day of Month (1-31)');
    setEditField3(baseSalaryDate || '1');
    setEditLabel4('Destination Bank / Account');
    const matched = accounts.find((a) => a.id === salaryAccountId) || accounts[0];
    setEditField4(matched?.name || 'Cash in Hand');
    setGenericEditModalOpen(true);
  };

  const handleOpenEditSalary = (sal: SalaryRecord) => {
    setEditingTarget({ type: 'salary', id: sal.id, isAdd: false });
    setEditTitle(`Edit Salary Record: ${sal.month}`);
    setEditLabel1('Month (YYYY-MM)');
    setEditField1(sal.month);
    setEditLabel2(`Salary Amount (${currencySymbol})`);
    setEditField2(String(sal.amount));
    setEditLabel3('Payday Day of Month (1-31)');
    setEditField3(sal.day);
    setEditLabel4('Destination Bank / Account');
    setEditField4(sal.accountName || accounts.find((a) => a.id === sal.accountId)?.name || 'Cash in Hand');
    setGenericEditModalOpen(true);
  };

  const handleCloseGenericModal = () => {
    setEditField1('');
    setEditField2('');
    setEditField3('');
    setEditField4('');
    setEditingTarget(null);
    setGenericEditModalOpen(false);
  };

  const handleSaveGenericEdit = async () => {
    if (!editingTarget) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const numVal2 = parseFloat(editField2) || 0;
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const recDate = editField4.trim() || today;

    if (editingTarget.isAdd) {
      if (editingTarget.type === 'envelope') {
        addEnvelope({ name: editField1 || 'Recurring Bill', emoji: editField3 || '⚡', color: '#f48295', budgeted: numVal2 });
      } else if (editingTarget.type === 'account') {
        addAccount({ name: editField1 || 'Account', emoji: editField3 || '💳', balance: numVal2, type: 'bank' });
      } else if (editingTarget.type === 'expense') {
        addExpense({ date: recDate, amount: numVal2, reason: editField1 || 'Expense', category: editField3 || 'General', stored: accounts[0]?.name || 'Bank', type: 'outgoing' });
      } else if (editingTarget.type === 'income') {
        addIncome({ date: recDate, amount: numVal2, note: editField1 || 'Income', stored: editField3 || accounts[0]?.name || 'Bank', type: 'incoming' });
      } else if (editingTarget.type === 'debt') {
        addDebt({ person: editField1 || 'Person', emoji: '🤝', total: numVal2, type: editField3.includes('borrow') ? 'borrowed' : 'lent' });
      } else if (editingTarget.type === 'wishlist') {
        addWishlistItem({ name: editField1 || 'Wish Item', emoji: '🎁', price: numVal2, priority: (editField3 as any) || 'Med Priority', targetDate: recDate });
      } else if (editingTarget.type === 'transfer') {
        addTransfer({ date: recDate, from: editField3 || accounts[0]?.name || 'Bank', fromEmoji: '💳', to: accounts[1]?.name || 'Savings', toEmoji: '🏦', amount: numVal2, reason: editField1 || 'Transfer' });
      } else if (editingTarget.type === 'transaction') {
        addTransaction({ date: recDate, type: 'Expense', amount: numVal2, from: 'Bank', to: 'Merchant', reference: editField1 || 'Log', category: editField3 || 'General' });
      } else if (editingTarget.type === 'salary') {
        const monthKey = editField1.trim() || new Date().toISOString().slice(0, 7);
        const dayStr = editField3.trim() || '1';
        const targetAcc = accounts.find((a) => a.name.toLowerCase() === editField4.trim().toLowerCase() || a.id === editField4.trim());
        await configureBaseSalary(numVal2, dayStr, monthKey);
        if (targetAcc) {
          await setSalaryAccountId(targetAcc.id);
        }
      }
    } else if (editingTarget.id) {
      if (editingTarget.type === 'envelope') {
        updateEnvelope(editingTarget.id, numVal2);
      } else if (editingTarget.type === 'account') {
        updateAccount(editingTarget.id, { name: editField1, balance: numVal2, emoji: editField3 });
      } else if (editingTarget.type === 'expense') {
        updateExpense(editingTarget.id, { date: recDate, reason: editField1, amount: numVal2, category: editField3 });
      } else if (editingTarget.type === 'income') {
        updateIncome(editingTarget.id, { date: recDate, note: editField1, amount: numVal2, stored: editField3 });
      } else if (editingTarget.type === 'debt') {
        const numVal3 = parseFloat(editField3) || 0;
        updateDebt(editingTarget.id, { person: editField1, total: numVal2, remaining: numVal3 });
      } else if (editingTarget.type === 'wishlist') {
        updateWishlistItem(editingTarget.id, { name: editField1, price: numVal2, priority: editField3 as any });
      } else if (editingTarget.type === 'transfer') {
        updateTransfer(editingTarget.id, { date: recDate, reason: editField1, amount: numVal2, from: editField3 });
      } else if (editingTarget.type === 'transaction') {
        updateTransaction(editingTarget.id, { date: recDate, reference: editField1, amount: numVal2, category: editField3 });
      } else if (editingTarget.type === 'salary') {
        const targetAcc = accounts.find((a) => a.name.toLowerCase() === editField4.trim().toLowerCase() || a.id === editField4.trim());
        await updateSalaryRecord({
          id: editingTarget.id,
          month: editField1.trim(),
          amount: numVal2,
          day: editField3.trim() || '1',
          accountId: targetAcc ? targetAcc.id : undefined,
          accountName: targetAcc ? targetAcc.name : (editField4.trim() || undefined),
          createdAt: new Date().toISOString(),
        });
      }
    }

    handleCloseGenericModal();
  };

  const handleOpenAddCategory = () => {
    setEditingCatId(null);
    setCatName('');
    setCatEmoji('🏷️');
    setCatColor('#f48295');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    const cleanName = cat.name.replace(/^[\p{Emoji}\s]+/u, '').trim() || cat.name;
    setCatName(cleanName);
    setCatEmoji(cat.emoji || '🏷️');
    setCatColor(cat.color || '#f48295');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = () => {
    if (!catName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const fullName = `${catEmoji} ${catName.trim()}`;

    if (editingCatId) {
      updateCategory(editingCatId, {
        name: fullName,
        emoji: catEmoji,
        color: catColor,
      });
    } else {
      addCategory({
        name: fullName,
        emoji: catEmoji,
        color: catColor,
      });
    }
    setIsCategoryModalOpen(false);
  };

  const handleConfirmDelete = (
    title: string,
    message: string,
    deleteAction: () => void | Promise<void>
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const doDelete = async () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await deleteAction();
      } catch (err: any) {
        console.error('Delete action failed:', err);
        if (Platform.OS === 'web') {
          window.alert(`Delete Failed ❌: ${err?.message || 'Could not delete item.'}`);
        } else {
          Alert.alert('Delete Failed ❌', err?.message || 'Could not delete item.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        doDelete();
      }
      return;
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: doDelete,
        },
      ]
    );
  };

  const handleDeleteCategory = (cat: Category) => {
    handleConfirmDelete(
      'Delete Category Tag?',
      `Are you sure you want to delete category "${cat.name}"?`,
      () => deleteCategory(cat.id)
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <ThemeHeader
        title="Admin Control Panel 🛠️"
        subtitle="Manage database tables & inspect system storage"
        stickerKey="vault"
      />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* 🎨 App Theme & Style Configuration Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.textMain,
                      flex: 1,
                      flexShrink: 1,
                    },
                  ]}
                >
                  App Theme & Style
                </Text>
                <View
                  style={{
                    backgroundColor: colors.primaryAccentLight || '#fff4e6',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: colors.primaryAccent,
                    }}
                    numberOfLines={1}
                  >
                    ACTIVE: {theme === 'kawaii' ? '🌸 KAWAII' : '🕶️ NOIR B&W'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {/* Kawaii Option */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await setTheme('kawaii');
              }}
              style={[
                styles.themeChoiceCard,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: theme === 'kawaii' ? colors.primaryAccent : colors.borderSoft,
                  borderWidth: theme === 'kawaii' ? 2 : 1,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 24 }}>🌸</Text>
                {theme === 'kawaii' ? (
                  <View style={[styles.activePillSmall, { backgroundColor: colors.primaryGreenLight || '#e4f5e4' }]}>
                    <Text style={[styles.activePillSmallText, { color: colors.primaryGreen }]}>ACTIVE</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.themeChoiceName, { color: colors.textMain }]}>Pastel</Text>
            </TouchableOpacity>

            {/* Noir Monochrome Option */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await setTheme('noir');
              }}
              style={[
                styles.themeChoiceCard,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: theme === 'noir' ? colors.primaryAccent : colors.borderSoft,
                  borderWidth: theme === 'noir' ? 2 : 1,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 24 }}>🕶️</Text>
                {theme === 'noir' ? (
                  <View style={[styles.activePillSmall, { backgroundColor: colors.primaryGreenLight || '#142e1b' }]}>
                    <Text style={[styles.activePillSmallText, { color: colors.primaryGreen }]}>ACTIVE</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.themeChoiceName, { color: colors.textMain }]}>Monochrome</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 💱 Currency Metric & Symbol Configuration Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.textMain,
                      flex: 1,
                      flexShrink: 1,
                    },
                  ]}
                >
                  Currency Metric & Symbol
                </Text>
                <View
                  style={{
                    backgroundColor: colors.primaryAccentLight || '#fff4e6',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: colors.primaryAccent,
                    }}
                    numberOfLines={1}
                  >
                    ACTIVE: {currencySymbol}
                  </Text>
                </View>
              </View>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginTop: 4 }]}>
                Select the unit and display metric used across dashboards, recurring bills, ledgers, and transactions.
              </Text>
            </View>
          </View>

          <View style={styles.currencyAdminChipsRow}>
            {CURRENCY_PRESETS.map((item) => {
              const isSelected = !isCustomAdminCurrency && currencySymbol === item.symbol;
              return (
                <TouchableOpacity
                  key={item.symbol}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsCustomAdminCurrency(false);
                    await setCurrencySymbol(item.symbol);
                  }}
                  style={[
                    styles.currencyAdminChip,
                    {
                      backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary,
                      borderColor: isSelected ? colors.primaryAccent : colors.borderSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyAdminChipText,
                      { color: isSelected ? colors.textOnAccent : colors.textMain },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsCustomAdminCurrency(true);
                setCustomAdminCurrencyInput(
                  CURRENCY_PRESETS.some((c) => c.symbol === currencySymbol) ? '' : currencySymbol
                );
              }}
              style={[
                styles.currencyAdminChip,
                {
                  backgroundColor: isCustomAdminCurrency ? colors.primaryAccent : colors.bgSecondary,
                  borderColor: isCustomAdminCurrency ? colors.primaryAccent : colors.borderSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.currencyAdminChipText,
                  { color: isCustomAdminCurrency ? colors.textOnAccent : colors.textMain },
                ]}
              >
                Custom...
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomAdminCurrency && (
            <View style={styles.customAdminCurrencyRow}>
              <TextInput
                style={[
                  styles.customAdminCurrencyInput,
                  {
                    backgroundColor: colors.bgSecondary,
                    color: colors.textMain,
                    borderColor: colors.borderSoft,
                  },
                ]}
                value={customAdminCurrencyInput}
                onChangeText={setCustomAdminCurrencyInput}
                placeholder="e.g. NPR, USD, CHF, ৳"
                placeholderTextColor={colors.textMuted}
                maxLength={6}
              />
              <TouchableOpacity
                onPress={async () => {
                  if (customAdminCurrencyInput.trim()) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await setCurrencySymbol(customAdminCurrencyInput.trim());
                    Alert.alert('Currency Updated', `Active metric updated to "${customAdminCurrencyInput.trim()}"`);
                  }
                }}
                style={[
                  styles.customAdminCurrencySaveBtn,
                  { backgroundColor: colors.primaryAccent },
                ]}
              >
                <Text style={[styles.customAdminCurrencySaveBtnText, { color: colors.textOnAccent }]}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 💼 Base Salary Administration Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.textMain,
                      flex: 1,
                      flexShrink: 1,
                    },
                  ]}
                >
                  Base Salary Configuration
                </Text>
                <View
                  style={{
                    backgroundColor: hasBaseSalary ? colors.primaryGreenLight : colors.bgSecondary,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: hasBaseSalary ? colors.primaryGreen : colors.textMuted,
                    }}
                    numberOfLines={1}
                  >
                    {hasBaseSalary ? 'ACTIVE 🟢' : 'DISABLED ⚪'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginTop: 4 }]}>
                {hasBaseSalary
                  ? `Auto-deposits ${currencySymbol} ${salary.toLocaleString()} into your Income on day ${baseSalaryDate} every month.`
                  : 'No fixed base salary configured.'}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginTop: 4 }]}>
                {!hasBaseSalary && (`Salary are logged directly as Total Income`)}
              </Text>

            </View>
          </View>

          {hasBaseSalary ? (
            <View>
              <View style={styles.salaryAdminDetailsRow}>
                <View style={[styles.salaryAdminStat, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                  <Text style={[styles.salaryAdminStatLabel, { color: colors.textMuted }]}>Monthly Salary</Text>
                  <Text style={[styles.salaryAdminStatVal, { color: colors.textMain }]}>{currencySymbol} {salary.toLocaleString()}</Text>
                </View>
                <View style={[styles.salaryAdminStat, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                  <Text style={[styles.salaryAdminStatLabel, { color: colors.textMuted }]}>Payday Date</Text>
                  <Text style={[styles.salaryAdminStatVal, { color: colors.primaryGreen }]}>
                    {baseSalaryDate ? `${baseSalaryDate}th of month` : '1st of month'}
                  </Text>
                </View>
              </View>
              {/* Salary Bank Destination Selection */}
              <View style={[styles.salaryBankRow, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.salaryBankLabel, { color: colors.textMuted }]}>Salary Deposit Bank Account</Text>
                  <Text style={[styles.salaryBankVal, { color: colors.textMain }]}>
                    {accounts.find((a) => a.id === salaryAccountId)?.name || 'Not Designated (Cash in Hand)'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsSalaryBankModalOpen(true)}
                  style={[styles.selectBankBtn, { backgroundColor: colors.primaryAccentLight }]}
                >
                  <Text style={[styles.selectBankBtnText, { color: colors.primaryAccent }]}>Choose Bank 💼</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}


          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsSalaryAdminModalOpen(true);
              }}
              style={[
                styles.inspectDbBtn,
                {
                  flex: 1,
                  backgroundColor: colors.primaryAccent,
                  borderColor: colors.borderAccent || colors.primaryAccent,
                },
              ]}
            >
              <Text
                style={[
                  styles.inspectDbBtnText,
                  { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') },
                ]}
              >
                {hasBaseSalary ? 'Edit Salary & Payday' : 'Add Base Salary'}
              </Text>
            </TouchableOpacity>

            {hasBaseSalary && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Remove Base Salary?',
                    'This will switch your dashboard to track Total Income directly and stop auto-depositing monthly base salary.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                          await skipBaseSalary();
                        },
                      },
                    ]
                  );
                }}
                style={[
                  styles.inspectDbBtn,
                  {
                    flex: 0.8,
                    backgroundColor: colors.dangerLight || '#FFEBEB',
                    borderColor: colors.danger,
                  },
                ]}
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.inspectDbBtnText, { color: colors.danger }]}>Remove Salary</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Salary History Over Time */}
          <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.borderSoft }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>
                  Salary Change History
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  Track when your salary changed and how much it was
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleOpenAddSalary}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                  backgroundColor: colors.primaryAccentLight || '#fff4e6',
                }}
              >
                <Ionicons name="add-circle" size={13} color={colors.primaryAccent} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryAccent }}>Add Month</Text>
              </TouchableOpacity>
            </View>

            {salaries.length === 0 ? (
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.bgSecondary, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>No salary timeline records stored yet.</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {[...salaries].sort((a, b) => b.month.localeCompare(a.month)).map((sal) => (
                  <View
                    key={sal.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: colors.bgSecondary,
                      borderWidth: 1,
                      borderColor: colors.borderSoft,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textMain }}>{sal.month}</Text>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.primaryGreenLight || '#eaf4eb' }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primaryGreen }}>Day {sal.day}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                        {sal.accountName || accounts.find((a) => a.id === sal.accountId)?.name || 'Cash in Hand'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primaryGreen }}>
                        {currencySymbol} {sal.amount.toLocaleString()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleOpenEditSalary(sal)}
                        style={[styles.actionIconButton, { backgroundColor: colors.bgCard, width: 28, height: 28 }]}
                      >
                        <Ionicons name="pencil" size={13} color={colors.textMain} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() =>
                          handleConfirmDelete(
                            'Delete Salary Record? 💼',
                            `Remove salary entry for ${sal.month} (${currencySymbol} ${sal.amount.toLocaleString()})?`,
                            () => deleteSalaryRecord(sal.id)
                          )
                        }
                        style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB', width: 28, height: 28 }]}
                      >
                        <Ionicons name="trash-outline" size={13} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 🔐 Security & PIN Management Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.textMain }]}> Security & PIN Settings</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Manage PIN codes for Admin Access and Account Vault
              </Text>
            </View>
          </View>

          <View style={styles.pinCardsContainer}>
            {/* Admin PIN Box */}
            <View style={[styles.pinBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
              <View style={styles.pinBoxHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.pinBoxTitle, { color: colors.textMain }]}>Admin PIN</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAdminPin(!showAdminPin)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showAdminPin ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.pinDisplayValue, { color: colors.primaryAccent }]}>
                {showAdminPin ? adminPin : '••••'}
              </Text>

              <TouchableOpacity
                onPress={() => handleOpenChangePin('admin')}
                style={[styles.changePinBtn, { backgroundColor: colors.primaryAccent }]}
              >
                <Text style={[styles.changePinBtnText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
                  Change Admin PIN
                </Text>
              </TouchableOpacity>
            </View>

            {/* Account PIN Box */}
            <View style={[styles.pinBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
              <View style={styles.pinBoxHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.pinBoxTitle, { color: colors.textMain }]}>Account PIN</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAccountPin(!showAccountPin)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showAccountPin ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.pinDisplayValue, { color: colors.primaryGreen }]}>
                {showAccountPin ? accountPin : '••••'}
              </Text>

              <TouchableOpacity
                onPress={() => handleOpenChangePin('account')}
                style={[styles.changePinBtn, { backgroundColor: colors.primaryGreen }]}
              >
                <Text style={[styles.changePinBtnText, { color: theme === 'kawaii' ? '#ffffff' : '#121214' }]}>
                  Change Account PIN
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ✉️ Recovery Email Management Box */}
          <View
            style={[
              styles.recoveryEmailBox,
              {
                backgroundColor: colors.bgSecondary,
                borderColor: colors.borderSoft,
              },
            ]}
          >
            <View style={styles.recoveryEmailHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text style={{ fontSize: 16 }}>✉️</Text>
                <Text style={[styles.recoveryEmailTitle, { color: colors.textMain }]}>
                  Recovery Email
                </Text>
              </View>
              <View
                style={[
                  styles.recoveryStatusBadge,
                  {
                    backgroundColor: recoveryEmail ? (colors.primaryGreenLight || '#e4f5e4') : colors.bgCard,
                    borderColor: recoveryEmail ? colors.primaryGreen : colors.borderSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.recoveryStatusText,
                    { color: recoveryEmail ? colors.primaryGreen : colors.textMuted },
                  ]}
                >
                  {recoveryEmail ? 'LINKED ' : 'NOT LINKED'}
                </Text>
              </View>
            </View>

            <Text style={[styles.recoveryEmailSubtitle, { color: colors.textMuted }]}>
              {recoveryEmail
                ? `Linked: ${recoveryEmail}. Used to recover forgotten Admin and Account PINs.`
                : 'Link an email to recover your Admin or Account PIN if forgotten'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsLinkEmailModalOpen(true);
                }}
                style={[styles.linkEmailBtn, { backgroundColor: colors.primaryAccent, flex: 1 }]}
              >
                <Ionicons name="mail" size={14} color={colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')} />
                <Text style={[styles.linkEmailBtnText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
                  {recoveryEmail ? 'Change Recovery Email' : 'Link Recovery Email'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Monthly Recurring Bills & Utilities Visibility Control Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.textMain, flexShrink: 1 },
                  ]}
                >
                  Recurring Bills & Utilities
                </Text>

                <View
                  style={{
                    backgroundColor: showMonthlyBills
                      ? (colors.primaryGreenLight || '#e4f5e4')
                      : (colors.dangerLight || '#FFEBEB'),
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: showMonthlyBills ? colors.primaryGreen : colors.danger,
                      letterSpacing: 0.5,
                    }}
                  >
                    {showMonthlyBills ? 'ACTIVE' : 'HIDDEN'}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textMuted, marginTop: 4 },
                ]}
              >
                Control whether the Monthly Recurring Bills & Utilities card (Rent,
                Electricity, Groceries, etc.) is shown or hidden across the app.
              </Text>
            </View>
          </View>

          {/* Button below the description */}
          <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleShowMonthlyBills();
              }}
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: showMonthlyBills
                  ? colors.primaryAccent
                  : colors.bgCard,
                borderWidth: 1,
                borderColor: showMonthlyBills
                  ? colors.primaryAccent
                  : colors.borderSoft,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Ionicons
                name={showMonthlyBills ? 'eye' : 'eye-off'}
                size={16}
                color={showMonthlyBills ? colors.textOnAccent : colors.textMain}
              />

              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: showMonthlyBills ? colors.textOnAccent : colors.textMain,
                  textAlign: 'center',
                }}
              >
                {showMonthlyBills ? 'Showing' : 'Hidden'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🗃️ Master Admin Database CRUD Table Explorer */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Manage Records</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Viewing, editing, and deleting saved records
              </Text>
            </View>
          </View>

          {/* Horizontal Table Switcher Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {[
              { key: 'categories', label: 'Categories' },
              { key: 'envelopes', label: showMonthlyBills ? 'Recurring Bills' : 'Recurring Bills (Hidden)' },
              { key: 'accounts', label: 'Accounts' },
              { key: 'expenses', label: 'Expenses' },
              { key: 'incomes', label: 'Incomes' },
              { key: 'debts', label: 'Debts' },
              { key: 'wishlist', label: 'Wishlist' },
              { key: 'transfers', label: 'Transfers' },
              { key: 'transactions', label: 'Log Transactions' },
              { key: 'salaries', label: 'Salaries' },
            ].map((tab) => {
              const isSelected = activeTableTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTableTab(tab.key as any);
                  }}
                  style={[
                    styles.choiceChip,
                    {
                      backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary,
                      borderColor: isSelected ? colors.borderAccent : colors.borderSoft,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? colors.textOnAccent : colors.textMain, fontWeight: isSelected ? '800' : '600' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ----------------- TABLE 1: CATEGORIES ----------------- */}
          {activeTableTab === 'categories' && (
            <View>
              <View style={styles.tableHeaderRowAction}>
                <Text style={[styles.tableSubHeader, { color: colors.textMuted }]}>Categories ({categories.length})</Text>
                <TouchableOpacity onPress={handleOpenAddCategory} style={[styles.addCatBtn, { backgroundColor: colors.primaryAccent }]}>
                  <Ionicons name="add-circle" size={14} color={colors.textOnAccent} />
                  <Text style={[styles.addCatBtnText, { color: colors.textOnAccent }]}>Add Tag</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.colHeader, { flex: 1, color: colors.textMuted }]}>EMOJI</Text>
                <Text style={[styles.colHeader, { flex: 3, color: colors.textMuted }]}>NAME</Text>
                <Text style={[styles.colHeader, { flex: 1.5, color: colors.textMuted, textAlign: 'center' }]}>COLOR</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {categories.map((cat) => (
                <View key={cat.id} style={[styles.tableRow, { borderBottomColor: colors.borderSoft }]}>
                  <Text style={{ flex: 1, fontSize: 18 }}>{cat.emoji || '🏷️'}</Text>
                  <Text style={[styles.themeName, { flex: 3, color: colors.textMain }]} numberOfLines={1}>{cat.name}</Text>
                  <View style={{ flex: 1.5, alignItems: 'center' }}>
                    <View style={[styles.colorSwatch, { backgroundColor: cat.color || '#f48295' }]} />
                  </View>
                  <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleOpenEditCategory(cat)} style={[styles.actionIconButton, { backgroundColor: colors.bgSecondary }]}>
                      <Ionicons name="pencil" size={14} color={colors.textMain} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => handleDeleteCategory(cat)}
                      style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB' }]}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ----------------- TABLE 2: RECURRING BILLS & UTILITIES ----------------- */}
          {activeTableTab === 'envelopes' && (
            <View>
              <View style={styles.tableHeaderRowAction}>
                <Text style={[styles.tableSubHeader, { color: colors.textMuted, flex: 1, flexShrink: 1, marginRight: 8 }]}>Monthly Recurring Bills & Utilities ({envelopes.length})</Text>
                <TouchableOpacity onPress={handleOpenAddEnvelope} style={[styles.addCatBtn, { backgroundColor: colors.primaryAccent, flexShrink: 0 }]}>
                  <Ionicons name="add-circle" size={14} color={colors.textOnAccent} />
                  <Text style={[styles.addCatBtnText, { color: colors.textOnAccent }]}>Add Recurring Bill</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Visibility Switch Banner inside Table */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: colors.bgSecondary,
                  borderRadius: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.borderSoft,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexShrink: 1 }}>
                  <Ionicons
                    name={showMonthlyBills ? 'eye-outline' : 'eye-off-outline'}
                    size={15}
                    color={showMonthlyBills ? colors.primaryGreen : colors.danger}
                  />
                  <Text style={{ fontSize: 11, color: colors.textMuted, flexShrink: 1 }} numberOfLines={1}>
                    Dashboard: <Text style={{ fontWeight: '800', color: showMonthlyBills ? colors.primaryGreen : colors.danger }}>{showMonthlyBills ? 'Visible to Users' : 'Hidden from Users'}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleShowMonthlyBills();
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                    backgroundColor: showMonthlyBills ? colors.bgCard : colors.primaryAccent,
                    borderWidth: 1,
                    borderColor: showMonthlyBills ? colors.borderSoft : colors.primaryAccent,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: showMonthlyBills ? colors.textMain : colors.textOnAccent,
                    }}
                  >
                    {showMonthlyBills ? 'Hide on Dashboard' : 'Show on Dashboard'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.colHeader, { flex: 1, color: colors.textMuted }]}>EMOJI</Text>
                <Text style={[styles.colHeader, { flex: 2.5, color: colors.textMuted }]}>BILL / UTILITY</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>MONTHLY BUDGET</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {envelopes.map((env) => (
                <View key={env.id} style={[styles.tableRow, { borderBottomColor: colors.borderSoft }]}>
                  <Text style={{ flex: 1, fontSize: 18 }}>{env.emoji || '⚡'}</Text>
                  <Text style={[styles.themeName, { flex: 2.5, color: colors.textMain }]} numberOfLines={1}>{env.name}</Text>
                  <Text style={{ flex: 2, fontSize: 12, fontWeight: '700', color: colors.primaryGreen }}>{currencySymbol} {env.budgeted.toLocaleString()}</Text>
                  <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleOpenEditEnvelope(env)} style={[styles.actionIconButton, { backgroundColor: colors.bgSecondary }]}>
                      <Ionicons name="pencil" size={14} color={colors.textMain} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() =>
                        handleConfirmDelete(
                          'Delete Recurring Bill? ⚡',
                          `Are you sure you want to delete recurring bill "${env.name}" (Budget: ${currencySymbol} ${env.budgeted.toLocaleString()})?`,
                          () => deleteEnvelope(env.id)
                        )
                      }
                      style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB' }]}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ----------------- TABLE 3: ACCOUNTS ----------------- */}
          {activeTableTab === 'accounts' && (
            <View>
              <View style={styles.tableHeaderRowAction}>
                <Text style={[styles.tableSubHeader, { color: colors.textMuted }]}>Accounts ({accounts.length})</Text>
                <TouchableOpacity onPress={handleOpenAddAccount} style={[styles.addCatBtn, { backgroundColor: colors.primaryAccent }]}>
                  <Ionicons name="add-circle" size={14} color={colors.textOnAccent} />
                  <Text style={[styles.addCatBtnText, { color: colors.textOnAccent }]}>Add Account</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.colHeader, { flex: 1, color: colors.textMuted }]}>EMOJI</Text>
                <Text style={[styles.colHeader, { flex: 2.5, color: colors.textMuted }]}>NAME</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>BALANCE</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {accounts.map((acc) => (
                <View key={acc.id} style={[styles.tableRow, { borderBottomColor: colors.borderSoft }]}>
                  <Text style={{ flex: 1, fontSize: 18 }}>{acc.emoji || '💳'}</Text>
                  <View style={{ flex: 2.5 }}>
                    <Text style={[styles.themeName, { color: colors.textMain }]} numberOfLines={1}>{acc.name}</Text>
                    {acc.name.toLowerCase().includes('cash') && (
                      <TouchableOpacity
                        onPress={() => {
                          setInitialCashAdminInput(initialCashInHand > 0 ? String(initialCashInHand) : (acc.balance > 0 ? String(acc.balance) : ''));
                          setIsInitialCashAdminModalOpen(true);
                        }}
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: colors.primaryGreenLight || '#eaf4eb',
                          marginTop: 2,
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primaryGreen }}>
                          💵 Initial: {currencySymbol} {initialCashInHand.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={{ flex: 2, fontSize: 12, fontWeight: '700', color: acc.balance >= 0 ? colors.primaryGreen : colors.danger }}>
                    {currencySymbol} {acc.balance.toLocaleString()}
                  </Text>
                  <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleOpenEditAccount(acc)} style={[styles.actionIconButton, { backgroundColor: colors.bgSecondary }]}>
                      <Ionicons name="pencil" size={14} color={colors.textMain} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() =>
                        handleConfirmDelete(
                          'Delete Linked Account? 💳',
                          `Are you sure you want to delete account "${acc.name}" (Balance: ${currencySymbol} ${acc.balance.toLocaleString()})?`,
                          () => deleteAccount(acc.id)
                        )
                      }
                      style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB' }]}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ----------------- TABLE 4: EXPENSES ----------------- */}
          {activeTableTab === 'expenses' && (
            <View>
              <View style={styles.tableHeaderRowAction}>
                <Text style={[styles.tableSubHeader, { color: colors.textMuted }]}>
                  Expenses ({filteredExpenses.length}{selectedMonth !== 'ALL' ? ` • ${selectedMonth}` : ' Total'})
                </Text>
                <TouchableOpacity onPress={handleOpenAddExpense} style={[styles.addCatBtn, { backgroundColor: colors.primaryAccent }]}>
                  <Ionicons name="add-circle" size={14} color={colors.textOnAccent} />
                  <Text style={[styles.addCatBtnText, { color: colors.textOnAccent }]}>Add Expense</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>DATE</Text>
                <Text style={[styles.colHeader, { flex: 3, color: colors.textMuted }]}>REASON/CATEGORY</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>AMOUNT</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {filteredExpenses.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    No expenses found for {selectedMonth === 'ALL' ? 'any date' : selectedMonth}.
                  </Text>
                </View>
              ) : (
                filteredExpenses.map((exp) => {
                  const linkedBill = exp.recurringBillId ? envelopes.find((b) => b.id === exp.recurringBillId) : null;
                  const catObj = categories.find((c) => c.name.toLowerCase() === exp.category.toLowerCase());
                  const catEmoji = catObj?.emoji || '🏷️';
                  return (
                    <View key={exp.id} style={[styles.tableRow, { borderBottomColor: colors.borderSoft }]}>
                      <Text style={{ flex: 2, fontSize: 11, color: colors.textMuted }}>{exp.date}</Text>
                      <View style={{ flex: 3 }}>
                        <Text style={[styles.themeName, { color: colors.textMain }]} numberOfLines={1}>{exp.reason}</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>
                          {catEmoji} {exp.category} {linkedBill ? `• ⚡ ${linkedBill.name}` : ''}
                        </Text>
                      </View>
                      <Text style={{ flex: 2, fontSize: 12, fontWeight: '700', color: colors.danger }}>-{currencySymbol} {exp.amount.toLocaleString()}</Text>
                      <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                        <TouchableOpacity onPress={() => handleOpenEditExpense(exp)} style={[styles.actionIconButton, { backgroundColor: colors.bgSecondary }]}>
                          <Ionicons name="pencil" size={14} color={colors.textMain} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          onPress={() =>
                            handleConfirmDelete(
                              'Delete Expense Record? 💸',
                              `Are you sure you want to delete expense "${exp.reason}" (-${currencySymbol} ${exp.amount.toLocaleString()})?`,
                              () => deleteExpense(exp.id)
                            )
                          }
                          style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB' }]}
                        >
                          <Ionicons name="trash-outline" size={15} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ----------------- TABLE 5: INCOMES ----------------- */}
          {activeTableTab === 'incomes' && (
            <View>
              <View style={styles.tableHeaderRowAction}>
                <Text style={[styles.tableSubHeader, { color: colors.textMuted }]}>
                  Incomes ({filteredIncomes.length}{selectedMonth !== 'ALL' ? ` • ${selectedMonth}` : ' Total'})
                </Text>
                <TouchableOpacity onPress={handleOpenAddIncome} style={[styles.addCatBtn, { backgroundColor: colors.primaryAccent }]}>
                  <Ionicons name="add-circle" size={14} color={colors.textOnAccent} />
                  <Text style={[styles.addCatBtnText, { color: colors.textOnAccent }]}>Add Income</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>DATE</Text>
                <Text style={[styles.colHeader, { flex: 3, color: colors.textMuted }]}>NOTE / STORED</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>AMOUNT</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {filteredIncomes.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    No incomes found for {selectedMonth === 'ALL' ? 'any date' : selectedMonth}.
                  </Text>
                </View>
              ) : (
                filteredIncomes.map((inc) => (
                  <View key={inc.id} style={[styles.tableRow, { borderBottomColor: colors.borderSoft }]}>
                    <Text style={{ flex: 2, fontSize: 11, color: colors.textMuted }}>{inc.date}</Text>
                    <View style={{ flex: 3 }}>
                      <Text style={[styles.themeName, { color: colors.textMain }]} numberOfLines={1}>{inc.note}</Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>{inc.stored}</Text>
                    </View>
                    <Text style={{ flex: 2, fontSize: 12, fontWeight: '700', color: colors.primaryGreen }}>+{currencySymbol} {inc.amount.toLocaleString()}</Text>
                    <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                      <TouchableOpacity onPress={() => handleOpenEditIncome(inc)} style={[styles.actionIconButton, { backgroundColor: colors.bgSecondary }]}>
                        <Ionicons name="pencil" size={14} color={colors.textMain} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() =>
                          handleConfirmDelete(
                            'Delete Income Record? 💰',
                            `Are you sure you want to delete income "${inc.note}" (+${currencySymbol} ${inc.amount.toLocaleString()})?`,
                            () => deleteIncome(inc.id)
                          )
                        }
                        style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB' }]}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ----------------- TABLE 6: DEBTS ----------------- */}
          {activeTableTab === 'debts' && (
            <View>
              <View style={styles.tableHeaderRowAction}>
                <Text style={[styles.tableSubHeader, { color: colors.textMuted }]}>Debts ({debts.length})</Text>
                <TouchableOpacity onPress={handleOpenAddDebt} style={[styles.addCatBtn, { backgroundColor: colors.primaryAccent }]}>
                  <Ionicons name="add-circle" size={14} color={colors.textOnAccent} />
                  <Text style={[styles.addCatBtnText, { color: colors.textOnAccent }]}>Add Debt</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.colHeader, { flex: 3, color: colors.textMuted }]}>PERSON</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>TOTAL</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>REMAINING</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {debts.map((d) => (
                <View key={d.id} style={[styles.tableRow, { borderBottomColor: colors.borderSoft }]}>
                  <View style={{ flex: 3 }}>
                    <Text style={[styles.themeName, { color: colors.textMain }]} numberOfLines={1}>{d.emoji} {d.person}</Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>
                      {d.type} • {d.status}{d.account ? ` • ${d.account}` : ''}{d.reason ? ` • "${d.reason}"` : ''}
                    </Text>
                  </View>
                  <Text style={{ flex: 2, fontSize: 11, fontWeight: '600', color: colors.textMain }}>{currencySymbol} {d.total.toLocaleString()}</Text>
                  <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: d.remaining === 0 ? colors.primaryGreen : colors.danger }}>{currencySymbol} {d.remaining.toLocaleString()}</Text>
                  <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleOpenEditDebt(d)} style={[styles.actionIconButton, { backgroundColor: colors.bgSecondary }]}>
                      <Ionicons name="pencil" size={14} color={colors.textMain} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() =>
                        handleConfirmDelete(
                          'Delete Debt Record? 🤝',
                          `Are you sure you want to delete debt record for "${d.person}" (${currencySymbol} ${d.total.toLocaleString()})?`,
                          () => deleteDebt(d.id)
                        )
                      }
                      style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB' }]}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ----------------- TABLE 7: WISHLIST ----------------- */}
          {activeTableTab === 'wishlist' && (
            <View>
              <View style={styles.tableHeaderRowAction}>
                <Text style={[styles.tableSubHeader, { color: colors.textMuted }]}>Wishlist ({wishlist.length})</Text>
                <TouchableOpacity onPress={handleOpenAddWishlist} style={[styles.addCatBtn, { backgroundColor: colors.primaryAccent }]}>
                  <Ionicons name="add-circle" size={14} color={colors.textOnAccent} />
                  <Text style={[styles.addCatBtnText, { color: colors.textOnAccent }]}>Add Wish Item</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.colHeader, { flex: 3, color: colors.textMuted }]}>ITEM</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>PRICE</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>PRIORITY</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {wishlist.map((w) => (
                <View key={w.id} style={[styles.tableRow, { borderBottomColor: colors.borderSoft }]}>
                  <Text style={[styles.themeName, { flex: 3, color: colors.textMain }]} numberOfLines={1}>{w.emoji} {w.name}</Text>
                  <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: colors.primaryAccent }}>{currencySymbol} {w.price.toLocaleString()}</Text>
                  <Text style={{ flex: 2, fontSize: 10, color: colors.textMuted }}>{w.priority}</Text>
                  <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleOpenEditWishlist(w)} style={[styles.actionIconButton, { backgroundColor: colors.bgSecondary }]}>
                      <Ionicons name="pencil" size={14} color={colors.textMain} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() =>
                        handleConfirmDelete(
                          'Delete Wishlist Item? 🎁',
                          `Are you sure you want to delete wishlist item "${w.name}" (${currencySymbol} ${w.price.toLocaleString()})?`,
                          () => deleteWishlistItem(w.id)
                        )
                      }
                      style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB' }]}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ----------------- TABLE 8: TRANSFERS ----------------- */}
          {activeTableTab === 'transfers' && (
            <View>
              <View style={styles.tableHeaderRowAction}>
                <Text style={[styles.tableSubHeader, { color: colors.textMuted }]}>Internal Transfers ({transfers.length})</Text>
                <TouchableOpacity onPress={handleOpenAddTransfer} style={[styles.addCatBtn, { backgroundColor: colors.primaryAccent }]}>
                  <Ionicons name="add-circle" size={14} color={colors.textOnAccent} />
                  <Text style={[styles.addCatBtnText, { color: colors.textOnAccent }]}>Add Transfer</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>DATE</Text>
                <Text style={[styles.colHeader, { flex: 3, color: colors.textMuted }]}>FROM ➔ TO</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>AMOUNT</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {transfers.map((tr) => (
                <View key={tr.id} style={[styles.tableRow, { borderBottomColor: colors.borderSoft }]}>
                  <Text style={{ flex: 2, fontSize: 10, color: colors.textMuted }}>{tr.date}</Text>
                  <Text style={[styles.themeName, { flex: 3, color: colors.textMain }]} numberOfLines={1}>{tr.from} ➔ {tr.to}</Text>
                  <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: colors.primaryAccent }}>{currencySymbol} {tr.amount.toLocaleString()}</Text>
                  <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleOpenEditTransfer(tr)} style={[styles.actionIconButton, { backgroundColor: colors.bgSecondary }]}>
                      <Ionicons name="pencil" size={14} color={colors.textMain} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() =>
                        handleConfirmDelete(
                          'Delete Transfer Record? 🔄',
                          `Are you sure you want to delete transfer "${tr.from} ➔ ${tr.to}" (${currencySymbol} ${tr.amount.toLocaleString()})?`,
                          () => deleteTransfer(tr.id)
                        )
                      }
                      style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB' }]}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ----------------- TABLE 9: TRANSACTIONS ----------------- */}
          {activeTableTab === 'transactions' && (
            <View>
              <View style={styles.tableHeaderRowAction}>
                <Text style={[styles.tableSubHeader, { color: colors.textMuted }]}>
                  Transaction Master Log ({filteredTransactions.length}{selectedMonth !== 'ALL' ? ` • ${selectedMonth}` : ' Total'})
                </Text>
                <TouchableOpacity onPress={handleOpenAddTransaction} style={[styles.addCatBtn, { backgroundColor: colors.primaryAccent }]}>
                  <Ionicons name="add-circle" size={14} color={colors.textOnAccent} />
                  <Text style={[styles.addCatBtnText, { color: colors.textOnAccent }]}>Add Log</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>DATE</Text>
                <Text style={[styles.colHeader, { flex: 3, color: colors.textMuted }]}>REFERENCE / TYPE</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>AMOUNT</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {filteredTransactions.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    No transactions found for {selectedMonth === 'ALL' ? 'any date' : selectedMonth}.
                  </Text>
                </View>
              ) : (
                filteredTransactions.map((tx) => (
                  <View key={tx.id} style={[styles.tableRow, { borderBottomColor: colors.borderSoft }]}>
                    <Text style={{ flex: 2, fontSize: 10, color: colors.textMuted }}>{tx.date}</Text>
                    <View style={{ flex: 3 }}>
                      <Text style={[styles.themeName, { color: colors.textMain }]} numberOfLines={1}>{tx.reference || tx.type}</Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>{tx.type} • {tx.category}</Text>
                    </View>
                    <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: colors.textMain }}>{currencySymbol} {tx.amount.toLocaleString()}</Text>
                    <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                      <TouchableOpacity onPress={() => handleOpenEditTransaction(tx)} style={[styles.actionIconButton, { backgroundColor: colors.bgSecondary }]}>
                        <Ionicons name="pencil" size={14} color={colors.textMain} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() =>
                          handleConfirmDelete(
                            'Delete Transaction Log? 📜',
                            `Are you sure you want to delete transaction "${tx.reference || tx.type}" (${currencySymbol} ${tx.amount.toLocaleString()})?`,
                            () => deleteTransaction(tx.id)
                          )
                        }
                        style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB' }]}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ----------------- TABLE 10: SALARIES ----------------- */}
          {activeTableTab === 'salaries' && (
            <View>
              <View style={styles.tableHeaderRowAction}>
                <Text style={[styles.tableSubHeader, { color: colors.textMuted }]}>Monthly Salaries ({salaries.length})</Text>
                <TouchableOpacity onPress={handleOpenAddSalary} style={[styles.addCatBtn, { backgroundColor: colors.primaryAccent }]}>
                  <Ionicons name="add-circle" size={14} color={colors.textOnAccent} />
                  <Text style={[styles.addCatBtnText, { color: colors.textOnAccent }]}>Add Salary</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>MONTH</Text>
                <Text style={[styles.colHeader, { flex: 1.5, color: colors.textMuted }]}>DAY</Text>
                <Text style={[styles.colHeader, { flex: 2.5, color: colors.textMuted }]}>AMOUNT</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {[...salaries].sort((a, b) => b.month.localeCompare(a.month)).map((sal) => (
                <View key={sal.id} style={[styles.tableRow, { borderBottomColor: colors.borderSoft }]}>
                  <Text style={{ flex: 2, fontSize: 12, fontWeight: '700', color: colors.textMain }}>{sal.month}</Text>
                  <Text style={{ flex: 1.5, fontSize: 11, color: colors.textMuted }}>Day {sal.day}</Text>
                  <View style={{ flex: 2.5 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primaryGreen }}>
                      {currencySymbol} {sal.amount.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>
                      {sal.accountName || accounts.find((a) => a.id === sal.accountId)?.name || 'Cash in Hand'}
                    </Text>
                  </View>
                  <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleOpenEditSalary(sal)} style={[styles.actionIconButton, { backgroundColor: colors.bgSecondary }]}>
                      <Ionicons name="pencil" size={14} color={colors.textMain} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() =>
                        handleConfirmDelete(
                          'Delete Salary Record? 💼',
                          `Are you sure you want to delete salary for month "${sal.month}" (${currencySymbol} ${sal.amount.toLocaleString()})?`,
                          () => deleteSalaryRecord(sal.id)
                        )
                      }
                      style={[styles.actionIconButton, { backgroundColor: colors.dangerLight || '#FFEBEB' }]}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 🗄️ Database & System Statistics Table */}
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Saved Data Summary</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              View the number of saved accounts, expenses, income records, and other app data.
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
              <Text style={[styles.statNumber, { color: colors.primaryAccent }]}>{expenses.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Expenses Records</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
              <Text style={[styles.statNumber, { color: colors.primaryAccent }]}>{incomes.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Incomes Records</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
              <Text style={[styles.statNumber, { color: colors.primaryAccent }]}>{accounts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Linked Accounts</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
              <Text style={[styles.statNumber, { color: colors.primaryAccent }]}>{debts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Debt Items</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
              <Text style={[styles.statNumber, { color: colors.primaryAccent }]}>{salaries.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Salary History</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
              <Text style={[styles.statNumber, { color: colors.primaryGreen }]}>{currencySymbol} {initialCashInHand.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Cash in Hand Initial</Text>
            </View>
          </View>

          {/* 📦 JSON Backup & Restore for Mobile Device Transfer */}
          <View style={{ marginTop: 14 }}>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginBottom: 8 }]}>
              Transfer previous data to a new mobile or save a JSON backup:
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleExportBackup}
                style={[
                  styles.inspectDbBtn,
                  {
                    flex: 1,
                    backgroundColor: colors.primaryGreenLight || '#eaf4eb',
                    borderColor: colors.primaryGreen,
                  },
                ]}
              >
                <Ionicons name="cloud-upload" size={16} color={colors.primaryGreen} />
                <Text style={[styles.inspectDbBtnText, { color: colors.primaryGreen }]}>Export JSON</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsImportModalOpen(true)}
                style={[
                  styles.inspectDbBtn,
                  {
                    flex: 1,
                    backgroundColor: colors.primaryAccentLight || '#fff4e6',
                    borderColor: colors.primaryAccent,
                  },
                ]}
              >
                <Ionicons name="cloud-download" size={16} color={colors.activeTabTint || colors.textMain} />
                <Text style={[styles.inspectDbBtnText, { color: colors.activeTabTint || colors.textMain }]}>Import JSON </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Wipe Database Action */}
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity
              onPress={handleWipeAllData}
              style={[styles.inspectDbBtn, { width: '100%', backgroundColor: colors.dangerLight || '#FFEBEB', borderColor: colors.danger }]}
            >
              <Ionicons name="trash" size={16} color={colors.danger} />
              <Text style={[styles.inspectDbBtnText, { color: colors.danger }]}>Wipe All Records (Factory Reset)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add / Edit Category Modal (Admin Only) */}
        <AestheticModal
          visible={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title={editingCatId ? 'Edit Category Tag' : 'Create Category Tag'}
        >
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMain }]}>Category Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
              placeholder="e.g. Travel, Gym, Gaming"
              placeholderTextColor={colors.textMuted}
              value={catName}
              onChangeText={setCatName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMain }]}>Icon / Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {emojiList.map((em) => {
                const isSelected = catEmoji === em;
                return (
                  <TouchableOpacity
                    key={em}
                    onPress={() => setCatEmoji(em)}
                    style={[
                      styles.choiceChip,
                      { backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{em}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMain }]}>Tag Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {colorSwatches.map((c) => {
                const isSelected = catColor === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCatColor(c)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c, borderColor: isSelected ? colors.textMain : 'transparent' },
                    ]}
                  />
                );
              })}
            </ScrollView>
          </View>

          <TouchableOpacity
            onPress={handleSaveCategory}
            style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
          >
            <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
              {editingCatId ? 'Update Category ' : 'Create Category '}
            </Text>
          </TouchableOpacity>
        </AestheticModal>

        {/* Generic Table Record Edit Modal (Admin Only) */}
        <AestheticModal
          visible={genericEditModalOpen}
          onClose={handleCloseGenericModal}
          title={editTitle}
        >
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMain }]}>{editLabel1}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
              value={editField1}
              onChangeText={setEditField1}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMain }]}>{editLabel2}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
              keyboardType="numeric"
              value={editField2}
              onChangeText={setEditField2}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMain }]}>{editLabel3}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
              value={editField3}
              onChangeText={setEditField3}
            />
          </View>

          {!!editLabel4 && (
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMain }]}>{editLabel4}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
                  value={editField4}
                  onChangeText={setEditField4}
                  placeholder="e.g. 15 Jul 2026 or 2026-07-15"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity
                  onPress={() => setIsAdminDatePickerOpen(true)}
                  style={{ padding: 12, borderRadius: 14, backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.borderSoft }}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.primaryAccent} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSaveGenericEdit}
            style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
          >
            <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
              Save Changes ✏️
            </Text>
          </TouchableOpacity>
        </AestheticModal>

        {/* Date Picker Selector Modal */}
        <DatePickerFieldModal
          visible={isAdminDatePickerOpen}
          onClose={() => setIsAdminDatePickerOpen(false)}
          onSelectDate={(formattedDate) => setEditField4(formattedDate)}
        />

        {/* JSON Backup Export Modal */}
        <AestheticModal
          visible={isExportSuccessModalOpen}
          onClose={() => setIsExportSuccessModalOpen(false)}
          title="Encrypted Backup Exported!"
        >
          <View style={{ paddingVertical: 4 }}>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  const now = new Date();
                  const dateTag = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
                  const fileName = `cashly_backup_${dateTag}.json`;

                  if (Platform.OS === 'web') {
                    const blob = new Blob([exportedJsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    a.click();
                    URL.revokeObjectURL(url);
                  } else {
                    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
                    await FileSystem.writeAsStringAsync(fileUri, exportedJsonString, { encoding: FileSystem.EncodingType.UTF8 });
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(fileUri, {
                        mimeType: 'application/json',
                        dialogTitle: 'Export Expense Tracker Backup (JSON)',
                        UTI: 'public.json',
                      });
                    }
                  }
                } catch (e: any) {
                  Alert.alert('Share Failed', e?.message || 'Could not trigger share dialog.');
                }
              }}
              style={[styles.submitButton, { backgroundColor: colors.primaryGreen, marginBottom: 10 }]}
            >
              <Text style={[styles.submitButtonText, { color: '#ffffff' }]}>Share / Save Backup File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsExportSuccessModalOpen(false)}
              style={[styles.submitButton, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1 }]}
            >
              <Text style={[styles.submitButtonText, { color: colors.textMain }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </AestheticModal>

        {/* JSON Backup Import Modal */}
        <AestheticModal
          visible={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setImportStatusMessage(null);
          }}
          title="Import Backup(JSON)"
          subtitle="Restore secure data when changing to a new phone"
        // icon="📥"
        >
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {/* <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17, marginBottom: 12 }}>
            Switching devices? Select your encrypted backup file or paste the backup text below. The app will automatically verify the tamper hash and securely decrypt your ledger, accounts, debts, and budgets.
          </Text> */}

            {/* Option 1: Pick File */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickBackupFile}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 14,
                backgroundColor: colors.primaryAccentLight || '#fff4e6',
                borderWidth: 1.5,
                borderColor: colors.primaryAccent,
                marginBottom: 12,
              }}
            >
              <Ionicons name="folder-open" size={18} color={colors.activeTabTint || colors.textMain} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.activeTabTint || colors.textMain }}>
                Select .json Backup File from Device
              </Text>
            </TouchableOpacity>

            {importStatusMessage && (
              <View style={{ backgroundColor: colors.primaryGreenLight || '#eaf4eb', padding: 10, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.primaryGreen }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primaryGreen }}>
                  ✅ {importStatusMessage}
                </Text>
              </View>
            )}

            <View style={{ backgroundColor: '#fff3cd', padding: 10, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: '#ffe69c' }}>
              <Text style={{ fontSize: 11, color: '#664d03', lineHeight: 15 }}>
                ⚠️ Restoring will overwrite existing records with the data from this backup.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isImporting}
              onPress={handleConfirmImport}
              style={[
                styles.submitButton,
                { backgroundColor: colors.primaryAccent, opacity: isImporting ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
                {isImporting ? 'Restoring Data...' : 'Confirm & Restore Previous Data'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </AestheticModal>

        {/* Base Salary Admin Setup Modal */}
        <BaseSalarySetupModal
          visible={isSalaryAdminModalOpen}
          onClose={() => setIsSalaryAdminModalOpen(false)}
          onSaveSalary={async (amount, dayStr) => {
            await configureBaseSalary(amount, dayStr);
            setIsSalaryAdminModalOpen(false);
          }}
          onSkipSalary={async () => {
            await skipBaseSalary();
            setIsSalaryAdminModalOpen(false);
          }}
          initialSalary={salary}
          initialDay={baseSalaryDate}
          forceConfigureStep={true}
        />

        {/* Change PIN Modal (Admin or Account) */}
        <AestheticModal
          visible={pinChangeTarget !== null}
          onClose={() => {
            setPinChangeTarget(null);
            setNewPinInput('');
            setPinChangeError('');
          }}
          title={pinChangeTarget === 'admin' ? 'Change Admin Access PIN' : 'Change Account Vault PIN'}
          subtitle={`Enter a new 4-digit security PIN for ${pinChangeTarget === 'admin' ? 'Admin Access' : 'Account Vault'}`}
          icon="🔑"
        >
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            {/* 4 Dots */}
            <View style={{ flexDirection: 'row', gap: 14, marginBottom: 16 }}>
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = newPinInput.length > idx;
                return (
                  <View
                    key={idx}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: colors.borderAccent || colors.primaryAccent,
                      backgroundColor: isFilled ? colors.primaryAccent : 'transparent',
                    }}
                  />
                );
              })}
            </View>

            {pinChangeError ? (
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger, marginBottom: 12 }}>
                {pinChangeError}
              </Text>
            ) : (
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 12 }}>
                Enter exactly 4 digits
              </Text>
            )}

            {/* Keypad */}
            <View style={{ width: '100%', gap: 10, marginBottom: 16 }}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['', '0', 'delete'],
              ].map((row, rIdx) => (
                <View key={rIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  {row.map((item, cIdx) => {
                    if (item === '') {
                      return <View key={cIdx} style={{ flex: 1, height: 50 }} />;
                    }
                    if (item === 'delete') {
                      return (
                        <TouchableOpacity
                          key={cIdx}
                          activeOpacity={0.7}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setPinChangeError('');
                            setNewPinInput((prev) => prev.slice(0, -1));
                          }}
                          style={{
                            flex: 1,
                            height: 50,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.bgSecondary,
                            borderColor: colors.borderSoft,
                            borderWidth: 1,
                          }}
                        >
                          <Ionicons name="backspace-outline" size={22} color={colors.textMain} />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={cIdx}
                        activeOpacity={0.7}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setPinChangeError('');
                          if (newPinInput.length < 4) {
                            setNewPinInput((prev) => prev + item);
                          }
                        }}
                        style={{
                          flex: 1,
                          height: 50,
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.bgSecondary,
                          borderColor: colors.borderSoft,
                          borderWidth: 1,
                        }}
                      >
                        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textMain }}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSavePin}
              style={[styles.submitButton, { width: '100%', backgroundColor: colors.primaryAccent }]}
            >
              <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
                Save New PIN 💾
              </Text>
            </TouchableOpacity>
          </View>
        </AestheticModal>

        {/* Select Salary Deposit Account Modal */}
        <AestheticModal
          visible={isSalaryBankModalOpen}
          onClose={() => setIsSalaryBankModalOpen(false)}
          title="Select Salary Bank Account"
          subtitle="Choose which bank stores your monthly salary for records"
          icon="💼"
        >
          <View style={{ gap: 10, paddingVertical: 8 }}>
            {accounts.map((acc) => {
              const isSelected = acc.id === salaryAccountId;
              return (
                <TouchableOpacity
                  key={acc.id}
                  onPress={async () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await setSalaryAccountId(acc.id);
                    setIsSalaryBankModalOpen(false);
                  }}
                  style={[
                    styles.accountSelectRow,
                    {
                      backgroundColor: isSelected ? colors.primaryGreenLight : colors.bgSecondary,
                      borderColor: isSelected ? colors.primaryGreen : colors.borderSoft,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{acc.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.accountSelectName, { color: colors.textMain }]}>{acc.name}</Text>
                    <Text style={[styles.accountSelectType, { color: colors.textMuted }]}>
                      {acc.type.toUpperCase()} • {currencySymbol} {acc.balance.toLocaleString()}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primaryGreen} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </AestheticModal>

        {/* Admin Initial Money for Cash in Hand Modal */}
        <AestheticModal
          visible={isInitialCashAdminModalOpen}
          onClose={() => setIsInitialCashAdminModalOpen(false)}
          title="Cash in Hand Initial Money 💵"
          subtitle="Set baseline liquid opening cash (does not create an incoming transaction)"
          icon="💵"
        >
          <View style={{ paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, lineHeight: 17 }}>
              Specify the starting liquid money you held before using the app. This balance is reflected directly in your Cash in Hand account and net worth, without polluting your income ledger or transaction log.
            </Text>
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMain }]}>Initial Cash in Hand ({currencySymbol})</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bgSecondary,
                    color: colors.textMain,
                    borderColor: colors.borderSoft,
                    fontSize: 16,
                    fontWeight: '700',
                  },
                ]}
                placeholder="e.g. 5000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={initialCashAdminInput}
                onChangeText={setInitialCashAdminInput}
              />
            </View>

            <TouchableOpacity
              onPress={async () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const val = parseFloat(initialCashAdminInput) || 0;
                await setCashInHandInitialMoney(val);
                setIsInitialCashAdminModalOpen(false);
              }}
              style={[styles.submitButton, { backgroundColor: colors.primaryGreen }]}
            >
              <Text style={[styles.submitButtonText, { color: '#ffffff' }]}>Save Initial Money 💵</Text>
            </TouchableOpacity>
          </View>
        </AestheticModal>

        {/* Link / Change Recovery Email Modal with OTP Code Verification */}
        <EmailVerificationModal
          visible={isLinkEmailModalOpen}
          onClose={() => setIsLinkEmailModalOpen(false)}
          badgeText="SECURITY • EMAIL VERIFICATION"
          title="Change Recovery Email ✉️"
          subtitle="A 6-digit code will be sent to your new email before updating."
          finishBtnText="Save New Email ✨"
          onVerifiedFinish={async () => {
            setIsLinkEmailModalOpen(false);
            Alert.alert('Email Updated 🎉', 'Your recovery email has been successfully updated and verified.');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 44 : 36,
    gap: 16,
  },
  adminBanner: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  exitBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeaderRow: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  inspectDbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  inspectDbBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  addCatBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  chipsScroll: {
    paddingVertical: 4,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 6,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    marginRight: 8,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  tableHeaderRowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableSubHeader: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipText: {
    fontSize: 12,
  },
  salaryAdminDetailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  salaryAdminStat: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  salaryAdminStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  salaryAdminStatVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  pinCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  pinBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  pinBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pinBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  eyeBtn: {
    padding: 2,
  },
  pinDisplayValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    marginVertical: 4,
  },
  changePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    marginTop: 6,
  },
  changePinBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  forgotPinLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
  },
  forgotPinLinkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recoveryEmailBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  recoveryEmailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recoveryEmailTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  recoveryStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  recoveryStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recoveryEmailSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  linkEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  linkEmailBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  unlinkEmailBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlinkEmailBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  salaryBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  salaryBankLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  salaryBankVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  selectBankBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  selectBankBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  accountSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  accountSelectName: {
    fontSize: 15,
    fontWeight: '700',
  },
  accountSelectType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  currencyAdminChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  currencyAdminChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  currencyAdminChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  customAdminCurrencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  customAdminCurrencyInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
  },
  customAdminCurrencySaveBtn: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAdminCurrencySaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  themeChoiceCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  themeChoiceName: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  themeChoiceDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  activePillSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillSmallText: {
    fontSize: 9,
    fontWeight: '900',
  },
});
