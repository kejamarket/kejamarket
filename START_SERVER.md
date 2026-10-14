# 🚀 Quick Start - KejaMarket Server

## Start the Server

Open PowerShell in the project folder and run:

```powershell
npm start
```

**OR**

```powershell
node server.js
```

## You should see:

```
✅ Store initialized successfully
🚀 KejaMarket backend running on PORT 3001
```

## Then test authentication:

1. **Open test page:** http://localhost:3001/test-auth.html
2. **Or open main site:** http://localhost:3001/index.html

## Default Admin Credentials:

- **Email:** admin@kejamarket.co.ke
- **Password:** admin123

## If server doesn't start:

1. **Check if port 3001 is already in use:**
   ```powershell
   netstat -ano | findstr :3001
   ```

2. **Install dependencies if needed:**
   ```powershell
   npm install
   ```

3. **Check for errors in the console output**

## Next Steps:

1. Start the server (above)
2. Open http://localhost:3001/test-auth.html
3. Follow the **AUTH_TESTING_GUIDE.md** for detailed testing

---

✅ Once the server is running, authentication will work!
