

# Create Admin Account: jambo@safarihirehub.com

Since the project is now connected to your own Supabase "hire" project, we'll create a dedicated edge function that securely creates the admin account using the service role key (bypassing RLS).

## Approach

We'll create a one-time-use edge function called `create-admin` that:

1. Creates the user in Supabase Auth with email `jambo@safarihirehub.com` (email auto-confirmed)
2. Updates the `profiles` table with admin details
3. Inserts the `admin` role into `user_roles`

After running it once, you can delete the function.

## Steps

### Step 1: Create Edge Function

Create `supabase/functions/create-admin/index.ts` that:
- Uses the service role key to call `supabase.auth.admin.createUser()` with email `jambo@safarihirehub.com`
- Sets a secure password (you'll provide it)
- Confirms the email automatically
- Inserts the `admin` role into `user_roles`
- Updates the profile with `full_name` and `account_status: 'active'`

### Step 2: Add Config Entry

Add `[functions.create-admin]` with `verify_jwt = false` to `supabase/config.toml` so the function can be called without authentication.

### Step 3: Run the Function

Call the deployed edge function once to create the admin account.

### Step 4: Cleanup

Delete the `create-admin` edge function after successful execution (it's a one-time setup tool).

---

## Technical Details

The edge function will look like this:

```typescript
// Creates admin user with service role key
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: "jambo@safarihirehub.com",
  password: <provided_password>,
  email_confirm: true,
  user_metadata: { full_name: "Safari Hire Hub Admin" }
});

// Assign admin role
await supabaseAdmin.from("user_roles").insert({
  user_id: data.user.id,
  role: "admin"
});
```

## What You Need to Provide

- The password you want for this admin account

