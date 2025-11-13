# Google & Microsoft SSO Backend - .NET Core 8 Web API

This is the backend service for dual OAuth authentication (Google + Microsoft 365). It validates ID tokens from both providers on the server side for enhanced security.

## Technology Stack

- **.NET Core 8.0** - Web API framework
- **Google.Apis.Auth (v1.72.0)** - Google token verification
- **Microsoft.Identity.Web (v3.2.2)** - Microsoft Identity support
- **System.IdentityModel.Tokens.Jwt (v8.1.2)** - JWT token handling
- **ASP.NET Core Authentication** - OAuth support

## Features

- **Dual Provider Support**: Validates both Google and Microsoft ID tokens
- **Google Token Verification**: Uses Google's public keys via `GoogleJsonWebSignature`
- **Microsoft Token Verification**: Manual JWT validation with audience, tenant, and expiration checks
- **User Secrets**: Secure credential storage for development
- **CORS Support**: Configured for Angular frontend
- **Health Check**: Simple endpoint to verify backend status
- **Logout Support**: Endpoint for logout operations

## Prerequisites

- .NET 8 SDK or later
- Google OAuth 2.0 Client ID
- Microsoft Azure AD App Registration

## Setup

### 1. Trust HTTPS Development Certificate (first time only)
```powershell
dotnet dev-certs https --trust
```

### 2. Configure OAuth Settings Using User Secrets (Recommended)

**Check UserSecretsId in `.csproj`:**
```xml
<PropertyGroup>
  <UserSecretsId>09630acc-8fab-465b-9bb4-e2b575a92c2f</UserSecretsId>
</PropertyGroup>
```

**Set secrets:**
```powershell
dotnet user-secrets set "GoogleOAuth:ClientId" "YOUR_GOOGLE_CLIENT_ID"
dotnet user-secrets set "GoogleOAuth:ClientSecret" "YOUR_GOOGLE_CLIENT_SECRET"
dotnet user-secrets set "MicrosoftOAuth:ClientId" "YOUR_MICROSOFT_CLIENT_ID"
dotnet user-secrets set "MicrosoftOAuth:TenantId" "consumers"
dotnet user-secrets set "MicrosoftOAuth:ClientSecret" "YOUR_CLIENT_SECRET"
```

**Verify secrets:**
```powershell
dotnet user-secrets list
```

**Alternative: Update `appsettings.json` (Not Recommended for Development)**
```json
{
  "GoogleOAuth": {
    "ClientId": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "ClientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
  },
  "MicrosoftOAuth": {
    "ClientId": "YOUR_MICROSOFT_CLIENT_ID",
    "TenantId": "consumers",
    "ClientSecret": "YOUR_CLIENT_SECRET"
  },
  "FrontendUrl": "http://localhost:4200"
}
```

**Note:** User secrets override `appsettings.json` in Development environment.

### 3. Restore Packages
```powershell
dotnet restore
```

## Running the Backend

### Development (HTTPS):
```powershell
dotnet run --launch-profile https
```

The backend will start on:
- **HTTPS**: https://localhost:7072
- **HTTP**: http://localhost:5293

### Production:
```powershell
dotnet run --configuration Release
```

## API Endpoints

### 1. Verify Google Token
**POST** `/auth/verify-token`

Validates a Google ID token using Google's public keys and returns user information.

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY..."
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "user": {
    "email": "user@gmail.com",
    "emailVerified": true,
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://lh3.googleusercontent.com/...",
    "googleId": "1234567890"
  }
}
```

**Error Response (400/401/500):**
```json
{
  "valid": false,
  "error": "Invalid or expired token"
}
```

### 2. Verify Microsoft Token
**POST** `/auth/verify-microsoft-token`

Validates a Microsoft ID token (JWT) and returns user information.

**Request Body:**
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
    "email": "user@outlook.com",
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
  "error": "Invalid audience"
}
```

**Validation Checks:**
- ✅ Audience claim matches Client ID
- ✅ Tenant ID validation (supports `consumers`, `common`, `organizations`)
- ✅ Token expiration check
- ✅ Claims extraction (email, given_name, family_name, oid)

### 3. Logout
**POST** `/auth/logout`

Endpoint for logout operations.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### 3. Health Check
**GET** `/auth/health`

