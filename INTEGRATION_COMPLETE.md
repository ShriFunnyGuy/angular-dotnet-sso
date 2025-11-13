# Google SSO Implementation - Complete Setup Guide

## Overview

This project implements Google Single Sign-On (SSO) using:
- **Frontend**: Angular 20 with Google Identity Services
- **Backend**: .NET Core 8 Web API for secure token validation
- **Styling**: Tailwind CSS v3

## Architecture

### Hybrid OAuth Flow

1. **Frontend (Angular)**: Displays Google Sign-In button using Google Identity Services
2. **Token Generation**: Google returns an ID token to the frontend
3. **Backend Verification**: Angular sends token to .NET backend for server-side validation
4. **User Session**: Backend validates with Google and returns user information

This approach provides:
- ✅ Excellent user experience (direct Google button)
- ✅ Enhanced security (backend validation)
- ✅ No Client Secret exposure in frontend
- ✅ Protection against token tampering

## Running the Application

### 1. Start Backend (.NET)

```powershell
cd backend
dotnet run --launch-profile https
```

Backend runs on: **https://localhost:7072**

### 2. Start Frontend (Angular)

```powershell
# In a separate terminal
npm start
```

Frontend runs on: **http://localhost:4200**

### 3. Test the Application

1. Navigate to http://localhost:4200
2. You'll be redirected to `/login`
3. Click "Sign in with Google"
4. Complete Google authentication
5. You'll be redirected to `/dashboard` with your profile

## Project Structure

```
googleSSO/
├── backend/                          # .NET Core 8 Web API
│   ├── Controllers/
│   │   └── AuthController.cs         # Token verification endpoints
│   ├── Properties/
│   │   └── launchSettings.json       # HTTPS/HTTP port configuration
│   ├── appsettings.json              # Google OAuth configuration
│   ├── Program.cs                    # CORS and middleware setup
│   └── README.md                     # Backend documentation
│
├── src/                              # Angular 20 Application
│   ├── app/
│   │   ├── models/
│   │   │   ├── classe/interface/
│   │   │   │   └── basic-user-details.ts      # User model
│   │   │   └── oAuthTypeEnum.enum.ts          # OAuth provider enum
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   │   ├── login.ts                   # Login page component
│   │   │   │   └── login.html                 # Login UI
│   │   │   └── dashboard/
│   │   │       ├── dashboard.ts               # Dashboard component
│   │   │       └── dashboard.html             # User profile display
│   │   ├── services/
│   │   │   ├── auth.service.ts                # Authentication service
│   │   │   └── auth-backend.service.ts        # Backend integration (unused)
│   │   ├── app.config.ts                      # App providers
│   │   └── app.routes.ts                      # Routing configuration
│   │
│   └── environments/
│       ├── environment.ts                     # Development config
│       ├── environment.test.ts                # Test config
│       └── environment.prod.ts                # Production config
│
└── tailwind.config.js                         # Tailwind CSS configuration
```

## Configuration

### Frontend Configuration

**src/environments/environment.ts** (Development):
```typescript
export const environment = {
  production: false,
  googleClientId: '513369139657-1v8rrem73cv7aapn2aatlljco1cpveqe.apps.googleusercontent.com',
  apiUrl: 'https://localhost:7072'
};
```

### Backend Configuration

**backend/appsettings.json**:
```json
{
  "GoogleOAuth": {
    "ClientId": "513369139657-1v8rrem73cv7aapn2aatlljco1cpveqe.apps.googleusercontent.com",
    "ClientSecret": ""
  },
  "FrontendUrl": "http://localhost:4200"
}
```

## Key Features

### Authentication Service (`auth.service.ts`)

- **Google Sign-In Integration**: Uses Google Identity Services SDK
- **Backend Token Verification**: Sends ID token to .NET backend
- **State Management**: Angular signals for user, authType, error, authState
- **Auto Navigation**: Redirects to dashboard after successful login
- **Error Handling**: Comprehensive error states and messages

### Backend API (`AuthController.cs`)

**Endpoints:**

1. **POST /auth/verify-token**
   - Validates Google ID token using `GoogleJsonWebSignature.ValidateAsync()`
   - Verifies signature with Google's public keys
   - Validates audience (Client ID)
   - Checks token expiration
   - Returns user profile data

2. **POST /auth/logout**
   - Handles logout operations

