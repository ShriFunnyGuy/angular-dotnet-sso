# Google & Microsoft 365 SSO Setup Guide

Complete setup instructions for implementing both Google and Microsoft authentication.

## Prerequisites

- Node.js (v18 or later)
- .NET 8 SDK
- Google OAuth 2.0 Client ID
- Microsoft Azure AD App Registration

## Part 1: Google SSO Setup

### 1. Get Your Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth Client ID**
5. Configure the OAuth consent screen if you haven't already
6. Select **Web application** as the application type
7. Add authorized JavaScript origins:
   - `http://localhost:4200` (for development)
   - Your production domain
8. Click **Create** and copy your **Client ID**

### 2. Configure Google Client ID

Add to user secrets (recommended) or environment file:

**Using User Secrets (Secure):**
```bash
cd backend
dotnet user-secrets set "GoogleOAuth:ClientId" "YOUR_GOOGLE_CLIENT_ID"
dotnet user-secrets set "GoogleOAuth:ClientSecret" "YOUR_GOOGLE_CLIENT_SECRET"
```

**Or in `src/environments/environment.ts`:**
```typescript
export const environment = {
  production: false,
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  apiUrl: 'https://localhost:7072'
};
```

## Part 2: Microsoft 365 SSO Setup

### 1. Register Application in Microsoft Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Your App Name
   - **Supported account types**: 
     - For personal accounts (@outlook.com, @hotmail.com): Select **"Personal Microsoft accounts only"** or **"Accounts in any organizational directory and personal Microsoft accounts"**
   - **Redirect URI**: 
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:4200`

5. Click **Register**

6. Note down:
   - **Application (client) ID**
   - **Directory (tenant) ID**

### 2. Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph**
3. Select **Delegated permissions**
4. Add:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
5. Click **Grant admin consent** (optional)

### 3. Configure Supported Account Types

**For Personal Microsoft Accounts:**

Go to **Manifest** and set:
```json
"signInAudience": "AzureADandPersonalMicrosoftAccount"
```
Or:
```json
"signInAudience": "PersonalMicrosoftAccount"
```

### 4. Configure Microsoft Credentials

**Using User Secrets (Recommended):**
```bash
cd backend
dotnet user-secrets set "MicrosoftOAuth:ClientId" "YOUR_MICROSOFT_CLIENT_ID"
dotnet user-secrets set "MicrosoftOAuth:TenantId" "consumers"
dotnet user-secrets set "MicrosoftOAuth:ClientSecret" "YOUR_CLIENT_SECRET"
```

**Tenant ID Options:**
- `consumers` - Personal Microsoft accounts only (@outlook.com, @hotmail.com, @live.com)
- `common` - Both personal and work/school accounts
- `organizations` - Work/school accounts only
- `{your-tenant-id}` - Specific Azure AD tenant

**Update `src/environments/environment.ts`:**
```typescript
export const environment = {
  production: false,
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID',
  microsoftClientId: 'YOUR_MICROSOFT_CLIENT_ID',
  microsoftTenantId: 'consumers', // or 'common'
  apiUrl: 'https://localhost:7072'
};
```

## Part 3: Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
dotnet restore
```

**Required Packages (Already in project):**
- Frontend: `@azure/msal-browser`
- Backend: `Google.Apis.Auth`, `Microsoft.Identity.Web`, `System.IdentityModel.Tokens.Jwt`

## Part 4: Configure User Secrets (Recommended)

User secrets keep credentials out of source control.

**Check UserSecretsId exists in `.csproj`:**
```xml
<PropertyGroup>
  <UserSecretsId>09630acc-8fab-465b-9bb4-e2b575a92c2f</UserSecretsId>
</PropertyGroup>
```

**Set all secrets:**
```bash
cd backend
dotnet user-secrets set "GoogleOAuth:ClientId" "YOUR_GOOGLE_CLIENT_ID"
dotnet user-secrets set "GoogleOAuth:ClientSecret" "YOUR_GOOGLE_CLIENT_SECRET"
dotnet user-secrets set "MicrosoftOAuth:ClientId" "YOUR_MICROSOFT_CLIENT_ID"
dotnet user-secrets set "MicrosoftOAuth:TenantId" "consumers"
dotnet user-secrets set "MicrosoftOAuth:ClientSecret" "YOUR_CLIENT_SECRET"
```

**Verify secrets:**
```bash
dotnet user-secrets list
```

Secrets are stored in: `%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json`

**Note:** `appsettings.json` should have empty values for security:
```json
{
  "GoogleOAuth": {
    "ClientId": "",
    "ClientSecret": ""
  },
  "MicrosoftOAuth": {
    "ClientId": "",
    "TenantId": "",
    "ClientSecret": ""
  }
}
```

## Part 5: Run the Application

**1. Trust HTTPS certificate (first time only):**
```bash
cd backend
dotnet dev-certs https --trust
```

**2. Start Backend:**
```bash
cd backend
dotnet run --launch-profile https
```
Backend runs on: `https://localhost:7072`

**3. Start Frontend (new terminal):**
```bash
npm start
```
Frontend runs on: `http://localhost:4200`

**4. Test Authentication:**
- Open `http://localhost:4200`
- Click "Sign in with Google" or "Sign in with Microsoft"
- Complete authentication
- You'll be redirected to the dashboard with your profile info

## Troubleshooting

### "unauthorized_client" error (Microsoft)
- Check Azure AD app **Supported account types**
- Ensure `signInAudience` in Manifest matches your needs
- Verify `microsoftTenantId` matches Azure AD configuration

### "Invalid tenant" error
- Backend `TenantId` must match frontend
- Use `consumers` for personal accounts
- Backend validates tenant in token claims

### Port already in use (7072)
```bash
# Find and kill process using port 7072
netstat -ano | findstr :7072
taskkill /PID <PID> /F
```

### CORS errors
- Verify `FrontendUrl` in `appsettings.json` matches frontend URL
- Ensure backend CORS policy allows frontend origin

## Architecture Overview

**Frontend Flow:**
1. `login.ts` initializes both Google and Microsoft SDKs
2. `auth.service.ts` handles authentication for both providers
3. Tokens sent to backend for validation
4. User profile stored in signals
5. Route guards protect authenticated routes

**Backend Flow:**
1. `AuthController` has two verification endpoints
2. Google: Uses `GoogleJsonWebSignature.ValidateAsync()`
3. Microsoft: Uses `JwtSecurityTokenHandler` for manual validation
4. Both return standardized `BasicUserDetails`

## Features

✅ **Dual SSO**: Google Identity Services + Microsoft MSAL  
✅ **Personal Accounts**: @gmail.com, @outlook.com, @hotmail.com, @live.com  
✅ **Secure Validation**: Backend verifies all tokens  
✅ **User Secrets**: Credentials stored outside source control  
✅ **Modern UI**: Tailwind CSS with responsive design  
✅ **Type Safety**: TypeScript with Angular signals  
✅ **Route Guards**: Protected dashboard routes  
✅ **Error Handling**: Comprehensive error messages  
