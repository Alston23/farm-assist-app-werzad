
# File Export Guide for Farm Assist App

This document lists ALL files you need to copy to recreate this project in a new Natively instance.

## How to Use This Guide

1. In your NEW Natively project, ask the assistant: "Create a file called [filename] with this content: [paste content]"
2. Work through each file one by one
3. Start with configuration files, then move to source code files

## File List (in order of importance)

### 1. Configuration Files (Copy these first)
- package.json
- app.json
- tsconfig.json
- babel.config.js
- metro.config.js
- index.ts
- .gitignore
- .npmrc
- .eslintrc.js
- .eslintignore

### 2. Core App Files
- app/_layout.tsx
- app/index.tsx
- app/(tabs)/_layout.tsx
- app/(tabs)/index.tsx
- app/(tabs)/fields.tsx
- app/(tabs)/tasks.tsx
- app/(tabs)/inventory.tsx
- app/(tabs)/revenue.tsx
- app/(tabs)/equipment.tsx
- app/(tabs)/ai-assistant.tsx
- app/(tabs)/ai-weather-insights.tsx
- app/(tabs)/ai-problem-diagnosis.tsx
- app/(tabs)/profile.tsx

### 3. Additional App Screens
- app/auth.tsx
- app/login.tsx
- app/paywall.tsx
- app/fertilizers.tsx
- app/seeds.tsx
- app/storage-locations.tsx
- app/transplants.tsx
- app/crop-guide/[cropName].tsx
- app/marketplace/_layout.tsx
- app/marketplace/index.tsx
- app/marketplace/equipment.tsx
- app/marketplace/customer.tsx
- app/marketplace/messages.tsx
- app/marketplace/conversation/[id].tsx

### 4. Components (40+ files)
- components/AddEquipmentListingModal.tsx
- components/AddEquipmentModal.tsx
- components/AddExpenseModal.tsx
- components/AddFertilizerModal.tsx
- components/AddFieldBedModal.tsx
- components/AddIncomeModal.tsx
- components/AddPackagingModal.tsx
- components/AddSeedModal.tsx
- components/AddServiceModal.tsx
- components/AddStorageModal.tsx
- components/AddTransplantModal.tsx
- components/CreateCustomerListingModal.tsx
- components/CustomerListingDetailModal.tsx
- components/EditPlantingModal.tsx
- components/EquipmentDetailModal.tsx
- components/EquipmentListingDetailModal.tsx
- components/FloatingTabBar.tsx
- components/GlassView.tsx
- components/IconSymbol.tsx
- components/PageHeader.tsx
- components/PremiumGuard.tsx
- components/ProUpsellBanner.tsx
- components/RateSellerModal.tsx
- components/ReportsModal.tsx
- components/SellerProfileModal.tsx

### 5. Contexts (7 files)
- contexts/AuthContext.tsx
- contexts/CameraContext.tsx
- contexts/LocationContext.tsx
- contexts/NotificationContext.tsx
- contexts/SubscriptionContext.tsx
- contexts/WidgetContext.tsx

### 6. Data Files (3 large files)
- data/crops.ts
- data/cropDetails.ts
- data/cropGuides.ts

### 7. Hooks
- hooks/useProStatus.ts

### 8. Library Files
- lib/supabase.ts
- lib/database.types.ts

### 9. Styles
- styles/commonStyles.ts

### 10. Utils
- utils/imagePicker.ts

## Total Files: ~80+ files

## Instructions for Manual Transfer

### Option 1: Copy Files One by One
In your NEW project, for each file:
1. Ask: "Create [filepath] with this content:"
2. Paste the file content
3. Move to next file

### Option 2: Request Specific Files
Ask me: "Show me the content of [specific file path]"
I'll provide the exact content you need to copy.

### Option 3: Batch by Category
Ask me: "Show me all configuration files" or "Show me all component files"
I'll provide them in groups.

## Which Files Do You Want First?

Tell me which category you want to start with:
- Configuration files (10 files)
- Core app screens (13 files)
- Components (25+ files)
- Data files (3 large files)
- Contexts (7 files)
- All files (I'll provide them in batches)

