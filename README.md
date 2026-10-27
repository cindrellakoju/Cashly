# 💸 Cashly - Personal Finance & Expense Tracker

A full-featured personal finance mobile app built with **React Native**, **Expo**, and **SQLite**. Features local offline data storage, dual themes (🌸 Kawaii & 🕶️ Noir), multi-account tracking, debt/credit management, mandatory email OTP onboarding, and a global full-screen admin control panel.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your Gmail SMTP credentials:
```bash
cp .env.example .env
```

### 3. Start the Email Dispatch Server
*(Required for OTP email verification and PIN recovery)*
```bash
npm run email-server
```

### 4. Start the Expo Application
In a separate terminal:
```bash
npx expo start
```

---

## 🏛️ System Architecture

For complete system architecture diagrams, state flow, and data models, see **[`DOCUMENTATION.md`](./DOCUMENTATION.md)**:

- **2.1 High-Level Architecture Diagram**: Flow from React Native client through SQLite, Context, and the Node.js email micro-service.
- **2.2 Global Admin Overlay Architecture**: Root layout (`app/(tabs)/_layout.tsx`) managing full-screen `AdminDashboardView` across all tabs.
- **2.3 State Management & Data Flow**: Unidirectional React Context (`FinancialContext`) synchronizing with SQLite (`services/database.ts`).
- **2.4 Email Micro-Service Architecture**: OTP generation, `/send-verification` dispatch, and Gmail SMTP transport.

---

## ✨ Key Features

- **Mandatory Email OTP Onboarding**: Email is compulsory during first setup; verified via a 6-digit OTP code sent via Gmail SMTP.
- **Global Admin Control Panel**: Full-screen administrator overlay accessible from any tab (*Home*, *Debt & Credit*, *Wishlist*, *Accounts*).
- **Persistent Header Controls in Admin**: Mode toggle (`[ Normal | Admin ]`), quick theme toggle (`🌸 / 🕶️`), and date selector (`📅 Month / All Time ⌄`).
- **Dynamic Table Date Filtering**: Expenses, Incomes, and Transactions in Admin mode dynamically filter based on the header's date selector.
- **Multi-Account Asset Vault**: Manage Cash, Bank, Wallet, Credit, and Savings accounts with PIN encryption.
- **Dual Themes**: Switch instantly between **Kawaii Pastel** and **Noir Monochrome**.
- **JSON Backup & Restore**: Export and import full database state to signed JSON files.

---

## 📖 Complete Documentation

Refer to **[`DOCUMENTATION.md`](./DOCUMENTATION.md)** for detailed coverage of:
1. Architecture Diagrams (Mermaid)
2. Database Schema (12 SQLite tables)
3. Component Hierarchy & Navigation
4. Services & Micro-services
5. Security & Access Control
