import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinancial, TransactionType } from '@/context/FinancialContext';
import { ThemeHeader } from '@/components/ThemeHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { AdminPinModal } from '@/components/AdminPinModal';
import { AestheticModal } from '@/components/AestheticModal';

type AccountSegment = 'balances' | 'transfers' | 'transactions';

export default function AccountsScreen() {
  const {
    colors,
    theme,
    isVaultUnlocked,
    isPrivacyMasked,
    lockVault,
    verifyAccountPin,
    salaryAccountId,
    setSalaryAccountId,
    togglePrivacyMask,
    totalNetWorth,
    currencySymbol,
    accounts,
    transfers,
    transactions,
    filteredTransfers,
    filteredTransactions: contextFilteredTx,
    addAccount,
    addTransfer,
    addTransaction,
    initialCashInHand,
    setCashInHandInitialMoney,
  } = useFinancial();

  const [activeSegment, setActiveSegment] = useState<AccountSegment>('balances');
  const [txFilter, setTxFilter] = useState<string>('All');
  const [txSearch, setTxSearch] = useState<string>('');
  const [transferSearch, setTransferSearch] = useState<string>('');

  // Modals
  const [isAccountPinModalOpen, setIsAccountPinModalOpen] = useState(!isVaultUnlocked);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isInitialCashModalOpen, setIsInitialCashModalOpen] = useState(false);
  const [initialCashInput, setInitialCashInput] = useState('');
  const [isSalaryStorage, setIsSalaryStorage] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Form states - Add Account
  const [accName, setAccName] = useState('');
  const [accEmoji, setAccEmoji] = useState('🏦');
  const [accBalance, setAccBalance] = useState('');
  const [accType, setAccType] = useState<'cash' | 'bank' | 'wallet' | 'credit' | 'savings'>('bank');

  // Form states - Internal Transfer
  const [transFrom, setTransFrom] = useState(accounts[0]?.name || 'Cash');
  const [transTo, setTransTo] = useState(accounts[1]?.name || 'eSewa Wallet');
  const [transAmount, setTransAmount] = useState('');
  const [transReason, setTransReason] = useState('');

  // Form states - Add Transaction
  const [txType, setTxType] = useState<TransactionType>('Expense');
  const [txAmount, setTxAmount] = useState('');
  const [txFrom, setTxFrom] = useState('Cash');
  const [txTo, setTxTo] = useState('Restaurant');
  const [txRef, setTxRef] = useState('');
  const [txCat, setTxCat] = useState('🍔 Food');

  const emojiList = ['🏦', '💵', '🟢', '💳', '🐷', '💼', '📈', '🪙'];

  const txFilterOptions = [
    'All',
    'Income',
    'Expense',
    'Salary',
    'Transfer',
    'Debt Borrowed',
    'Debt Payment',
    'Credit Given',
    'Credit Received',
  ];

  // Handle Add Account Submit
  const handleAddAccountSubmit = () => {
    const bal = parseFloat(accBalance);
    if (!accName.trim() || isNaN(bal)) return;
    const trimmedName = accName.trim();
    const newId = Date.now().toString();

    // If user explicitly checked the salary storage toggle:
    if (isSalaryStorage) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addAccount({
        id: newId,
        name: trimmedName,
        emoji: accEmoji,
        balance: bal,
        type: accType,
      });
      setSalaryAccountId(newId);
      setAccName('');
      setAccBalance('');
      setIsSalaryStorage(false);
      setIsAccountModalOpen(false);
      return;
    }

    // If it's a bank or savings account, ask user where salary is stored for records
    if (accType === 'bank' || accType === 'savings') {
      if (Platform.OS === 'web') {
        const isSalary = window.confirm(
          `💼 Salary Deposit Account?\n\nIs "${trimmedName}" the bank account where your monthly salary is stored for record keeping?`
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addAccount({
          id: newId,
          name: trimmedName,
          emoji: accEmoji,
          balance: bal,
          type: accType,
        });
        if (isSalary) {
          setSalaryAccountId(newId);
        }
        setAccName('');
        setAccBalance('');
        setIsSalaryStorage(false);
        setIsAccountModalOpen(false);
        return;
      }

      Alert.alert(
        '💼 Salary Deposit Account?',
        `Is "${trimmedName}" the bank account where your monthly salary is stored for record keeping?`,
        [
          {
            text: 'No, Regular Account',
            style: 'cancel',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              addAccount({
                id: newId,
                name: trimmedName,
                emoji: accEmoji,
                balance: bal,
                type: accType,
              });
              setAccName('');
              setAccBalance('');
              setIsSalaryStorage(false);
              setIsAccountModalOpen(false);
            },
          },
          {
            text: 'Yes, Store Salary Here',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              addAccount({
                id: newId,
                name: trimmedName,
                emoji: accEmoji,
                balance: bal,
                type: accType,
              });
              setSalaryAccountId(newId);
              setAccName('');
              setAccBalance('');
              setIsSalaryStorage(false);
              setIsAccountModalOpen(false);
            },
          },
        ]
      );
      return;
    }

    // Default for other types
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addAccount({
      id: newId,
      name: trimmedName,
      emoji: accEmoji,
      balance: bal,
      type: accType,
    });
    setAccName('');
    setAccBalance('');
    setIsSalaryStorage(false);
    setIsAccountModalOpen(false);
  };

  // Handle Add Transfer Submit
  const handleAddTransferSubmit = () => {
    const amt = parseFloat(transAmount);
    if (isNaN(amt) || amt <= 0 || transFrom === transTo) return;
    const fromAcc = accounts.find((a) => a.name === transFrom);
    const toAcc = accounts.find((a) => a.name === transTo);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    addTransfer({
      date: dateStr,
      from: transFrom,
      fromEmoji: fromAcc?.emoji || '🏦',
      to: transTo,
      toEmoji: toAcc?.emoji || '🏦',
      amount: amt,
      reason: transReason.trim() || 'Internal Transfer',
    });
    setTransAmount('');
    setTransReason('');
    setIsTransferModalOpen(false);
  };

  // Handle Add Transaction Submit
  const handleAddTxSubmit = () => {
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    addTransaction({
      date: dateStr,
      type: txType,
      amount: amt,
      from: txFrom.trim() || 'Account',
      to: txTo.trim() || 'Destination',
      reference: txRef.trim() || 'Transaction',
      category: txCat.trim() || 'General',
    });
    setTxAmount('');
    setTxRef('');
    setIsTxModalOpen(false);
  };

  // Filtered Transfers
  const filteredTransfersList = useMemo(() => {
    return filteredTransfers.filter((t) => {
      const q = transferSearch.toLowerCase();
      return (
        t.reason.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q) ||
        t.to.toLowerCase().includes(q) ||
        t.date.toLowerCase().includes(q)
      );
    });
  }, [filteredTransfers, transferSearch]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return contextFilteredTx.filter((tx) => {
      const matchesFilter =
        txFilter === 'All' ||
        tx.type.toLowerCase().replace(' ', '') === txFilter.toLowerCase().replace(' ', '');

      const q = txSearch.toLowerCase();
      const matchesQuery =
        !q ||
        tx.reference.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.from.toLowerCase().includes(q) ||
        tx.to.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q);

      return matchesFilter && matchesQuery;
    });
  }, [contextFilteredTx, txFilter, txSearch]);

  // If Vault is locked, display PIN modal popup and aesthetic locked card
  if (!isVaultUnlocked) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
        <ThemeHeader
          title="Account Vault 🔒"
          subtitle="Protected banking & portfolio records"
          stickerKey="vault"
        />
        <View style={styles.lockedContainer}>
          <View style={[styles.lockedCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
            <View style={[styles.lockedIconWrapper, { backgroundColor: colors.primaryAccentLight }]}>
              <Text style={{ fontSize: 44 }}>🔒</Text>
            </View>
            <Text style={[styles.lockedTitle, { color: colors.textMain }]}>Account Vault Locked</Text>
            <Text style={[styles.lockedSubtitle, { color: colors.textMuted }]}>
              Biometric & 4-Digit PIN encryption active. Enter your Account PIN to access balances and transactions.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsAccountPinModalOpen(true);
              }}
              style={[styles.unlockButton, { backgroundColor: colors.primaryAccent }]}
            >
              <Ionicons name="key" size={18} color={colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')} />
              <Text style={[styles.unlockButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
                Unlock Account Vault 🔑
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account PIN Verification Modal */}
        <AdminPinModal
          visible={isAccountPinModalOpen}
          onClose={() => setIsAccountPinModalOpen(false)}
          onSuccess={() => {
            setIsAccountPinModalOpen(false);
          }}
          title="Account Vault Access"
          subtitle="Enter 4-Digit Security PIN to Access Banking Records"
          icon="🏦"
          pinType="account"
          onVerify={verifyAccountPin}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header with Lock Vault button */}
      <ThemeHeader
        title="Account Manager 🏦"
        subtitle="Multi-account balances & transactions"
        stickerKey="vault"
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              lockVault();
              setIsAccountPinModalOpen(true);
            }}
            style={[styles.lockVaultBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}
          >
            <Ionicons name="lock-closed" size={14} color={colors.textMain} />
            <Text style={[styles.lockVaultText, { color: colors.textMain }]}>Lock</Text>
          </TouchableOpacity>
        }
      />

      {/* 3-Section Segment Switcher */}
      <SegmentedControl<AccountSegment>
        options={[
          { key: 'balances', label: 'Amounts' },
          { key: 'transfers', label: 'Own Transfer' },
          { key: 'transactions', label: 'Transactions' },
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
        {/* ===================== SUBVIEW 1: AMOUNTS & BALANCES ===================== */}
        {activeSegment === 'balances' && (
          <View style={styles.container}>
            {/* Total Net Worth Card */}
            <View style={[styles.netWorthCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
              <View style={styles.netWorthHeader}>
                <View>
                  <Text style={[styles.netWorthLabel, { color: colors.textMuted }]}>Total Net Worth</Text>
                  <Text style={[styles.netWorthValue, { color: colors.textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                    {isPrivacyMasked ? `${currencySymbol} ••••••••` : `${currencySymbol} ${totalNetWorth.toLocaleString()}`}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={togglePrivacyMask}
                  style={[styles.privacyBtn, { backgroundColor: colors.bgSecondary }]}
                >
                  <Ionicons
                    name={isPrivacyMasked ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMain}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Accounts Table List */}
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Accounts & Wallets 💼</Text>
                <TouchableOpacity
                  onPress={() => setIsAccountModalOpen(true)}
                  style={[styles.smallAddBtn, { backgroundColor: colors.primaryAccentLight }]}
                >
                  <Text style={[styles.smallAddText, { color: colors.activeTabTint }]}>＋ Add Account</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.accountsList}>
                {accounts.map((acc) => {
                  const isNegative = acc.balance < 0;
                  const isSalaryAcc = acc.id === salaryAccountId;
                  return (
                    <View key={acc.id} style={[styles.accountRow, { borderBottomColor: colors.borderSoft }]}>
                      <View style={styles.accountLeft}>
                        <View style={[styles.accountEmojiWrap, { backgroundColor: colors.bgSecondary }]}>
                          <Text style={styles.accountEmoji}>{acc.emoji}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={[styles.accountName, { color: colors.textMain }]} numberOfLines={1} ellipsizeMode="tail">
                              {acc.name}
                            </Text>
                            {isSalaryAcc && (
                              <View style={[styles.salaryBadge, { backgroundColor: colors.primaryGreenLight, borderColor: colors.primaryGreen }]}>
                                <Text style={[styles.salaryBadgeText, { color: colors.primaryGreen }]}>💼 Salary</Text>
                              </View>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            <Text style={[styles.accountType, { color: colors.textMuted }]}>
                              {acc.type.toUpperCase()}
                            </Text>
                            {!isSalaryAcc && (acc.type === 'bank' || acc.type === 'savings') && (
                              <TouchableOpacity
                                onPress={() => {
                                  if (Platform.OS === 'web') {
                                    const ok = window.confirm(
                                      `💼 Designate Salary Account\n\nDesignate "${acc.name}" as the bank account where monthly salary is stored for record keeping?`
                                    );
                                    if (ok) {
                                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                      setSalaryAccountId(acc.id);
                                    }
                                    return;
                                  }

                                  Alert.alert(
                                    '💼 Designate Salary Account',
                                    `Designate "${acc.name}" as the bank account where monthly salary is stored for record keeping?`,
                                    [
                                      { text: 'Cancel', style: 'cancel' },
                                      {
                                        text: 'Designate',
                                        onPress: () => {
                                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                          setSalaryAccountId(acc.id);
                                        },
                                      },
                                    ]
                                  );
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryAccent }}>
                                  Set Salary 💼
                                </Text>
                              </TouchableOpacity>
                            )}
                            {(acc.type === 'cash' || acc.name.toLowerCase().includes('cash in hand')) && (
                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setInitialCashInput(initialCashInHand > 0 ? String(initialCashInHand) : (acc.balance > 0 ? String(acc.balance) : ''));
                                  setIsInitialCashModalOpen(true);
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryGreen }}>
                                  Initial Money 💵
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>

                      <View style={styles.accountRight}>
                        <Text
                          style={[
                            styles.accountBalance,
                            { color: isNegative ? colors.danger : colors.primaryGreen },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {isPrivacyMasked
                            ? `${currencySymbol} •••••`
                            : `${isNegative ? '-' : ''}${currencySymbol} ${Math.abs(acc.balance).toLocaleString()}`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ===================== SUBVIEW 2: OWN MONEY TRANSFERS ===================== */}
        {activeSegment === 'transfers' && (
          <View style={styles.container}>
            {/* Header Action Row */}
            <View style={styles.subviewHeaderRow}>
              <View style={[styles.searchBox, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                <Ionicons name="search" size={16} color={colors.textSubtle} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textMain }]}
                  placeholder="Search internal transfers..."
                  placeholderTextColor={colors.textSubtle}
                  value={transferSearch}
                  onChangeText={setTransferSearch}
                />
              </View>

              <TouchableOpacity
                onPress={() => setIsTransferModalOpen(true)}
                style={[styles.actionCircleBtn, { backgroundColor: colors.primaryAccent }]}
              >
                <Ionicons name="add" size={22} color={colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')} />
              </TouchableOpacity>
            </View>

            {/* Transfers List */}
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMain, marginBottom: 12 }]}>
                Transfer Flow History 🔄
              </Text>

              {filteredTransfersList.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No internal transfers found.</Text>
              ) : (
                filteredTransfersList.map((item) => (
                  <View key={item.id} style={[styles.transferCard, { borderBottomColor: colors.borderSoft }]}>
                    <View style={styles.transferTop}>
                      <View style={styles.routePill}>
                        <Text style={[styles.routeName, { color: colors.textMain }]}>
                          {item.fromEmoji} {item.from}
                        </Text>
                        <Ionicons name="arrow-forward" size={12} color={colors.activeTabTint} style={{ marginHorizontal: 4 }} />
                        <Text style={[styles.routeName, { color: colors.textMain }]}>
                          {item.toEmoji} {item.to}
                        </Text>
                      </View>
                      <Text style={[styles.transferAmount, { color: colors.activeTabTint }]}>
                        {currencySymbol} {item.amount.toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.transferBottom}>
                      <Text style={[styles.transferReason, { color: colors.textMuted }]}>{item.reason}</Text>
                      <Text style={[styles.transferDate, { color: colors.textSubtle }]}>{item.date}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ===================== SUBVIEW 3: ALL UNIFIED TRANSACTIONS ===================== */}
        {activeSegment === 'transactions' && (
          <View style={styles.container}>
            {/* Search & Add Action Row */}
            <View style={styles.subviewHeaderRow}>
              <View style={[styles.searchBox, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft, borderWidth: 1, ...colors.cardShadow }]}>
                <Ionicons name="search" size={16} color={colors.textSubtle} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textMain }]}
                  placeholder="Search .........."
                  placeholderTextColor={colors.textSubtle}
                  value={txSearch}
                  onChangeText={setTxSearch}
                />
              </View>

              <TouchableOpacity
                onPress={() => setIsTxModalOpen(true)}
                style={[styles.actionCircleBtn, { backgroundColor: colors.primaryAccent }]}
              >
                <Ionicons name="add" size={22} color={colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')} />
              </TouchableOpacity>
            </View>

            {/* Horizontal Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsScroll}>
              {txFilterOptions.map((f) => {
                const isSelected = txFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTxFilter(f);
                    }}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSelected ? colors.primaryAccent : colors.bgCard,
                        borderColor: isSelected ? colors.primaryAccent : colors.borderSoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: isSelected
                            ? colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')
                            : colors.textMuted,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Transactions Ledger Cards */}
            <View style={styles.ledgerList}>
              {filteredTransactions.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
                  <Text style={styles.emptyEmoji}>📜</Text>
                  <Text style={[styles.emptyTitle, { color: colors.textMain }]}>No Transactions Found</Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                    No entries match your filter criteria.
                  </Text>
                </View>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncoming = ['Income', 'Salary', 'Credit Received', 'Debt Borrowed'].includes(tx.type);
                  return (
                    <View
                      key={tx.id}
                      style={[
                        styles.fullTxCard,
                        {
                          backgroundColor: colors.bgCard,
                          borderColor: colors.borderSoft,
                          borderWidth: 1,
                          ...colors.cardShadow,
                        },
                      ]}
                    >
                      {/* Top Row: Date & Type Badge */}
                      <View style={styles.txCardTopRow}>
                        <Text style={[styles.txCardDate, { color: colors.textMuted }]}>📅 {tx.date}</Text>
                        <View style={[styles.txTypeBadge, { backgroundColor: isIncoming ? colors.primaryGreenLight : colors.primaryAccentLight }]}>
                          <Text style={[styles.txTypeBadgeText, { color: isIncoming ? colors.primaryGreen : colors.activeTabTint }]}>
                            {tx.type}
                          </Text>
                        </View>
                      </View>

                      {/* Middle Row: Reference Title & Amount */}
                      <View style={styles.txCardMidRow}>
                        <Text style={[styles.txCardRef, { color: colors.textMain }]}>{tx.reference || tx.category}</Text>
                        <Text
                          style={[
                            styles.txCardAmount,
                            { color: isIncoming ? colors.primaryGreen : colors.danger },
                          ]}
                        >
                          {isIncoming ? '+' : '-'}{currencySymbol} {tx.amount.toLocaleString()}
                        </Text>
                      </View>

                      {/* Bottom Flow Route */}
                      <View style={styles.txCardBottomRow}>
                        <Text style={[styles.txFlowPill, { backgroundColor: colors.bgSecondary, color: colors.textMuted }]}>
                          From: {tx.from}
                        </Text>
                        <Ionicons name="arrow-forward" size={10} color={colors.textSubtle} style={{ marginHorizontal: 4 }} />
                        <Text style={[styles.txFlowPill, { backgroundColor: colors.bgSecondary, color: colors.textMuted }]}>
                          To: {tx.to}
                        </Text>
                        <Text style={[styles.txCategoryTag, { color: colors.textSubtle }]}>
                          🏷️ {tx.category}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ===================== MODAL: CASH IN HAND INITIAL MONEY ===================== */}
      <AestheticModal
        visible={isInitialCashModalOpen}
        onClose={() => setIsInitialCashModalOpen(false)}
        title="Cash in Hand - Initial Money 💵"
        subtitle="Set your physical cash starting balance"
        icon="💵"
      >
        <View style={{ paddingVertical: 4 }}>
          <View style={{ backgroundColor: colors.bgSecondary, padding: 12, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.borderSoft }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
              💡 <Text style={{ fontWeight: '800', color: colors.textMain }}>Opening Balance:</Text> Initial money sets your physical cash starting balance. It does NOT count as incoming income and will not be recorded in transactions.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMain }]}>
              Initial Cash in Hand Amount ({currencySymbol})
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: colors.borderSoft,
                  color: colors.textMain,
                  fontSize: 16,
                  fontWeight: '700',
                },
              ]}
              value={initialCashInput}
              onChangeText={setInitialCashInput}
              placeholder="e.g. 5000"
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsInitialCashModalOpen(false)}
              style={[styles.submitButton, { flex: 1, backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.borderSoft }]}
            >
              <Text style={[styles.submitButtonText, { color: colors.textMain }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                const num = parseFloat(initialCashInput);
                if (isNaN(num) || num < 0) return;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await setCashInHandInitialMoney(num);
                setIsInitialCashModalOpen(false);
              }}
              style={[styles.submitButton, { flex: 1.5, backgroundColor: colors.primaryGreen }]}
            >
              <Text style={[styles.submitButtonText, { color: '#ffffff' }]}>Save Initial Money 💵</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AestheticModal>

      {/* ===================== MODAL: ADD ACCOUNT ===================== */}
      <AestheticModal
        visible={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Add Account"
        subtitle="Add a new bank, cash wallet, or credit line"
        icon="💼"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Account Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Nabil Bank, Khalti"
            placeholderTextColor={colors.textSubtle}
            value={accName}
            onChangeText={setAccName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Select Icon / Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {emojiList.map((em, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setAccEmoji(em)}
                style={[
                  styles.emojiChip,
                  { backgroundColor: accEmoji === em ? colors.primaryAccent : colors.bgSecondary },
                ]}
              >
                <Text style={styles.emojiText}>{em}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Account Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {(['bank', 'wallet', 'cash', 'credit', 'savings'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setAccType(t)}
                style={[
                  styles.choiceChip,
                  { backgroundColor: accType === t ? colors.primaryAccent : colors.bgSecondary },
                ]}
              >
                <Text style={[styles.choiceChipText, { color: accType === t ? (colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')) : colors.textMuted }]}>
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Initial Balance ({currencySymbol})</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="25000"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={accBalance}
            onChangeText={setAccBalance}
          />
        </View>

        {/* Salary Deposit Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsSalaryStorage(!isSalaryStorage)}
          style={[
            styles.salaryToggleBox,
            {
              backgroundColor: isSalaryStorage ? colors.primaryGreenLight : colors.bgSecondary,
              borderColor: isSalaryStorage ? colors.primaryGreen : colors.borderSoft,
            },
          ]}
        >
          <Ionicons
            name={isSalaryStorage ? 'checkbox' : 'square-outline'}
            size={22}
            color={isSalaryStorage ? colors.primaryGreen : colors.textMuted}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.salaryToggleTitle, { color: colors.textMain }]}>
              Store Monthly Salary Here? 💼
            </Text>
            <Text style={[styles.salaryToggleSubtitle, { color: colors.textMuted }]}>
              Designate as bank account where salary is stored for record keeping
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAddAccountSubmit}
          style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
            Create Account 💼
          </Text>
        </TouchableOpacity>
      </AestheticModal>

      {/* ===================== MODAL: INTERNAL TRANSFER ===================== */}
      <AestheticModal
        visible={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Own Money Transfer"
        subtitle="Transfer money between your own accounts"
        icon="🔄"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>From Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                onPress={() => setTransFrom(acc.name)}
                style={[
                  styles.choiceChip,
                  { backgroundColor: transFrom === acc.name ? colors.primaryAccent : colors.bgSecondary },
                ]}
              >
                <Text style={[styles.choiceChipText, { color: transFrom === acc.name ? (colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')) : colors.textMuted }]}>
                  {acc.emoji} {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>To Destination Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                onPress={() => setTransTo(acc.name)}
                style={[
                  styles.choiceChip,
                  { backgroundColor: transTo === acc.name ? colors.primaryGreen : colors.bgSecondary },
                ]}
              >
                <Text style={[styles.choiceChipText, { color: transTo === acc.name ? (theme === 'noir' ? '#121214' : '#ffffff') : colors.textMuted }]}>
                  {acc.emoji} {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Transfer Amount ({currencySymbol})</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="2000"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={transAmount}
            onChangeText={setTransAmount}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Reason / Purpose</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Wallet Top-up, Savings allocation"
            placeholderTextColor={colors.textSubtle}
            value={transReason}
            onChangeText={setTransReason}
          />
        </View>

        <TouchableOpacity
          onPress={handleAddTransferSubmit}
          style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
            Execute Transfer 🔄
          </Text>
        </TouchableOpacity>
      </AestheticModal>

      {/* ===================== MODAL: MASTER TRANSACTION ===================== */}
      <AestheticModal
        visible={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title="Add Transaction"
        subtitle="Log a comprehensive transaction record"
        icon="📜"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Transaction Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {txFilterOptions.filter((t) => t !== 'All').map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setTxType(type as TransactionType)}
                style={[
                  styles.choiceChip,
                  { backgroundColor: txType === type ? colors.primaryAccent : colors.bgSecondary },
                ]}
              >
                <Text style={[styles.choiceChipText, { color: txType === type ? (colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214')) : colors.textMuted }]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Amount ({currencySymbol})</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="500"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={txAmount}
            onChangeText={setTxAmount}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>From (Source)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Cash, Employer, Friend"
            placeholderTextColor={colors.textSubtle}
            value={txFrom}
            onChangeText={setTxFrom}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>To (Destination)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Grocery Store, NIC Asia Bank"
            placeholderTextColor={colors.textSubtle}
            value={txTo}
            onChangeText={setTxTo}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Reference / Description</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Weekly Groceries, Dinner"
            placeholderTextColor={colors.textSubtle}
            value={txRef}
            onChangeText={setTxRef}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Category</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. 🍔 Food, 🛍️ Shopping"
            placeholderTextColor={colors.textSubtle}
            value={txCat}
            onChangeText={setTxCat}
          />
        </View>

        <TouchableOpacity
          onPress={handleAddTxSubmit}
          style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.submitButtonText, { color: colors.textOnAccent || (theme === 'kawaii' ? '#2c352d' : '#121214') }]}>
            Save Master Transaction 📜
          </Text>
        </TouchableOpacity>
      </AestheticModal>

      {/* Account PIN Verification Modal */}
      <AdminPinModal
        visible={isAccountPinModalOpen}
        onClose={() => setIsAccountPinModalOpen(false)}
        onSuccess={() => {
          setIsAccountPinModalOpen(false);
        }}
        title="Account Vault Access"
        subtitle="Enter 4-Digit Security PIN to Access Banking Records"
        icon="🏦"
        pinType="account"
        onVerify={verifyAccountPin}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  lockVaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  lockVaultText: {
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  netWorthCard: {
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
  },
  netWorthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  netWorthLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  netWorthValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  privacyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
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
  smallAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  smallAddText: {
    fontSize: 11,
    fontWeight: '800',
  },
  accountsList: {
    gap: 12,
    width: '100%',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  accountLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 10,
    minWidth: 0,
  },
  accountRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  accountEmojiWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  accountEmoji: {
    fontSize: 20,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
  },
  accountType: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  // Subview 2 styles
  subviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  actionCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  transferCard: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  transferTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  routePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    minWidth: 0,
    marginRight: 8,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  transferAmount: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 0,
    textAlign: 'right',
  },
  transferBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transferReason: {
    fontSize: 12,
    fontWeight: '500',
  },
  transferDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Subview 3 styles
  filterPillsScroll: {
    marginVertical: 4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 12,
  },
  ledgerList: {
    gap: 12,
  },
  fullTxCard: {
    borderRadius: 20,
    padding: 14,
    gap: 8,
    overflow: 'hidden',
  },
  txCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txCardDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  txTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  txTypeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  txCardMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  txCardRef: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    paddingRight: 10,
    minWidth: 0,
  },
  txCardAmount: {
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 0,
    textAlign: 'right',
  },
  txCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  txFlowPill: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txCategoryTag: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  emptyCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
  // Form styles
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
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
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  lockedCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  lockedIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  lockedSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    width: '100%',
  },
  unlockButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  salaryToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  salaryToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  salaryToggleSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  salaryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  salaryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
