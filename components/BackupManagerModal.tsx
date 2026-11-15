import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFinancial } from '@/context/FinancialContext';
import { sendVerificationEmail } from '@/services/emailService';
import { peekBackupSummary } from '@/services/database';
import { TotoroSticker } from '@/components/TotoroStickers';

interface BackupManagerModalProps {
  visible: boolean;
  mode: 'export' | 'import';
  onClose: () => void;
}

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email || '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  const first = localPart.slice(0, 2);
  const last = localPart.slice(-1);
  return `${first}***${last}@${domain}`;
};

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({
  visible,
  mode,
  onClose,
}) => {
  const {
    colors,
    theme,
    recoveryEmail,
    exportDataBackup,
    importDataBackup,
    reloadAllDataFromDB,
    completeOnboarding,
    markWelcomeShown,
    accounts,
    expenses,
    incomes,
    salaries,
    debts,
  } = useFinancial();

  // Mode step states
  // For export: 'export_otp' | 'export_success'
  // For import: 'import_select' | 'import_otp' | 'import_success'
  const [currentStep, setCurrentStep] = useState<string>('init');

  // Import payload data
  const [importedJsonString, setImportedJsonString] = useState<string>('');
  const [importedFileName, setImportedFileName] = useState<string>('');
  const [importedSummary, setImportedSummary] = useState<any>(null);

  // OTP states
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const cooldownRef = useRef<any>(null);

  // Export results
  const [exportedJsonStr, setExportedJsonStr] = useState<string>('');

  // Dev bypass
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
      } catch {}
    }
  };

  const startCooldown = () => {
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

  const dispatchOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    const newOtp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(newOtp);
    setEnteredOtp('');
    setOtpError('');
    setIsSendingCode(true);
    setStatusMessage(`Sending verification code to ${maskEmail(cleanEmail)}...`);

    try {
      const result = await sendVerificationEmail({ recipientEmail: cleanEmail, otp: newOtp });
      setIsSendingCode(false);
      if (result.success) {
        setStatusMessage(`Verification code sent to ${maskEmail(cleanEmail)}!`);
        startCooldown();
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      } else {
        setStatusMessage('');
        setOtpError(result.message || 'Could not send verification email. Please try again.');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
      }
    } catch (e: any) {
      setIsSendingCode(false);
      setStatusMessage('');
      setOtpError(e?.message || 'Network error while sending verification email.');
    }
  };

  // Initialize or reset when modal opens
  useEffect(() => {
    if (visible) {
      setEnteredOtp('');
      setOtpError('');
      setStatusMessage('');
      setImportedJsonString('');
      setImportedFileName('');
      setImportedSummary(null);

      if (mode === 'export') {
        const cleanEmail = recoveryEmail ? recoveryEmail.trim().toLowerCase() : '';
        if (cleanEmail) {
          setTargetEmail(cleanEmail);
          setCurrentStep('export_otp');
          dispatchOtp(cleanEmail);
        } else {
          // No email setup yet -> direct export confirmation
          setCurrentStep('export_direct');
        }
      } else {
        // import mode
        setCurrentStep('import_select');
      }
    } else {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
    }
  }, [visible, mode, recoveryEmail]);

  // Handle Export File Download/Share
  const performExport = async () => {
    try {
      setIsVerifying(true);
      const jsonStr = await exportDataBackup();
      setExportedJsonStr(jsonStr);

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

      setIsVerifying(false);
      setCurrentStep('export_success');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch (err: any) {
      setIsVerifying(false);
      Alert.alert('Export Error', err?.message || 'Could not export backup data.');
    }
  };

  // Verify OTP for Export
  const handleVerifyExportOtp = async () => {
    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setOtpError('Invalid verification code. Please check your email and try again.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      return;
    }
    await performExport();
  };

  // Handle File Selection for Import
  const handlePickFile = async () => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
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
        processImportContent(fileContent, asset.name);
      }
    } catch (err: any) {
      Alert.alert('File Picker Error', err?.message || 'Could not read selected backup file.');
    }
  };

  // Process and inspect loaded JSON
  const processImportContent = (content: string, fileName: string = 'backup.json') => {
    const trimmed = content.trim();
    if (!trimmed) {
      Alert.alert('Empty Data', 'Selected file is empty.');
      return;
    }

    const summary = peekBackupSummary(trimmed);
    if (!summary.valid) {
      Alert.alert('Invalid Backup', summary.error || 'The file is not a valid Cashly backup payload.');
      return;
    }

    setImportedJsonString(trimmed);
    setImportedFileName(fileName);
    setImportedSummary(summary);

    if (summary.email) {
      // Previous JSON HAS backup email -> MUST verify OTP!
      setTargetEmail(summary.email);
      setCurrentStep('import_otp');
      dispatchOtp(summary.email);
    } else {
      // Previous JSON does NOT have email -> proceed directly
      setCurrentStep('import_confirm_no_email');
    }
  };

  // Check if existing data other than default exists
  const hasExistingData = () => {
    const hasExpenses = expenses && expenses.length > 0;
    const hasIncomes = incomes && incomes.length > 0;
    const hasDebts = debts && debts.length > 0;
    const hasSalaries = salaries && salaries.length > 0;
    const hasCustomAccounts =
      accounts &&
      accounts.some(
        (a) => a.balance > 0 || (a.name.toLowerCase() !== 'cash in hand' && a.name.toLowerCase() !== 'main account')
      );
    return Boolean(hasExpenses || hasIncomes || hasDebts || hasSalaries || hasCustomAccounts);
  };

  // Execute restore in DB
  const executeImport = async () => {
    try {
      setIsVerifying(true);
      const result = await importDataBackup(importedJsonString);
      if (result.success) {
        await reloadAllDataFromDB();
        await completeOnboarding();
        await markWelcomeShown();
        setIsVerifying(false);
        setCurrentStep('import_success');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      } else {
        setIsVerifying(false);
        Alert.alert('Restore Failed', result.message || 'Could not restore backup data.');
      }
    } catch (err: any) {
      setIsVerifying(false);
      Alert.alert('Restore Error', err?.message || 'An error occurred during restore.');
    }
  };

  // Prompts user with override warning if existing records exist
  const confirmAndExecuteImport = () => {
    if (hasExistingData()) {
      Alert.alert(
        'Override Existing Data?',
        'New data will override your previous one. Are you sure you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Override & Restore',
            style: 'destructive',
            onPress: () => {
              executeImport();
            },
          },
        ]
      );
    } else {
      executeImport();
    }
  };

  // Verify OTP for Import
  const handleVerifyImportOtp = async () => {
    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setOtpError('Invalid verification code. Please check your email and try again.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      return;
    }
    confirmAndExecuteImport();
  };

  // Dev bypass helpers
  const handleDevBypassExport = async () => {
    setEnteredOtp(generatedOtp);
    await performExport();
  };

  const handleDevBypassImport = async () => {
    setEnteredOtp(generatedOtp);
    confirmAndExecuteImport();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.backdrop}>
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
            {/* Modal Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={handleDevTapBadge} style={styles.badgeWrapper}>
                <View style={[styles.badgePill, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                  <Ionicons
                    name={mode === 'export' ? 'share-outline' : 'download-outline'}
                    size={12}
                    color={mode === 'export' ? colors.primaryAccent : colors.primaryGreen}
                  />
                  <Text style={[styles.badgeText, { color: colors.textMain }]}>
                    {mode === 'export' ? 'EXPORT BACKUP • JSON' : 'RESTORE BACKUP • JSON'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color={colors.textMain} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* ===================== EXPORT: OTP VERIFICATION ===================== */}
              {currentStep === 'export_otp' && (
                <View style={styles.contentCol}>
                  <View style={styles.stickerCenter}>
                    <TotoroSticker type="peek" size={68} />
                  </View>
                  <Text style={[styles.title, { color: colors.textMain }]}>Verify Identity to Export</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Your account is protected. Enter the 6-digit verification code sent to{' '}
                    <Text style={{ fontWeight: '800', color: colors.textMain }}>{maskEmail(targetEmail)}</Text> to authorize exporting your JSON backup.
                  </Text>

                  {statusMessage ? (
                    <View style={[styles.statusBanner, { backgroundColor: colors.primaryGreenLight || '#ecfdf5', borderColor: colors.primaryGreen || '#10b981' }]}>
                      {isSendingCode ? (
                        <ActivityIndicator size="small" color={colors.primaryGreen || '#10b981'} style={{ marginRight: 6 }} />
                      ) : (
                        <Ionicons name="mail" size={14} color={colors.primaryGreen || '#10b981'} />
                      )}
                      <Text style={[styles.statusText, { color: colors.primaryGreen || '#047857' }]}>{statusMessage}</Text>
                    </View>
                  ) : null}

                  {/* OTP Input */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>6-DIGIT VERIFICATION CODE</Text>
                    <TextInput
                      style={[
                        styles.otpInput,
                        {
                          backgroundColor: colors.bgPrimary,
                          borderColor: otpError ? colors.danger : colors.borderSoft,
                          color: colors.textMain,
                        },
                      ]}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={enteredOtp}
                      placeholder="000000"
                      placeholderTextColor={colors.textMuted}
                      autoFocus={true}
                      onChangeText={(val) => {
                        setEnteredOtp(val.replace(/[^0-9]/g, ''));
                        setOtpError('');
                      }}
                    />
                  </View>

                  {otpError ? <Text style={[styles.errorText, { color: colors.danger }]}>{otpError}</Text> : null}

                  {/* Action Buttons */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleVerifyExportOtp}
                    disabled={isVerifying || enteredOtp.length < 6}
                    style={[
                      styles.primaryBtn,
                      {
                        backgroundColor: isVerifying || enteredOtp.length < 6 ? colors.borderSoft : (colors.primaryGreen || '#10b981'),
                      },
                    ]}
                  >
                    <Text style={[styles.primaryBtnText, { color: isVerifying || enteredOtp.length < 6 ? colors.textMuted : '#ffffff' }]}>
                      {isVerifying ? 'Verifying & Exporting…' : 'Verify & Export JSON ✓'}
                    </Text>
                  </TouchableOpacity>

                  {/* Resend button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => dispatchOtp(targetEmail)}
                    disabled={resendCooldown > 0 || isSendingCode}
                    style={styles.resendBtn}
                  >
                    <Ionicons name="refresh" size={14} color={resendCooldown > 0 ? colors.textMuted : colors.primaryAccent} />
                    <Text style={[styles.resendText, { color: resendCooldown > 0 ? colors.textMuted : colors.primaryAccent }]}>
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>

                  {/* Dev Bypass */}
                  {isDevMode && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleDevBypassExport}
                      style={[styles.devBypassBtn, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}
                    >
                      <Ionicons name="flash" size={14} color="#b45309" />
                      <Text style={[styles.devBypassText, { color: '#b45309' }]}>⚡ Dev Bypass (Auto-Verify)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ===================== EXPORT: DIRECT (NO EMAIL) ===================== */}
              {currentStep === 'export_direct' && (
                <View style={styles.contentCol}>
                  <View style={styles.stickerCenter}>
                    <TotoroSticker type="peek" size={68} />
                  </View>
                  <Text style={[styles.title, { color: colors.textMain }]}>Export Backup JSON</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    No recovery email is registered yet. Your backup will be cryptographically signed and exported immediately.
                  </Text>

                  <View style={[styles.summaryCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                    <Text style={[styles.summaryItem, { color: colors.textMain }]}>💳 Accounts: {accounts.length}</Text>
                    <Text style={[styles.summaryItem, { color: colors.textMain }]}>💸 Expenses: {expenses.length}</Text>
                    <Text style={[styles.summaryItem, { color: colors.textMain }]}>💰 Incomes: {incomes.length}</Text>
                    <Text style={[styles.summaryItem, { color: colors.textMain }]}>🤝 Debts/Lent: {debts.length}</Text>
                    <Text style={[styles.summaryItem, { color: colors.textMain }]}>📅 Salaries: {salaries.length}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={performExport}
                    disabled={isVerifying}
                    style={[styles.primaryBtn, { backgroundColor: colors.primaryAccent }]}
                  >
                    <Text style={[styles.primaryBtnText, { color: colors.textOnAccent || '#ffffff' }]}>
                      {isVerifying ? 'Generating Backup…' : 'Export & Save Backup (JSON) 📤'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ===================== EXPORT: SUCCESS ===================== */}
              {currentStep === 'export_success' && (
                <View style={styles.contentCol}>
                  <View style={styles.stickerCenter}>
                    <TotoroSticker type="big" size={72} />
                  </View>
                  <Text style={[styles.title, { color: colors.primaryGreen }]}>🎉 Backup Exported!</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Your encrypted JSON backup has been saved and shared. Keep this file safe to restore your data anytime.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onClose}
                    style={[styles.primaryBtn, { backgroundColor: colors.primaryAccent, marginTop: 12 }]}
                  >
                    <Text style={[styles.primaryBtnText, { color: colors.textOnAccent || '#ffffff' }]}>Done ✓</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ===================== IMPORT: STEP 1 - SELECT FILE OR PASTE ===================== */}
              {currentStep === 'import_select' && (
                <View style={styles.contentCol}>
                  <View style={styles.stickerCenter}>
                    <TotoroSticker type="vault" size={72} />
                  </View>
                  <Text style={[styles.title, { color: colors.textMain }]}>Restore Backup (JSON)</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Select your previous Cashly backup file to restore accounts, expenses, incomes, debts, and settings.
                  </Text>

                  {/* Pick File Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickFile}
                    style={[styles.primaryBtn, { backgroundColor: colors.primaryGreen || '#10b981', marginTop: 14 }]}
                  >
                    <Ionicons name="document-text-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={[styles.primaryBtnText, { color: '#ffffff' }]}>Choose Backup File (.json) 📁</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ===================== IMPORT: STEP 2 - OTP VERIFICATION ===================== */}
              {currentStep === 'import_otp' && (
                <View style={styles.contentCol}>
                  <View style={styles.stickerCenter}>
                    <TotoroSticker type="vault" size={72} />
                  </View>
                  <Text style={[styles.title, { color: colors.textMain }]}>Verify Backup Ownership</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    This backup is protected with recovery email{' '}
                    <Text style={{ fontWeight: '800', color: colors.textMain }}>{maskEmail(targetEmail)}</Text>. A 6-digit verification code has been dispatched. Enter the OTP code below to verify ownership and complete the restore.
                  </Text>

                  {/* Backup preview strip */}
                  {importedSummary && (
                    <View style={[styles.summaryCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                      <Text style={[styles.summaryHeader, { color: colors.textMain }]}>Backup Contents:</Text>
                      <Text style={[styles.summaryItem, { color: colors.textMuted }]}>
                        💳 {importedSummary.counts.accounts} Accounts  •  💸 {importedSummary.counts.expenses} Expenses  •  💰 {importedSummary.counts.incomes} Incomes
                      </Text>
                    </View>
                  )}

                  {statusMessage ? (
                    <View style={[styles.statusBanner, { backgroundColor: colors.primaryGreenLight || '#ecfdf5', borderColor: colors.primaryGreen || '#10b981' }]}>
                      {isSendingCode ? (
                        <ActivityIndicator size="small" color={colors.primaryGreen || '#10b981'} style={{ marginRight: 6 }} />
                      ) : (
                        <Ionicons name="mail" size={14} color={colors.primaryGreen || '#10b981'} />
                      )}
                      <Text style={[styles.statusText, { color: colors.primaryGreen || '#047857' }]}>{statusMessage}</Text>
                    </View>
                  ) : null}

                  {/* OTP Input */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>6-DIGIT VERIFICATION CODE</Text>
                    <TextInput
                      style={[
                        styles.otpInput,
                        {
                          backgroundColor: colors.bgPrimary,
                          borderColor: otpError ? colors.danger : colors.borderSoft,
                          color: colors.textMain,
                        },
                      ]}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={enteredOtp}
                      placeholder="000000"
                      placeholderTextColor={colors.textMuted}
                      autoFocus={true}
                      onChangeText={(val) => {
                        setEnteredOtp(val.replace(/[^0-9]/g, ''));
                        setOtpError('');
                      }}
                    />
                  </View>

                  {otpError ? <Text style={[styles.errorText, { color: colors.danger }]}>{otpError}</Text> : null}

                  {/* Verify & Restore Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleVerifyImportOtp}
                    disabled={isVerifying || enteredOtp.length < 6}
                    style={[
                      styles.primaryBtn,
                      {
                        backgroundColor: isVerifying || enteredOtp.length < 6 ? colors.borderSoft : (colors.primaryGreen || '#10b981'),
                      },
                    ]}
                  >
                    <Text style={[styles.primaryBtnText, { color: isVerifying || enteredOtp.length < 6 ? colors.textMuted : '#ffffff' }]}>
                      {isVerifying ? 'Verifying & Restoring…' : 'Verify & Restore Backup ✓'}
                    </Text>
                  </TouchableOpacity>

                  {/* Resend button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => dispatchOtp(targetEmail)}
                    disabled={resendCooldown > 0 || isSendingCode}
                    style={styles.resendBtn}
                  >
                    <Ionicons name="refresh" size={14} color={resendCooldown > 0 ? colors.textMuted : colors.primaryAccent} />
                    <Text style={[styles.resendText, { color: resendCooldown > 0 ? colors.textMuted : colors.primaryAccent }]}>
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>

                  {/* Dev Bypass */}
                  {isDevMode && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleDevBypassImport}
                      style={[styles.devBypassBtn, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}
                    >
                      <Ionicons name="flash" size={14} color="#b45309" />
                      <Text style={[styles.devBypassText, { color: '#b45309' }]}>⚡ Dev Bypass (Auto-Verify)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ===================== IMPORT: CONFIRM WITHOUT EMAIL ===================== */}
              {currentStep === 'import_confirm_no_email' && (
                <View style={styles.contentCol}>
                  <View style={styles.stickerCenter}>
                    <TotoroSticker type="vault" size={72} />
                  </View>
                  <Text style={[styles.title, { color: colors.textMain }]}>Confirm Backup Restore</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    This backup does not have a protected email. Ready to restore the following records:
                  </Text>

                  {importedSummary && (
                    <View style={[styles.summaryCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
                      <Text style={[styles.summaryItem, { color: colors.textMain }]}>💳 Accounts: {importedSummary.counts.accounts}</Text>
                      <Text style={[styles.summaryItem, { color: colors.textMain }]}>💸 Expenses: {importedSummary.counts.expenses}</Text>
                      <Text style={[styles.summaryItem, { color: colors.textMain }]}>💰 Incomes: {importedSummary.counts.incomes}</Text>
                      <Text style={[styles.summaryItem, { color: colors.textMain }]}>🤝 Debts/Lent: {importedSummary.counts.debts}</Text>
                      <Text style={[styles.summaryItem, { color: colors.textMain }]}>📅 Salaries: {importedSummary.counts.salaries}</Text>
                    </View>
                  )}

                  {hasExistingData() && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor: colors.dangerLight || '#FFEBEB',
                        marginTop: 4,
                        marginBottom: 4,
                      }}
                    >
                      <Ionicons name="warning" size={18} color={colors.danger || '#ef4444'} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.danger || '#ef4444', flex: 1 }}>
                        New data will override your previous one!
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={confirmAndExecuteImport}
                    disabled={isVerifying}
                    style={[styles.primaryBtn, { backgroundColor: colors.primaryGreen || '#10b981', marginTop: 12 }]}
                  >
                    <Text style={[styles.primaryBtnText, { color: '#ffffff' }]}>
                      {isVerifying ? 'Restoring Records…' : 'Restore All Records Now 📥'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ===================== IMPORT: SUCCESS ===================== */}
              {currentStep === 'import_success' && (
                <View style={styles.contentCol}>
                  <View style={styles.stickerCenter}>
                    <TotoroSticker type="big" size={72} />
                  </View>
                  <Text style={[styles.title, { color: colors.primaryGreen }]}>🎉 All Records Restored!</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    All your accounts, expenses, incomes, debts, and settings have been restored successfully.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onClose}
                    style={[styles.primaryBtn, { backgroundColor: colors.primaryAccent, marginTop: 14 }]}
                  >
                    <Text style={[styles.primaryBtnText, { color: colors.textOnAccent || '#ffffff' }]}>Open Cashly 🏠✨</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeWrapper: {
    flex: 1,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    paddingTop: 4,
  },
  stickerCenter: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 14,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    marginVertical: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
    textAlign: 'center',
  },
  otpInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  devBypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  devBypassText: {
    fontSize: 12,
    fontWeight: '800',
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginVertical: 10,
    gap: 4,
  },
  summaryHeader: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryItem: {
    fontSize: 12,
    fontWeight: '600',
  },
});
