import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinancial, DebtItem } from '@/context/FinancialContext';
import { ThemeHeader } from '@/components/ThemeHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { AestheticModal } from '@/components/AestheticModal';

type DebtSegment = 'borrowed' | 'lent';

export default function DebitCreditScreen() {
  const { colors, theme, debts, accounts, addDebt, recordInstallment } = useFinancial();
  const [segment, setSegment] = useState<DebtSegment>('borrowed');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Form states - Add Debt
  const [personName, setPersonName] = useState('');
  const [debtEmoji, setDebtEmoji] = useState('💰');
  const [totalAmount, setTotalAmount] = useState('');
  const [debtType, setDebtType] = useState<'borrowed' | 'lent'>('borrowed');
  const [debtReason, setDebtReason] = useState('');
  const [debtAccount, setDebtAccount] = useState(accounts[0]?.name || 'Cash');

  // Form states - Record Repayment
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccount, setRepayAccount] = useState(accounts[0]?.name || 'Cash');

  const filteredDebts = debts.filter((d) => d.type === segment);

  const emojiList = ['💰', '🖐️', '🤝', '👤', '💼', '💳', '🏠', '✨'];

  // Handle Add Debt Submit
  const handleAddDebtSubmit = () => {
    const total = parseFloat(totalAmount);
    if (!personName.trim() || isNaN(total) || total <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const chosenAcc = debtAccount || accounts[0]?.name || 'Cash';
    addDebt({
      person: personName.trim(),
      emoji: debtEmoji,
      total,
      type: debtType,
      reason: debtReason.trim(),
      account: chosenAcc,
    });
    setPersonName('');
    setTotalAmount('');
    setDebtReason('');
    setIsAddModalOpen(false);
  };

  // Handle Record Repayment Submit
  const handleRepaymentSubmit = () => {
    if (!selectedDebt) return;
    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    recordInstallment(selectedDebt.id, amount, repayAccount);
    setRepayAmount('');
    setIsHistoryModalOpen(false);
    setSelectedDebt(null);
  };

  const handleCardPress = (debt: DebtItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDebt(debt);
    setRepayAccount(debt.account || accounts[0]?.name || 'Cash in Hand');
    setIsHistoryModalOpen(true);
  };

  const borrowedTotal = debts
    .filter((d) => d.type === 'borrowed')
    .reduce((sum, d) => sum + d.remaining, 0);

  const lentTotal = debts
    .filter((d) => d.type === 'lent')
    .reduce((sum, d) => sum + d.remaining, 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <ThemeHeader
        title="Debt & Credit 💳"
        subtitle="Manage loans and friend balances 🤝"
        stickerKey="debitCredit"
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setDebtType(segment);
              setDebtAccount(accounts[0]?.name || 'Cash in Hand');
              setDebtReason('');
              setIsAddModalOpen(true);
            }}
            style={[styles.headerAddBtn, { backgroundColor: colors.primaryAccent }]}
          >
            <Ionicons name="add" size={20} color={theme === 'kawaii' ? '#2c352d' : '#ffffff'} />
          </TouchableOpacity>
        }
      />

      {/* Segment Switcher */}
      <SegmentedControl<DebtSegment>
        options={[
          {
            key: 'borrowed',
            label: 'Money Borrowed 💰',
            badge: `Rs. ${borrowedTotal.toLocaleString()}`,
          },
          {
            key: 'lent',
            label: 'Money Lent 🤝',
            badge: `Rs. ${lentTotal.toLocaleString()}`,
          },
        ]}
        selectedKey={segment}
        onSelect={setSegment}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.listContainer}>
          {filteredDebts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSoft }]}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={[styles.emptyTitle, { color: colors.textMain }]}>No {segment === 'borrowed' ? 'borrowed debts' : 'money lent'}!</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                All balances are clear. Tap + above to add a new record.
              </Text>
            </View>
          ) : (
            filteredDebts.map((item) => {
              const paidAmount = item.total - item.remaining;
              const percent = Math.min(100, Math.round((paidAmount / item.total) * 100));
              const isCompleted = item.status === 'Completed' || item.remaining === 0;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => handleCardPress(item)}
                  style={[
                    styles.debtCard,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: colors.borderSoft,
                      borderWidth: 1,
                      ...colors.cardShadow,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.personRow}>
                      <View style={[styles.avatarCircle, { backgroundColor: colors.bgSecondary }]}>
                        <Text style={styles.avatarEmoji}>{item.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.personName, { color: colors.textMain }]} numberOfLines={1}>
                          {item.person}
                        </Text>
                        <Text style={[styles.cardTypeSub, { color: colors.textMuted }]} numberOfLines={1}>
                          {item.type === 'borrowed' ? 'You owe them' : 'They owe you'}
                          {item.account ? ` • Via ${item.account}` : ''}
                        </Text>
                        {item.reason ? (
                          <Text
                            style={{
                              fontSize: 11,
                              color: colors.textSubtle,
                              marginTop: 2,
                              fontStyle: 'italic',
                            }}
                            numberOfLines={1}
                          >
                            📝 {item.reason}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isCompleted ? colors.statusCompletedBg : colors.statusPendingBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: isCompleted ? colors.statusCompletedText : colors.statusPendingText,
                          },
                        ]}
                      >
                        {isCompleted ? 'Completed 🟢' : 'Pending 🔴'}
                      </Text>
                    </View>
                  </View>

                  {/* Financial Breakdown Row */}
                  <View style={styles.financialRow}>
                    <View>
                      <Text style={[styles.finLabel, { color: colors.textMuted }]}>Remaining</Text>
                      <Text style={[styles.finValue, { color: isCompleted ? colors.primaryGreen : colors.danger }]}>
                        Rs. {item.remaining.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.alignRight}>
                      <Text style={[styles.finLabel, { color: colors.textMuted }]}>Total Loan</Text>
                      <Text style={[styles.finValueMuted, { color: colors.textMain }]}>
                        Rs. {item.total.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.progressBg, { backgroundColor: colors.bgSecondary }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: isCompleted ? colors.primaryGreen : colors.primaryAccent,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.percentText, { color: colors.textMuted }]}>
                      {percent}% Repaid (Rs. {paidAmount.toLocaleString()})
                    </Text>
                    <Text style={[styles.tapHint, { color: colors.activeTabTint }]}>
                      View History ❯
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ===================== MODAL: ADD DEBT ===================== */}
      <AestheticModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={debtType === 'borrowed' ? 'Add Borrowed Debt' : 'Add Money Lent'}
        subtitle="Log a new personal liability or credit"
        icon="💳"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Type</Text>
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              onPress={() => setDebtType('borrowed')}
              style={[
                styles.typeOptionBtn,
                { backgroundColor: debtType === 'borrowed' ? colors.primaryAccent : colors.bgSecondary },
              ]}
            >
              <Text style={[styles.typeOptionText, { color: debtType === 'borrowed' ? (theme === 'kawaii' ? '#2c352d' : '#ffffff') : colors.textMuted }]}>
                Money Borrowed 💰
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDebtType('lent')}
              style={[
                styles.typeOptionBtn,
                { backgroundColor: debtType === 'lent' ? colors.primaryGreen : colors.bgSecondary },
              ]}
            >
              <Text style={[styles.typeOptionText, { color: debtType === 'lent' ? '#ffffff' : colors.textMuted }]}>
                Money Lent 🤝
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Person Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="e.g. Ram Sharma"
            placeholderTextColor={colors.textSubtle}
            value={personName}
            onChangeText={setPersonName}
          />
        </View>

        {/* Reason / Note */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Reason / Note 📝</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder={debtType === 'lent' ? 'e.g. Lunch bill, Trip expense, Urgent help' : 'e.g. Laptop repair, College fee, Emergency'}
            placeholderTextColor={colors.textSubtle}
            value={debtReason}
            onChangeText={setDebtReason}
          />
        </View>

        {/* Source Account Picker */}
        <View style={styles.formGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={[styles.inputLabel, { color: colors.textMain }]}>
              {debtType === 'lent' ? 'Deduct From Account (Source):' : 'Deposit Into Account (Source):'}
            </Text>
            <View style={[styles.sourceBadgePill, { backgroundColor: debtType === 'lent' ? colors.dangerLight : colors.primaryGreenLight }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: debtType === 'lent' ? colors.danger : colors.primaryGreen }}>
                {debtAccount}
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {accounts.map((acc) => {
              const isSelected = debtAccount === acc.name;
              return (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDebtAccount(acc.name);
                  }}
                  style={[
                    styles.accountChip,
                    {
                      backgroundColor: isSelected
                        ? (debtType === 'lent' ? colors.primaryAccent : colors.primaryGreen)
                        : colors.bgSecondary,
                      borderColor: isSelected
                        ? (debtType === 'lent' ? colors.borderAccent : colors.primaryGreen)
                        : colors.borderSoft,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 13 }}>{acc.emoji}</Text>
                  <Text
                    style={[
                      styles.accountChipText,
                      {
                        color: isSelected
                          ? (debtType === 'lent' && theme === 'kawaii' ? '#2c352d' : '#ffffff')
                          : colors.textMain,
                      },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={[styles.sourceNoticeBox, { backgroundColor: debtType === 'lent' ? colors.dangerLight : colors.primaryGreenLight, borderColor: debtType === 'lent' ? '#f4aab9' : colors.primaryGreen }]}>
            <Ionicons
              name={debtType === 'lent' ? 'remove-circle' : 'add-circle'}
              size={15}
              color={debtType === 'lent' ? colors.danger : colors.primaryGreen}
            />
            <Text style={[styles.sourceNoticeText, { color: debtType === 'lent' ? colors.danger : colors.primaryGreen }]}>
              {debtType === 'lent'
                ? `Subtracts Rs. ${totalAmount ? parseFloat(totalAmount).toLocaleString() : '0'} from ${debtAccount} balance & logs in ledger`
                : `Adds Rs. ${totalAmount ? parseFloat(totalAmount).toLocaleString() : '0'} to ${debtAccount} balance & logs in ledger`}
            </Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Choose Avatar Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {emojiList.map((em, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setDebtEmoji(em)}
                style={[
                  styles.emojiChip,
                  { backgroundColor: debtEmoji === em ? colors.primaryAccent : colors.bgSecondary },
                ]}
              >
                <Text style={styles.emojiText}>{em}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMain }]}>Total Amount (Rs.)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textMain, borderColor: colors.borderSoft }]}
            placeholder="50000"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={totalAmount}
            onChangeText={setTotalAmount}
          />
        </View>

        <TouchableOpacity
          onPress={handleAddDebtSubmit}
          style={[styles.submitButton, { backgroundColor: colors.primaryAccent }]}
        >
          <Text style={[styles.submitButtonText, { color: theme === 'kawaii' ? '#2c352d' : '#ffffff' }]}>
            Save Record 💾
          </Text>
        </TouchableOpacity>
      </AestheticModal>

      {/* ===================== MODAL: PAYMENT HISTORY & RECORD REPAYMENT ===================== */}
      <AestheticModal
        visible={isHistoryModalOpen && selectedDebt !== null}
        onClose={() => setIsHistoryModalOpen(false)}
        title={selectedDebt ? `${selectedDebt.person}'s Log` : 'Payment History'}
        subtitle={`Total: Rs. ${selectedDebt?.total.toLocaleString()} • Remaining: Rs. ${selectedDebt?.remaining.toLocaleString()}`}
        icon="📜"
      >
        {/* Original Debt Summary Info */}
        {selectedDebt && (
          <View style={[styles.debtLoanDetailsBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
            <View style={styles.debtDetailRow}>
              <Text style={[styles.debtDetailLabel, { color: colors.textMuted }]}>Type:</Text>
              <Text style={[styles.debtDetailValue, { color: selectedDebt.type === 'lent' ? colors.primaryGreen : colors.danger }]}>
                {selectedDebt.type === 'lent' ? '🤝 Money Lent (They owe you)' : '💰 Money Borrowed (You owe them)'}
              </Text>
            </View>
            <View style={styles.debtDetailRow}>
              <Text style={[styles.debtDetailLabel, { color: colors.textMuted }]}>Source Account:</Text>
              <Text style={[styles.debtDetailValue, { color: colors.textMain }]}>
                {selectedDebt.account || 'Cash in Hand'}
              </Text>
            </View>
            {selectedDebt.reason ? (
              <View style={styles.debtDetailRow}>
                <Text style={[styles.debtDetailLabel, { color: colors.textMuted }]}>Reason / Note:</Text>
                <Text style={[styles.debtDetailValue, { color: colors.textMain }]} numberOfLines={2}>
                  "{selectedDebt.reason}"
                </Text>
              </View>
            ) : null}
            {selectedDebt.date ? (
              <View style={styles.debtDetailRow}>
                <Text style={[styles.debtDetailLabel, { color: colors.textMuted }]}>Date Logged:</Text>
                <Text style={[styles.debtDetailValue, { color: colors.textSubtle }]}>
                  {selectedDebt.date}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Record New Payment Form */}
        {selectedDebt && selectedDebt.remaining > 0 && (
          <View style={[styles.repayFormCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSoft }]}>
            <Text style={[styles.repayFormTitle, { color: colors.textMain }]}>Record Repayment 💸</Text>
            
            <View style={styles.repayInputRow}>
              <TextInput
                style={[styles.repayInput, { backgroundColor: colors.bgCard, color: colors.textMain, borderColor: colors.borderSoft }]}
                placeholder="Amount (Rs.)"
                placeholderTextColor={colors.textSubtle}
                keyboardType="numeric"
                value={repayAmount}
                onChangeText={setRepayAmount}
              />
              <TouchableOpacity
                onPress={handleRepaymentSubmit}
                style={[styles.repaySubmitBtn, { backgroundColor: colors.primaryGreen }]}
              >
                <Text style={styles.repaySubmitText}>Pay</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputSubLabel, { color: colors.textMuted }]}>Payment Account:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => setRepayAccount(acc.name)}
                  style={[
                    styles.miniChip,
                    { backgroundColor: repayAccount === acc.name ? colors.primaryGreen : colors.bgCard },
                  ]}
                >
                  <Text style={[styles.miniChipText, { color: repayAccount === acc.name ? '#ffffff' : colors.textMuted }]}>
                    {acc.emoji} {acc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.sourceNoticeBox, { backgroundColor: selectedDebt.type === 'lent' ? colors.primaryGreenLight : colors.dangerLight, borderColor: selectedDebt.type === 'lent' ? colors.primaryGreen : '#f4aab9', marginTop: 8 }]}>
              <Ionicons
                name={selectedDebt.type === 'lent' ? 'add-circle' : 'remove-circle'}
                size={14}
                color={selectedDebt.type === 'lent' ? colors.primaryGreen : colors.danger}
              />
              <Text style={[styles.sourceNoticeText, { color: selectedDebt.type === 'lent' ? colors.primaryGreen : colors.danger }]}>
                {selectedDebt.type === 'lent'
                  ? `Repayment will be added into ${repayAccount} balance & recorded in transactions`
                  : `Repayment will be subtracted from ${repayAccount} balance & recorded in transactions`}
              </Text>
            </View>
          </View>
        )}

        {/* History List */}
        <Text style={[styles.historyHeaderTitle, { color: colors.textMain }]}>Installment History</Text>
        {selectedDebt?.history.length === 0 ? (
          <Text style={[styles.noHistoryText, { color: colors.textMuted }]}>No payments recorded yet.</Text>
        ) : (
          <View style={styles.historyList}>
            {selectedDebt?.history.map((h, i) => (
              <View key={h.id || i} style={[styles.historyItem, { borderBottomColor: colors.borderSoft }]}>
                <View>
                  <Text style={[styles.histDate, { color: colors.textMain }]}>{h.date}</Text>
                  <Text style={[styles.histAccount, { color: colors.textMuted }]}>Via {h.account}</Text>
                </View>
                <View style={styles.alignRight}>
                  <Text style={[styles.histAmount, { color: colors.primaryGreen }]}>
                    +Rs. {h.amount.toLocaleString()}
                  </Text>
                  <Text style={[styles.histRemain, { color: colors.textSubtle }]}>
                    Rem: Rs. {h.remaining.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </AestheticModal>
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
  headerAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
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
  debtCard: {
    borderRadius: 24,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  personName: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardTypeSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  finLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  finValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  finValueMuted: {
    fontSize: 15,
    fontWeight: '700',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 11,
    fontWeight: '800',
  },
  // Forms
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
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipsScroll: {
    marginTop: 4,
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
  // Repay modal styles
  repayFormCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  repayFormTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  repayInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  repayInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
  },
  repaySubmitBtn: {
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repaySubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 6,
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  noHistoryText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  histDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  histAccount: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  histAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  histRemain: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  sourceBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  accountChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sourceNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  sourceNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    lineHeight: 15,
  },
  debtLoanDetailsBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    marginBottom: 12,
  },
  debtDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  debtDetailValue: {
    fontSize: 12,
    fontWeight: '700',
  },
});
