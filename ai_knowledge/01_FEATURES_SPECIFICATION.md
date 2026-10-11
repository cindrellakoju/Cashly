# Feature Specifications — Aesthetic Expense Tracker

This document provides the complete, exhaustive feature specification for all screens, tabs, subviews, modals, filters, and workflows in the application.

---

## Tab 1: 🏠 Home (Budget, Calendar & Analytics)

The Home tab serves as the financial command center with 3 view modes controlled by top pill segments:
1. **Monthly Budget Dashboard 👛** (Default)
2. **Interactive Calendar View 📅**
3. **Spending Analytics & Charts 📊**

### 1.1 Monthly Budget Dashboard Mode
- **Header & Sticker**:
  - Greeting banner displaying current month & year (e.g. *"August 2026"*).
  - Floating 3D mascot sticker dynamically matched to the active theme (e.g., Kawaii Cat Wallet / Nero Anti-Bird / Luffy Straw Hat).
- **Summary Metrics Cards**:
  - **Monthly Salary Card** (👛 Soft Pastel / Gold): Displays monthly recurring base salary (e.g., `Rs. 124,000`).
  - **Total Spent Card** (💸 Soft Rose / Crimson): Displays sum of all expenses in the current month.
  - **Total Income Card** (📈 Mint Green): Displays sum of base salary + extra income streams.
  - **Remaining Balance Card** (✨ Lavender / Emerald): Calculated as `Total Income - Total Spent`.
- **Income Stream Section**:
  - Table / Card list showing date, income source (e.g., *Monthly Salary*, *Freelance Bonus*), stored account (e.g., *NIC Asia Bank*, *eSewa*), and amount.
  - Action: **`+ Add Income`** modal button.
- **Recent Expenses Section**:
  - Card list showing date, category with emoji & custom swatch dot (e.g., `🍔 Food`, `☕ Coffee`), reason note, payment account, and amount.
  - Action: **`+ Add Expense`** modal button.
- **Cash Envelopes / Expected Money to Spend Section (`🌿 CASH ENVELOPES (optional)`)**:
  - **Header**: Sprout icon 🌿 + bold uppercase `CASH ENVELOPES` with `(optional)` badge + `+ Category` button + View mode toggle (`Table 📋` vs `Progress 📊`).
  - **Expected Budget Table View**:
    - **Header Bar**: `CATEGORY` (Left) and `BUDGETED` (Right) on soft pastel mint banner.
    - **Envelope Rows**: Dot color swatch, category emoji, category name, and expected budget (e.g. `🟠 🍔 Food` ➔ `$ 400.00`, `🟣 ☕ Coffee` ➔ `$ 50.00`, `🟢 🚗 Transport` ➔ `$ 120.00`, `🌸 🛍️ Shopping` ➔ `$ 100.00`, `🟢 🏠 Utilities` ➔ `$ 90.00`, `🟣 🍿 Fun` ➔ `$ 50.00`).
    - **Total Highlight Row**: Highlighted banner displaying `TOTAL` ➔ `$ 810.00` (automatically summing all envelopes).
    - **Interactive Budget Editing**: Tapping any category row opens the `Edit Expected Budget Modal` to dynamically modify the envelope allocation or delete the envelope.
  - **Spending Progress View**: Dynamic progress bars tracking spent vs budgeted with threshold warning indicators (>80%, >100%).
  - **Actions**: `+ Category` modal button and `Edit Envelope Budget` modal.

### 1.2 Interactive Calendar View Mode
- Monthly grid calendar rendered in the theme palette.
- Dates with expenses highlight with dots/indicators color-coded by top category.
- Selecting any day dynamically updates the day breakdown list beneath the calendar, displaying all transactions that occurred on that date.
- Quick navigation: Prev Month `❮` / Next Month `❯` / Jump to Today.

### 1.3 Spending Analytics & Visual Charts Mode
- **Donut / Ring Category Breakdown**:
  - Visual donut chart displaying percentage allocation across all categories.
- **Monthly Income vs. Expense Bar Comparison**:
  - Side-by-side comparative bars showing cash inflow vs. cash outflow.
- **Top Spending Highlights**:
  - Ranked list of highest expense categories with total spent and percentage of total budget.

---

## Tab 2: 💳 Debit & Credit Tracker (Lending & Borrowing)

Manages informal loans, debts, repayments, and personal balances between friends, family, and colleagues.

### 2.1 Segmented Control
- **Money Borrowed 💰 (I Owe Someone)**:
  - Tracks liabilities where the user borrowed money and needs to repay.
- **Money Lent 🤝 (Someone Owes Me)**:
  - Tracks assets where the user lent money and is awaiting repayment.

### 2.2 Debt / Credit Cards
- **Card Content**:
  - Person's Name (e.g., *Ram Sharma*, *Priya Patel*).
  - Avatar / Contact Emoji (e.g., 💰, 🖐️, 🤝).
  - Total Loan Amount (e.g., `Rs. 50,000`).
  - Remaining Unpaid Balance (e.g., `Rs. 11,000`).
  - Status Badge:
    - `🔴 Pending`: When remaining balance > 0.
    - `🟢 Completed`: When fully repaid (`remaining == 0`).
  - Progress bar visualizing repayment percentage.
- **Interactive Actions**:
  - **Tap Card**: Opens **Payment History & Installment Details Modal**:
    - Complete chronological log of each payment made/received (Date, Amount, Account used, Updated remaining balance).
    - **`+ Record Installment Payment`** button to log partial or full repayments.
  - **`+ Add Debt / Lent Entry`** modal button in top header.

