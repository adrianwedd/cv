
🔄 **MANUAL COOKIE REFRESH REQUIRED**

Your Claude.ai session cookies have expired. Please refresh them manually:

1. **Open Claude.ai in your browser**
   → https://claude.ai
   → Make sure you're logged in

2. **Extract fresh cookies using browser console:**
   → Press F12 (Developer Tools)
   → Go to Console tab
   → Paste and run this code:

   ```javascript
   const cookies = document.cookie.split(';').reduce((acc, cookie) => {
     const [name, value] = cookie.trim().split('=');
     if (['sessionKey', 'lastActiveOrg', 'ajs_user_id'].includes(name)) {
       acc[name] = value;
     }
     return acc;
   }, {});
   
   console.log('🍪 COPY THESE VALUES:');
   console.log('CLAUDE_SESSION_KEY=' + (cookies.sessionKey || 'NOT_FOUND'));
   console.log('CLAUDE_ORG_ID=' + (cookies.lastActiveOrg || 'NOT_FOUND'));
   console.log('CLAUDE_USER_ID=' + (cookies.ajs_user_id || 'NOT_FOUND'));
   ```

3. **Update your .env file** with the new values
4. **Run:** node browser-auth-refresh.js test
5. **Update GitHub secrets:** node setup-claude-cookies.js

⏰ **Next check:** 2025-08-08T15:23:23.913Z
