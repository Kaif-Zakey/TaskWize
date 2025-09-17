# 📱 TaskWize

<div align="center">

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.4-000020.svg)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.2.1-FFCA28.svg)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**A smart task management app with location-based notifications and intelligent reminders**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

## 🎥 Demo Video

<div align="center">

[![TaskWize Demo Video](https://img.youtube.com/vi/mQT03gbeuAY/0.jpg)](https://www.youtube.com/watch?v=mQT03gbeuAY)

**📺 [Watch the Full Demo on YouTube](https://www.youtube.com/watch?v=mQT03gbeuAY)**



_See TaskWize in action! This demo showcases location-based task management, proximity notifications, and all key features._

</div>

---

## 🌟 Features

### 🎯 **Core Task Management**

- ✅ Create, edit, and delete tasks with rich details
- 📅 Set priorities (Low, Medium, High) with visual indicators
- 🏷️ Categorize tasks (Work, Personal, Shopping, etc.)
- 📝 Add detailed descriptions and notes
- ✔️ Mark tasks as complete with progress tracking

### 📍 **Location-Based Intelligence**

- 🗺️ **Interactive Map Integration** - Select task locations using Google Maps
- 📡 **Smart Location Monitoring** - Automatic proximity detection
- 🔔 **Proximity Notifications** - Get reminded when near task locations
- 📏 **Customizable Range** - Set notification radius (50m-1000m)
- 🎯 **Geofencing** - Background location tracking for timely reminders

### 🔐 **Authentication & Security**

- 👤 **Firebase Authentication** - Secure user management
- 🔄 **Persistent Login** - Stay logged in between app sessions
- 📱 **Cross-Platform Sync** - Your tasks everywhere you go
- 🛡️ **Data Security** - Encrypted cloud storage

### 🎨 **Modern User Experience**

- 🌙 **Dark/Light Theme** - Automatic theme switching
- 📱 **Responsive Design** - Optimized for all screen sizes
- 🎯 **Intuitive Navigation** - Tab-based navigation with Expo Router
- ⚡ **Fast Performance** - Optimized with React Native reanimated
- 🔄 **Real-time Updates** - Live task synchronization

### 🔔 **Smart Notifications**

- 📢 **Location Alerts** - Notifications when approaching task locations
- 🔊 **Sound Effects** - Customizable notification sounds
- ⚙️ **Notification Settings** - Full control over alert preferences
- 📱 **Push Notifications** - Works in background and foreground

---

## 🚀 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### 1. Clone the Repository

```bash
git clone https://github.com/Kaif-Zakey/TaskWize.git
cd TaskWize/TaskWize
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and add your Firebase configuration:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

### 4. Start Development Server

```bash
npm start
```

### 5. Run on Device/Simulator

```bash
# For Android
npm run android

# For iOS
npm run ios

# For Web
npm run web
```

---

## 📱 Usage

### Getting Started

1. **Sign Up/Login** - Create an account or login with existing credentials
2. **Create Your First Task** - Tap the "+" button to add a new task
3. **Set Location** - Use the map to select where you want to be reminded
4. **Configure Notifications** - Set your preferred notification range
5. **Get Reminded** - Receive alerts when you're near your task locations

### Key Workflows

#### Creating a Location-Based Task

```
1. Tap "Add Task" → 2. Fill task details → 3. Enable location notifications
→ 4. Select location on map → 5. Set notification range → 6. Save
```

#### Managing Tasks

- **View Tasks**: Home screen shows all active tasks
- **Edit Tasks**: Tap any task to modify details
- **Complete Tasks**: Swipe or tap checkbox to mark complete
- **Delete Tasks**: Swipe left or use task options

#### Location Features

- **Current Location**: Auto-detect your current position
- **Map Selection**: Manually pick locations on interactive map
- **Address Search**: Search for specific addresses or landmarks
- **Range Adjustment**: Customize notification distance (50m-1000m)

---

## 🏗️ Architecture

### Tech Stack

| Category                 | Technology                   | Purpose                               |
| ------------------------ | ---------------------------- | ------------------------------------- |
| **Framework**            | React Native 0.81.4          | Cross-platform mobile development     |
| **Development Platform** | Expo SDK 54                  | Rapid development and deployment      |
| **Language**             | TypeScript                   | Type safety and developer experience  |
| **Styling**              | NativeWind + Tailwind CSS    | Utility-first styling                 |
| **Navigation**           | Expo Router                  | File-based routing system             |
| **State Management**     | React Context API            | Global state management               |
| **Backend**              | Firebase 12.2.1              | Authentication, database, and hosting |
| **Database**             | Firestore                    | NoSQL cloud database                  |
| **Maps**                 | Google Maps API              | Location services and mapping         |
| **Notifications**        | Expo Notifications           | Push notifications                    |
| **Location**             | Expo Location + Task Manager | Background location tracking          |
| **Storage**              | AsyncStorage                 | Local data persistence                |

### Project Structure

```
TaskWize/
├── 📁 app/                    # App screens (Expo Router)
│   ├── 📁 (auth)/            # Authentication screens
│   ├── 📁 (dashboard)/       # Main app screens
│   └── 📁 types/             # Type definitions
├── 📁 assets/                # Static assets
│   ├── 📁 images/           # App icons and images
│   ├── 📁 fonts/            # Custom fonts
│   └── 📁 sound/            # Notification sounds
├── 📁 components/            # Reusable UI components
├── 📁 context/               # React Context providers
├── 📁 service/               # Business logic and APIs
│   └── 📁 config/           # API configuration
└── 📁 types/                 # Global type definitions
```

### Core Services

- **🔐 authService.ts** - User authentication and session management
- **📋 taskService.ts** - Task CRUD operations and data management
- **📍 locationService.ts** - Location utilities and geocoding
- **📡 locationMonitoringService.ts** - Background location tracking
- **🔔 notificationService.ts** - Push notification management
- **🔧 api.ts** - API configuration and endpoints

### Key Features Implementation

#### Location Monitoring

```typescript
// Automatic proximity detection with geofencing
LocationMonitoringService.startLocationMonitoring()
  → Background location tracking
  → Proximity calculation
  → Notification triggering
```

#### Real-time Notifications

```typescript
// Smart notification system
NotificationService.scheduleTaskNotification()
  → Location-based triggers
  → Customizable sound effects
  → Background processing
```

#### Data Persistence

```typescript
// Multi-layer data storage
Firebase Firestore (Cloud) ↔ AsyncStorage (Local) ↔ React Context (Memory)
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm start              # Start Expo development server
npm run android        # Run on Android device/emulator
npm run ios           # Run on iOS device/simulator
npm run web           # Run on web browser

# Building
eas build --platform android    # Build Android APK/AAB
eas build --platform ios        # Build iOS IPA

# Code Quality
npm run lint          # Run ESLint
npm run reset-project # Reset project to clean state
```

### Environment Variables

| Variable                                   | Description                  | Required |
| ------------------------------------------ | ---------------------------- | -------- |
| `EXPO_PUBLIC_FIREBASE_API_KEY`             | Firebase API key             | ✅       |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain         | ✅       |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID          | ✅       |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket      | ✅       |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | ✅       |
| `EXPO_PUBLIC_FIREBASE_APP_ID`              | Firebase app ID              | ✅       |

### Permissions

#### Android

- `ACCESS_FINE_LOCATION` - Precise location access
- `ACCESS_BACKGROUND_LOCATION` - Background location tracking
- `CAMERA` - Camera access for task images
- `READ_MEDIA_IMAGES` - Access to photo library

#### iOS

- `NSLocationWhenInUseUsageDescription` - Location access explanation
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Background location explanation

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication Flow

- [ ] User registration with email/password
- [ ] User login with valid credentials
- [ ] Password reset functionality
- [ ] Persistent login after app restart
- [ ] Logout functionality

#### Task Management

- [ ] Create task with all fields
- [ ] Edit existing task
- [ ] Delete task
- [ ] Mark task as complete
- [ ] Task persistence across sessions

#### Location Features

- [ ] Location permission request
- [ ] Current location detection
- [ ] Map location selection
- [ ] Address geocoding
- [ ] Proximity notification triggering

#### Notifications

- [ ] Notification permission request
- [ ] Location-based notifications
- [ ] Notification sound effects
- [ ] Background notification delivery
- [ ] Notification settings persistence

---

## 🔧 Troubleshooting

### Common Issues

#### Build Errors

```bash
# AsyncStorage version conflicts
npm uninstall @react-native-async-storage/async-storage
npm install @react-native-async-storage/async-storage@1.24.0

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Location Not Working

1. Check device location permissions
2. Verify Google Maps API key
3. Ensure location services enabled
4. Check network connectivity

#### Notifications Not Showing

1. Check notification permissions
2. Verify notification settings in app
3. Test in foreground vs background
4. Check device Do Not Disturb settings

#### Firebase Connection Issues

1. Verify environment variables
2. Check Firebase project configuration
3. Ensure internet connectivity
4. Verify Firebase security rules

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for type safety
- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Kaif Zakey**

- GitHub: [@Kaif-Zakey](https://github.com/Kaif-Zakey)
- Project: [TaskWize](https://github.com/Kaif-Zakey/TaskWize)

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [Firebase](https://firebase.google.com/) for backend services
- [Google Maps](https://developers.google.com/maps) for location services
- [React Native](https://reactnative.dev/) community for excellent documentation

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ using React Native & Expo

</div>