---

## Tab 3: 🎁 Wishlist (Dream & Goal Tracker)

A gamified savings and goal tracker for aspirational purchases and milestones.

### 3.1 Wishlist Cards Grid
- **Item Details**:
  - Item Name (e.g., *iPhone 18*, *MacBook Air M4*, *Noise Cancelling Headphones*).
  - Custom Emoji / 3D Icon (📱, 💻, 🎧, 🚗, ✈️).
  - Priority Badge:
    - `🔴 High Priority`
    - `🟠 Medium Priority`
    - `🟢 Low Priority`
  - Target Price (Rs.).
  - Target Purchase Date (e.g., *December 2026*).
  - Savings Progress Tracker (e.g., saved `Rs. 80,000` / `Rs. 175,000` — `45%`).
- **Card Actions**:
  - Tap to mark as **"Purchased! 🎉"** (automatically creates an expense entry if desired).
  - Edit goal details or delete item.
- Action: **`+ Add Wishlist Item`** modal button.

---

## Tab 4: 🏦 Account Management & Vault

A secure multi-account manager partitioned into 3 dedicated subviews, protected by a security gatekeeper.

### 4.1 Security Lock Screen / PIN Vault
- Biometric & 4-digit PIN Gatekeeper (Default PIN: `1234`).
- Custom numeric keypad with soft haptic feedback.
- "Lock Vault 🔒" button allowing instant re-locking when leaving the screen.

### 4.2 Subview 1: 🪙 Amounts & Balances (`Amounts 🪙`)
- **Total Net Worth Banner**: Sum of all positive account balances minus credit liabilities.
- **Accounts List**:
  - `💵 Cash` (Physical wallet cash)
  - `🟢 eSewa` / Digital Wallets
  - `🏦 NIC Asia Bank` / Commercial Bank Accounts
  - `💳 Credit Cards` (Displays in distinct alert color when negative / owing balance)
  - `🐷 Emergency Fund` / Dedicated Savings Vaults
- **Account Card Features**:
  - Account name, emoji badge, available balance in Rs.
  - Privacy toggle: Eye icon `👁️` to hide/show balances with asterisks (`Rs. ••••••`).
- Action: **`+ Add New Account`** modal form (Name, Emoji, Initial Balance, Account Type).

### 4.3 Subview 2: 🔄 Own Money Transfer (`Own Transfer 🔄`)
- Manages internal fund movements between the user's own accounts (e.g., transferring `Rs. 2,000` from *Cash* to *eSewa*, or `Rs. 10,500` from *Bank* to *Emergency Fund*).
- **Transfer Log List**:
  - Transfer Date.
  - From Account (with emoji) ➔ To Account (with emoji).
  - Amount transferred (Rs.).
  - Purpose / Reason note (e.g., *Wallet Top-up*, *Monthly Savings*).
- **Search & Filter**: Search transfer logs by note, account name, or date.
- Action: **`+ New Internal Transfer`** modal form (From Account picker, To Account picker, Amount, Date, Reason).

### 4.4 Subview 3: 📜 All Unified Transactions (`All Transactions 📜`)
- A master financial ledger integrating all 8 transaction types across the entire ecosystem:
  1. `💵 Income`
  2. `🧾 Expense`
  3. `💼 Salary`
  4. `🔄 Internal Transfer`
  5. `🤲 Debt Borrowed`
  6. `💸 Debt Repayment`
  7. `🤝 Credit Given`
  8. `🪙 Credit Received`
- **Horizontal Scrollable Filter Pills**:
  - `All 🌐`, `Income 🟢`, `Expense 🔴`, `Salary 💼`, `Transfer 🔄`, `Debt Borrowed 🤲`, `Debt Payment 💸`, `Credit Given 🤝`, `Credit Received 🪙`.
- **Search Bar**: Real-time multi-field search (by note, reference, person, account, or category).
- **Transaction Card Specification**:
  - Top row: Date (Left), Color-coded Type Badge (Right).
  - Middle row: Category/Reason title (Left), Amount in Rs. (Right, green for inflow, red for outflow).
  - Bottom row: Flow pills (`From: Cash` ➔ `To: eSewa` or `Account: NIC Asia Bank`) + Reference tag.
- Action: **`+ Add Transaction`** comprehensive modal form.

---

## 5. Global Modals System

All modal dialogs are presented with smooth backdrop blur, bottom-sheet slide-up animations, and keyboard-avoiding views:

1. **Add Income Modal**: Amount, Date, Source Title, Stored Account selector.
2. **Add Expense Modal**: Amount, Date, Category selector, Note/Reason, Payment Account selector, quick link to `+ Add Category`.
3. **Add Custom Category Modal**: Category Name, Emoji Picker, Color Swatch Picker, Default Monthly Budget.
4. **Add Debt / Credit Modal**: Borrower/Lender Name, Type (Borrowed/Lent), Emoji, Total Amount, Initial Repaid Amount.
5. **Record Payment / Repayment Modal**: Amount Paid, Payment Date, Account Used, Updated Remaining balance preview.
6. **Add Wishlist Item Modal**: Name, Emoji, Estimated Price, Target Date, Priority (High/Med/Low).
7. **Add Account Modal**: Account Name, Emoji, Account Type, Initial Balance.
8. **Add Internal Transfer Modal**: Source Account, Destination Account, Amount, Date, Reason Note.
