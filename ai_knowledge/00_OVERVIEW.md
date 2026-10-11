# Aesthetic Expense Tracker — System Architecture & Knowledge Base Overview

## 1. Executive Summary
The **Aesthetic Expense Tracker** is a cross-platform mobile financial application built with **React Native (0.81)** and **Expo SDK 54** using **Expo Router (File-based navigation)** and **TypeScript**. 

It transforms personal budgeting and wealth tracking into a delightful, gamified, and visually stunning experience inspired by modern kawaii pastel and anime aesthetics (featuring **Kawaii Pastel**, **Black Clover**, and **One Piece** dynamic themes).

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Expo SDK | 54.0.35 | Core managed runtime, Expo Go compatibility |
| **Runtime** | React Native | 0.81.5 (React 19.1.0) | Native UI rendering on iOS & Android |
| **Navigation** | Expo Router | 6.0.24 | Typed, file-based routing (`app/(tabs)/...`) |
| **Language** | TypeScript | 5.9.2 | Type-safe state, models, and UI props |
| **Animation** | React Native Reanimated | 4.1.1 | 60fps micro-animations, tab transitions, cards |
| **Gestures** | React Native Gesture Handler | 2.28.0 | Swiping, interactive cards, drag-and-drop |
| **Icons** | `@expo/vector-icons` / Lucide / SF Symbols | 15.0.3 | Native, crisp vector iconography |
| **Haptics** | `expo-haptics` | 15.0.8 | Tactile physical feedback for buttons and PIN pad |
| **Images** | `expo-image` | 3.0.11 | High performance image caching & blur-up |
| **Storage** | `@react-native-async-storage/async-storage` | Latest | Offline-first local data persistence |

---

## 3. High-Level Architecture

```mermaid
graph TD
    App[App Entry: app/_layout.tsx] --> Providers[Theme & Global Financial Context Provider]
    Providers --> TabRouter[Tab Router: app/(tabs)/_layout.tsx]
    
    TabRouter --> TabHome[🏠 Home: index.tsx]
    TabRouter --> TabDebt[💳 Debt & Credit: debit-credit.tsx]
    TabRouter --> TabWishlist[🎁 Wishlist: wishlist.tsx]
    TabRouter --> TabAccounts[🏦 Account Vault: accounts.tsx]
    
    TabHome --> SubDash[1. Monthly Budget Dashboard]
    TabHome --> SubCal[2. Interactive Calendar View]
    TabHome --> SubAnalytics[3. Spending Analytics & Pie Charts]
    
    TabAccounts --> PINLock[PIN Security Gatekeeper]
    PINLock --> SubBalances[1. Amounts & Balances]
    PINLock --> SubTransfers[2. Own Money Transfers]
    PINLock --> SubAllTx[3. All Unified Transactions]

    Providers --> Storage[(AsyncStorage Local DB)]
```

---

## 4. Knowledge Base Map

All detailed specifications are organized into the following markdown documents:

1. [`01_FEATURES_SPECIFICATION.md`](file:///d:/Expense%20Tracker/ExpenseTracker/ai_knowledge/01_FEATURES_SPECIFICATION.md) — Comprehensive feature breakdowns for all 4 bottom tabs, subviews, filters, and modal forms.
2. [`02_DESIGN_SYSTEM_AND_THEMES.md`](file:///d:/Expense%20Tracker/ExpenseTracker/ai_knowledge/02_DESIGN_SYSTEM_AND_THEMES.md) — Multi-theme color palettes, typography, card elevation, floating 3D stickers, and sound/haptics.
3. [`03_DATA_MODELS_AND_STATE.md`](file:///d:/Expense%20Tracker/ExpenseTracker/ai_knowledge/03_DATA_MODELS_AND_STATE.md) — TypeScript data structures, models, calculations, and AsyncStorage persistence schema.
4. [`04_NAVIGATION_AND_ROUTING.md`](file:///d:/Expense%20Tracker/ExpenseTracker/ai_knowledge/04_NAVIGATION_AND_ROUTING.md) — File-based route hierarchy, modal presentations, and deep links.
5. [`05_SECURITY_AND_VAULT.md`](file:///d:/Expense%20Tracker/ExpenseTracker/ai_knowledge/05_SECURITY_AND_VAULT.md) — 4-digit PIN authentication, biometric unlock, and account privacy masking.
6. [`06_IMPLEMENTATION_ROADMAP.md`](file:///d:/Expense%20Tracker/ExpenseTracker/ai_knowledge/06_IMPLEMENTATION_ROADMAP.md) — Step-by-step phased execution plan for building the complete React Native Expo app.
