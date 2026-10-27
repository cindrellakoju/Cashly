import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinancial, extractDayFromDate, getCurrentMonthKey } from '@/context/FinancialContext';
import { ThemeHeader } from '@/components/ThemeHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { AestheticModal } from '@/components/AestheticModal';
import { AdminDashboardView as _AdminDashboardView } from '@/components/AdminDashboardView'; // kept for type safety, rendered in _layout
import { DatePickerFieldModal } from '@/components/DatePickerFieldModal';
import { BaseSalarySetupModal } from '@/components/BaseSalarySetupModal';
import { EmailVerificationModal } from '@/components/EmailVerificationModal';

type HomeSegment = 'dashboard' | 'calendar' | 'analytics';

const { width } = Dimensions.get('window');

const RECURRING_BILL_SUGGESTIONS = [
  { name: 'Electricity Bill', emoji: '⚡', color: '#f3b06c' },
  { name: 'Groceries', emoji: '🛒', color: '#56a76e' },
  { name: 'Water Bill', emoji: '💧', color: '#4a90e2' },
  { name: 'House Rent', emoji: '🏠', color: '#9d7be2' },
  { name: 'Wi-Fi / Internet', emoji: '🌐', color: '#50e3c2' },
  { name: 'Cooking Gas', emoji: '🔥', color: '#f2738a' },
  { name: 'Mobile Recharge', emoji: '📱', color: '#7ab583' },
];

