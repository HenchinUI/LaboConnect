# Debugging Session Issues on Render

## Quick Testing Steps

### 1. **Check Session Debug Endpoint**
After deploying, visit this URL in your browser:
```
https://your-app-on-render.com/api/session-debug
```

This will show you:
- Session ID being used
- Cookie configuration (secure, sameSite, etc.)
- NODE_ENV setting
- Session store type

### 2. **Test Login Flow with Console**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Open Network tab
4. Try to log in
5. Watch the Network tab for the `/login` POST request
6. Check the **Response** tab - should show user object
7. Check the **Cookies** tab - should see `connect.sid` cookie being set
8. After login, run in console:
```javascript
fetch('/api/session').then(r => r.json()).then(d => console.log(d))
```

Should return: `{ authenticated: true, user: {...} }`

### 3. **Check Server Logs on Render**
1. Go to your Render dashboard
2. Click on your Web Service
3. Go to the "Logs" tab
4. Try logging in and watch for these logs:
```
[LOGIN] Session ID: <session-id>
[LOGIN] User set in session: { id, username, email, role }
[LOGIN] NODE_ENV: production
[SESSION CHECK] Session ID: <session-id>
[SESSION CHECK] Session user: { id, username, email, role }
```

If you see `[PGSESSION ERROR]` - that means the PostgreSQL session store failed to save/retrieve the session.

---

## Common Issues & Solutions

### **Issue 1: Cookie not being sent with requests**
**Symptom:** Session works after login, but subsequent requests return 401

**Causes:**
- `secure: true` requires HTTPS (should be fine on Render)
- Browser privacy/incognito mode blocking cookies
- CORS not allowing credentials

**Fix:** Ensure frontend is sending cookies with requests:
```javascript
// In frontend code, all fetches should have:
fetch(url, {
  credentials: 'include', // This sends cookies!
  // ... other options
})
```

### **Issue 2: PostgreSQL session store can't connect**
**Symptom:** `[PGSESSION ERROR]` in logs

**Causes:**
- `DATABASE_URL` environment variable not set
- PostgreSQL connection pool exhausted
- Session table doesn't exist

**Fix:**
1. Check Render Environment Variables:
   - Go to Settings → Environment
   - Verify `DATABASE_URL` is set
   - If not, add it from your PostgreSQL database resource

2. Verify session table exists:
   - Connect to your PostgreSQL database via psql or Render console
   - Run: `SELECT * FROM session LIMIT 1;`
   - If table doesn't exist, run the migration:
   ```sql
   CREATE TABLE IF NOT EXISTS "session" (
     "sid" varchar NOT NULL COLLATE "default",
     "sess" json NOT NULL,
     "expire" timestamp(6) NOT NULL,
     PRIMARY KEY ("sid")
   )
   WITH (OIDS=FALSE);
   
   CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
   ```

### **Issue 3: SESSION_SECRET not set**
**Symptom:** Sessions might be created but not encrypted properly

**Fix:**
1. Go to Render dashboard → Settings → Environment
2. Add environment variable: `SESSION_SECRET=<random-long-string>`
   - Generate a secure string: `openssl rand -base64 32`

### **Issue 4: Connection pool issues**
**Symptom:** Occasional 500 errors or timeouts

**Check:**
- How many concurrent connections is your PostgreSQL plan allowing?
- Render free tier has limited connections

**Fix:**
- Upgrade PostgreSQL tier on Render
- Or reduce connection pool size in code

---

## Environment Variables Checklist

Make sure these are set in Render → Settings → Environment:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SESSION_SECRET` - Long random string (e.g., `openssl rand -base64 32`)
- [ ] `NODE_ENV` - Set to `production`
- [ ] `PORT` - Usually `3000` (auto-set, but verify)

---

## Testing Locally vs Render

### Local (localhost:3000):
- Uses `secure: false` (HTTP cookies allowed)
- Uses in-memory fallback for sessions
- No CORS issues

### Render (HTTPS):
- Uses `secure: true` (HTTPS only for cookies)
- MUST use PostgreSQL session store
- Browser MUST send cookies with `credentials: 'include'`

---

## Advanced Debugging

### Check if session table is being written:
```sql
SELECT COUNT(*) FROM session;
SELECT * FROM session LIMIT 5;
```

### Check session expiration:
```sql
SELECT sid, expire, NOW() as current_time, 
       (expire > NOW()) as is_valid
FROM session
ORDER BY expire DESC LIMIT 5;
```

### Monitor query errors:
In server.js, the session store error handler will log to console if queries fail.

---

## Frontend Debugging

Add this to your frontend code to check sessions:
```javascript
// Check session status
async function debugSession() {
  const response = await fetch('/api/session');
  const data = await response.json();
  console.log('Session status:', data);
  
  // Also check debug endpoint
  const debug = await fetch('/api/session-debug');
  const debugData = await debug.json();
  console.log('Session config:', debugData);
}

// Run after login
debugSession();
```

---

## Need More Help?

1. Check Render logs for any error messages
2. Test `/api/session-debug` endpoint in browser
3. Verify all environment variables are set
4. Check PostgreSQL database is accessible
5. Try redeploying the application