Verify backend is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:30:00Z"
}
```

## CORS Configuration

The backend is configured to accept requests from:
- http://localhost:4200 (Angular development server)

Configured methods:
- GET, POST, PUT, DELETE, OPTIONS

Credentials: Enabled

## Security Notes

### Token Validation

**Google Tokens:**
- Uses `GoogleJsonWebSignature.ValidateAsync()` with Google's public keys
- Verifies token signature, audience (Client ID), and expiration
- No Client Secret needed for verification

**Microsoft Tokens:**
- Manual JWT validation using `JwtSecurityTokenHandler`
- Validates audience (Client ID), tenant ID, and expiration
- Supports special tenant values: `consumers`, `common`, `organizations`
- Extracts claims from decoded JWT

### User Secrets (Development)

Credentials stored in: `%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json`
- Never committed to source control
- Automatically loaded in Development environment
- Override `appsettings.json` values

### Production Configuration

For production, use:
- **Environment Variables** (Azure App Service, Docker)
- **Azure Key Vault** (recommended for Azure deployments)
- **AWS Secrets Manager** (for AWS)

### CORS Protection

- Restricts API access to specific frontend origins
- Configured methods: GET, POST, PUT, DELETE, OPTIONS
- Credentials enabled for cookie-based auth (if needed)

### HTTPS

- Development uses self-signed certificate
- Production should use valid SSL/TLS certificate
- Required for OAuth 2.0 security

## Troubleshooting

### Port Already in Use (7072)
```powershell
# Find process using port
netstat -ano | findstr :7072

# Kill process
taskkill /PID <PID> /F

# Or stop all dotnet processes
Get-Process -Name dotnet | Stop-Process -Force
```

### Certificate Trust Issues
```powershell
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```

### "Invalid tenant" Error
- Ensure backend `MicrosoftOAuth:TenantId` matches frontend configuration
- Use `consumers` for personal Microsoft accounts
- Backend code supports special tenant values (consumers, common, organizations)

### "Invalid audience" Error
- Verify `MicrosoftOAuth:ClientId` matches Azure AD Application (client) ID
- Check token is for correct application

### CORS Errors
- Verify `FrontendUrl` in `appsettings.json` matches Angular URL
- Check frontend uses correct backend URL (`https://localhost:7072`)

### User Secrets Not Loading
- Confirm `UserSecretsId` exists in `.csproj`
- Run `dotnet user-secrets list` to verify secrets
- Ensure running in Development environment (`ASPNETCORE_ENVIRONMENT=Development`)

## Project Structure

```
backend/
├── Controllers/
│   └── AuthController.cs       # Authentication endpoints
├── Properties/
│   └── launchSettings.json     # Port and launch configuration
├── appsettings.json            # Application configuration
├── appsettings.Production.json # Production configuration
├── Program.cs                  # Application entry point & middleware
└── SSOBackend.csproj           # Project dependencies
```

## Integration with Angular Frontend

The Angular frontend uses two authentication libraries:

### Google SSO Flow
1. **Google Identity Services** renders sign-in button
2. User authenticates with Google
3. ID token sent to `POST /auth/verify-token`
4. Backend validates with `GoogleJsonWebSignature.ValidateAsync()`
5. Returns validated user data to frontend
6. Angular navigates to dashboard

### Microsoft SSO Flow
1. **MSAL.js** (`@azure/msal-browser`) initializes with configuration
2. User clicks Microsoft button → popup opens
3. User authenticates in popup
4. ID token received from MSAL
5. Token sent to `POST /auth/verify-microsoft-token`
6. Backend validates JWT manually (audience, tenant, expiration)
7. Returns validated user data to frontend
8. Angular navigates to dashboard

### Benefits of This Approach

✅ **Good UX**: Modern library-based authentication (no manual redirects)  
✅ **Security**: All tokens verified server-side  
✅ **No Secret Exposure**: Client secrets stored on backend only  
✅ **Token Tampering Protection**: Backend validates signatures  
✅ **Unified User Model**: Both providers return `BasicUserDetails`  
✅ **Flexible**: Easy to add more OAuth providers  

## Packages Used

```xml
<PackageReference Include="Google.Apis.Auth" Version="1.72.0" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.Google" Version="8.0.0" />
<PackageReference Include="Microsoft.Identity.Web" Version="3.2.2" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.1.2" />
```

## Additional Resources

- [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview)
- [Microsoft MSAL.js Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [JWT Token Validation](https://learn.microsoft.com/en-us/dotnet/api/system.identitymodel.tokens.jwt.jwtsecuritytokenhandler)
- [.NET User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets)
