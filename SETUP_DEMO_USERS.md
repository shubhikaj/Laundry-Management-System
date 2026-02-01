# Setup Demo Users in Real Supabase

This guide will help you set up the demo credentials in your real Supabase backend so you can use them with actual Supabase authentication.

## Step-by-Step Instructions

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **Authentication** in the left sidebar
3. Click on **Users**

### Step 2: Create the Admin User

1. Click **Add User** button
2. Fill in the form:
   - **Email**: `admin@college.edu`
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ (check this box for testing)
   - **Send confirmation email**: ❌ (uncheck for testing)
3. Click **Create User**
4. **Copy the User ID** (you'll need this later)

### Step 3: Create the Staff User

1. Click **Add User** button again
2. Fill in the form:
   - **Email**: `staff@college.edu`
   - **Password**: `staff123`
   - **Auto Confirm User**: ✅
   - **Send confirmation email**: ❌
3. Click **Create User**
4. **Copy the User ID**

### Step 4: Create the Student User

1. Click **Add User** button again
2. Fill in the form:
   - **Email**: `john.doe@student.college.edu`
   - **Password**: `student123`
   - **Auto Confirm User**: ✅
   - **Send confirmation email**: ❌
3. Click **Create User**
4. **Copy the User ID**

### Step 5: Get All User IDs

1. Go to **SQL Editor** in Supabase
2. Run this query to get all user IDs:

```sql
SELECT id, email FROM auth.users 
WHERE email IN (
    'admin@college.edu',
    'staff@college.edu',
    'john.doe@student.college.edu'
);
```

3. **Copy the IDs** - you'll need them for the next step

### Step 6: Create Profiles for the Users

1. Still in **SQL Editor**, open the file `scripts/09-setup-demo-users-in-supabase.sql`
2. Replace these placeholders with the actual UUIDs from Step 5:
   - `YOUR-ADMIN-ID-HERE` → Admin user's UUID
   - `YOUR-STAFF-ID-HERE` → Staff user's UUID
   - `YOUR-STUDENT-ID-HERE` → Student user's UUID
3. Run the modified SQL script

### Step 7: Update Your .env.local File

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

You can find these in: **Settings** → **API** in your Supabase dashboard

### Step 8: Restart Your Development Server

1. Stop your Next.js server (Ctrl+C)
2. Start it again: `npm run dev` or `pnpm dev`

### Step 9: Test Login

Now you can log in with:
- **Admin**: `admin@college.edu` / `admin123`
- **Staff**: `staff@college.edu` / `staff123`
- **Student**: `john.doe@student.college.edu` / `student123`

## Quick Reference

### Demo Credentials:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | admin123 |
| Staff | staff@college.edu | staff123 |
| Student | john.doe@student.college.edu | student123 |

### Verify Everything Works

Run this query in SQL Editor to verify all users and profiles are set up correctly:

```sql
SELECT 
    u.email,
    p.full_name,
    p.role,
    p.block,
    p.floor_number,
    p.room_number
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN (
    'admin@college.edu',
    'staff@college.edu',
    'john.doe@student.college.edu'
);
```

You should see all three users with their profiles.

## Troubleshooting

### Issue: "Invalid credentials" error
- Make sure you created the users in Supabase Authentication
- Verify the email addresses match exactly (case-sensitive)
- Check that "Auto Confirm User" was checked when creating users

### Issue: "User profile not found" error
- Make sure you ran the SQL script to create profiles
- Verify the user IDs in the profiles table match the auth.users IDs
- Check that the `profiles` table exists (run `scripts/01-create-tables.sql` if needed)

### Issue: Still seeing demo mode
- Check your `.env.local` file has real Supabase URLs (not placeholders)
- Restart your development server after changing `.env.local`
- Check browser console for "Auth mode check" log to see which mode is active

