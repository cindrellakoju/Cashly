import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinancial } from '@/context/FinancialContext';
import { sendVerificationEmail } from '@/services/emailService';

interface EmailVerificationModalProps {
  visible?: boolean;
  onVerifiedFinish: () => Promise<void>;
  onClose?: () => void;
  onBack?: () => void;
  isInline?: boolean;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  finishBtnText?: string;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  visible = true,
  onVerifiedFinish,
  onClose,
  onBack,
  isInline = false,
  badgeText = 'STEP 1 OF 2 • MANDATORY SECURITY',
  title,
  subtitle,
  finishBtnText = 'Continue to Base Salary ➡️',
}) => {
  const { colors, recoveryEmail, setRecoveryEmail } = useFinancial();

  const [emailInput, setEmailInput] = useState<string>(recoveryEmail || '');
  const [emailError, setEmailError] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const cooldownRef = useRef<any>(null);

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible && !isInline) {
      setIsVerified(false);
      setIsCodeSent(false);
      setIsSendingCode(false);
      setEnteredOtp('');
      setOtpError('');
      setEmailError('');
    }
  }

  // When database is wiped and recoveryEmail is reset to empty, reset modal internal state completely
  useEffect(() => {
    if (!recoveryEmail) {
      setEmailInput('');
      setEmailError('');
      setGeneratedOtp('');
      setEnteredOtp('');
      setIsCodeSent(false);
      setIsSendingCode(false);
      setIsVerifying(false);
      setIsVerified(false);
      setOtpError('');
      setResendCooldown(0);
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
    } else {
      setEmailInput(recoveryEmail);
    }
  }, [recoveryEmail]);

  // Dev Mode Bypass support
  const [devTapCount, setDevTapCount] = useState<number>(0);
  const [devForceEnabled, setDevForceEnabled] = useState<boolean>(false);

  const isDevMode =
    String(process.env.EXPO_PUBLIC_IS_DEV_MODE || '').trim().toLowerCase() === 'true' ||
    devForceEnabled;

  const handleDevTapBadge = () => {
    const next = devTapCount + 1;
    setDevTapCount(next);
    if (next >= 4) {
      setDevForceEnabled(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch { }
    }
  };

  const handleDevBypass = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { }

    const targetEmail = emailInput.trim().toLowerCase() || 'dev@cashly.local';
    setEmailInput(targetEmail);
    setEmailError('');
    setOtpError('');
    setIsVerified(true);
    await setRecoveryEmail(targetEmail);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }
  };

  const handleDevBypassAndContinue = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { }

    const targetEmail = emailInput.trim().toLowerCase() || 'dev@cashly.local';
    setEmailInput(targetEmail);
    setEmailError('');
    setOtpError('');
    setIsVerified(true);
    await setRecoveryEmail(targetEmail);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }
    await onVerifiedFinish();
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
          clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendVerificationCode = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      setEmailError('Please enter your recovery email address.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address (e.g. name@gmail.com).');
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
        setEmailError('Email server is missing Google App Password in .env.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (result.error === 'CONNECTION_FAILED') {
        setEmailError('Cannot reach email server. Run "npm run email-server" in terminal.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setEmailError(result.message || 'Failed to send code. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setEmailError('Cannot reach email server. Run "npm run email-server" in terminal.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!enteredOtp.trim()) {
      setOtpError('Please enter the 6-digit verification code.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsVerifying(true);
    setOtpError('');

    await new Promise((r) => setTimeout(r, 300));

    // Support dev test bypass codes (000000 or 123456) when in Dev Mode
    const isDevCode =
      (isDevMode || (typeof __DEV__ !== 'undefined' && __DEV__)) &&
      (enteredOtp.trim() === '000000' || enteredOtp.trim() === '123456');

    if (enteredOtp.trim() === generatedOtp || isDevCode) {
      setIsVerified(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch { }
      await setRecoveryEmail(emailInput.trim().toLowerCase() || 'dev@cashly.local');
    } else {
      setOtpError('Incorrect code. Please check your email and try again.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch { }
    }
    setIsVerifying(false);
  };

  const handleFinish = async () => {
    if (!isVerified) {
      setOtpError('Please verify your email before entering.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await onVerifiedFinish();
  };

  const cardContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.bgPrimary }]}>
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.stepContainer}
          >
            {/* Step Tracker Badge & Optional Close Button */}
            <View style={styles.stepBadgeRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDevTapBadge}
                style={[styles.stepBadge, { backgroundColor: '#e4f5e4' }]}
              >
                <Text style={[styles.stepBadgeText, { color: '#24783e' }]}>
                  {badgeText}
                </Text>
              </TouchableOpacity>

              {onClose && (
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.closeIconBtn, { backgroundColor: colors.bgSecondary }]}
                >
                  <Ionicons name="close" size={18} color={colors.textMain} />
                </TouchableOpacity>
              )}
            </View>

            {/* Title & Subtitle */}
            <View style={styles.headerCol}>
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                {isVerified ? 'Email Verified! 🎉' : (title || 'Link Recovery Email ✉️')}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                {isVerified
                  ? 'Your email has been verified! Tap below to save.'
                  : (subtitle || 'Required to recover your PIN code and secure your vault.')}
              </Text>
            </View>

            {/* Verified Success State */}
            {isVerified ? (
              <View style={[styles.verifiedCard, { backgroundColor: '#d3f2db', borderColor: '#24783e' }]}>
                <Ionicons name="checkmark-circle" size={36} color="#24783e" style={{ marginBottom: 6 }} />
                <Text style={[styles.verifiedTitle, { color: '#24783e' }]}>
                  Verified Successfully!
                </Text>
                <Text style={[styles.verifiedEmailText, { color: '#243326' }]}>
                  {emailInput.trim().toLowerCase()}
                </Text>
              </View>
            ) : (
              <>
                {/* Email Input Field */}
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textMain }]}>
                    Enter Email:
                  </Text>
                  <View
                    style={[
                      styles.emailInputRow,
                      {
                        backgroundColor: colors.bgSecondary,
                        borderColor: emailError ? colors.danger : colors.borderSoft,
                      },
                    ]}
                  >
                    <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.emailInput, { color: colors.textMain }]}
                      placeholder="youremail@gmail.com"
                      placeholderTextColor={colors.textSubtle}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={emailInput}
                      editable={!isSendingCode && !isCodeSent}
                      onChangeText={(txt) => {
                        setEmailInput(txt);
                        setEmailError('');
                      }}
                    />
                    {emailInput.length > 0 && !isCodeSent && (
                      <TouchableOpacity onPress={() => setEmailInput('')} activeOpacity={0.7}>
                        <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {emailError ? (
                    <Text style={[styles.fieldError, { color: colors.danger }]}>{emailError}</Text>
                  ) : null}
                </View>

                {/* Send Code Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSendVerificationCode}
                  disabled={isSendingCode || resendCooldown > 0}
                  style={[
                    styles.sendCodeBtn,
                    {
                      backgroundColor:
                        isSendingCode || resendCooldown > 0
                          ? colors.bgSecondary
                          : colors.primaryGreen || '#65a865',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sendCodeBtnText,
                      {
                        color:
                          isSendingCode || resendCooldown > 0
                            ? colors.textMuted
                            : '#ffffff',
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

                {/* OTP Input Field */}
                {isCodeSent && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMain, marginTop: 12 }]}>
                      Enter 6-Digit Code:
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
                    </View>
                    {otpError ? (
                      <Text style={[styles.fieldError, { color: colors.danger }]}>{otpError}</Text>
                    ) : null}

                    {/* Verify Button */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleVerifyCode}
                      disabled={isVerifying || enteredOtp.length < 6}
                      style={[
                        styles.verifyBtn,
                        {
                          backgroundColor:
                            isVerifying || enteredOtp.length < 6
                              ? colors.borderSoft
                              : '#10b981',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.verifyBtnText,
                          {
                            color:
                              isVerifying || enteredOtp.length < 6
                                ? colors.textMuted
                                : '#ffffff',
                          },
                        ]}
                      >
                        {isVerifying ? 'Verifying…' : 'Verify Code ✓'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {/* DEV MODE QUICK BYPASS */}
                {isDevMode && (
                  <View style={[styles.devBypassCard, { backgroundColor: '#fffbeb', borderColor: '#f59e0b' }]}>
                    <View style={styles.devBypassHeader}>
                      <Ionicons name="construct" size={13} color="#d97706" />
                      <Text style={styles.devBypassBadgeText}>DEV MODE ACTIVE</Text>
                    </View>
                    <Text style={styles.devBypassHint}>
                      Testing mode: bypass email verification without requesting codes.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleDevBypass}
                        style={[styles.devBypassBtn, { backgroundColor: '#fef3c7', borderColor: '#f59e0b', borderWidth: 1 }]}
                      >
                        <Ionicons name="checkmark-done" size={14} color="#b45309" style={{ marginRight: 4 }} />
                        <Text style={[styles.devBypassBtnText, { color: '#b45309' }]}>Auto-Verify</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleDevBypassAndContinue}
                        style={[styles.devBypassBtn, { backgroundColor: '#d97706', flex: 1.2 }]}
                      >
                        <Ionicons name="flash" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={[styles.devBypassBtnText, { color: '#ffffff' }]}>⚡ Bypass to Step 2 ➡️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Action Buttons */}
            <View style={styles.actionBtnCol}>
              {isVerified && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleFinish}
                  style={styles.finishBtn}
                >
                  <Text style={styles.finishBtnText}>{finishBtnText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  if (isInline) {
    return cardContent;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose || (() => { })}
      statusBarTranslucent
    >
      {cardContent}
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
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  stepContainer: {
    paddingBottom: 8,
  },
  stepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  closeIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  headerCol: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 48,
  },
  emailInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldError: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  sendCodeBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sendCodeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  verifyBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  verifyBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  verifiedCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  verifiedTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  verifiedEmailText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnCol: {
    marginTop: 18,
    gap: 8,
  },
  finishBtn: {
    backgroundColor: '#10b981',
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  finishBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  backBtn: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  devBypassCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 6,
  },
  devBypassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  devBypassBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 0.6,
  },
  devBypassHint: {
    fontSize: 11,
    color: '#78350f',
    lineHeight: 15,
  },
  devBypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  devBypassBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
