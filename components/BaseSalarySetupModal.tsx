import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinancial } from '@/context/FinancialContext';
import { sendVerificationEmail } from '@/services/emailService';

interface BaseSalarySetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveSalary: (amount: number, dayStr: string) => Promise<void>;
  onSkipSalary: () => Promise<void>;
  initialSalary?: number;
  initialDay?: string;
  forceConfigureStep?: boolean;
  onBackToEmail?: () => void;
  isInline?: boolean;
}

const ALL_PAYDAYS = Array.from({ length: 31 }, (_, i) => {
  const d = i + 1;
  const suffix =
    d === 1 || d === 21 || d === 31
      ? 'st'
      : d === 2 || d === 22
        ? 'nd'
        : d === 3 || d === 23
          ? 'rd'
          : 'th';
  return { day: String(d), label: `${d}${suffix}`, num: d };
});

const CURRENCY_PRESETS = [
  { symbol: 'Rs.', label: 'Rs.' },
  { symbol: '$', label: '$' },
  { symbol: '₹', label: '₹' },
  { symbol: '€', label: '€' },
  { symbol: '£', label: '£' },
  { symbol: '¥', label: '¥' },
];

export const BaseSalarySetupModal: React.FC<BaseSalarySetupModalProps> = ({
  visible,
  onClose,
  onSaveSalary,
  onSkipSalary,
  initialSalary = 0,
  initialDay = '1',
  forceConfigureStep = false,
  onBackToEmail,
  isInline = false,
}) => {
  const {
    colors,
    isSalaryLoaded,
    daysUntilPayday,
    loadSalaryNow,
    hasBaseSalary,
    baseSalaryDate,
    accounts,
    salaryAccountId,
    selectedMonth,
    markWelcomeShown,
    currencySymbol,
    setCurrencySymbol,
    recoveryEmail,
    setRecoveryEmail,
  } = useFinancial();

  type SetupStep = 'ask' | 'configure' | 'email';
  const [step, setStep] = useState<SetupStep>(forceConfigureStep ? 'configure' : 'ask');
  const [salaryAmount, setSalaryAmount] = useState<string>(initialSalary > 0 ? String(initialSalary) : '');
  const [selectedDay, setSelectedDay] = useState<string>(initialDay || '1');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currencySymbol || 'Rs.');
  const [isCustomCurrency, setIsCustomCurrency] = useState<boolean>(false);
  const [customCurrencyText, setCustomCurrencyText] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>(recoveryEmail || '');
  const [emailError, setEmailError] = useState<string>('');
  const [isSalarySkipped, setIsSalarySkipped] = useState<boolean>(false);

  // OTP / Verification state
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setStep(forceConfigureStep ? 'configure' : 'ask');
      setSalaryAmount(initialSalary > 0 ? String(initialSalary) : '');
      setSelectedDay(initialDay || '1');
      setErrorMsg('');
      setSelectedCurrency(currencySymbol || 'Rs.');
      setIsCustomCurrency(false);
      setCustomCurrencyText('');
      setEmailInput(recoveryEmail || '');
      setEmailError('');
      setIsSalarySkipped(false);
      // Reset OTP state on re-open
      setGeneratedOtp('');
      setEnteredOtp('');
      setIsCodeSent(false);
      setIsVerified(false);
      setOtpError('');
      setResendCooldown(0);
    }
  }

  const handleSelectCurrency = (sym: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCurrency(sym);
    setIsCustomCurrency(false);
    setCurrencySymbol(sym);
  };

  const handleSelectCustomCurrency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCustomCurrency(true);
  };

  const handleCustomCurrencyChange = (txt: string) => {
    setCustomCurrencyText(txt);
    if (txt.trim()) {
      setSelectedCurrency(txt.trim());
      setCurrencySymbol(txt.trim());
    }
  };

  const handleChooseYes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSalarySkipped(false);
    setStep('configure');
    setErrorMsg('');
  };

  const handleChooseNo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSalarySkipped(true);
    await onSkipSalary();
  };

  const handleConfirmSalary = async () => {
    const num = parseFloat(salaryAmount.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) {
      setErrorMsg('Please enter a valid salary amount greater than 0.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const dayNum = parseInt(selectedDay, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setErrorMsg('Please select a valid day between 1 and 31.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSalarySkipped(false);
    await onSaveSalary(num, selectedDay);
    if (forceConfigureStep) {
      onClose();
    }
  };

  const generateOtp = (): string => {
    return String(Math.floor(100000 + Math.random() * 900000));
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendVerificationCode = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailError('Email address is required.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address (e.g. name@gmail.com)');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setEmailError('');
    setIsSendingCode(true);
    setOtpError('');
    const otp = generateOtp();
    setGeneratedOtp(otp);

    try {
      const result = await sendVerificationEmail({ recipientEmail: cleanEmail, otp });
      if (result.success) {
        setIsCodeSent(true);
        setEnteredOtp('');
        startResendCooldown();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.error === 'MISSING_APP_PASSWORD') {
        setEmailError('Email server is missing the Google App Password. Open .env and set GMAIL_APP_PASSWORD.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (result.error === 'CONNECTION_FAILED') {
        setEmailError('Cannot reach the email server. Run "npm run email-server" in a separate terminal, then try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setEmailError(result.message || 'Failed to send code. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setEmailError('Cannot reach the email server. Run "npm run email-server" in a separate terminal, then try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!enteredOtp.trim()) {
      setOtpError('Please enter the verification code.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsVerifying(true);
    setOtpError('');

    // Small delay for feel
    await new Promise((r) => setTimeout(r, 300));

    const isDevMode = String(process.env.EXPO_PUBLIC_IS_DEV_MODE || '').trim().toLowerCase() === 'true';
    const isDevCode =
      (isDevMode || (typeof __DEV__ !== 'undefined' && __DEV__)) &&
      (enteredOtp.trim() === '000000' || enteredOtp.trim() === '123456');

    if (enteredOtp.trim() === generatedOtp || isDevCode) {
      setIsVerified(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Save verified email
      await setRecoveryEmail(emailInput.trim().toLowerCase());
    } else {
      setOtpError('Incorrect code. Please check your email and try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setIsVerifying(false);
  };

  const handleVerifiedFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isSalarySkipped) {
      await onSkipSalary();
    } else {
      const num = parseFloat(salaryAmount.replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        await onSaveSalary(num, selectedDay);
      } else {
        await onSkipSalary();
      }
    }
    onClose();
  };

  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'short' });
  const previewDayPadded = selectedDay.padStart(2, '0');
  const previewDepositStr = `${previewDayPadded} ${currentMonthName} ${now.getFullYear()}`;

  const modalContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.bgPrimary }]}>
        {forceConfigureStep && (
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdropDismissArea} />
          </TouchableWithoutFeedback>
        )}

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSoft,
              ...colors.cardShadow,
            },
          ]}
        >
            {step === 'ask' ? (
              /* ==================== STEP 1: ASK USER ==================== */
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={styles.stepContainer}
                style={styles.scrollStep}
              >
                {!forceConfigureStep && (
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#e4f5e4' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: '#24783e' }}>
                        STEP 2 OF 2 • BASE SALARY &amp; CURRENCY
                      </Text>
                    </View>
                  </View>
                )}

                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={styles.titleCol}>
                    <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                      Currency &amp; Base Salary 💰
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                      Set up your preferred currency &amp; balance tracking
                    </Text>
                  </View>
                  {forceConfigureStep && (
                    <TouchableOpacity
                      onPress={onClose}
                      activeOpacity={0.7}
                      style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
                    >
                      <Ionicons name="close" size={18} color={colors.textMain} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Currency Metric Picker */}
                <View style={[styles.metricPickerCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                  <View style={styles.metricPickerHeader}>
                    <Text style={[styles.metricPickerTitle, { color: colors.textMain }]}>
                      Choose Currency Metric
                    </Text>
                    <Text style={[styles.metricPickerSub, { color: colors.textMuted }]}>
                      Select currency for recurring bills, dashboard & accounts:
                    </Text>
                  </View>

                  <View style={styles.currencyChipsRow}>
                    {CURRENCY_PRESETS.map((p) => {
                      const isSelected = !isCustomCurrency && (selectedCurrency === p.symbol || currencySymbol === p.symbol);
                      return (
                        <TouchableOpacity
                          key={p.symbol}
                          activeOpacity={0.7}
                          onPress={() => handleSelectCurrency(p.symbol)}
                          style={[
                            styles.currencyChip,
                            {
                              backgroundColor: isSelected ? colors.primaryAccent : colors.bgCard,
                              borderColor: isSelected ? (colors.borderAccent || colors.primaryAccent) : colors.borderSoft,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.currencyChipText,
                              { color: isSelected ? colors.textOnAccent : colors.textMain, fontWeight: isSelected ? '800' : '600' },
                            ]}
                          >
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleSelectCustomCurrency}
                      style={[
                        styles.currencyChip,
                        {
                          backgroundColor: isCustomCurrency ? colors.primaryAccent : colors.bgCard,
                          borderColor: isCustomCurrency ? (colors.borderAccent || colors.primaryAccent) : colors.borderSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currencyChipText,
                          { color: isCustomCurrency ? '#2c352d' : colors.textMain, fontWeight: isCustomCurrency ? '800' : '600' },
                        ]}
                      >
                        Custom
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isCustomCurrency && (
                    <View style={[styles.customCurrencyInputRow, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
                      <Text style={[styles.customCurrencyLabel, { color: colors.textMuted }]}>Symbol / Code:</Text>
                      <TextInput
                        style={[styles.customCurrencyInput, { color: colors.textMain }]}
                        placeholder="e.g. NPR, USD, CAD"
                        placeholderTextColor={colors.textSubtle}
                        value={customCurrencyText}
                        onChangeText={handleCustomCurrencyChange}
                        maxLength={8}
                        autoCapitalize="characters"
                      />
                    </View>
                  )}
                </View>

                {/* Note Box */}
                <View style={[styles.noteBox, { backgroundColor: '#fdebef', borderColor: '#f4aab9' }]}>
                  <Ionicons name="information-circle" size={18} color="#d85c72" style={{ marginTop: 2 }} />
                  <Text style={[styles.noteText, { color: '#2c352d' }]}>
                    <Text style={{ fontWeight: '800' }}>Note:</Text> Base salary will be added automatically on your selected date into your Income log
                  </Text>
                </View>
                {/* Cute Illustration / Icon */}
                <View style={[styles.iconHeroBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                  <Text style={[styles.questionText, { color: colors.textMain }]}>
                    Would you like to add a Base Salary?
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      width: '100%',
                    }}
                  >
                    {/* Yes - Half Width */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleChooseYes}
                      style={[
                        styles.primaryChoiceBtn,
                        {
                          backgroundColor: colors.primaryAccent,
                          flex: 1,
                          minWidth: 0,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.primaryChoiceTitle}>
                          Yes, Add Base Salary
                        </Text>
                        <Text style={styles.primaryChoiceSub}>
                          Set monthly amount & payday date
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={18} color="#2c352d" />
                    </TouchableOpacity>

                    {/* No - Half Width */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleChooseNo}
                      style={[
                        styles.secondaryChoiceBtn,
                        {
                          backgroundColor: colors.bgSecondary,
                          borderColor: colors.borderSoft,
                          flex: 1,
                          minWidth: 0,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.secondaryChoiceTitle, { color: colors.textMain }]}>
                          No, Track Income Directly
                        </Text>
                        <Text style={[styles.secondaryChoiceSub, { color: colors.textMuted }]}>
                          Show Total Income instead of Base Salary
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Action Choices */}
                {/* Action Choices */}


              </ScrollView>
            ) : step === 'configure' ? (
              /* ==================== STEP 2: CONFIGURE SALARY & DATE ==================== */
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={styles.stepContainer}
                style={styles.scrollStep}
              >
                {!forceConfigureStep && (
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#e4f5e4' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: '#24783e' }}>
                        STEP 2 OF 2 • BASE SALARY &amp; CURRENCY
                      </Text>
                    </View>
                  </View>
                )}

                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={styles.titleCol}>
                    <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                      Configure Base Salary 👛
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                      Amount will be added to Income on your selected date
                    </Text>
                  </View>
                  {forceConfigureStep && (
                    <TouchableOpacity
                      onPress={onClose}
                      activeOpacity={0.7}
                      style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
                    >
                      <Ionicons name="close" size={18} color={colors.textMain} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Live Salary Status Banner */}
                {hasBaseSalary && initialSalary > 0 && (
                  <View
                    style={[
                      styles.salaryStatusBanner,
                      {
                        backgroundColor: isSalaryLoaded ? colors.primaryGreenLight : '#fff9e6',
                        borderColor: isSalaryLoaded ? colors.primaryGreen : '#ffd43b',
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 20 }}>{isSalaryLoaded ? '✅' : '⏳'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.statusBannerTitle,
                            { color: isSalaryLoaded ? colors.primaryGreen : '#856404' },
                          ]}
                        >
                          {isSalaryLoaded
                            ? 'Salary Loaded & Deposited'
                            : `Salary Pending (Arrives in ${daysUntilPayday} ${daysUntilPayday === 1 ? 'day' : 'days'})`}
                        </Text>
                        <Text
                          style={[
                            styles.statusBannerSub,
                            { color: isSalaryLoaded ? colors.textMain : '#664d03' },
                          ]}
                        >
                          {isSalaryLoaded
                            ? `Deposited into ${accounts.find((a) => a.id === salaryAccountId)?.name || 'Cash in Hand'}. Included in Total Income & Remaining.`
                            : `Scheduled on day ${baseSalaryDate}. It is NOT added to Total Income or Remaining until loaded.`}
                        </Text>
                      </View>
                    </View>

                    {!isSalaryLoaded && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={async () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          await loadSalaryNow(selectedMonth);
                          onClose();
                        }}
                        style={[styles.loadNowBtn, { backgroundColor: colors.primaryAccent }]}
                      >
                        <Ionicons name="flash" size={15} color="#2c352d" />
                        <Text style={styles.loadNowBtnText}>Load Salary to Bank Now (Early)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Error Message if any */}
                {errorMsg ? (
                  <View style={[styles.errorBox, { backgroundColor: '#ffe4e6', borderColor: '#e6536b' }]}>
                    <Ionicons name="alert-circle" size={16} color="#e6536b" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                {/* Input: Salary Amount */}
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textMain }]}>
                    Monthly Salary Amount ({currencySymbol})
                  </Text>
                  <View style={[styles.amountInputRow, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                    <Text style={[styles.currencyPrefix, { color: colors.textMuted }]}>{currencySymbol}</Text>
                    <TextInput
                      style={[styles.amountInput, { color: colors.textMain }]}
                      placeholder="e.g. 124000"
                      placeholderTextColor={colors.textSubtle}
                      keyboardType="numeric"
                      value={salaryAmount}
                      onChangeText={(txt) => {
                        setSalaryAmount(txt);
                        setErrorMsg('');
                      }}
                    />
                  </View>
                </View>

                {/* Input: Recurring Payday Date (All 31 dates available) */}
                <View style={styles.formGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={[styles.inputLabel, { color: colors.textMain }]}>
                      Select Payday (Days 1 to 31):
                    </Text>
                    <View style={[styles.selectedDayBadge, { backgroundColor: colors.primaryAccentLight }]}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.activeTabTint }}>
                        Day {selectedDay} selected
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.fieldHint, { color: colors.textMuted }]}>
                    Tap any date below to set when your salary is auto-deposited:
                  </Text>

                  <View style={styles.dayGridContainer}>
                    {ALL_PAYDAYS.map((p) => {
                      const isSelected = selectedDay === p.day;
                      return (
                        <TouchableOpacity
                          key={p.day}
                          activeOpacity={0.7}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedDay(p.day);
                            setErrorMsg('');
                          }}
                          style={[
                            styles.dayGridCell,
                            {
                              backgroundColor: isSelected ? colors.primaryAccent : colors.bgSecondary,
                              borderColor: isSelected ? colors.borderAccent : colors.borderSoft,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayGridCellText,
                              { color: isSelected ? colors.textOnAccent : colors.textMain },
                              isSelected && { fontWeight: '800' },
                            ]}
                          >
                            {p.day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Deposit Preview Card */}
                  <View style={[styles.previewCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                    <Ionicons name="calendar" size={16} color={colors.primaryGreen} />
                    <Text style={[styles.previewText, { color: colors.textMuted }]}>
                      Auto-deposit on: <Text style={{ color: colors.textMain, fontWeight: '800' }}>{previewDepositStr}</Text>
                    </Text>
                  </View>
                </View>

                {/* Submit Buttons */}
                <View style={styles.submitBtnCol}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleConfirmSalary}
                    style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
                  >
                    <Text style={styles.submitButtonText}>
                      {forceConfigureStep ? 'Confirm & Add to Income ✨' : 'Finish Setup & Enter Cashly ✨'}
                    </Text>
                  </TouchableOpacity>

                  {!forceConfigureStep && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setStep('ask')}
                      style={[styles.backBtn, { borderColor: colors.borderSoft }]}
                    >
                      <Text style={[styles.backBtnText, { color: colors.textMuted }]}>Back</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            ) : (
              /* ==================== STEP 3: EMAIL VERIFICATION (MANDATORY) ==================== */
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={styles.stepContainer}
                style={styles.scrollStep}
              >
                {!forceConfigureStep && (
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#e4f5e4' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: '#24783e' }}>
                        STEP 2 OF 2 • BASE SALARY &amp; CURRENCY
                      </Text>
                    </View>
                  </View>
                )}

                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={styles.titleCol}>
                    <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                      {isVerified ? 'Email Verified! 🎉' : 'Verify Your Email ✉️'}
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                      {isVerified
                        ? 'Your email has been confirmed and saved'
                        : 'Required for PIN recovery & security notifications'}
                    </Text>
                  </View>
                </View>

                {/* Success state */}
                {isVerified ? (
                  <View
                    style={[
                      styles.securityInfoCard,
                      { backgroundColor: colors.primaryAccentLight || '#d1fae5', borderColor: colors.primaryGreen || '#10b981' },
                    ]}
                  >
                    <View style={styles.securityIconRow}>
                      <View style={[styles.securityShieldCircle, { backgroundColor: colors.primaryAccent }]}>
                        <Ionicons name="checkmark-circle" size={26} color={colors.textOnAccent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.securityTitle, { color: colors.textMain }]}>Email Confirmed</Text>
                        <Text style={[styles.securitySub, { color: colors.textMuted }]}>
                          {emailInput.trim().toLowerCase()} has been verified and saved as your recovery email.
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    {/* Info card */}
                    <View style={[styles.securityInfoCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                      <View style={styles.securityIconRow}>
                        <View style={[styles.securityShieldCircle, { backgroundColor: colors.primaryAccentLight }]}>
                          <Ionicons name="shield-checkmark" size={26} color={colors.primaryGreen} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.securityTitle, { color: colors.textMain }]}>Security & PIN Recovery</Text>
                          <Text style={[styles.securitySub, { color: colors.textMuted }]}>
                            Your email is used to recover your security PIN. A verification code will be sent to confirm it's yours.
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Email input */}
                    <View style={styles.formGroup}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={[styles.inputLabel, { color: colors.textMain, flex: 1 }]}>Email Address</Text>
                        <View style={[styles.selectedDayBadge, { backgroundColor: colors.danger + '22' }]}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: colors.danger }}>REQUIRED</Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.emailInputRow,
                          {
                            backgroundColor: colors.bgSecondary,
                            borderColor: emailError ? colors.danger : isCodeSent ? colors.primaryGreen : colors.borderSoft,
                          },
                        ]}
                      >
                        <Ionicons
                          name={isCodeSent ? 'mail' : 'mail-outline'}
                          size={20}
                          color={isCodeSent ? colors.primaryGreen : colors.textMuted}
                          style={{ marginRight: 8 }}
                        />
                        <TextInput
                          style={[styles.emailInput, { color: colors.textMain }]}
                          placeholder="e.g. name@gmail.com"
                          placeholderTextColor={colors.textSubtle}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isCodeSent}
                          value={emailInput}
                          onChangeText={(txt) => {
                            setEmailInput(txt);
                            setEmailError('');
                            setIsCodeSent(false);
                            setIsVerified(false);
                          }}
                        />
                        {isCodeSent && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.primaryGreen} />
                        )}
                        {!isCodeSent && emailInput.trim().length > 0 && (
                          <TouchableOpacity onPress={() => { setEmailInput(''); setEmailError(''); }} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {emailError ? (
                        <Text style={[styles.fieldError, { color: colors.danger }]}>{emailError}</Text>
                      ) : null}
                    </View>

                    {/* Send / Resend code button */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleSendVerificationCode}
                      disabled={isSendingCode || resendCooldown > 0 || !emailInput.trim()}
                      style={[
                        styles.submitButton,
                        {
                          backgroundColor:
                            isSendingCode || resendCooldown > 0 || !emailInput.trim()
                              ? colors.borderSoft
                              : isCodeSent
                                ? colors.bgSecondary
                                : colors.primaryAccent,
                          borderWidth: isCodeSent ? 1 : 0,
                          borderColor: colors.primaryGreen,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.submitButtonText,
                          {
                            color:
                              isSendingCode || resendCooldown > 0 || !emailInput.trim()
                                ? colors.textMuted
                                : isCodeSent
                                  ? colors.primaryGreen
                                  : colors.textOnAccent,
                          },
                        ]}
                      >
                        {isSendingCode
                          ? 'Sending Code…'
                          : resendCooldown > 0
                            ? `Resend Code (${resendCooldown}s)`
                            : isCodeSent
                              ? '✓ Code Sent — Resend'
                              : 'Send Verification Code 📧'}
                      </Text>
                    </TouchableOpacity>

                    {/* OTP input — shown after code is sent */}
                    {isCodeSent && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textMain, marginBottom: 4 }]}>
                          Enter Verification Code:
                        </Text>
                        <Text style={[styles.fieldHint, { color: colors.textMuted, marginBottom: 8 }]}>
                          We sent a 6-digit code to {emailInput.trim().toLowerCase()}
                        </Text>
                        <View
                          style={[
                            styles.emailInputRow,
                            {
                              backgroundColor: colors.bgSecondary,
                              borderColor: otpError ? colors.danger : colors.borderSoft,
                            },
                          ]}
                        >
                          <Ionicons name="keypad-outline" size={20} color={colors.textMuted} style={{ marginRight: 8 }} />
                          <TextInput
                            style={[styles.emailInput, { color: colors.textMain, fontSize: 20, letterSpacing: 6, fontWeight: '800' }]}
                            placeholder="123456"
                            placeholderTextColor={colors.textSubtle}
                            keyboardType="number-pad"
                            maxLength={6}
                            value={enteredOtp}
                            onChangeText={(txt) => {
                              setEnteredOtp(txt.replace(/[^0-9]/g, ''));
                              setOtpError('');
                            }}
                          />
                          {enteredOtp.length > 0 && (
                            <TouchableOpacity onPress={() => setEnteredOtp('')} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
                            </TouchableOpacity>
                          )}
                        </View>
                        {otpError ? (
                          <Text style={[styles.fieldError, { color: colors.danger }]}>{otpError}</Text>
                        ) : null}

                        {/* Verify button */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handleVerifyCode}
                          disabled={isVerifying || enteredOtp.length < 6}
                          style={[
                            styles.submitButton,
                            {
                              marginTop: 12,
                              backgroundColor:
                                isVerifying || enteredOtp.length < 6
                                  ? colors.borderSoft
                                  : colors.primaryAccent,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.submitButtonText,
                              { color: isVerifying || enteredOtp.length < 6 ? colors.textMuted : '#2c352d' },
                            ]}
                          >
                            {isVerifying ? 'Verifying…' : 'Verify Code ✓'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                {/* Finish / Back buttons */}
                <View style={styles.submitBtnCol}>
                  {isVerified && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleVerifiedFinish}
                      style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
                    >
                      <Text style={styles.submitButtonText}>Finish Setup ✨</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setStep(isSalarySkipped ? 'ask' : 'configure');
                      setIsCodeSent(false);
                      setIsVerified(false);
                      setEnteredOtp('');
                      setOtpError('');
                    }}
                    style={[styles.backBtn, { borderColor: colors.borderSoft }]}
                  >
                    <Text style={[styles.backBtnText, { color: colors.textMuted }]}>Back</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
  );

  if (isInline) {
    return modalContent;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={forceConfigureStep ? onClose : () => {}}
      statusBarTranslucent
    >
      {modalContent}
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  backdropDismissArea: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  scrollStep: {
    flexShrink: 1,
  },
  stepContainer: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  titleCol: {
    flex: 1,
    paddingRight: 8,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHeroBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroEmoji: {
    fontSize: 36,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  noteBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  actionChoiceCol: {
    gap: 10,
    marginTop: 4,
  },
  primaryChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  primaryChoiceEmoji: {
    fontSize: 22,
  },
  primaryChoiceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2c352d',
  },
  primaryChoiceSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#637365',
    marginTop: 2,
  },
  secondaryChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  secondaryChoiceEmoji: {
    fontSize: 22,
  },
  secondaryChoiceTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryChoiceSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 10,
  },
  fieldHint: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -2,
    marginBottom: 4,
  },
  selectedDayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
    marginTop: 2,
  },
  dayGridCell: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayGridCellText: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    color: '#e6536b',
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtnCol: {
    gap: 8,
    marginTop: 6,
  },
  submitButton: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2c352d',
  },
  backBtn: {
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  salaryStatusBanner: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusBannerSub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    fontWeight: '500',
  },
  loadNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  loadNowBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2c352d',
  },
  metricPickerCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  metricPickerHeader: {
    gap: 2,
  },
  metricPickerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricPickerSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  currencyChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  currencyChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyChipText: {
    fontSize: 12,
  },
  customCurrencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 8,
    marginTop: 4,
  },
  customCurrencyLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  customCurrencyInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 4,
  },
  securityInfoCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  securityIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityShieldCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  securitySub: {
    fontSize: 11,
    lineHeight: 16,
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  emailInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldError: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
