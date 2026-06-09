# G(old) - Freelancer Consultation Platform
## Product Documentation & Implementation Summary

---

## 📋 Table of Contents
1. [Product Overview](#product-overview)
2. [Architecture](#architecture)
3. [User Roles & Flows](#user-roles--flows)
4. [Features Implemented](#features-implemented)
5. [Design System](#design-system)
6. [Security Features](#security-features)
7. [Technical Stack](#technical-stack)
8. [Recent Improvements](#recent-improvements)

---

## 🎯 Product Overview

**G(old)** is a mobile-first freelancer consultation platform that connects clients with professional freelancers for consultation services. The platform features a warm, gold-themed design system emphasizing accessibility and trust.

### Core Value Proposition
- **For Clients**: Easy discovery and booking of freelancer consultations
- **For Freelancers**: Manage consultation requests and availability
- **For Admins**: Oversight of applications, user accounts, and platform activity

---

## 🏗 Architecture

### Platform
- **Framework**: React Native + Expo
- **Routing**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Storage**: AsyncStorage (secure token management)
- **Real-time**: WebSocket (Socket.io) for chat

### Project Structure
```
project_old/
├── app/                          # Expo Router screens
│   ├── (auth)/                  # Authentication flows
│   ├── (client)/                # Client role screens
│   ├── (freelancer)/            # Freelancer role screens
│   ├── (admin)/                 # Admin role screens
│   ├── chat/[id].tsx            # Real-time chat
│   └── _layout.tsx              # Root layout
├── src/
│   ├── components/              # Reusable UI components
│   ├── context/                 # React Context providers
│   ├── services/                # API client, notifications
│   ├── design-system/           # Colors, typography, spacing
│   └── types/                   # TypeScript definitions
└── assets/                       # Images, icons, fonts
```

---

## 👥 User Roles & Flows

### 1. **Client Role**
**Purpose**: Find and hire freelancers for consultations

#### Key Flows:
1. **Discovery Flow**
   - Browse freelancer profiles (Discover tab)
   - View ratings, expertise, and availability
   - Save favorites for later

2. **Booking Flow**
   - Select freelancer → Book consultation
   - Choose date/time from availability
   - Submit consultation request
   - Track request status (Requests tab)

3. **Communication Flow**
   - Real-time messaging (Messages tab)
   - Receive notifications for updates
   - Chat with accepted freelancers

#### Screens:
- `(client)/(tabs)/index.tsx` - Discover freelancers
- `(client)/(tabs)/saved.tsx` - Saved freelancers
- `(client)/(tabs)/requests.tsx` - Consultation requests
- `(client)/(tabs)/messages.tsx` - Message list
- `(client)/(tabs)/profile.tsx` - Profile management

---

### 2. **Freelancer Role**
**Purpose**: Receive and manage consultation requests

#### Key Flows:
1. **Application Flow**
   - Sign up as freelancer
   - Submit profile for admin approval
   - Wait for account activation

2. **Request Management Flow**
   - Receive consultation requests (Inbox)
   - Accept or decline requests
   - View client details

3. **Availability Management Flow**
   - Set weekly availability (Schedule tab)
   - Block specific dates
   - Manage consultation hours

4. **Communication Flow**
   - Chat with clients (Messages tab)
   - Receive real-time notifications

#### Screens:
- `(freelancer)/(tabs)/index.tsx` - Dashboard (stats, quick actions)
- `(freelancer)/(tabs)/inbox.tsx` - Consultation requests
- `(freelancer)/(tabs)/schedule.tsx` - Availability management
- `(freelancer)/(tabs)/messages.tsx` - Message list
- `(freelancer)/(tabs)/profile.tsx` - Profile management

---

### 3. **Admin Role**
**Purpose**: Platform oversight and moderation

#### Key Flows:
1. **Application Review Flow**
   - Review freelancer applications
   - Approve or reject with reasons
   - Monitor application pipeline

2. **User Management Flow**
   - View all freelancers
   - Suspend/activate accounts
   - Monitor account statuses

3. **Audit Flow**
   - View platform activity logs
   - Track admin actions
   - Monitor system events

#### Screens:
- `(admin)/(tabs)/index.tsx` - Overview dashboard
- `(admin)/(tabs)/applications.tsx` - Application reviews
- `(admin)/(tabs)/freelancers.tsx` - User management
- `(admin)/(tabs)/audit.tsx` - Audit logs
- `(admin)/(tabs)/profile.tsx` - Admin profile

---

## ✨ Features Implemented

### Core Features

#### 1. **Authentication System**
- Multi-role login (Client/Freelancer/Admin)
- Token-based authentication (JWT)
- Automatic token refresh
- Session persistence
- Rate limiting protection (NEW)

#### 2. **Real-time Chat**
- One-on-one messaging
- Read receipts
- Typing indicators
- Unread message counters
- Message persistence

#### 3. **Consultation Request System**
- Request creation and tracking
- Status management (pending/accepted/rejected)
- Real-time status updates
- Request history

#### 4. **Availability Management**
- Weekly availability calendar
- Exception date blocking
- Time slot configuration
- Timezone support

#### 5. **Profile Management**
- User profile editing
- Avatar management
- Portfolio/bio sections
- Privacy settings

#### 6. **Notification System**
- Push notifications (Expo Notifications)
- In-app notification center
- Real-time alerts
- Device token management

#### 7. **Admin Controls**
- Application approval workflow
- Account suspension/activation
- Audit logging
- Platform analytics

---

## 🎨 Design System

### Brand Identity: G(old)
**Philosophy**: Warm authority, accessible first, trust through restraint

### Color Palette

#### Gold (Primary Brand Color)
```
gold.500: #BA7517  - Primary actions, CTAs
gold.400: #F4CF87  - Highlights, focus states
gold.100: #FDF3E1  - Light backgrounds, muted sections
```

#### Neutral (Warm Gray)
```
neutral.50:  #FAFAF8  - Background (never pure white)
neutral.100: #F5F5F2  - Cards, surfaces
neutral.700: #2E2E28  - Headings, primary text
neutral.600: #4A4A42  - Body text
neutral.500: #7A7A6E  - Muted text
```

#### Semantic Colors
```
Success: #2D7A3E  - Positive actions
Warning: #C77A1A  - Warnings
Error:   #C73A1A  - Errors
Info:    #1A5C9E  - Information
```

### Typography
- **Display/Headings**: Fraunces (Serif)
- **Body/UI**: DM Sans (Sans-serif)
- Font weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

### Spacing System
```
xxs: 4px   - Tight spacing
xs:  8px   - Compact spacing
sm:  12px  - Small spacing
md:  16px  - Base spacing
lg:  24px  - Large spacing
xl:  32px  - Extra large spacing
xxl: 48px  - Maximum spacing
```

### Theme Support
- ✅ Light mode (default)
- ✅ Dark mode
- ✅ Automatic system preference detection
- ✅ Persistent theme selection

---

## 🔒 Security Features

### 1. **Rate Limiting** (NEW)
- **Protection against**: Brute force attacks
- **Limits**: 5 failed login attempts per email
- **Lockout**: 15 minutes after max attempts
- **Window**: 5-minute rolling window
- **Storage**: Persisted in AsyncStorage
- **User feedback**: Clear countdown messages

### 2. **Authentication Security**
- JWT token-based authentication
- Automatic token refresh
- Secure token storage (AsyncStorage)
- Session validation on app startup
- Role-based access control (RBAC)

### 3. **API Security**
- Bearer token authentication
- 401 handling with refresh logic
- Request/response validation
- HTTPS enforcement (production)

### 4. **Data Privacy**
- Local storage encryption
- No sensitive data in logs
- GDPR-compliant data handling

---

## 💻 Technical Stack

### Frontend
- **React Native**: 0.74+ (New Architecture enabled)
- **Expo**: SDK 51+
- **Expo Router**: File-based navigation
- **TypeScript**: Type safety
- **Socket.io Client**: Real-time communication

### State Management
- **Context API**: Global state
  - AuthContext - User authentication
  - ChatContext - Real-time messaging
  - FreelancersContext - Freelancer data
  - RequestsContext - Consultation requests
  - SavedContext - Saved freelancers
  - ThemeContext - Theme management

### Storage
- **AsyncStorage**: Local persistence
- **Expo SecureStore**: Sensitive data (recommended upgrade)

### UI Libraries
- **React Native**: Core components
- **Expo Vector Icons**: Ionicons
- **Expo Image**: Optimized image loading
- **React Native Toast**: Toast notifications
- **Safe Area Context**: Screen edge handling

### Fonts
- **Fraunces**: Display and headings
- **DM Sans**: UI and body text

---

## 🚀 Recent Improvements

### Session: Keyboard & Theme Fixes
**Date**: Current session

#### 1. **Keyboard Behavior Fixed**
**Problem**: Keyboard overlapped message input field on Android
**Solution**:
- Updated `app.json` with `softwareKeyboardLayoutMode: "pan"`
- Configured `KeyboardAvoidingView` properly
- Added `keyboardDismissMode` and `keyboardShouldPersistTaps`
- Result: Smooth keyboard interaction, no overlap with navigation buttons

#### 2. **Theme Consistency Implemented**
**Problem**: Some screens didn't follow dark/light theme
**Solution**:
- Migrated all hardcoded colors to `useTheme()` hook
- Updated tab layouts (Client, Freelancer, Admin)
- Fixed message screens and chat screen
- Applied dynamic colors to all UI elements
- Result: Uniform theme across entire application

#### 3. **Chat Header Theme**
**Problem**: Chat screen header was white in dark mode
**Solution**:
- Added theme-aware header styling
- Applied `colors.background` and `colors.textPrimary`
- Result: Header now respects theme selection

#### 4. **Loading & Splash Screen Enhancement**
**Implemented**:
- Custom branded `LoadingScreen` component
- Reusable `LoadingIndicator` component
- Updated splash screen colors to match brand
- Smooth transitions from splash to app
- Theme-aware loading states

**Files Created**:
- `src/components/LoadingScreen/LoadingScreen.tsx`
- `src/components/LoadingIndicator/LoadingIndicator.tsx`

#### 5. **Rate Limiting Security**
**Implemented**:
- Smart rate limiter service
- Per-email tracking
- 5 attempts / 15-minute lockout
- User-friendly error messages
- Automatic cleanup and reset

**Files Created**:
- `src/services/rateLimiter.ts`

**Files Modified**:
- `src/context/AuthContext.tsx` - Added rate limiting
- `app.json` - Updated splash screen colors
- `app/_layout.tsx` - Added loading states

---

## 📱 App Flows Diagram

### Authentication Flow
```
Launch App
    ↓
Check Session
    ↓
├─ Valid → Navigate to role-specific home
│   ├─ Client → (client)/(tabs)
│   ├─ Freelancer → (freelancer)/(tabs)
│   └─ Admin → (admin)/(tabs)
│
└─ Invalid → Login Screen
    ↓
    Select Role → Enter Credentials
    ↓
    Rate Limit Check
    ↓
    ├─ Allowed → API Login
    │   ↓
    │   ├─ Success → Home
    │   └─ Failed → Record Attempt → Error
    │
    └─ Blocked → Show Lockout Message
```

### Consultation Request Flow (Client)
```
Discover Tab
    ↓
Browse Freelancers
    ↓
Select Freelancer → View Profile
    ↓
Book Consultation
    ↓
Choose Date/Time
    ↓
Submit Request
    ↓
Wait for Response
    ↓
├─ Accepted → Start Chat
│   ↓
│   Messages Tab → Real-time Chat
│
├─ Rejected → View Reason
│
└─ Pending → Track in Requests Tab
```

### Consultation Management Flow (Freelancer)
```
Inbox Tab
    ↓
View Incoming Requests
    ↓
Select Request → View Details
    ↓
Decision
    ↓
├─ Accept → Conversation Created
│   ↓
│   Messages Tab → Chat with Client
│
└─ Decline → Request Closed
```

### Admin Review Flow
```
Applications Tab
    ↓
View Pending Applications
    ↓
Select Application → Review Profile
    ↓
Decision
    ↓
├─ Approve → Freelancer Account Activated
│   ↓
│   User Notified → Can Login
│
└─ Reject → Application Closed
    ↓
    User Notified
```

---

## 🔑 Key Contexts

### 1. AuthContext
**Purpose**: Manages user authentication and session

**State**:
- `user`: Current authenticated user
- `isLoading`: Auth state loading
- `applications`: Freelancer applications (admin)
- `auditLogs`: Platform activity logs (admin)
- `freelancerStatus`: Account status tracking

**Methods**:
- `login(email, password, role)` - Authenticate user
- `register(...)` - Create new account
- `logout()` - Clear session
- `refreshUser()` - Reload user data
- `updateProfile(fields)` - Update user profile
- `reviewApplication(id, decision)` - Approve/reject application (admin)
- `setFreelancerAccountStatus(id, status)` - Suspend/activate (admin)

### 2. ChatContext
**Purpose**: Real-time messaging functionality

**State**:
- `conversations`: All user conversations
- `messages`: Messages for active conversation
- `typingUsers`: Who's typing indicator
- `totalUnreadCount`: Badge counter

**Methods**:
- `sendMessage(conversationId, text)` - Send message
- `markAsRead(conversationId)` - Clear unread
- `setActiveConversationId(id)` - Load conversation
- `emitTyping(conversationId)` - Typing indicator
- `refreshConversations()` - Reload list

### 3. ThemeContext
**Purpose**: Theme management (light/dark mode)

**State**:
- `theme`: "light" | "dark"
- `colors`: Current color palette
- `isDark`: Boolean helper

**Methods**:
- `toggleTheme()` - Switch theme

---

## 📊 Database Schema (Backend Reference)

### Users Collection
```typescript
{
  _id: string
  email: string
  role: "client" | "freelancer" | "admin"
  accountStatus: "active" | "suspended"
  managedFreelancerId?: string
  profile: {
    fullName: string
    bio?: string
    headline?: string
    avatarUrl?: string
    company?: string
    website?: string
    location?: string
    phone?: string
  }
}
```

### Requests Collection
```typescript
{
  _id: string
  clientId: string
  freelancerId: string
  projectTitle: string
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt: Date
}
```

### Conversations Collection
```typescript
{
  _id: string
  participants: [userId1, userId2]
  lastMessage: {
    text: string
    sender: string
    sentAt: Date
  }
  unreadCount: number
}
```

### Messages Collection
```typescript
{
  _id: string
  conversationId: string
  sender: string
  text: string
  createdAt: Date
  readAt?: Date
}
```

---

## 🧪 Testing Recommendations

### Manual Testing Checklist

#### Authentication
- [ ] Login with valid credentials (all roles)
- [ ] Login with invalid credentials
- [ ] Rate limiting (6+ failed attempts)
- [ ] Token refresh on 401
- [ ] Logout clears session
- [ ] Remember me functionality

#### Chat
- [ ] Send message
- [ ] Receive message (real-time)
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Message persistence
- [ ] Unread counters

#### Theme
- [ ] Toggle light/dark mode
- [ ] Theme persists on app restart
- [ ] All screens respect theme
- [ ] Headers match theme
- [ ] Tab bars match theme

#### Keyboard
- [ ] Message input visible when typing
- [ ] No overlap with navigation
- [ ] Keyboard dismisses on send
- [ ] Smooth transitions

#### Requests
- [ ] Create consultation request
- [ ] Accept request (freelancer)
- [ ] Decline request (freelancer)
- [ ] Track request status (client)

---

## 📚 Developer Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio / Xcode (for native builds)

### Installation
```bash
# Clone repository
git clone <repo-url>
cd project_old

# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

### Environment Variables
Create `.env` file:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

### Build Configuration
Native builds require updating:
```bash
# Prebuild (if needed)
npx expo prebuild --clean

# Build for Android
eas build --platform android --profile development

# Build for iOS
eas build --platform ios --profile development
```

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **WebSocket**: Requires stable connection, no offline queue
2. **Image Upload**: Not yet implemented in mobile app
3. **Payment Integration**: Not implemented
4. **Video Calls**: Not implemented
5. **Analytics**: Basic logging only

### Future Enhancements
- [ ] Offline support with queue
- [ ] Image/file sharing in chat
- [ ] Payment processing integration
- [ ] Video consultation support
- [ ] Push notification customization
- [ ] Advanced search/filters
- [ ] Rating and review system
- [ ] Calendar integration
- [ ] Multi-language support

---

## 📞 Support & Maintenance

### Key Files to Monitor
- `src/services/apiClient.ts` - API configuration
- `src/context/AuthContext.tsx` - Authentication logic
- `src/context/ChatContext.tsx` - Real-time messaging
- `app.json` - App configuration
- `package.json` - Dependencies

### Common Issues

**Issue**: App won't start
**Solution**: Clear cache with `npx expo start --clear`

**Issue**: Theme not updating
**Solution**: Check AsyncStorage, clear app data

**Issue**: Chat not connecting
**Solution**: Verify WebSocket URL, check backend status

**Issue**: Rate limit testing
**Solution**: Use `clearAllRateLimits()` from rateLimiter service

---

## 📄 License & Credits

### Technology Credits
- **Expo**: Application framework
- **React Native**: Mobile development
- **Socket.io**: Real-time communication
- **Google Fonts**: Fraunces & DM Sans typography

### Design Philosophy
G(old) design system emphasizes:
- Warm, accessible color palette
- Restraint and clarity
- Trust through professional design
- Mobile-first approach

---

**Document Version**: 1.0  
**Last Updated**: Current Session  
**Maintained By**: Development Team

---

## Quick Reference

### Demo Accounts
```typescript
// Client
email: client@gold.com
password: demo

// Freelancer
email: freelancer@gold.com
password: demo

// Admin
email: admin@gold.com
password: demo
```

### Important Commands
```bash
# Start dev server
npx expo start

# Clear cache
npx expo start --clear

# Run Android
npx expo run:android

# Run iOS
npx expo run:ios

# Type check
npx tsc --noEmit

# Build preview
eas build --platform android --profile preview
```

---

**End of Documentation**
