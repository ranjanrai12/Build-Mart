---
description: Rules and conventions for the BuildMart project
---

# BuildMart Project Rules

## 1. README Updates on Business Logic Changes

Whenever any business logic is added, modified, or removed in the BuildMart project, the `README.md` file at the project root **must be updated** to reflect those changes. This includes but is not limited to:

- New features or screens added
- Changes to user flows (buyer or seller)
- New or modified context providers / state management
- Navigation changes
- New dependencies added
- Changes to the tech stack
- Updates to the project structure (new files/folders)
- Changes to the roadmap or current status

**File to update:** `/Users/ranjanrai/OneDrive - Nagarro/BuildMart/README.md`

## 2. Project History & Context

This project was built across multiple conversations. When working on this project, always refer to past conversation history and knowledge items to maintain continuity.

### Key Project Context
- **App Name:** BuildMart
- **Type:** Construction materials marketplace (React Native + Expo)
- **Roles:** Buyer and Seller with role-based navigation
- **State:** MVP Phase 1 is 100% complete (30 source files)
- **Data:** Currently uses mock data (no backend yet)
- **Auth:** Phone + OTP (mock — any 4 digits work)
- **Persistence:** AsyncStorage for auth, wishlist, and recently viewed

### Completed Phases
1. Project Setup (Expo blank)
2. Design System (`theme.js`)
3. Mock Data Layer
4. State Management (AuthContext, CartContext, OrderContext, WishlistContext)
5. Navigation (AppNavigator, BuyerTabs, SellerTabs)
6. Auth Screens (Login, Register, OTP)
7. Buyer Screens (Home, ProductList, ProductDetail, SellerProfile, Cart, Checkout, OrderHistory)
8. Seller Screens (Dashboard, ManageProducts, AddProduct, SellerOrders)
9. Shared Screens (Profile)
10. UX Enhancements (Wishlist, Recently Viewed, UI Polish)

### Future Roadmap (Not Started)
- Backend API integration (NestJS + PostgreSQL)
- Product image upload
- Push notifications
- Advanced search & filters
- Ratings & reviews
- Payment gateway integration
- Enhanced seller analytics
- Feature-based folder refactoring
