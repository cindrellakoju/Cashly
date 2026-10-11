# Data Models & State Management — Aesthetic Expense Tracker

This document details the TypeScript type definitions, state contracts, storage persistence patterns, and business logic calculations.

---

## 1. Core TypeScript Interfaces

```typescript
// Theme Definition
export type AppTheme = 'kawaii' | 'blackclover' | 'onepiece' | 'purpleneko';

// Transaction Type
export type TransactionType = 
  | 'Expense' 
  | 'Income' 
  | 'Salary' 
  | 'Transfer' 
  | 'Debt Borrowed' 
  | 'Debt Payment' 
  | 'Credit Given' 
  | 'Credit Received';

// Master Unified Transaction
export interface Transaction {
  id: string;
  date: string; // ISO or formatted date e.g. "2026-08-15"
  type: TransactionType;
  amount: number;
  from: string; // e.g. "Cash", "Employer", "Ram Sharma"
  to: string; // e.g. "Restaurant", "NIC Asia Bank", "eSewa"
  reference: string; // Note / memo
  category: string; // e.g. "🍔 Food", "💼 Salary", "🔄 Transfer"
  accountId?: string; // Associated internal account
}

// Cash Envelopes Model (Expected Money to Spend)
export interface CashEnvelope {
  id: string;
  name: string; // e.g. "Food", "Coffee", "Transport"
  emoji: string; // e.g. "🍔"
  color: string; // Hex color code e.g. "#f3b06c"
  budgeted: number; // Expected allocated money to spend (e.g. 400.00)
}

// Expense Category Tags Model (Transaction Taxonomy)
export interface Category {
  id: string;
  name: string; // e.g. "Food", "Subscriptions", "Gaming"
  emoji: string; // e.g. "🍔"
  color: string; // Hex color code e.g. "#f3b06c"
}

// Income Stream
export interface Income {
  id: string;
  date: string;
  amount: number;
  stored: string; // e.g. "NIC Asia Bank"
  note: string;
  type: 'incoming';
}

// Expense Entry
export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  reason: string;
  stored: string; // Account paid from e.g. "Cash", "eSewa"
  type: 'outgoing';
}

// Installment Payment History for Debts / Loans
export interface InstallmentPayment {
  id: string;
  date: string;
  amount: number;
  remaining: number;
  account: string;
  themeColorTag?: string;
}

// Debt / Credit (Lending & Borrowing)
export interface DebtItem {
  id: string;
  person: string;
  emoji: string;
  total: number;
  remaining: number;
  status: 'Pending' | 'Completed';
  type: 'borrowed' | 'lent';
  history: InstallmentPayment[];
}

// Wishlist Goal Item
export interface WishlistItem {
  id: string;
  name: string;
  emoji: string;
  priority: 'High Priority' | 'Med Priority' | 'Low Priority';
  price: number;
  targetDate: string;
  savedAmount?: number;
  isPurchased?: boolean;
}

// Financial Account / Wallet
export interface Account {
  id: string;
  name: string;
  emoji: string;
  balance: number;
  type: 'cash' | 'bank' | 'wallet' | 'credit' | 'savings';
}

// Internal Account Transfer
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
```

---

## 2. Global State Store (`FinancialContext`)

The application leverages a unified React Context + Hook architecture with automatic local disk caching:

```typescript
export interface FinancialState {
  theme: AppTheme;
  salary: number;
  isVaultUnlocked: boolean;
  pinCode: string; // Default: '1234'
  
  // Data Collections
  categories: Category[];
  incomes: Income[];
  expenses: Expense[];
  debts: DebtItem[];
  wishlist: WishlistItem[];
  accounts: Account[];
  transfers: InternalTransfer[];
  transactions: Transaction[];

  // Mutations
  setTheme: (theme: AppTheme) => void;
  unlockVault: (pin: string) => boolean;
  lockVault: () => void;
  updateSalary: (salary: number) => void;
  
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  
  addDebt: (debt: Omit<DebtItem, 'id' | 'remaining' | 'status' | 'history'>) => void;
  recordInstallment: (debtId: string, payment: Omit<InstallmentPayment, 'id' | 'remaining'>) => void;
  
  addWishlistItem: (item: Omit<WishlistItem, 'id'>) => void;
  toggleWishlistPurchased: (id: string) => void;
  
  addAccount: (account: Omit<Account, 'id'>) => void;
  addTransfer: (transfer: Omit<InternalTransfer, 'id'>) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
}
```

---

## 3. Financial Calculations & Derived State

1. **Total Net Worth**:
   $$\text{Net Worth} = \sum_{\text{assets}} \text{Account Balance} - \sum_{\text{liabilities}} |\text{Credit Card Balance}|$$
2. **Current Month Spent**:
   $$\text{Total Spent} = \sum_{e \in \text{Expenses in Month}} e.\text{amount}$$
3. **Current Month Remaining Budget**:
   $$\text{Remaining} = (\text{Salary} + \text{Extra Income}) - \text{Total Spent}$$
4. **Cash Envelope Status**:
   $$\text{Envelope Utilization \%} = \left(\frac{\text{Spent in Category}}{\text{Allocated Budget}}\right) \times 100$$
5. **Debt Remaining Calculation**:
   $$\text{Remaining Debt} = \text{Total Loan} - \sum \text{Installments Paid}$$
