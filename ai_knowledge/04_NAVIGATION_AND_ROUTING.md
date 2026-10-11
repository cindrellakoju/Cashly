# Navigation & Routing Architecture — Aesthetic Expense Tracker

This document maps out the file-based routing structure using Expo Router v6 and layout configurations.

---

## 1. Directory & Route Hierarchy

```
app/
├── _layout.tsx                     # Root Layout: Theme & Global Context Provider, Font loading, Status bar
├── modal.tsx                       # Universal dynamic modal container (bottom-sheet style)
└── (tabs)/
    ├── _layout.tsx                 # Custom Aesthetic Bottom Tab Bar with haptics & theme badges
    ├── index.tsx                   # 🏠 Tab 1: Home (Dashboard, Calendar, Analytics)
    ├── debit-credit.tsx            # 💳 Tab 2: Debt & Credit Tracker (Borrowed / Lent)
    ├── wishlist.tsx                # 🎁 Tab 3: Wishlist (Goals & Milestones)
    └── accounts.tsx                # 🏦 Tab 4: Account Vault & 3-Section Manager (PIN Protected)
```

---

## 2. Bottom Tab Bar Design
- Custom tab bar component replacing default tab bar for fluid animations.
- Icons: Vector Icons (`Ionicons` / `MaterialCommunityIcons` / `FontAwesome6`) paired with custom active pill indicators.
- Haptic trigger on tab press (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`).
- Floating blurred background supporting safe area insets on iPhone notch/island and modern Android gestures.

---

## 3. Modal Navigation System
Modals are rendered as seamless animated bottom sheets with:
- Backdrop dim & blur (`react-native-safe-area-context` aware).
- Smooth entry/exit spring transitions.
- Interactive keyboard handling (`KeyboardAvoidingView` with automatic scroll-to-input).
