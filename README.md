# 🏗️ BuildMart

**A construction materials marketplace** — browse, compare, and order building supplies from verified sellers near you.

Built with **React Native + Expo** for iOS, Android, and Web.

---

## ✨ Features

### For Buyers
- 🏠 **Home Feed** — Hero banner, top sellers, and bestseller products at a glance
- 🗂️ **Category Navigation** — 9 curated construction categories for focused browsing
- ✨ **Premium Parallax Details** — High-fidelity interaction on Product & Seller pages with **Dynamic Sticky Headers**
- 🛡️ **Adaptive Navigation** — Icons that intelligently change color based on scroll position for perfect accessibility
- ⭐ **Ratings & Reviews** — Verified-purchase review system with real-time average calculation
- 🛍️ **Multi-Seller Cart** — Intelligent cart that handles items from multiple vendors, applying individual fulfillment fees (₹150/seller)
- 🕊️ **B2B Bulk Quotes** — Request custom pricing for 100+ units with persistent state tracking
- ❤️ **Wishlist** — Save materials for later with native storage persistence
- 📍 **Address Management** — Save and label multiple delivery addresses (Home / Work / Site)
- 📋 **Order Tracking** — Live 5-stage timeline tracker for every purchase

### For Sellers (Elite Suite)
- 📊 **Insight Dashboard** — Real-time revenue, total orders, and visual **Sales Trends**
- 🎯 **Merchant Scorecard** — Track your professional **Fulfillment Rate**, **Response Time**, and **Order Accuracy**
- 📉 **Category Analytics** — Visual revenue breakdown by material type (Cement, Steel, etc.)
- 🏪 **Store Status Toggle** — One-tap "Open/Closed" toggle in the header for real-time logistics management
- 🏆 **Top Selling Products** — Automatic calculation of your best-performing materials
- ⚠️ **Smart Stock Alerts** — Dynamic "Low Stock" indicators + **Smart Refill Workflow**
- 🚚 **Order Fulfillment** — Sophisticated tabbed manager (Placed, Confirmed, Dispatched, Delivered, **Rejected**)

### General
- 🎨 **Premium UI/UX** — Modern overhaul with **Parallax Scaling**, **Glassmorphism**, and high-fidelity branding
- 🔐 **Dual-Role Auth** — Phone + OTP logic with role selection and session persistence
- 💾 **State Persistence** — 5 synchronized Context Providers (Auth, Cart, Orders, Wishlist, **Quotes**)
- 🛠️ **Design Tokens** — Reusable professional theme (COLORS, SHADOWS, RADIUS, FONTS)
- 💵 **Localized Currency** — Standardized ₹ (INR) formatting across all financial data

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Core** | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) SDK 51 |
| **Animation** | `Animated` API for high-perf scroll tracking & parallax |
| **Navigation** | [React Navigation](https://reactnavigation.org/) 7 (Native Stack + Bottom Tabs) |
| **State** | React Context + `useReducer` with `AsyncStorage` persistence |
| **Visuals** | `expo-linear-gradient` for branded surfaces |

---

## 📁 Project Structure

```
BuildMart/
├── src/
│   ├── components/
│   │   └── shared/                 
│   │       ├── ProductCard.js      # Premium product tile
│   │       ├── OrderStepTracker.js # Real-time progress timeline
│   │       ├── QuantitySelector.js # Interactive item counter
│   │       └── QuoteRequestModal.js# B2B Bulk workflow UI
│   ├── features/                   
│   │   ├── marketplace/            # Home, Search, Details, Cart, Checkout
│   │   ├── seller/                 # Analytics, Inventory, Orders, Performance
│   │   └── account/                # Order history, Addresses, Settings
│   └── navigation/
│       ├── AppNavigator.js          # Auth ↔ Role-wise routing
│       ├── BuyerTabs.js             # Marketplace tab system
│       └── SellerTabs.js            # Merchant command tabs
```

---

## 🚀 Getting Started

### Installation
```bash
git clone <your-repo-url>
cd BuildMart
npm install
```

### Run the App
```bash
npm run start
```
- 📱 Scan QR code with **Expo Go**
- Press **`w`** for Web Browser

---

## 📝 Current Status

| Phase | Milestone | Status |
|-------|-----------|--------|
| **Setup** | Project foundation + Roles | ✅ Complete |
| **Marketplace** | Search, Browsing, Wishlist | ✅ Complete |
| **UX Upgrade** | Parallax + Adaptive Nav | ✅ Complete |
| **B2B Engine** | Multi-seller + Bulk Quotes | ✅ Complete |
| **Analytics** | Dashboards + Store Insights | ✅ Complete |
| **Performance** | Merchant Scorecard + Trust Badges | ✅ Complete |

---

## 🗺️ Roadmap
- 🔴 High | Backend API NestJS/PostgreSQL integration
- 🔴 High | Real image uploads (`expo-image-picker`)
- 🟡 Medium | In-app Push Notifications
- 🟡 Medium | Logistics/Courier Partner integration

---

## 📄 License
This project is private and proprietary.

---

## 👨‍💻 Author
**BuildMart** — Built with ❤️ for the construction industry.
