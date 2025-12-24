# Admin Authentication System - Complete Guide

## 🔐 Overview

The MetroClassy Admin Panel has a complete authentication system that ensures only authorized admin users can access the admin features. All login activities are automatically tracked in the Audit Logs.

## ✅ What's Already Implemented

### 1. **Authentication Features**
- ✅ Email/Password login
- ✅ JWT token-based authentication
- ✅ Session management (7-day sessions)
- ✅ Automatic token refresh on page load
- ✅ Protected routes (all admin pages require login)
- ✅ Admin role verification
- ✅ Password hashing with bcrypt
- ✅ Rate limiting (5 login attempts per 15 minutes)

### 2. **Security Features**
- ✅ Rate limiting to prevent brute force attacks
- ✅ Secure password storage (hashed, never stored in plain text)
- ✅ Token expiration (7 days)
- ✅ Session tracking in database
- ✅ IP address logging
- ✅ User agent tracking
- ✅ HttpOnly cookies (in production)

### 3. **Audit Logging**
- ✅ Successful logins logged with:
  - Admin user details (name, email)
  - IP address
  - User agent (browser/device info)
  - Timestamp
  - Session token reference
- ✅ Failed login attempts logged with:
  - Email attempted
  - Reason (user not found, wrong password, not admin)
  - IP address
  - User agent
  - Timestamp
- ✅ Logouts logged with all details
- ✅ All logs visible in Admin Panel → Audit Logs

## 🚀 How to Use

### Step 1: Create an Admin User

Run this command in the `backend` directory:

```bash
cd backend
npm run create-admin
```

Or create with custom credentials:
```bash
npm run create-admin your-email@example.com your-secure-password Your Name
```

### Step 2: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5000`

**Terminal 2 - Admin Frontend:**
```bash
cd Admin
npm run dev
```
Admin panel runs on `http://localhost:3001`

### Step 3: Login

1. Open `http://localhost:3001`
2. You'll be redirected to `/admin/login` if not authenticated
3. Enter your admin credentials:
   - Email: `admin@metroclassy.com` (or your custom email)
   - Password: `admin123` (or your custom password)
4. Click "Sign In"

### Step 4: View Audit Logs

1. After logging in, go to **Audit Logs** in the sidebar
2. Filter by action type:
   - **LOGIN** - Successful logins
   - **LOGIN_FAILED** - Failed login attempts (security monitoring)
   - **LOGOUT** - When admins log out
3. View details by clicking on any action badge or resource ID

## 📋 What Gets Logged

### Successful Login
- **Who**: Admin name and email
- **When**: Exact timestamp
- **Where**: IP address
- **How**: Browser/device info (user agent)
- **What**: "LOGIN" action type

### Failed Login Attempts
- **Who**: Email attempted (user may not exist)
- **When**: Exact timestamp
- **Where**: IP address
- **Why**: Reason for failure:
  - "User not found"
  - "Invalid password"
  - "Not an admin user"

### Logout
- **Who**: Admin name and email
- **When**: Exact timestamp
- **Where**: IP address

## 🔒 Security Features Explained

### 1. Rate Limiting
- Maximum 5 login attempts per 15 minutes per IP
- After 5 attempts, must wait 15 minutes
- Prevents brute force attacks

### 2. Token Security
- JWT tokens expire after 7 days
- Tokens stored securely (localStorage for frontend)
- HttpOnly cookies used in production
- Automatic token refresh on app load

### 3. Session Management
- Each login creates a database session
- Sessions automatically expire after 7 days
- Can be manually invalidated on logout
- Multiple devices/sessions supported

### 4. Role-Based Access
- Only users with `isAdmin: true` can access admin panel
- Regular users cannot access admin routes
- Admin routes protected at both frontend and backend

## 🛡️ What's Protected

### Frontend Protection
All admin pages are wrapped in `ProtectedRoute`:
- Dashboard
- Products
- Categories
- Orders
- Discount Wheel
- Analytics
- Audit Logs

**If not logged in**: Automatically redirected to `/admin/login`

### Backend Protection
All admin API routes use `adminAuth` middleware:
- `/api/admin/products/*`
- `/api/admin/categories/*`
- `/api/admin/orders/*`
- `/api/admin/metrics/*`
- `/api/admin/audit-logs/*`

**If not authenticated**: Returns `401 Unauthorized`

## 📊 Monitoring Failed Login Attempts

1. Go to **Audit Logs** page
2. Filter by **Action**: "Failed Login"
3. Review:
   - Which emails were attempted
   - From which IP addresses
   - When the attempts occurred
   - Reasons for failure

This helps identify:
- Potential security threats
- Brute force attempts
- Unauthorized access attempts

## 🔄 Current Authentication Flow

```
1. User enters email/password
   ↓
2. Frontend sends to /api/admin/auth/login
   ↓
3. Backend validates:
   - User exists?
   - Is admin?
   - Password correct?
   ↓
4a. If SUCCESS:
    - Generate JWT token
    - Create database session
    - Log successful login to Audit Logs
    - Return token to frontend
    - Frontend stores token
    - Redirect to Dashboard

4b. If FAILURE:
    - Log failed attempt to Audit Logs
    - Return error message
    - Frontend shows error
```

## 📝 Next Steps (Optional Enhancements)

If you want to add more security features:

1. **Two-Factor Authentication (2FA)**
   - Use Google Authenticator or SMS
   - Extra layer of security

2. **Password Policy**
   - Minimum length requirements
   - Require special characters
   - Password expiration

3. **Account Lockout**
   - Lock account after X failed attempts
   - Require admin to unlock

4. **Email Notifications**
   - Alert on failed login attempts
   - Notify on new device login

5. **Session Management UI**
   - View all active sessions
   - Logout from specific devices

## 🎯 Summary

**Authentication is already fully functional!**

✅ Only authorized admin users can access the admin panel
✅ All login activities are captured in Audit Logs
✅ Failed login attempts are tracked for security
✅ Rate limiting prevents brute force attacks
✅ Secure token-based authentication
✅ Session management with expiration

**To see it in action:**
1. Create an admin: `npm run create-admin`
2. Start servers
3. Login at `http://localhost:3001`
4. Check Audit Logs to see your login recorded!