export default function HomeScreen() {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'expense' | 'income'>('expense');
  const {
    colors,
    theme,
    currencySymbol,
    salary,
    hasBaseSalary,
    baseSalaryDate,
    configureBaseSalary,
    skipBaseSalary,
    isDbLoaded,
    hasCompletedOnboarding,
    isWelcomeActive,
    completeOnboarding,
    extraIncome,
    totalSpent,
    totalIncome,
    remainingBudget,
    totalEnvelopesBudgeted,
    incomes,
    expenses,
    filteredIncomes,
    filteredExpenses,
    selectedMonth,
    setSelectedMonth,
    isAdminMode,
    envelopes,
    categories,
    accounts,
    salaryAccountId,
    isSalaryLoaded,
    daysUntilPayday,
    loadSalaryNow,
    activeMonthSalary,
    recoveryEmail,
    salaries,
    addIncome,
    addExpense,
    addCategory,
    deleteCategory,
    addEnvelope,
    updateEnvelope,
    deleteEnvelope,
    updateSalary,
    showMonthlyBills,
    resetDatabase,
    resetPINs
  } = useFinancial();

  const isDevMode =
    String(process.env.EXPO_PUBLIC_IS_DEV_MODE || '')
      .trim()
      .toLowerCase() === 'true';
  const [activeSegment, setActiveSegment] = useState<HomeSegment>('dashboard');
  const [envelopeViewMode, setEnvelopeViewMode] = useState<'table' | 'progress'>('table');


  const handleClearPins = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const performWipe = async () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await resetPINs();
        if (Platform.OS === 'web') {
          window.alert('✅ Security PINs Cleared!\n\nAll security PINs (admin, account, and vault) have been reset back to 1234.');
        } else {
          Alert.alert(
            '✅ Security PINs Cleared!',
            'All records, categories, accounts, and security PINs (reset to 1234) have been reset back to default factory settings.'
          );
        }
      } catch (err: any) {
        console.error('Failed to wipe database in Dev Mode:', err);
        if (Platform.OS === 'web') {
          window.alert(`❌ Reset Failed: ${err?.message || 'Error wiping database'}`);
        } else {
          Alert.alert('❌ Reset Failed', err?.message || 'Failed to wipe database');
        }
      }
    };


    Alert.alert(
      '⚠️ Clear All Pins?',
      'This will permanently delete all security PINs. Are you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Clear All Pins',
          style: 'destructive',
          onPress: performWipe,
        },
      ]
    );
  };
  const handleDevClearAllData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const performWipe = async () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await resetDatabase();
        Alert.alert(
          'Record Wiped',
          'All records, categories, accounts, and security PINs (reset to 1234) have been reset back to default factory settings.'
        );
      } catch (err: any) {
        console.error('Failed to wipe database in Dev Mode:', err);
        if (Platform.OS === 'web') {
          window.alert(`❌ Reset Failed: ${err?.message || 'Error wiping database'}`);
        } else {
          Alert.alert('❌ Reset Failed', err?.message || 'Failed to wipe database');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '⚠️ Clear All Data (Dev Mode)?\n\nThis will permanently delete all expenses, incomes, debts, categories, and reset security PINs back to default (1234).'
      );
      if (confirmed) {
        performWipe();
      }
      return;
    }

    Alert.alert(
      '⚠️ Clear All Data (Dev Mode)?',
      'This will permanently delete all expenses, incomes, debts, categories, and reset your security PINs back to default (1234). Are you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Clear All Data',
          style: 'destructive',
          onPress: performWipe,
        },
      ]
    );
  };

  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddEnvelopeModalOpen, setIsAddEnvelopeModalOpen] = useState(false);
  const [isEditEnvelopeModalOpen, setIsEditEnvelopeModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isWelcomeDismissed, setIsWelcomeDismissed] = useState(false);
  const [onboardingStage, setOnboardingStage] = useState<'email' | 'salary'>('email');
  const [pendingPrevCalMonth, setPendingPrevCalMonth] = useState<string | null>(null);

  // When database is wiped or onboarding is reset, ensure we always return to Step 1 ('email')
  useEffect(() => {
    if (!hasCompletedOnboarding && !recoveryEmail) {
      setOnboardingStage('email');
    }
  }, [hasCompletedOnboarding, recoveryEmail]);

  const [selectedEnvelopeForEdit, setSelectedEnvelopeForEdit] = useState<any | null>(null);
  const [editEnvBudget, setEditEnvBudget] = useState('');

  const getTodayDateStr = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Form states - Income
  const [incAmount, setIncAmount] = useState('');
  const [incNote, setIncNote] = useState('');
  const [incAccount, setIncAccount] = useState(accounts[0]?.name || 'Cash in Hand');
  const [incDate, setIncDate] = useState(getTodayDateStr());

  // Form states - Expense
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState(categories[0]?.name || 'Food');
  const [expReason, setExpReason] = useState('');
  const [expAccount, setExpAccount] = useState(accounts[0]?.name || 'Cash in Hand');
  const [expDate, setExpDate] = useState(getTodayDateStr());
  const [expRecurringBillId, setExpRecurringBillId] = useState('');

  // Form states - Category Tag (General categorization)
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('🏷️');
  const [catColor, setCatColor] = useState('#f48295');

  // Form states - Cash Envelope (Expected Budget bucket)
  const [envName, setEnvName] = useState('');
  const [envEmoji, setEnvEmoji] = useState('✉️');
  const [envColor, setEnvColor] = useState('#56a76e');
  const [envBudget, setEnvBudget] = useState('');

  // Form states - Salary
  const [salaryInput, setSalaryInput] = useState(salary.toString());

  // Calendar State & Dynamic Month Navigation
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const [selectedMonthYear, selectedMonthIndex] = useMemo(() => {
    if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) {
      const parts = selectedMonth.split('-');
      return [parseInt(parts[0], 10), parseInt(parts[1], 10) - 1];
    }
    const d = new Date();
    return [d.getFullYear(), d.getMonth()];
  }, [selectedMonth]);

  const MONTH_NAMES_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = `${MONTH_NAMES_FULL[selectedMonthIndex]} ${selectedMonthYear}`;

  const daysInMonth = useMemo(() => {
    return new Date(selectedMonthYear, selectedMonthIndex + 1, 0).getDate();
  }, [selectedMonthYear, selectedMonthIndex]);

  const firstDayOffset = useMemo(() => {
    return new Date(selectedMonthYear, selectedMonthIndex, 1).getDay(); // 0 = Sun .. 6 = Sat
  }, [selectedMonthYear, selectedMonthIndex]);

  // Dynamically calculate set of days that have logged expenses OR incomes
  const daysWithExpense = useMemo(() => {
    const s = new Set<number>();
    filteredExpenses.forEach((exp) => {
      const num = extractDayFromDate(exp.date);
      if (num && num >= 1 && num <= 31) s.add(num);
    });
    return s;
  }, [filteredExpenses]);

  const daysWithIncome = useMemo(() => {
    const s = new Set<number>();
    filteredIncomes.forEach((inc) => {
      const num = extractDayFromDate(inc.date);
      if (num && num >= 1 && num <= 31) s.add(num);
    });
    return s;
  }, [filteredIncomes]);

  const daysWithSalary = useMemo(() => {
    const s = new Set<number>();
    filteredIncomes.forEach((inc) => {
      if (inc.note.toLowerCase().includes('monthly base salary')) {
        const num = extractDayFromDate(inc.date);
        if (num && num >= 1 && num <= 31) s.add(num);
      }
    });
    return s;
  }, [filteredIncomes]);

  const daysWithActivity = useMemo(() => {
    const daysSet = new Set<number>();
    daysWithExpense.forEach((d) => daysSet.add(d));
    daysWithIncome.forEach((d) => daysSet.add(d));
    return daysSet;
  }, [daysWithExpense, daysWithIncome]);

  // Expenses strictly for selected calendar day (no dummy fallbacks)
  const dayExpenses = useMemo(() => {
    return filteredExpenses.filter((e) => {
      return extractDayFromDate(e.date) === selectedDay;
    });
  }, [filteredExpenses, selectedDay]);

  // Incomes strictly for selected calendar day
  const dayIncomes = useMemo(() => {
    return filteredIncomes.filter((inc) => {
      return extractDayFromDate(inc.date) === selectedDay;
    });
  }, [filteredIncomes, selectedDay]);

  const handlePrevCalMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let newYear = selectedMonthYear;
    let newMonth = selectedMonthIndex - 1;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    const monthStr = newMonth + 1 < 10 ? `0${newMonth + 1}` : `${newMonth + 1}`;
    const targetKey = `${newYear}-${monthStr}`;
    const todayKey = getCurrentMonthKey();

    if (targetKey < todayKey) {
      setPendingPrevCalMonth(targetKey);
      return;
    }

    const maxDays = new Date(newYear, newMonth + 1, 0).getDate();
    setSelectedDay((cur) => Math.min(cur, maxDays));
    setSelectedMonth(targetKey);
  };

  const handleNextCalMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let newYear = selectedMonthYear;
    let newMonth = selectedMonthIndex + 1;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    const maxDays = new Date(newYear, newMonth + 1, 0).getDate();
    setSelectedDay((cur) => Math.min(cur, maxDays));
    const monthStr = newMonth + 1 < 10 ? `0${newMonth + 1}` : `${newMonth + 1}`;
    setSelectedMonth(`${newYear}-${monthStr}`);
  };

  const colorSwatches = [
    '#f48295', '#85b885', '#ffc285', '#64ad72', '#d85c72',
    '#a685e2', '#5995e2', '#ff4d6d', '#38ef7d', '#ffd100',
  ];

  const emojiList = ['🍔', '☕', '🚗', '🛍️', '🏠', '🍿', '🎮', '✈️', '🐾', '💊', '📚', '💪'];

  const handleCloseIncomeModal = () => {
    setIncAmount('');
    setIncNote('');
    setIncAccount(accounts[0]?.name || 'Cash in Hand');
    setIncDate(getTodayDateStr());
    setIsIncomeModalOpen(false);
  };

  const handleCloseExpenseModal = () => {
    setExpAmount('');
    setExpReason('');
    setExpRecurringBillId('');
    setExpCategory(categories[0]?.name || 'Food');
    setExpAccount(accounts[0]?.name || 'Cash in Hand');
    setExpDate(getTodayDateStr());
    setIsExpenseModalOpen(false);
  };

  // Handle Adding Income
  const handleAddIncomeSubmit = () => {
    const num = parseFloat(incAmount);
    if (isNaN(num) || num <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dateStr = incDate.trim() || getTodayDateStr();
    addIncome({
      date: dateStr,
      amount: num,
      stored: incAccount,
      note: incNote.trim() || 'Additional Income',
      type: 'incoming',
    });
    handleCloseIncomeModal();
  };

  // Handle Adding Expense
  const handleAddExpenseSubmit = () => {
    const num = parseFloat(expAmount);
    if (isNaN(num) || num <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dateStr = expDate.trim() || getTodayDateStr();
    addExpense({
      date: dateStr,
      category: expCategory,
      amount: num,
      reason: expReason.trim() || 'General Expense',
      stored: expAccount,
      type: 'outgoing',
      recurringBillId: expRecurringBillId || undefined,
    });
    handleCloseExpenseModal();
  };

  // Handle Adding Category Tag
  const handleAddCategorySubmit = () => {
    if (!catName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const fullName = `${catEmoji} ${catName.trim()}`;
    addCategory({
      name: fullName,
      emoji: catEmoji,
      color: catColor,
    });
    setExpCategory(fullName);
    setCatName('');
    setIsCategoryModalOpen(false);
  };

  // Handle Adding Cash Envelope
  const handleAddEnvelopeSubmit = () => {
    if (!envName.trim()) return;
    const numBudget = parseFloat(envBudget) || 0;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addEnvelope({
      name: envName.trim(),
      emoji: envEmoji,
      color: envColor,
      budgeted: numBudget,
    });
    setEnvName('');
    setEnvBudget('');
    setIsAddEnvelopeModalOpen(false);
  };

  // Handle Update Envelope Budget
  const handleUpdateEnvelopeSubmit = () => {
    if (!selectedEnvelopeForEdit) return;
    const num = parseFloat(editEnvBudget);
    if (!isNaN(num) && num >= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateEnvelope(selectedEnvelopeForEdit.id, num);
      setIsEditEnvelopeModalOpen(false);
      setSelectedEnvelopeForEdit(null);
    }
  };

  // Handle Delete Envelope
  const handleDeleteEnvelopeSubmit = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteEnvelope(id);
    setIsEditEnvelopeModalOpen(false);
    setSelectedEnvelopeForEdit(null);
  };

  // Handle Salary Update
  const handleSalarySubmit = () => {
    const num = parseFloat(salaryInput);
    if (!isNaN(num) && num >= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateSalary(num);
      setIsSalaryModalOpen(false);
    }
  };

  // Compute envelope spent vs budget
  const envelopeStats = useMemo(() => {
    return envelopes.map((env) => {
      const spent = filteredExpenses
        .filter((e) => {
          if (e.recurringBillId) {
            return e.recurringBillId === env.id;
          }
          return (
            e.category.toLowerCase().includes(env.name.toLowerCase()) ||
            env.name.toLowerCase().includes(e.category.toLowerCase())
          );
        })
        .reduce((sum, e) => sum + e.amount, 0);
      const percent = env.budgeted > 0 ? Math.min(100, Math.round((spent / env.budgeted) * 100)) : 0;
      return {
        ...env,
        spent,
        remaining: Math.max(0, env.budgeted - spent),
        percent,
      };
    });
  }, [envelopes, filteredExpenses]);

  // Compute category spent for analytics
  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const spent = filteredExpenses
        .filter((e) => e.category.toLowerCase().includes(cat.name.toLowerCase()) || cat.name.toLowerCase().includes(e.category.toLowerCase()))
        .reduce((sum, e) => sum + e.amount, 0);
      const percent = totalSpent > 0 ? Math.min(100, Math.round((spent / totalSpent) * 100)) : 0;
      return {
        ...cat,
        spent,
        percent,
      };
    });
  }, [categories, filteredExpenses, totalSpent]);

  // Helper to extract or match category emoji (always returns an emoji icon, never plain text)
  const getCategoryEmoji = useCallback(
    (categoryName: string): string => {
      if (!categoryName) return '💸';
      const trimmed = categoryName.trim();
      const cat = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (cat?.emoji) return cat.emoji;

      const subCat = categories.find(
        (c) =>
          c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
          trimmed.toLowerCase().includes(c.name.toLowerCase())
      );
      if (subCat?.emoji) return subCat.emoji;

      const firstToken = trimmed.split(' ')[0];
      if (/\p{Extended_Pictographic}/u.test(firstToken)) {
        return firstToken;
      }

      const lower = trimmed.toLowerCase();
      if (lower.includes('food') || lower.includes('eat') || lower.includes('dining')) return '🍔';
      if (lower.includes('coffee') || lower.includes('tea') || lower.includes('cafe')) return '☕';
      if (lower.includes('transport') || lower.includes('travel') || lower.includes('fuel') || lower.includes('bus')) return '🚗';
      if (lower.includes('shop') || lower.includes('cloth') || lower.includes('store')) return '🛍️';
      if (lower.includes('utilit') || lower.includes('bill') || lower.includes('electric') || lower.includes('water')) return '🏠';
      if (lower.includes('fun') || lower.includes('movie') || lower.includes('entertain') || lower.includes('game')) return '🍿';
      if (lower.includes('grocer')) return '🛒';
      if (lower.includes('health') || lower.includes('med') || lower.includes('doctor')) return '💊';
      if (lower.includes('edu') || lower.includes('book') || lower.includes('school')) return '📚';

      return '💸';
    },
    [categories]
  );

  // Map category name to total spent in active month
  const categorySpentMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of filteredExpenses) {
      const key = exp.category.trim().toLowerCase();
      map.set(key, (map.get(key) || 0) + exp.amount);
    }
    return map;
  }, [filteredExpenses]);

  // Active category spending summaries for quick breakdown strip
  const activeCategorySummaries = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; total: number; count: number }>();
    for (const exp of filteredExpenses) {
      const key = exp.category.trim().toLowerCase();
      const existing = map.get(key);
      const emoji = getCategoryEmoji(exp.category);
      if (existing) {
        existing.total += exp.amount;
        existing.count += 1;
      } else {
        map.set(key, { name: exp.category.trim(), emoji, total: exp.amount, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, getCategoryEmoji]);

  if (!isDbLoaded) {
    return null;
  }

  // STRICT ONBOARDING FLOW:
  // 1. Welcome Screen (plays in _layout.tsx over everything at zIndex 99999)
  // 2. Step 1: Recovery Email (already mounted underneath on colors.bgPrimary, visible IMMEDIATELY when welcome fades)
  // 3. Step 2: Base Salary Setup (rendered on colors.bgPrimary, exact same color as Home)
  // 4. Home Dashboard (only unlocks once both steps are completed)
  if (!hasCompletedOnboarding) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top', 'bottom']}>
        <StatusBar style={theme === 'kawaii' ? 'dark' : 'light'} />

        {/* STEP 1: Recovery Email (Directly rendered underneath welcome screen, already mounted) */}
        {onboardingStage === 'email' && (
          <EmailVerificationModal
            isInline={true}
            onVerifiedFinish={async () => {
              setOnboardingStage('salary');
            }}
          />
        )}

        {/* STEP 2: Base Salary (On colors.bgPrimary, same color as Home) */}
        {onboardingStage === 'salary' && (
          <BaseSalarySetupModal
            isInline={true}
            visible={true}
            onClose={() => { }}
            onSaveSalary={async (amount, dayStr) => {
              await configureBaseSalary(amount, dayStr);
              await completeOnboarding();
            }}
            onSkipSalary={async () => {
              await skipBaseSalary();
              await completeOnboarding();
            }}
            onBackToEmail={() => setOnboardingStage('email')}
            initialSalary={salary}
            initialDay={baseSalaryDate}
            forceConfigureStep={false}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <ThemeHeader
        title={
          isAdminMode
            ? 'Admin Control Panel '
            : activeSegment === 'dashboard'
              ? 'Monthly Budget'
              : activeSegment === 'calendar'
                ? 'Calendar View 📅'
                : 'Analytics & Insights 📊'
        }
        subtitle={
          isAdminMode
            ? 'Manage database tables & inspect system storage'
            : 'Keep track of your monthly glow-up finances'
        }
        stickerKey="home"
      />

      {/* ===================== DEV MODE: CLEAR ALL DATA ===================== */}
      {isDevMode && (
        <View
          style={[
            styles.devModeBanner,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.danger,
              ...colors.cardShadow,
            },
          ]}
        >
          <View style={styles.devModeHeader}>
            <View style={[styles.devModeBadge, { backgroundColor: colors.dangerLight || '#fee2e2' }]}>
              <Ionicons name="construct" size={13} color={colors.danger} />
              <Text style={[styles.devModeBadgeText, { color: colors.danger }]}>DEV MODE ACTIVE</Text>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[styles.devClearBtn, { backgroundColor: colors.danger }]}
              onPress={handleDevClearAllData}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#ffffff" />
              <Text style={styles.devClearBtnText}>Clear All Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.devClearBtn, { backgroundColor: colors.danger }]}
              onPress={handleClearPins}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={16} color="#ffffff" />
              <Text style={styles.devClearBtnText}>Reset PIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      <>
        {/* Segment Switcher */}
        <SegmentedControl<HomeSegment>
          options={[
            { key: 'dashboard', label: 'Dashboard ' },
            { key: 'calendar', label: 'Calendar ' },
            { key: 'analytics', label: 'Analytics ' },
          ]}
          selectedKey={activeSegment}
          onSelect={setActiveSegment}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scrollContent}
        >
          {/* ===================== VIEW 1: DASHBOARD ===================== */}
          {activeSegment === 'dashboard' && (
            <View style={styles.viewContainer}>
              {/* Month Navigator Header Bar */}
              {/* <View style={[styles.dashboardMonthBar, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                  <TouchableOpacity
                    onPress={handlePrevCalMonth}
                    style={styles.monthNavBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="chevron-back" size={18} color={colors.textMain} />
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
                    <Ionicons name="calendar-outline" size={15} color={colors.primaryAccent} />
                    <Text style={[styles.dashboardMonthTitle, { color: colors.textMain }]} numberOfLines={1}>
                      {selectedMonth === 'ALL' ? 'All Months (Lifetime)' : currentMonthName}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedMonth(selectedMonth === 'ALL' ? `${selectedMonthYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}` : 'ALL')}
                      style={[
                        styles.allMonthsPill,
                        {
                          backgroundColor: selectedMonth === 'ALL' ? colors.primaryAccent : colors.bgSecondary,
                          borderColor: colors.borderSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.allMonthsPillText,
                          { color: selectedMonth === 'ALL' ? colors.textOnAccent : colors.textMuted },
                        ]}
                      >
                        {selectedMonth === 'ALL' ? 'Monthly' : 'All'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleNextCalMonth}
                      style={styles.monthNavBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="chevron-forward" size={18} color={colors.textMain} />
                    </TouchableOpacity>
                  </View>
                </View> */}

              {/* 4 Summary Cards */}
              <View style={styles.metricsGrid}>
                {hasBaseSalary ? (
                  <>
                    {/* Card 1: Base Salary */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setIsSalaryModalOpen(true);
                      }}
                      style={[
                        styles.metricCard,
                        {
                          backgroundColor: colors.bgCard,
                          borderColor: isSalaryLoaded ? colors.primaryGreenLight : colors.borderSoft,
                          borderWidth: 1,
                          ...colors.cardShadow,
                        },
                      ]}
                    >
                      <View style={styles.metricHeaderRow}>
                        <Text style={styles.metricEmoji}>👛</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {isSalaryLoaded ? (
                            <Text
                              style={[
                                styles.badgePill,
                                { backgroundColor: colors.primaryGreenLight, color: colors.primaryGreen, fontWeight: '800' },
                              ]}
                            >
                              ✅ Loaded
                            </Text>
                          ) : (
                            <Text
                              style={[
                                styles.badgePill,
                                {
                                  backgroundColor: '#fff3cd',
                                  color: '#997404',
                                  fontWeight: '800',
                                },
                              ]}
                            >
                              {daysUntilPayday === 1 ? '⏳ Tomorrow' : `⏳ In ${daysUntilPayday}d`}
                            </Text>
                          )}
                          <Ionicons name="pencil" size={12} color={colors.textSubtle} />
                        </View>
                      </View>
                      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                        {selectedMonth === 'ALL' ? 'Salary (All Time)' : 'Base Salary'}
                      </Text>
                      <Text style={[styles.metricValue, { color: colors.textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                        {currencySymbol} {activeMonthSalary.toLocaleString()}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          marginTop: 3,
                          color: isSalaryLoaded || selectedMonth === 'ALL' ? colors.primaryGreen : colors.textMuted,
                        }}
                        numberOfLines={1}
                      >
                        {selectedMonth === 'ALL'
                          ? 'Across all months 💼'
                          : isSalaryLoaded
                            ? `✓ In ${accounts.find((a) => a.id === salaryAccountId)?.name || 'Cash in Hand'}`
                            : `Due on ${baseSalaryDate}th`}
                      </Text>
                    </TouchableOpacity>

                    {/* Card 2: Spent */}
                    <View style={[styles.metricCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                      <View style={styles.metricHeaderRow}>
                        <Text style={styles.metricEmoji}>💸</Text>
                        <Text style={[styles.badgePill, { backgroundColor: colors.dangerLight, color: colors.danger }]}>Spent</Text>
                      </View>
                      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Spent</Text>
                      <Text style={[styles.metricValue, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                        {currencySymbol} {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </Text>
                    </View>

                    {/* Card 3: Total Income */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setIncDate(getTodayDateStr());
                        setIncAmount('');
                        setIncNote('');
                        setIsIncomeModalOpen(true);
                      }}
                      style={[styles.metricCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}
                    >
                      <View style={styles.metricHeaderRow}>
                        <Text style={styles.metricEmoji}>📈</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={[styles.badgePill, { backgroundColor: colors.primaryGreenLight, color: colors.primaryGreen }]}>Inflow</Text>
                          <Ionicons name="add-circle" size={13} color={colors.primaryGreen} />
                        </View>
                      </View>
                      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Income</Text>
                      <Text style={[styles.metricValue, { color: colors.primaryGreen }]} numberOfLines={1} adjustsFontSizeToFit>
                        {currencySymbol} {totalIncome.toLocaleString()}
                      </Text>
                    </TouchableOpacity>

                    {/* Card 4: Remaining */}
                    <View style={[styles.metricCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                      <View style={styles.metricHeaderRow}>
                        <Text style={styles.metricEmoji}>✨</Text>
                        <Text style={[styles.badgePill, { backgroundColor: colors.primaryAccentLight, color: colors.activeTabTint }]}>Saved</Text>
                      </View>
                      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Remaining</Text>
                      <Text style={[styles.metricValue, { color: remainingBudget >= 0 ? colors.textMain : colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                        {currencySymbol} {remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Card 1: Total Income (No Base Salary field shown) */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setIncDate(getTodayDateStr());
                        setIncAmount('');
                        setIncNote('');
                        setIsIncomeModalOpen(true);
                      }}
                      style={[styles.metricCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}
                    >
                      <View style={styles.metricHeaderRow}>
                        <Text style={styles.metricEmoji}>💰</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={[styles.badgePill, { backgroundColor: colors.primaryGreenLight, color: colors.primaryGreen }]}>Inflow</Text>
                          <Ionicons name="add-circle" size={13} color={colors.primaryGreen} />
                        </View>
                      </View>
                      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Income</Text>
                      <Text style={[styles.metricValue, { color: colors.primaryGreen }]} numberOfLines={1} adjustsFontSizeToFit>
                        {currencySymbol} {totalIncome.toLocaleString()}
                      </Text>
                    </TouchableOpacity>

                    {/* Card 2: Spent */}
                    <View style={[styles.metricCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                      <View style={styles.metricHeaderRow}>
                        <Text style={styles.metricEmoji}>💸</Text>
                        <Text style={[styles.badgePill, { backgroundColor: colors.dangerLight, color: colors.danger }]}>Spent</Text>
                      </View>
                      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Spent</Text>
                      <Text style={[styles.metricValue, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                        {currencySymbol} {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </Text>
                    </View>

                    {/* Card 3: Remaining (Full Width Hero Card - exactly 3 fields!) */}
                    <View
                      style={[
                        styles.metricCard,
                        {
                          width: '100%',
                          backgroundColor: colors.bgCard,
                          borderColor: colors.borderSoft,
                          borderWidth: 1,
                          ...colors.cardShadow,
                        },
                      ]}
                    >
                      <View style={styles.metricHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.metricLabel, { color: colors.textMuted, marginBottom: 0 }]}>Monthly Balance</Text>
                        </View>
                        <Text
                          style={[
                            styles.badgePill,
                            {
                              backgroundColor: remainingBudget >= 0 ? colors.primaryGreenLight : colors.dangerLight,
                              color: remainingBudget >= 0 ? colors.primaryGreen : colors.danger,
                            },
                          ]}
                        >
                          {remainingBudget >= 0 ? 'Saved' : 'Deficit'}
                        </Text>
                      </View>
                      <Text style={[styles.metricValue, { fontSize: 20, marginTop: 4, color: remainingBudget >= 0 ? colors.textMain : colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                        {currencySymbol} {remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Quick Action Buttons */}
              <View style={styles.actionButtonsRow}>
                {/* Add Expense */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setExpDate(getTodayDateStr());
                    setExpAmount('');
                    setExpReason('');
                    setExpRecurringBillId('');
                    setIsExpenseModalOpen(true);
                  }}
                  style={[
                    styles.primaryActionBtn,
                    { flex: 1, backgroundColor: colors.primaryAccent, ...colors.cardShadow },
                  ]}
                >
                  <Ionicons name="remove-circle" size={18} color={colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')} />
                  <Text
                    style={[styles.primaryActionText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}
                    numberOfLines={1}
                  >
                    Add Expense 💸
                  </Text>
                </TouchableOpacity>

                {/* Add Income */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setIncDate(getTodayDateStr());
                    setIncAmount('');
                    setIncNote('');
                    setIsIncomeModalOpen(true);
                  }}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      flex: 1,
                      backgroundColor: colors.bgCard,
                      borderColor: colors.borderSoft,
                      borderWidth: 1,
                      ...colors.cardShadow,
                    },
                  ]}
                >
                  <Ionicons name="add-circle" size={18} color={colors.primaryGreen} />
                  <Text
                    style={[styles.secondaryActionText, { color: colors.textMain }]}
                    numberOfLines={1}
                  >
                    Income 💰
                  </Text>
                </TouchableOpacity>
              </View>

              {/* MONTHLY RECURRING & BILLS (Utilities, Rent, Groceries, etc.) */}
              {showMonthlyBills && (
                <View style={[styles.envelopesCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                  {/* Card Header */}
                  <View style={styles.envelopeCardHeader}>
                    <View style={styles.envelopeTitleContainer}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.envelopeHeaderTitle, { color: colors.textMain }]} numberOfLines={1}>
                          MONTHLY RECURRING & BILLS
                        </Text>
                        <Text style={[styles.envelopeHeaderSub, { color: colors.textMuted }]} numberOfLines={1}>
                          Utilities, Rent, Groceries
                        </Text>
                      </View>
                    </View>

                    <View style={styles.envelopeHeaderActions}>
                      {/* View Mode Switcher Button */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEnvelopeViewMode((prev) => (prev === 'table' ? 'progress' : 'table'));
                        }}
                        style={[styles.envelopeToggleBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}
                      >
                        <Ionicons
                          name={envelopeViewMode === 'table' ? 'bar-chart-outline' : 'list-outline'}
                          size={14}
                          color={colors.textMain}
                        />
                      </TouchableOpacity>

                      {/* + Add Bill Button */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setIsAddEnvelopeModalOpen(true)}
                        style={[styles.addCategoryPillBtn, { backgroundColor: theme === 'kawaii' ? '#f4f8f4' : colors.bgCardAlt, borderColor: colors.borderSoft }]}
                      >
                        <Text style={[styles.addCategoryPillText, { color: colors.textMain }]} numberOfLines={1}>+ Add Bill</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {envelopes.length === 0 ? (
                    /* EMPTY BILLS STATE */
                    <View style={styles.emptyEnvelopeBox}>
                      <Text style={[styles.emptyEnvelopeTitle, { color: colors.textMain }]}>No Recurring Bills or Utilities Yet</Text>
                      <Text style={[styles.emptyEnvelopeSub, { color: colors.textMuted }]}>
                        Plan and track recurring monthly essentials like Electricity, Water, Rent, Groceries, and Wi-Fi. Set expected monthly amounts and track actual spending.
                      </Text>
                      {/* <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsAddEnvelopeModalOpen(true)}
                        style={[styles.addFirstEnvelopeBtn, { backgroundColor: colors.primaryAccent }]}
                      >
                        <Ionicons name="add" size={16} color="#2c352d" />
                        <Text style={styles.addFirstEnvelopeText}>+ Add Recurring Bill / Utility</Text>
                      </TouchableOpacity> */}
                    </View>
                  ) : envelopeViewMode === 'table' ? (
                    /* TABLE VIEW */
                    <View style={styles.envelopeTable}>
                      {/* Table Column Headers */}
                      <View style={[styles.tableHeaderRow, { backgroundColor: theme === 'kawaii' ? '#eaf4eb' : colors.bgSecondary }]}>
                        <Text style={[styles.colHeaderCategory, { color: theme === 'kawaii' ? '#5a6e5b' : colors.textMuted }]}>
                          RECURRING BILL / UTILITY
                        </Text>
                        <Text style={[styles.colHeaderBudgeted, { color: theme === 'kawaii' ? '#5a6e5b' : colors.textMuted }]}>
                          MONTHLY BUDGET
                        </Text>
                      </View>

                      {/* Envelope Rows */}
                      {envelopeStats.map((env, idx) => (
                        <TouchableOpacity
                          key={env.id}
                          activeOpacity={0.75}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedEnvelopeForEdit(env);
                            setEditEnvBudget(env.budgeted.toString());
                            setIsEditEnvelopeModalOpen(true);
                          }}
                          style={[
                            styles.tableRowItem,
                            { borderBottomColor: colors.borderSoft },
                            idx === envelopeStats.length - 1 && { borderBottomWidth: 0 },
                          ]}
                        >
                          <View style={styles.tableRowLeft}>
                            <View style={[styles.catColorDot, { backgroundColor: env.color }]} />
                            <Text style={styles.catEmojiText}>{env.emoji}</Text>
                            <View style={{ flex: 1, marginRight: 6 }}>
                              <Text
                                style={[styles.catNameText, { color: colors.textMain }]}
                                numberOfLines={1}
                              >
                                {env.name.replace(env.emoji, '').trim() || env.name}
                              </Text>
                              <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600', marginTop: 1 }} numberOfLines={1}>
                                Spent: {currencySymbol} {env.spent.toFixed(2)} ({env.percent}%)
                              </Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end', minWidth: 90 }}>
                            <Text style={[styles.catBudgetText, { color: colors.textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                              {currencySymbol} {env.budgeted.toFixed(2)}
                            </Text>
                            <Text style={{ fontSize: 10, color: env.remaining > 0 ? colors.primaryGreen : colors.danger, fontWeight: '700', marginTop: 1 }} numberOfLines={1}>
                              {env.remaining > 0 ? `Left: ${currencySymbol} ${env.remaining.toFixed(2)}` : 'Limit reached'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}

                      {/* TOTAL Highlight Row */}
                      <View style={[styles.tableTotalRow, { backgroundColor: theme === 'kawaii' ? '#eaf4eb' : colors.bgSecondary }]}>
                        <Text style={[styles.totalLabelText, { color: colors.textMain }]}>TOTAL MONTHLY BUDGET</Text>
                        <Text style={[styles.totalValueText, { color: colors.textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                          {currencySymbol} {totalEnvelopesBudgeted.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    /* PROGRESS VIEW: Spent vs Budget Bar Tracker */
                    <View style={styles.envelopesList}>
                      {envelopeStats.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.75}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedEnvelopeForEdit(item);
                            setEditEnvBudget(item.budgeted.toString());
                            setIsEditEnvelopeModalOpen(true);
                          }}
                          style={styles.envelopeItem}
                        >
                          <View style={styles.envelopeTopRow}>
                            <View style={styles.envelopeTitleWrapper}>
                              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                              <Text style={[styles.envelopeName, { color: colors.textMain }]}>{item.name}</Text>
                            </View>
                            <Text style={[styles.envelopeAmount, { color: colors.textMuted }]}>
                              {currencySymbol} {item.spent.toFixed(2)} / <Text style={{ color: colors.textMain, fontWeight: '700' }}>{currencySymbol} {item.budgeted.toFixed(2)}</Text>
                            </Text>
                          </View>

                          {/* Progress Bar */}
                          <View style={[styles.progressBarBg, { backgroundColor: colors.bgSecondary }]}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${Math.min(100, item.percent)}%`,
                                  backgroundColor: item.percent > 90 ? colors.danger : item.color,
                                },
                              ]}
                            />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Recent Expenses List */}
              <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Recent Expenses 🧾</Text>
                  <Text style={[styles.countBadge, { color: colors.textMuted }]}>{filteredExpenses.length} total</Text>
                </View>

                {/* Category Spending Overview Strip */}
                {activeCategorySummaries.length > 0 && (
                  <View style={styles.catSpendStrip}>
                    <Text style={[styles.catSpendStripLabel, { color: colors.textMuted }]}>
                      SPENT BY CATEGORY:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catSpendScroll}>
                      {activeCategorySummaries.map((cat) => (
                        <View
                          key={cat.name}
                          style={[
                            styles.catSpendChip,
                            { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft },
                          ]}
                        >
                          <Text style={styles.catSpendChipEmoji}>{cat.emoji}</Text>
                          <Text style={[styles.catSpendChipName, { color: colors.textMain }]}>
                            {cat.name}:
                          </Text>
                          <Text style={[styles.catSpendChipAmount, { color: colors.danger }]}>
                            {currencySymbol} {cat.total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.transactionList}>
                  {filteredExpenses.map((exp) => {
                    const linkedBill = exp.recurringBillId ? envelopes.find((b) => b.id === exp.recurringBillId) : null;
                    const catEmoji = getCategoryEmoji(exp.category);
                    const catTotal = categorySpentMap.get(exp.category.trim().toLowerCase()) || exp.amount;
                    return (
                      <View key={exp.id} style={[styles.txItem, { borderBottomColor: colors.borderSoft }]}>
                        <View style={styles.txLeft}>
                          <View style={[styles.txEmojiCircle, { backgroundColor: colors.bgSecondary }]}>
                            <Text style={styles.txEmoji}>{catEmoji}</Text>
                          </View>
                          <View style={styles.txInfo}>
                            <Text style={[styles.txTitle, { color: colors.textMain }]} numberOfLines={1}>{exp.reason}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                              <Text style={[styles.txSub, { color: colors.textMuted, marginTop: 0 }]}>
                                {exp.date} • {exp.stored}
                              </Text>
                              {/* Category Spent Badge */}
                              <View style={[styles.badgePill, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1, paddingVertical: 1 }]}>
                                <Text style={{ fontSize: 10, color: colors.textMain, fontWeight: '700' }} numberOfLines={1}>
                                  {catEmoji} {exp.category} ({currencySymbol} {catTotal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} total)
                                </Text>
                              </View>
                              {linkedBill && (
                                <View style={[styles.badgePill, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1, paddingVertical: 1 }]}>
                                  <Text style={{ fontSize: 10, color: colors.textMain, fontWeight: '700' }} numberOfLines={1}>
                                    {linkedBill.emoji} {linkedBill.name}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                        <Text style={[styles.txExpenseAmount, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                          -{currencySymbol} {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Income Streams List */}
              <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Income Streams 💵</Text>
                  <Text style={[styles.countBadge, { color: colors.textMuted }]}>{filteredIncomes.length} items</Text>
                </View>

                <View style={styles.transactionList}>
                  {filteredIncomes.map((inc) => (
                    <View key={inc.id} style={[styles.txItem, { borderBottomColor: colors.borderSoft }]}>
                      <View style={styles.txLeft}>
                        <View style={[styles.txEmojiCircle, { backgroundColor: colors.bgSecondary }]}>
                          <Text style={styles.txEmoji}>👛</Text>
                        </View>
                        <View style={styles.txInfo}>
                          <Text style={[styles.txTitle, { color: colors.textMain }]} numberOfLines={1}>{inc.note}</Text>
                          <Text style={[styles.txSub, { color: colors.textMuted }]}>
                            {inc.date} • {inc.stored}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.txIncomeAmount, { color: colors.primaryGreen }]} numberOfLines={1} adjustsFontSizeToFit>
                        +{currencySymbol} {inc.amount.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ===================== VIEW 2: CALENDAR ===================== */}
          {activeSegment === 'calendar' && (
            <View style={styles.viewContainer}>
              <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                <View style={styles.calendarNavRow}>
                  <TouchableOpacity
                    onPress={handlePrevCalMonth}
                    style={styles.calNavBtn}
                  >
                    <Ionicons name="chevron-back" size={20} color={colors.textMain} />
                  </TouchableOpacity>
                  <Text style={[styles.calMonthTitle, { color: colors.textMain }]}>{currentMonthName}</Text>
                  <TouchableOpacity onPress={handleNextCalMonth} style={styles.calNavBtn}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMain} />
                  </TouchableOpacity>
                </View>

                {/* Day headers */}
                <View style={styles.calDaysHeader}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                    <Text key={i} style={[styles.calDayHeadText, { color: colors.textMuted }]}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Grid */}
                <View style={styles.calGrid}>
                  {/* Blank Padding Cells for Month Alignment */}
                  {Array.from({ length: firstDayOffset }).map((_, i) => (
                    <View key={`cal-blank-${i}`} style={styles.calDayCell} />
                  ))}

                  {/* Days 1 .. N */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const nowObj = new Date();
                    const isToday =
                      day === nowObj.getDate() &&
                      selectedMonthIndex === nowObj.getMonth() &&
                      selectedMonthYear === nowObj.getFullYear();
                    const isSelected = selectedDay === day;
                    const hasActivity = daysWithActivity.has(day);
                    const hasSalary = daysWithSalary.has(day);
                    const hasIncome = daysWithIncome.has(day);
                    const hasExpense = daysWithExpense.has(day);

                    let bgColor = 'transparent';
                    let borderColor = 'transparent';
                    let textColor = colors.textMain;
                    let borderWidth = 0;

                    if (isSelected && isToday) {
                      bgColor = colors.primaryAccent;
                      borderColor = colors.primaryGreen;
                      borderWidth = 2.5;
                      textColor = colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214');
                    } else if (isSelected) {
                      bgColor = colors.primaryAccent;
                      borderColor = colors.primaryAccent;
                      borderWidth = 1;
                      textColor = colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214');
                    } else if (isToday) {
                      bgColor = colors.primaryGreen;
                      borderColor = colors.primaryGreen;
                      borderWidth = 1;
                      textColor = '#ffffff';
                    }

                    return (
                      <TouchableOpacity
                        key={day}
                        activeOpacity={0.7}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedDay(day);
                        }}
                        style={[
                          styles.calDayCell,
                          {
                            backgroundColor: bgColor,
                            borderColor: borderColor,
                            borderWidth: borderWidth,
                            borderRadius: 12,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.calDayNumber,
                            {
                              color: textColor,
                              fontWeight: isSelected || isToday ? '800' : '600',
                            },
                          ]}
                        >
                          {day}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                          {hasSalary ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                              <Text style={{ fontSize: 9 }}>💼</Text>
                              <View
                                style={[
                                  styles.calExpenseDot,
                                  {
                                    marginTop: 0,
                                    backgroundColor: isSelected || isToday
                                      ? (theme === 'kawaii' && isSelected ? '#2c352d' : '#ffffff')
                                      : colors.primaryGreen,
                                  },
                                ]}
                              />
                            </View>
                          ) : hasIncome ? (
                            <View
                              style={[
                                styles.calExpenseDot,
                                {
                                  marginTop: 0,
                                  backgroundColor: isSelected || isToday
                                    ? (theme === 'kawaii' && isSelected ? '#2c352d' : '#ffffff')
                                    : colors.primaryGreen,
                                },
                              ]}
                            />
                          ) : null}
                          {hasExpense && (
                            <View
                              style={[
                                styles.calExpenseDot,
                                {
                                  marginTop: 0,
                                  backgroundColor: isSelected || isToday
                                    ? (theme === 'kawaii' && isSelected ? '#2c352d' : '#ffffff')
                                    : colors.danger,
                                },
                              ]}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Calendar Legend */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 12, paddingVertical: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 11 }}>💼</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700' }}>Salary</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={[styles.calExpenseDot, { backgroundColor: colors.primaryGreen, marginTop: 0 }]} />
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700' }}>Income</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={[styles.calExpenseDot, { backgroundColor: colors.danger, marginTop: 0 }]} />
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700' }}>Expense</Text>
                  </View>
                </View>
              </View>

              {/* Selected Day Log */}
              <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                <Text style={[styles.sectionTitle, { color: colors.textMain, marginBottom: 12 }]}>
                  Transactions for Day {selectedDay} 🗓️
                </Text>

                {dayExpenses.length === 0 && dayIncomes.length === 0 ? (
                  <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic', paddingVertical: 8 }}>
                    No transactions recorded on this day.
                  </Text>
                ) : (
                  <>
                    {dayIncomes.map((inc) => {
                      const isSalary = inc.note.toLowerCase().includes('monthly base salary');
                      return (
                        <View key={inc.id} style={[styles.txItem, { borderBottomColor: colors.borderSoft }]}>
                          <View style={styles.txLeft}>
                            <View style={[styles.txEmojiCircle, { backgroundColor: colors.bgSecondary }]}>
                              <Text style={styles.txEmoji}>{isSalary ? '💼' : '👛'}</Text>
                            </View>
                            <View style={styles.txInfo}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Text style={[styles.txTitle, { color: colors.textMain }]}>{inc.note}</Text>
                                {isSalary && (
                                  <Text
                                    style={[
                                      styles.badgePill,
                                      {
                                        backgroundColor: colors.primaryGreenLight,
                                        color: colors.primaryGreen,
                                      },
                                    ]}
                                  >
                                    Salary Loaded ✨
                                  </Text>
                                )}
                              </View>
                              <Text style={[styles.txSub, { color: colors.textMuted }]}>{inc.date} • {inc.stored}</Text>
                            </View>
                          </View>
                          <Text style={[styles.txIncomeAmount, { color: colors.primaryGreen }]} numberOfLines={1} adjustsFontSizeToFit>
                            +{currencySymbol} {inc.amount.toLocaleString()}
                          </Text>
                        </View>
                      );
                    })}

                    {dayExpenses.map((e) => {
                      const linkedBill = e.recurringBillId ? envelopes.find((b) => b.id === e.recurringBillId) : null;
                      const catEmoji = getCategoryEmoji(e.category);
                      const catTotal = categorySpentMap.get(e.category.trim().toLowerCase()) || e.amount;
                      return (
                        <View key={e.id} style={[styles.txItem, { borderBottomColor: colors.borderSoft }]}>
                          <View style={styles.txLeft}>
                            <View style={[styles.txEmojiCircle, { backgroundColor: colors.bgSecondary }]}>
                              <Text style={styles.txEmoji}>{catEmoji}</Text>
                            </View>
                            <View style={styles.txInfo}>
                              <Text style={[styles.txTitle, { color: colors.textMain }]} numberOfLines={1}>{e.reason}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                                <Text style={[styles.txSub, { color: colors.textMuted, marginTop: 0 }]}>{e.date} • {e.stored}</Text>
                                {/* Category Spent Badge */}
                                <View style={[styles.badgePill, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1, paddingVertical: 1 }]}>
                                  <Text style={{ fontSize: 10, color: colors.textMain, fontWeight: '700' }} numberOfLines={1}>
                                    {catEmoji} {e.category} ({currencySymbol} {catTotal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} total)
                                  </Text>
                                </View>
                                {linkedBill && (
                                  <View style={[styles.badgePill, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft, borderWidth: 1, paddingVertical: 1 }]}>
                                    <Text style={{ fontSize: 10, color: colors.textMain, fontWeight: '700' }} numberOfLines={1}>
                                      {linkedBill.emoji} {linkedBill.name}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                          <Text style={[styles.txExpenseAmount, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                            -{currencySymbol} {e.amount.toLocaleString()}
                          </Text>
                        </View>
                      );
                    })}
                  </>
                )}
              </View>
            </View>
          )}

          {/* ===================== VIEW 3: ANALYTICS ===================== */}
          {activeSegment === 'analytics' && (
            <View style={styles.viewContainer}>
              {/* Category Breakdown Rings/Bars */}
              <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Spending Breakdown 🍩</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginBottom: 16 }]}>
                  Share of monthly budget by category
                </Text>

                {categoryStats.map((cat) => (
                  <View key={cat.id} style={styles.analyticsBarRow}>
                    <View style={styles.analyticsBarInfo}>
                      <Text style={[styles.analyticsCatName, { color: colors.textMain }]}>{cat.name}</Text>
                      <Text style={[styles.analyticsCatVal, { color: colors.textMuted }]}>
                        {currencySymbol} {cat.spent.toLocaleString()} ({cat.percent}%)
                      </Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.bgSecondary }]}>
                      <View style={[styles.progressBarFill, { width: `${cat.percent}%`, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                ))}
              </View>

              {/* Income vs Outflow Comparison */}
              <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Inflow vs Outflow 📊</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginBottom: 16 }]}>
                  Net monthly cash balance
                </Text>

                <View style={styles.comparisonContainer}>
                  {/* Inflow Bar */}
                  <View style={styles.compareCol}>
                    <View style={[styles.compareBar, { height: 120, backgroundColor: colors.primaryGreen }]} />
                    <Text style={[styles.compareLabel, { color: colors.textMain }]}>Inflow</Text>
                    <Text style={[styles.compareAmount, { color: colors.primaryGreen }]}>
                      {currencySymbol} {totalIncome.toLocaleString()}
                    </Text>
                  </View>

                  {/* Outflow Bar */}
                  <View style={styles.compareCol}>
                    <View
                      style={[
                        styles.compareBar,
                        {
                          height: Math.min(120, Math.max(20, (totalSpent / (totalIncome || 1)) * 120)),
                          backgroundColor: colors.danger,
                        },
                      ]}
                    />
                    <Text style={[styles.compareLabel, { color: colors.textMain }]}>Outflow</Text>
                    <Text style={[styles.compareAmount, { color: colors.danger }]}>
                      {currencySymbol} {totalSpent.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </>

      {/* ===================== MODAL 1: ADD EXPENSE ===================== */}
      <AestheticModal
        visible={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        title="Add Expense"
        subtitle="Log a new outgoing transaction"
        icon="💸"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Amount ({currencySymbol})</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. 250"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={expAmount}
            onChangeText={setExpAmount}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {categories.map((c) => {
              const isSelected = expCategory === c.name;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setExpCategory(c.name)}
                  style={[
                    styles.choiceChip,
                    { backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary },
                  ]}
                >
                  <Text style={[styles.choiceChipText, { color: isSelected ? (colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')) : colors.textMuted }]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Optional Link to Recurring Bill / Utility */}
        {showMonthlyBills && envelopes.length > 0 && (
          <View style={styles.formGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={[styles.inputLabel, { color: colors.textMain, marginBottom: 0 }]}>
                Connect to Recurring Bill ⚡
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
                Optional
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              <TouchableOpacity
                onPress={() => setExpRecurringBillId('')}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: !expRecurringBillId ? colors.primaryAccent : colors.bgSecondary,
                    borderWidth: 1,
                    borderColor: !expRecurringBillId ? (colors.borderAccent || colors.primaryAccent) : colors.borderSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.choiceChipText,
                    {
                      color: !expRecurringBillId ? (colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')) : colors.textMuted,
                      fontWeight: !expRecurringBillId ? '800' : '600',
                    },
                  ]}
                >
                  🚫 None (Standard)
                </Text>
              </TouchableOpacity>
              {envelopes.map((bill) => {
                const isSelected = expRecurringBillId === bill.id;
                return (
                  <TouchableOpacity
                    key={bill.id}
                    onPress={() => setExpRecurringBillId(bill.id)}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary,
                        borderWidth: 1,
                        borderColor: isSelected ? (colors.borderAccent || colors.primaryAccent) : colors.borderSoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        {
                          color: isSelected ? (colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')) : colors.textMuted,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {bill.emoji} {bill.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Reason / Note</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Lunch at Cafe"
            placeholderTextColor={colors.textSubtle}
            value={expReason}
            onChangeText={setExpReason}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Date (Defaults to Today)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
              placeholder="e.g. 15 Jul 2026 or 2026-07-15"
              placeholderTextColor={colors.textSubtle}
              value={expDate}
              onChangeText={setExpDate}
            />
            <TouchableOpacity
              onPress={() => {
                setDatePickerTarget('expense');
                setIsDatePickerOpen(true);
              }}
              style={{ padding: 12, borderRadius: 14, backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.borderSoft }}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primaryAccent} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Paid From Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {accounts.map((acc) => {
              const isSelected = expAccount === acc.name;
              return (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => setExpAccount(acc.name)}
                  style={[
                    styles.choiceChip,
                    { backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary },
                  ]}
                >
                  <Text style={[styles.choiceChipText, { color: isSelected ? (colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')) : colors.textMuted }]}>
                    {acc.emoji} {acc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity
          onPress={handleAddExpenseSubmit}
          style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
            Save Expense 💸
          </Text>
        </TouchableOpacity>
      </AestheticModal>

      {/* ===================== MODAL 2: ADD INCOME ===================== */}
      <AestheticModal
        visible={isIncomeModalOpen}
        onClose={handleCloseIncomeModal}
        title="Add Income"
        subtitle="Log additional incoming funds"
        icon="💰"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Amount ({currencySymbol})</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. 15000"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={incAmount}
            onChangeText={setIncAmount}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Income Title / Source</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Freelance Design Bonus"
            placeholderTextColor={colors.textSubtle}
            value={incNote}
            onChangeText={setIncNote}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Date (Defaults to Today)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
              placeholder="e.g. 15 Jul 2026 or 2026-07-15"
              placeholderTextColor={colors.textSubtle}
              value={incDate}
              onChangeText={setIncDate}
            />
            <TouchableOpacity
              onPress={() => {
                setDatePickerTarget('income');
                setIsDatePickerOpen(true);
              }}
              style={{ padding: 12, borderRadius: 14, backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.borderSoft }}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primaryGreen} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Deposited Into Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {accounts.map((acc) => {
              const isSelected = incAccount === acc.name;
              return (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => setIncAccount(acc.name)}
                  style={[
                    styles.choiceChip,
                    { backgroundColor: isSelected ? colors.primaryGreen : colors.bgSecondary },
                  ]}
                >
                  <Text style={[styles.choiceChipText, { color: isSelected ? '#ffffff' : colors.textMuted }]}>
                    {acc.emoji} {acc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity
          onPress={handleAddIncomeSubmit}
          style={[styles.submitButton, { backgroundColor: colors.primaryGreen }]}
        >
          <Text style={styles.submitButtonTextWhite}>Save Income 💰</Text>
        </TouchableOpacity>
      </AestheticModal>

      {/* ===================== MODAL 3: ADD RECURRING MONTHLY BILL ===================== */}
      <AestheticModal
        visible={isAddEnvelopeModalOpen}
        onClose={() => setIsAddEnvelopeModalOpen(false)}
        title="Add Recurring Bill / Utility ⚡"
        subtitle="Set monthly budget for recurring essentials (Electricity, Water, Rent, etc.)"
        icon="⚡"
      >
        {/* Quick Suggestion Chips */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Quick Suggestions (Tap to fill)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {RECURRING_BILL_SUGGESTIONS.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEnvName(item.name);
                  setEnvEmoji(item.emoji);
                  setEnvColor(item.color);
                }}
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: envName === item.name ? colors.primaryAccent : colors.bgSecondary,
                    borderColor: envName === item.name ? colors.primaryAccent : colors.borderSoft,
                  },
                ]}
              >
                <Text style={{ fontSize: 13, marginRight: 5 }}>{item.emoji}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: envName === item.name ? colors.textOnAccent : colors.textMain,
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Bill / Utility Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Electricity Bill, House Rent, Groceries"
            placeholderTextColor={colors.textSubtle}
            value={envName}
            onChangeText={setEnvName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Icon Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {emojiList.map((em, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setEnvEmoji(em)}
                style={[
                  styles.emojiChip,
                  { backgroundColor: envEmoji === em ? colors.primaryAccent : colors.bgSecondary },
                ]}
              >
                <Text style={styles.emojiText}>{em}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Color Tag</Text>
          <View style={styles.swatchGrid}>
            {colorSwatches.map((color, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setEnvColor(color)}
                style={[
                  styles.swatchDot,
                  { backgroundColor: color },
                  envColor === color && styles.swatchDotSelected,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Expected Monthly Amount ({currencySymbol})</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. 1500"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={envBudget}
            onChangeText={setEnvBudget}
          />
        </View>

        <TouchableOpacity
          onPress={handleAddEnvelopeSubmit}
          style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
            Save Recurring Bill 🌿
          </Text>
        </TouchableOpacity>
      </AestheticModal>

      {/* ===================== MODAL 4: EDIT RECURRING BILL BUDGET ===================== */}
      <AestheticModal
        visible={isEditEnvelopeModalOpen && selectedEnvelopeForEdit !== null}
        onClose={() => {
          setIsEditEnvelopeModalOpen(false);
          setSelectedEnvelopeForEdit(null);
        }}
        title="Edit Recurring Bill Budget"
        subtitle={`Set expected monthly amount for ${selectedEnvelopeForEdit?.name}`}
        icon={selectedEnvelopeForEdit?.emoji || '⚡'}
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Expected Monthly Amount ({currencySymbol})</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. 1500"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={editEnvBudget}
            onChangeText={setEditEnvBudget}
          />
        </View>

        <TouchableOpacity
          onPress={handleUpdateEnvelopeSubmit}
          style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
            Save Monthly Budget 💾
          </Text>
        </TouchableOpacity>

        {selectedEnvelopeForEdit && (
          <TouchableOpacity
            onPress={() => handleDeleteEnvelopeSubmit(selectedEnvelopeForEdit?.id)}
            style={[styles.deleteCategoryBtn, { borderColor: colors.dangerLight }]}
          >
            <Text style={[styles.deleteCategoryText, { color: colors.danger }]}>Delete Recurring Bill 🗑️</Text>
          </TouchableOpacity>
        )}
      </AestheticModal>

      {/* ===================== MODAL 5: ADD EXPENSE CATEGORY TAG ===================== */}
      <AestheticModal
        visible={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Category Tag"
        subtitle="Create a new category tag for expenses"
        icon="🏷️"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Category Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Gaming, Gym, Subscriptions"
            placeholderTextColor={colors.textSubtle}
            value={catName}
            onChangeText={setCatName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Select Icon Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {emojiList.map((em, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setCatEmoji(em)}
                style={[
                  styles.emojiChip,
                  { backgroundColor: catEmoji === em ? colors.primaryAccent : colors.bgSecondary },
                ]}
              >
                <Text style={styles.emojiText}>{em}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Category Color Swatch</Text>
          <View style={styles.swatchGrid}>
            {colorSwatches.map((color, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setCatColor(color)}
                style={[
                  styles.swatchDot,
                  { backgroundColor: color },
                  catColor === color && styles.swatchDotSelected,
                ]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleAddCategorySubmit}
          style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
            Create Category Tag 🏷️
          </Text>
        </TouchableOpacity>

        {/* Existing category tags */}
        <View style={{ marginTop: 14 }}>
          <Text style={[styles.inputLabel, { color: colors.textMuted, fontSize: 12 }]}>Existing Category Tags (Tap ✕ to remove)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {categories.map((c) => (
              <View
                key={c.id}
                style={[
                  styles.choiceChip,
                  { backgroundColor: colors.bgSecondary, flexDirection: 'row', alignItems: 'center', gap: 6 },
                ]}
              >
                <Text style={[styles.choiceChipText, { color: colors.textMain }]}>
                  {c.emoji} {c.name}
                </Text>
                {categories.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      deleteCategory(c.id);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </AestheticModal>

      {/* Previous Month Notice Popup for Calendar Navigation */}
      <AestheticModal
        visible={Boolean(pendingPrevCalMonth)}
        onClose={() => setPendingPrevCalMonth(null)}
        title="Previous Month Notice"
        subtitle="Tracking history notice"
        icon="🗓️"
      >
        <View style={{ paddingVertical: 4 }}>
          <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textMuted, marginBottom: 18 }}>
            You started using this app in{' '}
            <Text style={{ fontWeight: '800', color: colors.textMain }}>
              {MONTH_NAMES_FULL[new Date().getMonth()]} {new Date().getFullYear()}
            </Text>
            . Navigating to previous month records may show empty budget or unloaded salary.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPendingPrevCalMonth(null)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: colors.bgSecondary,
                borderColor: colors.borderSoft,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>Stay on Current</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (pendingPrevCalMonth) {
                  const [py, pm] = pendingPrevCalMonth.split('-');
                  const maxDays = new Date(parseInt(py, 10), parseInt(pm, 10), 0).getDate();
                  setSelectedDay((cur) => Math.min(cur, maxDays));
                  setSelectedMonth(pendingPrevCalMonth);
                }
                setPendingPrevCalMonth(null);
              }}
              style={{
                flex: 1.2,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: colors.primaryAccent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }}>
                View Month ➡️
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AestheticModal>

      {/* ===================== MODAL 6: BASE SALARY / EDIT SETUP (RS & EMAIL) ===================== */}
      <BaseSalarySetupModal
        visible={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        onSaveSalary={async (amount, dayStr) => {
          await configureBaseSalary(amount, dayStr);
          setIsSalaryModalOpen(false);
        }}
        onSkipSalary={async () => {
          await skipBaseSalary();
          setIsSalaryModalOpen(false);
        }}
        initialSalary={salary}
        initialDay={baseSalaryDate}
        forceConfigureStep={true}
      />

      {/* Date Picker Selector Modal */}
      <DatePickerFieldModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        currentValue={datePickerTarget === 'expense' ? expDate : incDate}
        onSelectDate={(formattedDate) => {
          if (datePickerTarget === 'expense') {
            setExpDate(formattedDate);
          } else {
            setIncDate(formattedDate);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 110 : 85,
  },
  viewContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    padding: 14,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricEmoji: {
    fontSize: 22,
  },
  badgePill: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: 24,
    padding: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  smallAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  smallAddText: {
    fontSize: 11,
    fontWeight: '800',
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  envelopesList: {
    gap: 14,
  },
  envelopeItem: {
    gap: 6,
  },
  envelopeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  envelopeTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  envelopeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  envelopeAmount: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  transactionList: {
    gap: 10,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  txEmojiCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txEmoji: {
    fontSize: 20,
  },
  catSpendStrip: {
    marginBottom: 12,
    paddingBottom: 8,
  },
  catSpendStripLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  catSpendScroll: {
    flexDirection: 'row',
  },
  catSpendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  catSpendChipEmoji: {
    fontSize: 13,
  },
  catSpendChipName: {
    fontSize: 11,
    fontWeight: '700',
  },
  catSpendChipAmount: {
    fontSize: 11,
    fontWeight: '800',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  txSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  txExpenseAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txIncomeAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  // Calendar styles
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calNavBtn: {
    padding: 6,
  },
  calMonthTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  calDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calDayHeadText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  calDayNumber: {
    fontSize: 13,
  },
  calExpenseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  // Analytics styles
  analyticsBarRow: {
    marginBottom: 14,
    gap: 6,
  },
  analyticsBarInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsCatName: {
    fontSize: 13,
    fontWeight: '700',
  },
  analyticsCatVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 16,
  },
  compareCol: {
    alignItems: 'center',
    gap: 6,
  },
  compareBar: {
    width: 44,
    borderRadius: 12,
  },
  compareLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  compareAmount: {
    fontSize: 12,
    fontWeight: '800',
  },
  // Form styles
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  labelWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inlineAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
  },
  chipsScroll: {
    marginTop: 4,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
  },
  choiceChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emojiChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  emojiText: {
    fontSize: 20,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  swatchDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  swatchDotSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  submitButtonTextWhite: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  // Cash Envelopes Table Styles (Matching Reference)
  envelopesCard: {
    borderRadius: 28,
    padding: 16,
  },
  envelopeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  envelopeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 150,
  },
  sproutIcon: {
    fontSize: 22,
  },
  envelopeHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  envelopeHeaderSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  envelopeHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  envelopeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryPillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  envelopeTable: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  colHeaderCategory: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  colHeaderBudgeted: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  tableRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catEmojiText: {
    fontSize: 16,
  },
  catNameText: {
    fontSize: 14,
    fontWeight: '600',
  },
  catBudgetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: 2,
  },
  totalLabelText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  totalValueText: {
    fontSize: 14,
    fontWeight: '900',
  },
  deleteCategoryBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
  },
  deleteCategoryText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyEnvelopeBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEnvelopeTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyEnvelopeSub: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  addFirstEnvelopeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addFirstEnvelopeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2c352d',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  dashboardMonthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 12,
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardMonthTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  allMonthsPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allMonthsPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  devModeBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  devModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  devModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  devModeBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  devModeHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  devClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  devClearBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
