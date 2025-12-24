# 🚀 How to Create Admin Users

## Quick Guide: Name is Collected During Login

**IMPORTANT:** The admin name is **NOT** set during admin creation. Instead, it is **collected dynamically during login**.

- ✅ **Email & Password**: Static (set when creating admin)
- ✅ **Name**: Dynamic (entered during login)

---

## 📋 Step-by-Step Instructions

### 1. Create Admin Account (Email & Password Only)

Navigate to backend folder and create admin:
```bash
cd backend
npm run create-admin [email] [password]
```

**Example:**
```bash
npm run create-admin admin@metroclassy.com mypassword
```

**Note:** Name is optional during creation - it will be collected during login.

---

### 2. Login and Enter Your Name

1. Go to `/admin/login` in your browser
2. Enter your **Email** (static - from admin creation)
3. Enter your **Password** (static - from admin creation)
4. Enter your **Name** (dynamic - enter it here!)
5. Click "Sign In"

The name you enter will be:
- ✅ Displayed in the admin panel header
- ✅ Recorded in all audit logs
- ✅ Saved to your admin profile

---

## ✅ Correct Examples

### Creating Admin:
```bash
# Example 1: Create admin with email and password only
npm run create-admin admin@metroclassy.com admin123

# Example 2: Create admin (name optional)
npm run create-admin manager@metroclassy.com secret123

# Example 3: Create admin (name will be collected during login)
npm run create-admin super@metroclassy.com password123
```

### During Login:
- Email: `admin@metroclassy.com` (static)
- Password: `admin123` (static)
- Name: `John Doe` (dynamic - enter here!)

---

## 🔄 How It Works

1. **Admin Creation** (One-time setup):
   - Creates admin account with email and password
   - Name is optional and can be set later

2. **Login** (Every time):
   - Enter email and password (static credentials)
   - Enter your name (dynamic - can be different each time)
   - Your name is saved and displayed throughout the session

3. **Name Usage**:
   - Shown in header: "Welcome [Your Name]"
   - Recorded in audit logs for all actions
   - Updated in database for future reference

---

## 💡 Why Dynamic Name?

- **Multiple Admins**: Different team members can use the same admin account
- **Flexibility**: Name can change if different person logs in
- **Audit Trail**: Each login records who actually logged in
- **Simplicity**: No need to update admin account for name changes

---

## ⚠️ Important Notes

1. **Name is Required**: You cannot login without entering a name
2. **Name Updates**: Each login updates the name in the database
3. **Audit Logs**: All actions are recorded with the name you entered during login
4. **Header Display**: The name shown in header is from your current login session

---

## 🆘 Troubleshooting

### "Name is required. Please enter your name."
**Solution:** Make sure you fill in the name field on the login page before clicking "Sign In".

### "Email and password are required"
**Solution:** Make sure you've created an admin account first using `npm run create-admin`.

### "Invalid credentials"
**Solution:** Check that you're using the correct email and password from admin creation.

---

## 📍 Where the Name Appears

After logging in with your name, you'll see it in:

1. **Admin Panel Header** (top right)
   - Shows: "Welcome [Your Name]"

2. **Audit Logs**
   - Every action shows who did it: "[Your Name]"
   - Filter by your name to see all your actions

3. **Login Logs**
   - Your name is recorded when you login
   - Your name is recorded when you logout

---

## ✨ Summary

**Admin Creation:**
```bash
npm run create-admin email password
```

**Login:**
- Email: (from admin creation)
- Password: (from admin creation)
- **Name: (enter here during login!)**

That's it! Your name is collected during login and used throughout the admin panel! 🎉
