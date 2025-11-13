# Google SSO with Secure Backend

This project implements Google OAuth 2.0 authentication with a secure backend using the **Authorization Code Flow**.

## 🏗️ Architecture

```
┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│   Angular   │          │   Backend    │          │   Google    │
│  (Frontend) │◄────────►│  (Node.js)   │◄────────►│   OAuth     │
│  Port: 4200 │          │  Port: 3000  │          │             │
└─────────────┘          └──────────────┘          └─────────────┘
```

### Security Benefits:
✅ **Client Secret protected** - Never exposed to frontend
✅ **Token validation** - Backend verifies all tokens
✅ **CSRF protection** - State parameter validation
✅ **Secure sessions** - HTTP-only cookies
✅ **CORS configured** - Only your frontend can access API

## 🚀 Setup Instructions

### 1. Backend Setup

```powershell
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment template
Copy-Item .env.example .env

# Edit .env file with your credentials
notepad .env
```

**Required in `.env`:**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-console
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
FRONTEND_URL=http://localhost:4200
PORT=3000
SESSION_SECRET=generate-a-random-string-here
```

**Start backend:**
```powershell
npm run dev
```

Backend runs on: http://localhost:3000

### 2. Google Cloud Console Configuration

**For Backend (Authorization Code Flow):**

1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth Client ID
3. Add to **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback` (Backend endpoint)
4. Note down both **Client ID** and **Client Secret**

**For Frontend (Google Identity Services - Optional):**

If you want to keep using the current Google button:
1. Add to **Authorized JavaScript origins**:
   - `http://localhost:4200`

### 3. Frontend Setup

The frontend is already configured! Just make sure backend is running.

```powershell
# In main project directory
npm start
```

Frontend runs on: http://localhost:4200

## 📝 Two Authentication Methods

### Method 1: Backend OAuth Flow (Most Secure)

**Flow:**
1. User clicks "Sign in with Google"
2. Frontend calls `/auth/google` backend endpoint
3. Backend generates secure auth URL with state
4. User redirects to Google consent screen
5. Google redirects back to `/auth/callback` (backend)
6. Backend exchanges code for tokens using Client Secret
7. Backend verifies token and creates session
8. User redirected to frontend dashboard

**To use in LoginComponent:**
```typescript
import { AuthBackendService } from './services/auth-backend.service';

constructor(private authBackend: AuthBackendService) {}

login() {
  this.authBackend.initiateGoogleLogin();
}
```

### Method 2: Hybrid Approach (Current + Backend Validation)

Keep your current Google Identity Services button, but validate through backend:

**Flow:**
1. User clicks Google button (current implementation)
2. Google returns JWT token to frontend
3. Frontend sends token to backend for verification
4. Backend validates token signature and audience
5. Backend returns user info
6. Frontend navigates to dashboard

**Update your current AuthService:**
```typescript
// In handleGoogleSignIn method, after receiving response
private async handleGoogleSignIn(response: any): Promise<void> {
  try {
    if (!response?.credential) {
      throw new Error('Invalid response');
    }
    
    // Send token to backend for verification
    await this.authBackendService.verifyGoogleToken(response.credential);
    
  } catch (error) {
    // Handle error
  }
}
```

## 🔑 API Endpoints

**Backend endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/auth/google` | GET | Get OAuth URL |
| `/auth/callback` | GET | Handle OAuth callback |
| `/auth/verify-token` | POST | Verify ID token |
| `/auth/logout` | POST | Logout user |
| `/auth/user` | GET | Get current user |

## 🎯 Production Deployment

### Backend (.env for production):
```env
GOOGLE_CLIENT_ID=your-prod-client-id
GOOGLE_CLIENT_SECRET=your-prod-client-secret
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/callback
FRONTEND_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production
SESSION_SECRET=use-a-strong-random-string
```

### Frontend (environment.prod.ts):
```typescript
export const environment = {
  production: true,
  googleClientId: 'your-prod-client-id',
  apiUrl: 'https://api.yourdomain.com'
};
```

### Google Console (Production):
```
Authorized JavaScript origins:
- https://yourdomain.com

Authorized redirect URIs:
- https://api.yourdomain.com/auth/callback
- https://yourdomain.com  (if using hybrid)
```

## 🛡️ Security Checklist

✅ Client Secret stored only on backend
✅ HTTPS in production
✅ HTTP-only cookies for sessions
✅ CORS restricted to your frontend
✅ State parameter for CSRF protection
✅ Token verification on backend
✅ Secure session storage (use Redis in production)
✅ Environment variables for secrets

## 📦 Dependencies

**Backend:**
- `express` - Web framework
- `googleapis` - Google OAuth client
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `helmet` - Security headers
- `cookie-parser` - Cookie handling

**Frontend:**
- `@angular/common/http` - HTTP client (already included)

## 🔄 Comparison with Current Setup

| Aspect | Current (Frontend Only) | Backend Integration |
|--------|------------------------|-------------------|
| **Client Secret** | Not used | ✅ Secure in backend |
| **Token Validation** | Frontend only | ✅ Backend validates |
| **Session Management** | LocalStorage/Cookie | ✅ HTTP-only secure cookie |
| **Refresh Tokens** | ❌ Not supported | ✅ Available |
| **Security** | ⚠️ Good | ✅ Excellent |

## 🚨 Troubleshooting

**Backend won't start:**
- Check if port 3000 is available
- Verify all environment variables in `.env`
- Run `npm install` in backend folder

**CORS errors:**
- Ensure `FRONTEND_URL` in backend `.env` matches your Angular URL
- Check browser console for specific origin

**Authentication fails:**
- Verify Client ID and Secret in `.env`
- Check redirect URI matches Google Console exactly
- Ensure backend is running before frontend authentication

## 📚 Next Steps

1. ✅ Install backend dependencies
2. ✅ Configure `.env` file
3. ✅ Update Google Console redirect URIs
4. ✅ Start backend server
5. ✅ Test authentication flow
6. Implement session storage (Redis/Database)
7. Add refresh token handling
8. Deploy to production
