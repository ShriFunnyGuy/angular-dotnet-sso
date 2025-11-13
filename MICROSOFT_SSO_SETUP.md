# Microsoft 365 SSO Implementation Guide

## Overview

This application supports **Microsoft 365** and **Personal Microsoft Account** Single Sign-On using **MSAL.js (Microsoft Authentication Library)** with popup flow.

## Supported Account Types

✅ **Personal Microsoft Accounts**: @outlook.com, @hotmail.com, @live.com  
✅ **Work/School Accounts**: Azure AD organizational accounts  
✅ **Multi-tenant**: Both personal and organizational accounts  

## Features

- ✅ MSAL.js v2 integration with popup authentication
- ✅ Backend JWT token validation (.NET Core)
- ✅ Secure token verification (audience, tenant, expiration)
- ✅ Unified authentication flow with Google SSO
- ✅ Modern Microsoft sign-in button with official logo
- ✅ Error handling and user cancellation support

## Architecture

### Frontend (Angular + MSAL.js)
- **MSAL PublicClientApplication** for popup-based authentication
- **Interactive popup flow** - user authenticates in Microsoft popup window
- **ID token** returned directly to application
- **Token sent to backend** for validation at `/auth/verify-microsoft-token`
- **User profile** extracted from validated token claims

### Backend (.NET Core)
- **POST /auth/verify-microsoft-token** endpoint
- **JwtSecurityTokenHandler** for manual JWT validation
- **Validates**: audience (client ID), tenant ID, token expiration
- **Extracts claims**: email, given_name, family_name, oid (Microsoft ID)
- **Returns**: standardized `BasicUserDetails` object

### Key Difference from Google
- **Google**: Uses Google Identity Services (seamless, no popup)
- **Microsoft**: Uses MSAL popup window (security isolation)
- Both send ID tokens to backend for validation

## Setup Instructions

### 1. Register Application in Microsoft Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Your App Name (e.g., "Google SSO App")
   - **Supported account types**: Choose based on your needs:
     - **Accounts in any organizational directory (Any Azure AD directory - Multitenant)** for work/school accounts
     - **Accounts in any organizational directory and personal Microsoft accounts** for both
     - **Personal Microsoft accounts only** for consumers
   - **Redirect URI**: Select **Single-page application (SPA)** and enter:
     - `http://localhost:4200` (development)
     - `https://your-production-domain.com` (production)

5. Click **Register**

6. Note down:
   - **Application (client) ID**
   - **Directory (tenant) ID** (or use "common" for multi-tenant)