3. **GET /auth/health**
   - Health check endpoint

### Dashboard Component

- **Auth Guard**: Redirects to login if user is not authenticated
- **User Profile Display**: Shows avatar, name, email, verification status
- **Statistics Cards**: Displays authentication method and account info
- **Logout Functionality**: Sign out button

## Security Considerations

### ✅ Implemented Security Features

1. **Server-Side Token Validation**: Backend validates tokens with Google
2. **CORS Protection**: Only Angular frontend can access API
3. **HTTPS**: Backend runs on HTTPS in development
4. **No Client Secret in Frontend**: Client Secret not required for ID token verification
5. **Token Signature Verification**: Google's public keys validate token integrity
6. **Audience Validation**: Ensures token was issued for this application

### 🔒 Production Recommendations

1. **Environment Variables**: Store Client ID in environment variables, not code
2. **HTTPS Only**: Enforce HTTPS for frontend and backend
3. **Rate Limiting**: Implement rate limiting on /auth/verify-token endpoint
4. **Logging**: Add comprehensive logging for security events
5. **Error Messages**: Don't expose internal errors to clients
6. **Token Storage**: Consider using HttpOnly cookies instead of localStorage

## Google Cloud Console Setup

### Required Configuration

1. **Authorized JavaScript origins**:
   - http://localhost:4200 (development)
   - https://yourdomain.com (production)

2. **Authorized redirect URIs**:
   - Not required for this flow (using ID token, not authorization code)

3. **API & Services > Credentials**:
   - OAuth 2.0 Client ID type: Web application
   - Note: Client Secret is not used in this implementation

## Troubleshooting

### Backend Won't Start

**Port Already in Use**:
```powershell
Get-Process -Name dotnet | Stop-Process -Force
```

**Certificate Not Trusted**:
```powershell
dotnet dev-certs https --trust
```

### CORS Errors

- Verify `FrontendUrl` in `backend/appsettings.json` matches Angular dev server
- Check browser console for specific CORS error messages
- Ensure backend is running before starting frontend

### Google Sign-In Button Not Appearing

- Check browser console for JavaScript errors
- Verify `googleClientId` in `environment.ts`
- Ensure Google Identity Services SDK is loaded (check Network tab)
- Verify origin is authorized in Google Cloud Console

### Token Verification Fails

- Check backend logs for specific error
- Verify Client ID in both frontend and backend match
- Ensure token hasn't expired (tokens are short-lived)
- Check network request in browser DevTools

## Testing

### Manual Testing Flow

1. Start backend: `cd backend && dotnet run --launch-profile https`
2. Start frontend: `npm start`
3. Open http://localhost:4200 in browser
4. Should auto-redirect to `/login`
5. Click "Sign in with Google"
6. Complete Google authentication
7. Should see success message then redirect to `/dashboard`
8. Dashboard should display your Google profile
9. Click "Sign Out" to test logout
10. Should redirect back to `/login`

### Backend Health Check

```powershell
# Test if backend is running
Invoke-WebRequest -Uri https://localhost:7072/auth/health -UseBasicParsing
```

Expected response:
```json
{"status":"ok","timestamp":"2025-01-20T..."}
```

## Dependencies

### Frontend (package.json)
- Angular 20.0.0
- Tailwind CSS 3.4.17
- TypeScript 5.9.2

### Backend (SSOBackend.csproj)
- Microsoft.AspNetCore.OpenApi 8.0.0
- Google.Apis.Auth 1.72.0
- Microsoft.AspNetCore.Authentication.Google 8.0.0

## Development Timeline

1. ✅ Angular enum creation and basic setup
2. ✅ Google OAuth with Google Identity Services
3. ✅ Tailwind CSS v3 integration
4. ✅ Error handling and loading states
5. ✅ Login and Dashboard pages
6. ✅ Routing with auth guard
7. ✅ Environment-based configuration
8. ✅ .NET Core 8 backend implementation
9. ✅ Backend token verification integration
10. ✅ Complete end-to-end authentication flow

## Next Steps / Enhancements

- [ ] Add refresh token support for long sessions
- [ ] Implement session management in backend
- [ ] Add Microsoft authentication (existing enum supports it)
- [ ] Add unit tests for frontend and backend
- [ ] Set up CI/CD pipeline
- [ ] Deploy to production environment
- [ ] Add user profile management
- [ ] Implement role-based access control
