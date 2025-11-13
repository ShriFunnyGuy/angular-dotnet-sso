# Local Environment Setup

This file contains instructions for setting up your local environment with actual OAuth credentials.

## Frontend Configuration

1. Copy your actual credentials into `src/environments/environment.ts`:

```typescript
// Development environment configuration
export const environment = {
  production: false,
  googleClientId: 'YOUR_ACTUAL_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  microsoftClientId: 'YOUR_ACTUAL_MICROSOFT_CLIENT_ID',
  microsoftTenantId: 'consumers', // or 'common', 'organizations', or your specific tenant ID
  apiUrl: 'https://localhost:7072'
};
```

## Backend Configuration

Use .NET User Secrets to store your OAuth credentials securely:

```powershell
cd backend

# Set Google OAuth credentials
dotnet user-secrets set "GoogleOAuth:ClientId" "YOUR_GOOGLE_CLIENT_ID"
dotnet user-secrets set "GoogleOAuth:ClientSecret" "YOUR_GOOGLE_CLIENT_SECRET"

# Set Microsoft OAuth credentials
dotnet user-secrets set "MicrosoftOAuth:ClientId" "YOUR_MICROSOFT_CLIENT_ID"
dotnet user-secrets set "MicrosoftOAuth:TenantId" "consumers"
```

## Important Notes

⚠️ **Never commit actual credentials to Git!**

- Frontend OAuth Client IDs are public by nature but should still use environment-specific configurations
- Backend secrets must ALWAYS use User Secrets in development and Azure Key Vault in production
- The `.gitignore` file is configured to prevent committing sensitive files

## Verification

After setting up your credentials:

1. Run the backend: `cd backend; dotnet run --launch-profile https`
2. Run the frontend: `npm start`
3. Visit `http://localhost:4200` and test both Google and Microsoft sign-in

## Getting OAuth Credentials

### Google OAuth
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:4200`
   - `https://localhost:7072`

### Microsoft OAuth
1. Visit [Azure Portal](https://portal.azure.com/)
2. Go to Azure Active Directory → App registrations
3. Register a new application
4. Add redirect URIs:
   - `http://localhost:4200`
   - SPA type
5. Configure supported account types (Personal Microsoft accounts)

For detailed setup instructions, see:
- [README_SETUP.md](./README_SETUP.md)
- [MICROSOFT_SSO_SETUP.md](./MICROSOFT_SSO_SETUP.md)
