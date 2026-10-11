# Implementation Roadmap & Verification Plan

This document outlines the phased implementation roadmap for executing the full React Native / Expo Go application.

---

## Phase 1: Foundation, Asset Migration & Theme Engine
1. **Asset Migration**:
   - Copy 3D stickers (Kawaii, Black Clover, One Piece) from scratch repository into `ExpenseTracker/assets/images/stickers/`.
2. **Theme Constants & Token System**:
   - Build `constants/theme.ts` exporting color palettes, typography, spacing, shadows, and sticker asset mappings for all 3 themes.
3. **Data Context & Local Persistence**:
   - Implement `context/FinancialContext.tsx` with full mock initial state and reactive actions for adding/updating all financial entities.

---

## Phase 2: Navigation & Custom UI Components
1. **Root Layout & Fonts**:
   - Configure `app/_layout.tsx` to wrap `FinancialProvider`, handle Safe Area insets and Status Bar styling per theme.
2. **Aesthetic Bottom Tab Bar**:
   - Build `app/(tabs)/_layout.tsx` with 4 bottom tabs (Home, Debit & Credit, Wishlist, Accounts) with haptic feedback and active pill animations.
3. **Reusable Aesthetic UI Library**:
   - Segmented buttons (`SegmentedControl.tsx`).
   - Floating 3D Mascot banner (`ThemeBanner.tsx`).
   - Reusable Bottom Sheet Modal manager (`AestheticModal.tsx`).
   - Keypad Lock Component (`PinKeypad.tsx`).

---

## Phase 3: Screen Implementations
1. **Tab 1: Home (`app/(tabs)/index.tsx`)**:
   - Mode 1: Dashboard with Salary/Spent/Income/Remaining summary cards, recent transactions, cash envelope progress bars.
   - Mode 2: Interactive Month/Day Calendar view.
   - Mode 3: Spending Analytics Donut & Bar comparison charts.
2. **Tab 2: Debit & Credit (`app/(tabs)/debit-credit.tsx`)**:
   - Segmented toggle for Borrowed vs. Lent.
   - Person debt cards with balance, status badge, and repayment progress bar.
   - Installment payment breakdown modal.
3. **Tab 3: Wishlist (`app/(tabs)/wishlist.tsx`)**:
   - Savings goals grid with priority tags, target dates, progress meters, and "Mark as Purchased 🎉" action.
4. **Tab 4: Account Management & Vault (`app/(tabs)/accounts.tsx`)**:
   - PIN Lock screen gatekeeper (Keypad + Lock/Unlock state).
   - Subview 1: Amounts & Balances (List of accounts + Net Worth banner).
   - Subview 2: Own Money Transfer (Internal fund movements & search).
   - Subview 3: All Unified Transactions (8-type filter pills, search bar, comprehensive transaction cards).

---

## Phase 4: Modal Forms & Input Flows
1. **Add Income / Add Expense Form** with category picker & account selection.
2. **Add Custom Category Form** with emoji picker, custom color palette swatches, and monthly budget allocation.
3. **Add Debt / Record Repayment Form**.
4. **Add Wishlist Item Form**.
5. **Add Account Form**.
6. **Add Internal Transfer Form**.
7. **Add Master Transaction Form**.

---

## Phase 5: Verification & Testing on Expo Go
1. **TypeScript Typecheck**: Run `npx tsc --noEmit` to ensure 100% strict type safety.
2. **Lint Validation**: Run `npx expo lint`.
3. **Expo Go Device Testing**: Start dev server (`npx expo start` / `npx expo start --tunnel`) and verify across iOS and Android on Expo Go.
