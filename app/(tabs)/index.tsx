import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinancial, extractDayFromDate, getCurrentMonthKey } from '@/context/FinancialContext';
import { ThemeHeader } from '@/components/ThemeHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { AestheticModal } from '@/components/AestheticModal';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { DatePickerFieldModal } from '@/components/DatePickerFieldModal';
import { BaseSalarySetupModal } from '@/components/BaseSalarySetupModal';

type HomeSegment = 'dashboard' | 'calendar' | 'analytics';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'expense' | 'income'>('expense');
  const {
    colors,
    theme,
    salary,
    hasBaseSalary,
    baseSalaryDate,
    configureBaseSalary,
    skipBaseSalary,
    isDbLoaded,
    hasCompletedOnboarding,
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
    salaries,
    addIncome,
    addExpense,
    addCategory,
    deleteCategory,
    addEnvelope,
    updateEnvelope,
    deleteEnvelope,
    updateSalary,
  } = useFinancial();

  const [activeSegment, setActiveSegment] = useState<HomeSegment>('dashboard');
  const [envelopeViewMode, setEnvelopeViewMode] = useState<'table' | 'progress'>('table');

  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddEnvelopeModalOpen, setIsAddEnvelopeModalOpen] = useState(false);
  const [isEditEnvelopeModalOpen, setIsEditEnvelopeModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isWelcomeDismissed, setIsWelcomeDismissed] = useState(false);
  const [pendingPrevCalMonth, setPendingPrevCalMonth] = useState<string | null>(null);

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

  // Form states - Category Tag (General categorization)
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('🏷️');
  const [catColor, setCatColor] = useState('#f48295');

  // Form states - Cash Envelope (Expected Budget bucket)
  const [envName, setEnvName] = useState('');
  const [envEmoji, setEnvEmoji] = useState('✉️');
  const [envColor, setEnvColor] = useState('#56a76e');
  const [envBudget, setEnvBudget] = useState('100');

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
    const numBudget = parseFloat(envBudget) || 100;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addEnvelope({
      name: envName.trim(),
      emoji: envEmoji,
      color: envColor,
      budgeted: numBudget,
    });
    setEnvName('');
    setEnvBudget('100');
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
        .filter((e) => e.category.toLowerCase().includes(env.name.toLowerCase()) || env.name.toLowerCase().includes(e.category.toLowerCase()))
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <ThemeHeader
        title={
          isAdminMode
            ? 'Admin Control Panel 👑'
            : activeSegment === 'dashboard'
              ? 'Monthly Budget 👛'
              : activeSegment === 'calendar'
                ? 'Calendar View 📅'
                : 'Analytics & Insights 📊'
        }
        subtitle={
          isAdminMode
            ? 'Manage database tables & inspect system storage'
            : 'Keep track of your monthly glow-up finances ✨'
        }
        stickerKey="home"
      />

      {isAdminMode ? (
        <AdminDashboardView />
      ) : (
        <>
          {/* Segment Switcher */}
          <SegmentedControl<HomeSegment>
            options={[
              { key: 'dashboard', label: 'Dashboard 👛' },
              { key: 'calendar', label: 'Calendar 📅' },
              { key: 'analytics', label: 'Analytics 📊' },
            ]}
            selectedKey={activeSegment}
            onSelect={setActiveSegment}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ===================== VIEW 1: DASHBOARD ===================== */}
            {activeSegment === 'dashboard' && (
              <View style={styles.viewContainer}>
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
                        <Text style={[styles.metricValue, { color: colors.textMain }]}>
                          Rs. {activeMonthSalary.toLocaleString()}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            marginTop: 3,
                            color: isSalaryLoaded || selectedMonth === 'ALL' ? colors.primaryGreen : colors.textMuted,
                          }}
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
                        <Text style={[styles.metricValue, { color: colors.danger }]}>
                          Rs. {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
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
                        <Text style={[styles.metricValue, { color: colors.primaryGreen }]}>
                          Rs. {totalIncome.toLocaleString()}
                        </Text>
                      </TouchableOpacity>

                      {/* Card 4: Remaining */}
                      <View style={[styles.metricCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                        <View style={styles.metricHeaderRow}>
                          <Text style={styles.metricEmoji}>✨</Text>
                          <Text style={[styles.badgePill, { backgroundColor: colors.primaryAccentLight, color: colors.activeTabTint }]}>Saved</Text>
                        </View>
                        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Remaining</Text>
                        <Text style={[styles.metricValue, { color: remainingBudget >= 0 ? colors.textMain : colors.danger }]}>
                          Rs. {remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
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
                        <Text style={[styles.metricValue, { color: colors.primaryGreen }]}>
                          Rs. {totalIncome.toLocaleString()}
                        </Text>
                      </TouchableOpacity>

                      {/* Card 2: Spent */}
                      <View style={[styles.metricCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                        <View style={styles.metricHeaderRow}>
                          <Text style={styles.metricEmoji}>💸</Text>
                          <Text style={[styles.badgePill, { backgroundColor: colors.dangerLight, color: colors.danger }]}>Spent</Text>
                        </View>
                        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Spent</Text>
                        <Text style={[styles.metricValue, { color: colors.danger }]}>
                          Rs. {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
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
                            <Text style={styles.metricEmoji}>✨</Text>
                            <Text style={[styles.metricLabel, { color: colors.textMuted, marginBottom: 0 }]}>Remaining Balance</Text>
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
                        <Text style={[styles.metricValue, { fontSize: 20, marginTop: 4, color: remainingBudget >= 0 ? colors.textMain : colors.danger }]}>
                          Rs. {remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setExpDate(getTodayDateStr());
                      setExpAmount('');
                      setExpReason('');
                      setIsExpenseModalOpen(true);
                    }}
                    style={[styles.primaryActionBtn, { backgroundColor: colors.primaryAccent, ...colors.cardShadow }]}
                  >
                    <Ionicons name="remove-circle" size={18} color={theme === 'kawaii' ? '#2c352d' : '#ffffff'} />
                    <Text style={[styles.primaryActionText, { color: theme === 'kawaii' ? '#2c352d' : '#ffffff' }]}>
                      + Add Expense 💸
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setIncDate(getTodayDateStr());
                      setIncAmount('');
                      setIncNote('');
                      setIsIncomeModalOpen(true);
                    }}
                    style={[styles.secondaryActionBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}
                  >
                    <Ionicons name="add-circle" size={18} color={colors.primaryGreen} />
                    <Text style={[styles.secondaryActionText, { color: colors.textMain }]}>
                      + Income 💰
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* CASH ENVELOPES (optional) - Expected Money to Spend */}
                <View style={[styles.envelopesCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                  {/* Card Header matching uploaded image */}
                  <View style={styles.envelopeCardHeader}>
                    <View style={styles.envelopeTitleContainer}>
                      <Text style={styles.sproutIcon}>🌿</Text>
                      <View>
                        <Text style={[styles.envelopeHeaderTitle, { color: colors.textMain }]}>CASH ENVELOPES</Text>
                        <Text style={[styles.envelopeHeaderSub, { color: colors.textMuted }]}> (optional)</Text>
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

                      {/* + Envelope Button */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setIsAddEnvelopeModalOpen(true)}
                        style={[styles.addCategoryPillBtn, { backgroundColor: theme === 'kawaii' ? '#f4f8f4' : colors.bgCardAlt, borderColor: colors.borderSoft }]}
                      >
                        <Text style={[styles.addCategoryPillText, { color: colors.textMain }]}>+ Envelope</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {envelopeViewMode === 'table' ? (
                    /* TABLE VIEW: Exactly as in Reference Image */
                    <View style={styles.envelopeTable}>
                      {/* Table Column Headers */}
                      <View style={[styles.tableHeaderRow, { backgroundColor: theme === 'kawaii' ? '#eaf4eb' : colors.bgSecondary }]}>
                        <Text style={[styles.colHeaderCategory, { color: theme === 'kawaii' ? '#5a6e5b' : colors.textMuted }]}>
                          CATEGORY
                        </Text>
                        <Text style={[styles.colHeaderBudgeted, { color: theme === 'kawaii' ? '#5a6e5b' : colors.textMuted }]}>
                          BUDGETED
                        </Text>
                      </View>

                      {/* Envelope Rows */}
                      {envelopes.map((env, idx) => (
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
                            idx === envelopes.length - 1 && { borderBottomWidth: 0 },
                          ]}
                        >
                          <View style={styles.tableRowLeft}>
                            <View style={[styles.catColorDot, { backgroundColor: env.color }]} />
                            <Text style={styles.catEmojiText}>{env.emoji}</Text>
                            <Text
                              style={[styles.catNameText, { color: colors.textMain }]}
                              numberOfLines={1}
                            >
                              {env.name.replace(env.emoji, '').trim() || env.name}
                            </Text>
                          </View>
                          <Text style={[styles.catBudgetText, { color: colors.textMain }]}>
                            $ {env.budgeted.toFixed(2)}
                          </Text>
                        </TouchableOpacity>
                      ))}

                      {/* TOTAL Highlight Row */}
                      <View style={[styles.tableTotalRow, { backgroundColor: theme === 'kawaii' ? '#eaf4eb' : colors.bgSecondary }]}>
                        <Text style={[styles.totalLabelText, { color: colors.textMain }]}>TOTAL</Text>
                        <Text style={[styles.totalValueText, { color: colors.textMain }]}>
                          $ {totalEnvelopesBudgeted.toFixed(2)}
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
                              ${item.spent.toFixed(2)} / <Text style={{ color: colors.textMain, fontWeight: '700' }}>${item.budgeted.toFixed(2)}</Text>
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

                {/* Recent Expenses List */}
                <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Recent Expenses 🧾</Text>
                    <Text style={[styles.countBadge, { color: colors.textMuted }]}>{filteredExpenses.length} total</Text>
                  </View>

                  <View style={styles.transactionList}>
                    {filteredExpenses.map((exp) => (
                      <View key={exp.id} style={[styles.txItem, { borderBottomColor: colors.borderSoft }]}>
                        <View style={styles.txLeft}>
                          <Text style={styles.txEmoji}>
                            {exp.category.split(' ')[0] || '💸'}
                          </Text>
                          <View style={styles.txInfo}>
                            <Text style={[styles.txTitle, { color: colors.textMain }]}>{exp.reason}</Text>
                            <Text style={[styles.txSub, { color: colors.textMuted }]}>
                              {exp.date} • {exp.stored}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.txExpenseAmount, { color: colors.danger }]}>
                          -Rs. {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </Text>
                      </View>
                    ))}
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
                          <Text style={styles.txEmoji}>👛</Text>
                          <View style={styles.txInfo}>
                            <Text style={[styles.txTitle, { color: colors.textMain }]}>{inc.note}</Text>
                            <Text style={[styles.txSub, { color: colors.textMuted }]}>
                              {inc.date} • {inc.stored}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.txIncomeAmount, { color: colors.primaryGreen }]}>
                          +Rs. {inc.amount.toLocaleString()}
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
                        textColor = theme === 'kawaii' ? '#2c352d' : '#ffffff';
                      } else if (isSelected) {
                        bgColor = colors.primaryAccent;
                        borderColor = colors.primaryAccent;
                        borderWidth = 1;
                        textColor = theme === 'kawaii' ? '#2c352d' : '#ffffff';
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
                              <Text style={styles.txEmoji}>{isSalary ? '💼' : '👛'}</Text>
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
                            <Text style={[styles.txIncomeAmount, { color: colors.primaryGreen }]}>
                              +Rs. {inc.amount.toLocaleString()}
                            </Text>
                          </View>
                        );
                      })}

                      {dayExpenses.map((e) => (
                        <View key={e.id} style={[styles.txItem, { borderBottomColor: colors.borderSoft }]}>
                          <View style={styles.txLeft}>
                            <Text style={styles.txEmoji}>{e.category.split(' ')[0]}</Text>
                            <View style={styles.txInfo}>
                              <Text style={[styles.txTitle, { color: colors.textMain }]}>{e.reason}</Text>
                              <Text style={[styles.txSub, { color: colors.textMuted }]}>{e.category} • {e.stored}</Text>
                            </View>
                          </View>
                          <Text style={[styles.txExpenseAmount, { color: colors.danger }]}>
                            -Rs. {e.amount.toLocaleString()}
                          </Text>
                        </View>
                      ))}
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
                          Rs. {cat.spent.toLocaleString()} ({cat.percent}%)
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
                        Rs. {totalIncome.toLocaleString()}
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
                        Rs. {totalSpent.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* ===================== MODAL 1: ADD EXPENSE ===================== */}
      <AestheticModal
        visible={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        title="Add Expense"
        subtitle="Log a new outgoing transaction"
        icon="💸"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Amount (Rs.)</Text>
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
                  <Text style={[styles.choiceChipText, { color: isSelected ? (theme === 'kawaii' ? '#2c352d' : '#ffffff') : colors.textMuted }]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

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
                  <Text style={[styles.choiceChipText, { color: isSelected ? (theme === 'kawaii' ? '#2c352d' : '#ffffff') : colors.textMuted }]}>
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
          <Text style={[styles.submitButtonText, { color: theme === 'kawaii' ? '#2c352d' : '#ffffff' }]}>
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
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Amount (Rs.)</Text>
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

        {/* Date Picker Selector Modal */}
        <DatePickerFieldModal
          visible={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          onSelectDate={(formattedDate) => {
            if (datePickerTarget === 'expense') {
              setExpDate(formattedDate);
            } else {
              setIncDate(formattedDate);
            }
          }}
        />

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

      {/* ===================== MODAL 3: ADD CASH ENVELOPE ===================== */}
      <AestheticModal
        visible={isAddEnvelopeModalOpen}
        onClose={() => setIsAddEnvelopeModalOpen(false)}
        title="Add Cash Envelope"
        subtitle="Set expected money to spend for a budget bucket"
        icon="🌿"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Envelope Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Food, Coffee, Transport"
            placeholderTextColor={colors.textSubtle}
            value={envName}
            onChangeText={setEnvName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Select Icon Emoji</Text>
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
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Envelope Color Swatch</Text>
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
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Expected Budget ($ / Rs.)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. 400"
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
          <Text style={[styles.submitButtonText, { color: theme === 'kawaii' ? '#2c352d' : '#ffffff' }]}>
            Create Envelope 🌿
          </Text>
        </TouchableOpacity>
      </AestheticModal>

      {/* ===================== MODAL 4: EDIT ENVELOPE BUDGET ===================== */}
      <AestheticModal
        visible={isEditEnvelopeModalOpen && selectedEnvelopeForEdit !== null}
        onClose={() => {
          setIsEditEnvelopeModalOpen(false);
          setSelectedEnvelopeForEdit(null);
        }}
        title="Edit Expected Budget"
        subtitle={`Set expected money to spend on ${selectedEnvelopeForEdit?.name}`}
        icon={selectedEnvelopeForEdit?.emoji || '✉️'}
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Expected Budget ($ / Rs.)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="400.00"
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
          <Text style={[styles.submitButtonText, { color: theme === 'kawaii' ? '#2c352d' : '#ffffff' }]}>
            Save Envelope Budget 💾
          </Text>
        </TouchableOpacity>

        {envelopes.length > 1 && (
          <TouchableOpacity
            onPress={() => handleDeleteEnvelopeSubmit(selectedEnvelopeForEdit?.id)}
            style={[styles.deleteCategoryBtn, { borderColor: colors.dangerLight }]}
          >
            <Text style={[styles.deleteCategoryText, { color: colors.danger }]}>Delete Envelope 🗑️</Text>
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
          <Text style={[styles.submitButtonText, { color: theme === 'kawaii' ? '#2c352d' : '#ffffff' }]}>
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
              <Text style={{ fontSize: 13, fontWeight: '800', color: theme === 'kawaii' ? '#2c352d' : '#ffffff' }}>
                View Month ➡️
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AestheticModal>

      {/* ===================== MODAL 6: BASE SALARY ONBOARDING / SETUP ===================== */}
      <BaseSalarySetupModal
        visible={(isDbLoaded && !hasCompletedOnboarding && !isWelcomeDismissed) || isSalaryModalOpen}
        onClose={async () => {
          setIsWelcomeDismissed(true);
          await completeOnboarding();
          setIsSalaryModalOpen(false);
        }}
        onSaveSalary={async (amount, dayStr) => {
          setIsWelcomeDismissed(true);
          await configureBaseSalary(amount, dayStr);
          await completeOnboarding();
          setIsSalaryModalOpen(false);
        }}
        onSkipSalary={async () => {
          setIsWelcomeDismissed(true);
          await skipBaseSalary();
          await completeOnboarding();
          setIsSalaryModalOpen(false);
        }}
        initialSalary={salary}
        initialDay={baseSalaryDate}
        forceConfigureStep={isSalaryModalOpen}
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
  },
  txEmoji: {
    fontSize: 22,
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
  },
  envelopeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sproutIcon: {
    fontSize: 22,
  },
  envelopeHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  envelopeHeaderSub: {
    fontSize: 13,
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
});
