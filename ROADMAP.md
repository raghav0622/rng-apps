# Platinum Edition Roadmap

## Module 1: Authentication & Identity

### Core Auth Flows
- [x] **Sign Up**: Email/Password -> Firebase Auth -> Firestore Profile (Dual Write)
- [x] **Login**: Email/Password -> Session Cookie Generation
- [ ] **Forgot Password**: Request Reset Link -> Validate Code -> Set New Password (Client-Side Trigger) - *Pending Verification*
- [ ] **Verify Email**: Send Verification Link -> Handle applyActionCode -> Update emailVerified (Client-Side Trigger) - *Pending Verification*

### Advanced Auth
- [ ] **Social Login (Google)**: Backend verification of Identity Tokens + Dual Write Linking
- [ ] **Magic Link Auth**: Redis-backed secure tokens delivered via Event Bus


### Session Management
- [ ] **Revocation Dashboard**: UI to list active device sessions (IP, OS, Last Active)
- [ ] **Revoke Action**: Ability to delete specific session keys from Redis
- [ ] **Security**: Enforce "Log out all other devices" on password change

## Module 2: Organization Governance

### Core Org Flows
- [x] **Create Organization**: Transactional Setup (Org Doc + Owner Member + Audit Log)
- [x] **Update Settings**: Name, Slug, Logo URL (Owner Only)

### Advanced Governance
- [ ] **Domain Verification**: DNS TXT record generation & verification logic
- [ ] **Auto-Join**: Logic to automatically add users with verified domains to the Org
- [ ] **API Keys**: Generate, List, and Revoke scoped API keys (hashed storage)

### Audit Log Viewer
- [ ] **UI**: Dedicated "Activity Log" page for Org Owners
- [ ] **Data**: Fetch from audit.repository with filters (Actor, Action, Date)

### Safe Ownership Transfer
- [ ] **Step 1 (Offer)**: Owner creates a signed "Ownership Offer" for a specific Admin
- [ ] **Step 2 (Accept)**: Target Admin accepts -> Transaction swaps roles -> Logs event

## Module 3: Billing & Revenue

### Webhook Reconciliation
- [ ] **Handler for invoice.payment_failed** (Trigger "Past Due" status)
- [ ] **Handler for customer.subscription.updated** (Sync Plan/Period)
- [ ] **Handler for customer.subscription.deleted** (Downgrade to Free)

### Customer Portal
- [ ] **Action**: Generate secure Stripe/LemonSqueezy Portal URL

### Usage Metering
- [ ] **Background worker**: Aggregate seat count/usage
- [ ] **Push usage**: To Payment Provider API (if metered)

## Module 4: Intelligent Notifications

### Preference Center
- [ ] **NotificationPreferences Model**: Email, SMS, Push toggles per topic
- [ ] **UI**: User management of settings

### In-App Feed
- [ ] **Logic**: Write alerts to users/{uid}/notifications
- [ ] **UI**: "Bell Icon" with unread badge and list view

### Channel Routing
- [ ] **Logic**: Update NotificationProvider to check preferences before sending external messages

## Module 5: Membership & Growth

### Role Management
- [x] **Update Member Role**: Owner/Admin logic
- [x] **Safety Check**: Prevent removing the last Owner of an Org

### Invitation System
- [x] **Send**: Check Seat Limits -> Transactional Create -> Audit Log
- [x] **Revoke**: Owner cancels pending invite (Delete Doc)
- [x] **Reject**: User declines invite (Mark status REJECTED)

### Member Removal
- [x] **Transactional Delete**: Member Doc + Clear User orgId + Audit Log