### 2. Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph**
3. Select **Delegated permissions**
4. Add these permissions:
   - `openid` (sign in and read user profile)
   - `profile` (read user's basic profile)
   - `email` (read user's email address)
   - `User.Read` (read signed-in user's profile)
5. Click **Add permissions**
6. **(Optional)** Click **Grant admin consent for [Your Tenant]**

**Note:** For personal accounts, admin consent is not required.

### 3. Configure Supported Account Types

**Method 1: Via UI (if available)**
- Go to **Authentication** 
- Under "Supported account types", select:
  - **"Accounts in any organizational directory and personal Microsoft accounts"**

**Method 2: Via Manifest (Recommended)**
1. Go to **Manifest** in your app registration
2. Find `"signInAudience"` property
3. Set to one of:
   ```json
   "signInAudience": "AzureADandPersonalMicrosoftAccount"  // Personal + Work accounts
   ```
   OR
   ```json
   "signInAudience": "PersonalMicrosoftAccount"  // Personal accounts only
   ```
   OR
   ```json
   "signInAudience": "AzureADMultipleOrgs"  // Work/school accounts only
   ```
4. Click **Save**

**Important:** If you see "unauthorized_client" error, check this setting!

### 4. Configure Backend (User Secrets)

**Recommended: Use User Secrets** (keeps credentials out of source control)

```bash
cd backend
dotnet user-secrets set "MicrosoftOAuth:ClientId" "YOUR_APPLICATION_CLIENT_ID"
dotnet user-secrets set "MicrosoftOAuth:TenantId" "consumers"
dotnet user-secrets set "MicrosoftOAuth:ClientSecret" "YOUR_CLIENT_SECRET_IF_NEEDED"
```

**Verify secrets:**
```bash
dotnet user-secrets list
```

**TenantId Options:**
- `consumers` - **Personal Microsoft accounts only** (@outlook.com, @hotmail.com, @live.com)
- `common` - **Multi-tenant** (personal + work/school accounts)
- `organizations` - **Work/school accounts only**
- `{your-tenant-id}` - **Specific Azure AD tenant** (use actual tenant GUID)

**Backend Configuration File** (`appsettings.json`):
```json
{
  "MicrosoftOAuth": {
    "ClientId": "",
    "TenantId": "",
    "ClientSecret": ""
  }
}
```

**Note:** Leave empty in `appsettings.json` - values loaded from user secrets in Development.

### 5. Configure Frontend

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID',
  microsoftClientId: 'YOUR_MICROSOFT_CLIENT_ID',
  microsoftTenantId: 'consumers', // Match backend configuration
  apiUrl: 'https://localhost:7072'
};
```

**Important:** Frontend `microsoftTenantId` must match backend `TenantId` setting!

### 6. Update Azure AD Redirect URIs

1. In Azure Portal, go to your app registration
2. Navigate to **Authentication**
3. Under **Platform configurations** > **Single-page application**, ensure redirect URI exists:
   - `http://localhost:4200` (development)
   - `https://your-production-domain.com` (production)
4. Under **Implicit grant and hybrid flows**:
   - ✅ **ID tokens** should be checked (MSAL requires this)
5. Click **Save**

**Note:** MSAL uses the popup for authentication, so the redirect URI is the app origin.

## How It Works

### Microsoft MSAL Authentication Flow

1. **Initialization**: `auth.service.ts` creates MSAL `PublicClientApplication` instance
   ```typescript
   const msalConfig = {
     auth: {
       clientId: 'YOUR_CLIENT_ID',
       authority: 'https://login.microsoftonline.com/consumers',
       redirectUri: window.location.origin
     }
   };
   this.msalInstance = new PublicClientApplication(msalConfig);
   ```

2. **User clicks** "Sign in with Microsoft" button

3. **Popup opens**: MSAL opens Microsoft login popup
   ```typescript
   const result = await this.msalInstance.loginPopup({
     scopes: ['openid', 'profile', 'email', 'User.Read']
   });
   ```

4. **User authenticates** with Microsoft credentials in popup

5. **ID token received**: MSAL returns authentication result with ID token

6. **Token sent to backend**: Angular sends token to `POST /auth/verify-microsoft-token`

7. **Backend validation**:
   - Decodes JWT token using `JwtSecurityTokenHandler`
   - Validates audience (client ID matches)
   - Validates tenant (if specific tenant configured)
   - Checks token expiration
   - Extracts user claims (email, given_name, family_name, oid)

8. **Backend returns** validated user data:
   ```json
   {
     "valid": true,
     "user": {
       "email": "user@outlook.com",
       "firstName": "John",
       "lastName": "Doe",
       "emailVerified": true,
       "avatar": "",
       "microsoftId": "00000000-0000-0000-0000-000000000000"
     }
   }
   ```

9. **Angular stores** user profile in signals and navigates to dashboard

### Token Validation Logic (Backend)

The backend validates tokens by checking:
```csharp
// 1. Audience claim must match client ID
if (azpClaim != clientId) {
    return Unauthorized("Invalid audience");
}

// 2. Tenant validation (special handling for consumers/common/organizations)
if (tenantId != "consumers" && tenantId != "common" && 
    tenantId != "organizations" && tidClaim != tenantId) {
    return Unauthorized("Invalid tenant");
}

// 3. Token expiration
if (expDateTime < DateTimeOffset.UtcNow) {
    return Unauthorized("Token expired");
}
```

**Key Point**: When using `consumers`, `common`, or `organizations`, the backend skips exact tenant ID matching because tokens contain the actual consumer tenant GUID.

## API Endpoints

### Verify Microsoft Token

**Endpoint:** `POST /auth/verify-microsoft-token`

**Request:**
```json
{
  "idToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "user": {
    "email": "user@contoso.com",
    "emailVerified": true,
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "",
    "microsoftId": "00000000-0000-0000-0000-000000000000"
  }
}
```

**Error Response (401/500):**
```json
{
  "valid": false,
  "error": "Invalid or expired token"
}
```

## Troubleshooting

### "unauthorized_client" Error

**Problem**: "The client does not exist or is not enabled for consumers"

**Solutions:**
1. Check Azure AD **Manifest** → `"signInAudience"` must be:
   - `"AzureADandPersonalMicrosoftAccount"` (for personal + work accounts)
   - `"PersonalMicrosoftAccount"` (for personal accounts only)
2. Verify **Authentication** settings allow personal accounts
3. Ensure you created a **new app registration** after changing account types (existing apps may need recreation)

### "Invalid tenant" Error

**Problem**: Backend returns `{valid: false, error: 'Invalid tenant'}`

**Solutions:**
1. **Match tenant IDs**: Frontend and backend must use same tenant value
2. **Use `consumers`** for personal Microsoft accounts
3. **Backend fix applied**: Code now accepts `consumers`, `common`, `organizations` without exact tenant ID matching

**Check:**
- Frontend `environment.ts`: `microsoftTenantId: 'consumers'`
- Backend user secrets: `MicrosoftOAuth:TenantId` = `'consumers'`
- Backend validation allows special tenant values (line 109-113 in AuthController)

### Popup Blocked

**Problem**: Browser blocks MSAL popup window

**Solutions:**
1. Allow popups for `localhost:4200` in browser settings
2. User must click button (popup must be triggered by user action)
3. Try different browser

### Token Claims Missing

**Problem**: Email or name not in token

**Solutions:**
1. Add Graph API permissions: `openid`, `profile`, `email`
2. Grant consent (click "Grant admin consent" in API permissions)
3. Sign out and sign in again to get new token with updated claims

### CORS Errors

**Problem**: Backend rejects requests from frontend

**Solutions:**
1. Verify `FrontendUrl` in `appsettings.json` matches frontend origin
2. Check backend CORS policy allows `http://localhost:4200`
3. Ensure backend is running on `https://localhost:7072`

### Dashboard

The dashboard displays:
- User's avatar (if available)
- Full name
- Email address
- Email verification status
- Authentication provider (Google or Microsoft)
- Sign out button

## Security Considerations

### ✅ Implemented

1. **Token Validation**: All tokens validated on backend
2. **Audience Verification**: Ensures token was issued for your app
3. **Tenant Verification**: Validates tenant if configured
4. **Expiration Check**: Rejects expired tokens
5. **CORS Protection**: Backend only accepts requests from frontend origin
6. **HTTPS**: Enforced in production
7. **Popup Authentication**: More secure than redirect flow for SPAs

### 🔒 Production Recommendations

1. **Use HTTPS Everywhere**: Never use HTTP in production
2. **Configure Specific Tenant**: Use specific tenant ID instead of "common" if possible
3. **Enable App Roles**: Configure role-based access in Azure AD
4. **Monitor Auth Logs**: Enable Azure AD sign-in logs
5. **Rate Limiting**: Implement rate limiting on token verification endpoints
6. **Token Storage**: Consider using HttpOnly cookies instead of localStorage
7. **Update Dependencies**: Keep Microsoft.Identity.Web updated (current version has moderate vulnerability)

## Troubleshooting

### Microsoft Sign-In Button Not Working

**Issue:** Clicking button does nothing

**Solutions:**
- Check browser console for errors
- Verify `microsoftClientId` in `environment.ts`
- Ensure Client ID is correct in Azure AD
- Check popup blocker isn't blocking authentication window

### "Invalid Client ID" Error

**Issue:** Error message about invalid client

**Solutions:**
- Verify Client ID matches Azure AD app registration
- Check tenant ID is correct ("common", "organizations", or your tenant GUID)
- Ensure appsettings.json has correct MicrosoftOAuth:ClientId

### Popup Blocked

**Issue:** Popup window doesn't open

**Solutions:**
- Allow popups for localhost in browser settings
- Try signing in again after allowing popups
- Check browser's popup blocker settings

### Token Validation Fails

**Issue:** Backend returns "Invalid token"

**Solutions:**
- Verify token hasn't expired (tokens are short-lived)
- Check client ID in backend matches Azure AD
- Ensure tenant ID is correct
- Review backend logs for specific error
- Verify ID tokens are enabled in Azure AD app registration

### CORS Errors

**Issue:** Browser shows CORS policy error

**Solutions:**
- Verify `FrontendUrl` in backend appsettings.json matches Angular URL
- Ensure backend is running before frontend
- Check browser DevTools Network tab for CORS headers
- Verify https://localhost:7072 is the backend URL

## Testing

### Manual Testing Steps

1. **Start Backend**:
   ```powershell
   cd backend
   dotnet run --launch-profile https
   ```
   Backend runs on: https://localhost:7072

2. **Start Frontend**:
   ```powershell
   npm start
   ```
   Frontend runs on: http://localhost:4200

3. **Test Google SSO**:
   - Click "Sign in with Google"
   - Complete Google authentication
   - Verify redirect to dashboard
   - Check user profile displays correctly

4. **Test Microsoft SSO**:
   - Refresh page to return to login
   - Click "Sign in with Microsoft"
   - Complete Microsoft authentication
   - Verify redirect to dashboard
   - Check user profile displays correctly

5. **Test Logout**:
   - Click "Sign Out" on dashboard
   - Verify return to login page
   - Try logging in again with different provider

## Token Claims

### Microsoft ID Token Claims

The Microsoft ID token contains these useful claims:

- `oid` - Object ID (unique user identifier)
- `tid` - Tenant ID
- `preferred_username` or `email` - User's email
- `given_name` - First name
- `family_name` - Last name
- `name` - Full name
- `aud` - Audience (your client ID)
- `exp` - Expiration timestamp
- `iat` - Issued at timestamp

## Differences: Google vs Microsoft

| Feature | Google | Microsoft |
|---------|--------|-----------|
| **Button Style** | Google Identity Services official button | Custom styled button |
| **Authentication** | Automatic with SDK | Popup with OAuth URL |
| **Token Validation** | Google.Apis.Auth library | Manual JWT decoding |
| **User Avatar** | Provided in token | Requires Microsoft Graph API |
| **Setup Complexity** | Simple | Moderate (Azure AD required) |
| **Account Types** | Personal Google accounts | Personal, Work, School accounts |

## Next Steps

- [ ] Get Microsoft Graph API profile photos
- [ ] Add Microsoft account type detection
- [ ] Implement refresh token support
- [ ] Add role-based access control (RBAC)
- [ ] Set up Azure AD groups integration
- [ ] Add audit logging for authentication events
- [ ] Implement session management
- [ ] Deploy to production environment

## Resources

- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Azure AD App Registration](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
- [Microsoft Authentication Library (MSAL)](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [ID Token Claims Reference](https://learn.microsoft.com/en-us/azure/active-directory/develop/id-tokens)
