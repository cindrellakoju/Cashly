import React, { useState, useEffect } from 'react';
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

interface BaseSalarySetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveSalary: (amount: number, dayStr: string) => Promise<void>;
  onSkipSalary: () => Promise<void>;
  initialSalary?: number;
  initialDay?: string;
  forceConfigureStep?: boolean;
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

export const BaseSalarySetupModal: React.FC<BaseSalarySetupModalProps> = ({
  visible,
  onClose,
  onSaveSalary,
  onSkipSalary,
  initialSalary = 0,
  initialDay = '1',
  forceConfigureStep = false,
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
  } = useFinancial();

  const [step, setStep] = useState<'ask' | 'configure'>(forceConfigureStep ? 'configure' : 'ask');
  const [salaryAmount, setSalaryAmount] = useState<string>(initialSalary > 0 ? String(initialSalary) : '');
  const [selectedDay, setSelectedDay] = useState<string>(initialDay || '1');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setStep(forceConfigureStep ? 'configure' : 'ask');
      setSalaryAmount(initialSalary > 0 ? String(initialSalary) : '');
      setSelectedDay(initialDay || '1');
      setErrorMsg('');
    }
  }

  // When the welcome screen is shown to the user, immediately record it as flagged in persistent storage.
  // Next time the app opens, it will see the flag and never show the welcome screen again.
  React.useEffect(() => {
    if (visible && step === 'ask') {
      markWelcomeShown();
    }
  }, [visible, step, markWelcomeShown]);

  const handleChooseYes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('configure');
    setErrorMsg('');
  };

  const handleChooseNo = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await onSkipSalary();
    onClose();
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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await onSaveSalary(num, selectedDay);
    onClose();
  };

  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'short' });
  const previewDayPadded = selectedDay.padStart(2, '0');
  const previewDepositStr = `${previewDayPadded} ${currentMonthName} ${now.getFullYear()}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardContainer}
            >
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
                  <View style={styles.stepContainer}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                      <View style={styles.titleCol}>
                        <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                          Welcome! 🌸
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                          Set up your income & balance tracking
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.7}
                        style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
                      >
                        <Ionicons name="close" size={18} color={colors.textMain} />
                      </TouchableOpacity>
                    </View>

                    {/* Cute Illustration / Icon */}
                    <View style={[styles.iconHeroBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                      <Text style={styles.heroEmoji}>👛</Text>
                      <Text style={[styles.questionText, { color: colors.textMain }]}>
                        Would you like to add a Base Salary?
                      </Text>
                    </View>

                    {/* Note Box */}
                    <View style={[styles.noteBox, { backgroundColor: '#fdebef', borderColor: '#f4aab9' }]}>
                      <Ionicons name="information-circle" size={18} color="#d85c72" style={{ marginTop: 2 }} />
                      <Text style={[styles.noteText, { color: '#2c352d' }]}>
                        <Text style={{ fontWeight: '800' }}>Note:</Text> Base salary will be added automatically on your selected date into your Income log ✨
                      </Text>
                    </View>

                    {/* Action Choices */}
                    <View style={styles.actionChoiceCol}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleChooseYes}
                        style={[styles.primaryChoiceBtn, { backgroundColor: colors.primaryAccent }]}
                      >
                        <Text style={styles.primaryChoiceEmoji}>✨</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.primaryChoiceTitle}>Yes, Add Base Salary</Text>
                          <Text style={styles.primaryChoiceSub}>Set monthly amount & payday date</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={18} color="#2c352d" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleChooseNo}
                        style={[styles.secondaryChoiceBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}
                      >
                        <Text style={styles.secondaryChoiceEmoji}>📈</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.secondaryChoiceTitle, { color: colors.textMain }]}>No, Track Income Directly</Text>
                          <Text style={[styles.secondaryChoiceSub, { color: colors.textMuted }]}>Show Total Income instead of Base Salary</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* ==================== STEP 2: CONFIGURE SALARY & DATE ==================== */
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContainer}>
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
                      <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.7}
                        style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
                      >
                        <Ionicons name="close" size={18} color={colors.textMain} />
                      </TouchableOpacity>
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
                        Monthly Salary Amount (Rs.)
                      </Text>
                      <View style={[styles.amountInputRow, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                        <Text style={[styles.currencyPrefix, { color: colors.textMuted }]}>Rs.</Text>
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
                                  { color: isSelected ? '#2c352d' : colors.textMain },
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
                        <Text style={styles.submitButtonText}>Confirm & Add to Income ✨</Text>
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
                )}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 380,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
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
});
