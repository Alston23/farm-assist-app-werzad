
# SmallFarm Copilot - Complete Project Export

This is a complete export of the SmallFarm Copilot application, ready to be pushed to GitHub and imported into a new Natively project.

## 📦 Project Structure

```
SmallFarm-Copilot/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab-based navigation screens
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── ai-assistant.tsx      # AI Chat Assistant
│   │   ├── ai-weather-insights.tsx
│   │   ├── ai-problem-diagnosis.tsx
│   │   ├── crops.tsx             # Crop Management
│   │   ├── tasks.tsx             # Task Management
│   │   ├── inventory.tsx         # Inventory Management
│   │   ├── revenue.tsx           # Revenue Tracking
│   │   ├── equipment.tsx         # Equipment Management
│   │   └── marketplace.tsx       # Marketplace Hub
│   ├── marketplace/              # Marketplace sub-screens
│   │   ├── equipment.tsx
│   │   ├── customers.tsx
│   │   └── messages.tsx
│   ├── login.tsx                 # Authentication
│   └── _layout.tsx               # Root layout with providers
├── components/                   # Reusable UI components
│   ├── AddFieldBedModal.tsx
│   ├── AddIncomeModal.tsx
│   ├── AddExpenseModal.tsx
│   ├── AddSeedModal.tsx
│   ├── AddFertilizerModal.tsx
│   ├── AddPackagingModal.tsx
│   ├── AddStorageModal.tsx
│   ├── AddTransplantModal.tsx
│   ├── AddEquipmentModal.tsx
│   ├── AddServiceModal.tsx
│   ├── AddEquipmentListingModal.tsx
│   ├── AddCustomerListingModal.tsx
│   ├── EditPlantingModal.tsx
│   ├── EquipmentDetailModal.tsx
│   ├── EquipmentListingDetailModal.tsx
│   ├── CustomerListingDetailModal.tsx
│   ├── SellerProfileModal.tsx
│   ├── RateSellerModal.tsx
│   ├── ReportsModal.tsx
│   ├── PremiumGuard.tsx
│   ├── ProUpsellBanner.tsx
│   ├── PageHeader.tsx
│   └── IconSymbol.tsx
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx
│   ├── CameraContext.tsx
│   ├── LocationContext.tsx
│   ├── NotificationContext.tsx
│   ├── SubscriptionContext.tsx
│   └── WidgetContext.tsx
├── hooks/                        # Custom React hooks
│   └── useProStatus.tsx
├── data/                         # Static data and crop information
│   ├── crops.ts
│   ├── cropDetails.ts
│   └── cropGuides.ts
├── lib/                          # External service integrations
│   ├── supabase.ts
│   └── database.types.ts
├── utils/                        # Utility functions
│   ├── imagePicker.ts
│   └── errorLogger.ts
├── assets/                       # Images, fonts, icons
│   └── images/
├── package.json                  # Dependencies
├── app.json                      # Expo configuration
├── tsconfig.json                 # TypeScript configuration
├── babel.config.js               # Babel configuration
├── metro.config.js               # Metro bundler configuration
├── eas.json                      # EAS Build configuration
├── index.ts                      # Entry point
└── .gitignore                    # Git ignore rules
```

## 🚀 Features

### Core Functionality
- **Crop Management**: Track plantings, harvest dates, and crop details
- **Task Management**: Organize farming tasks with priorities and due dates
- **Inventory Management**: Track seeds, fertilizers, packaging, storage, and transplants
- **Revenue Tracking**: Monitor income and expenses with detailed reports
- **Equipment Management**: Track equipment, maintenance, and service history

### AI-Powered Features
- **AI Assistant**: Chat with AI for farming advice and recommendations
- **Weather Insights**: AI-powered weather analysis and task suggestions
- **Problem Diagnosis**: Image-based plant problem identification

### Marketplace
- **Equipment Marketplace**: Buy/sell/rent farm equipment
- **Customer Marketplace**: Sell produce directly to customers
- **Messaging System**: Communicate with buyers and sellers
- **Seller Profiles & Ratings**: Build trust with reviews

### Premium Features (Pro Subscription)
- Advanced AI features
- Detailed revenue reports
- Unlimited marketplace listings
- Priority support

## 🛠️ Technology Stack

- **Framework**: React Native + Expo 54
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **State Management**: React Context API
- **UI Components**: Custom components with React Native
- **Styling**: StyleSheet API with theme support
- **Image Handling**: expo-image-picker
- **Location Services**: expo-location
- **Notifications**: expo-notifications
- **Subscriptions**: expo-in-app-purchases

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Supabase account (for backend services)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/SmallFarm-Copilot.git
cd SmallFarm-Copilot
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Setup

The app uses Supabase for:
- User authentication
- Database (PostgreSQL)
- File storage
- Real-time subscriptions

**Database Tables** (see Supabase schema in project):
- `profiles` - User profiles
- `field_beds` - Field/bed tracking
- `plantings` - Crop plantings
- `tasks` - Task management
- `income` - Revenue tracking
- `expenses` - Expense tracking
- `equipment` - Equipment inventory
- `equipment_services` - Service history
- `seeds`, `fertilizers`, `packaging`, `storage_locations`, `transplants` - Inventory
- `equipment_listings` - Equipment marketplace
- `customer_listings` - Customer marketplace
- `marketplace_messages` - Messaging
- `seller_ratings` - Ratings and reviews

### 5. Run the App

```bash
# Development mode
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📱 Building for Production

### iOS

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build for Google Play
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

## 🔐 Authentication

The app supports:
- Email/password authentication
- Google OAuth (configured in Supabase)
- Apple Sign-In (configured in Supabase)

## 📊 Database Schema

The Supabase database includes comprehensive tables for:
- User management and profiles
- Crop and planting tracking
- Task management with priorities
- Financial tracking (income/expenses)
- Inventory management (seeds, fertilizers, etc.)
- Equipment tracking and maintenance
- Marketplace listings and transactions
- Messaging and ratings

## 🎨 Customization

### Theme Colors
Edit `styles/commonStyles.ts` to customize the app's color scheme.

### Crop Data
Modify files in the `data/` directory to add or update crop information.

### AI Features
AI features are integrated via backend API endpoints. Configure in Supabase Edge Functions.

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For questions or issues, contact the project owner.

## 📞 Support

For support with:
- **Natively Platform**: Visit [natively.dev](https://natively.dev)
- **Expo**: Visit [docs.expo.dev](https://docs.expo.dev)
- **Supabase**: Visit [supabase.com/docs](https://supabase.com/docs)

## 🎯 Next Steps After Import

1. **Connect to Supabase**: Add your Supabase credentials to `.env`
2. **Set up Database**: Run migrations or create tables in Supabase
3. **Configure OAuth**: Set up Google and Apple OAuth in Supabase
4. **Test Features**: Verify all features work in the new environment
5. **Deploy**: Build and submit to app stores

---

**Built with ❤️ using [Natively.dev](https://natively.dev)**
