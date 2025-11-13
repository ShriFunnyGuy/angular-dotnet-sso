# Google & Microsoft 365 SSO Application

A secure authentication application supporting both **Google** and **Microsoft 365** Single Sign-On (SSO) with Angular 20 frontend and .NET Core 8 backend.

## Features

✅ **Dual Authentication**: Google SSO + Microsoft 365 SSO  
✅ **Seamless UX**: Google Identity Services (no popup) + MSAL popup for Microsoft  
✅ **Backend Verification**: Secure token validation on .NET Core backend  
✅ **Personal Accounts**: Supports @gmail.com, @outlook.com, @hotmail.com, @live.com  
✅ **User Secrets**: Secure credential storage for development  
✅ **Modern UI**: Responsive design with Tailwind CSS  

## Development Server

**Start Frontend:**
```bash
npm start
```

**Start Backend:**
```bash
cd backend
dotnet run --launch-profile https
```

Frontend: `http://localhost:4200`  
Backend: `https://localhost:7072`

## Technology Stack

**Frontend:**
- Angular 20 (standalone components)
- TypeScript with RxJS Signals
- Tailwind CSS
- Google Identity Services
- @azure/msal-browser (MSAL.js v2)

**Backend:**
- .NET Core 8 Web API
- Google.Apis.Auth (v1.72.0)
- Microsoft.Identity.Web (v3.2.2)
- System.IdentityModel.Tokens.Jwt (v8.1.2)

## Quick Start

See [SETUP.md](./README_SETUP.md) for detailed setup instructions.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── models/              # User models and enums
│   │   ├── services/            # Auth service (Google + Microsoft)
│   │   ├── pages/               # Login and Dashboard pages
│   │   └── guards/              # Route guards
│   └── environments/            # Environment configs
├── backend/
│   ├── Controllers/             # AuthController (token verification)
│   ├── appsettings.json        # Configuration (empty values)
│   └── Program.cs              # Application startup
└── docs/                        # Additional documentation
```

## Authentication Flow

### Google SSO
1. User clicks Google sign-in button
2. Google Identity Services handles authentication seamlessly
3. ID token sent to backend `/auth/verify-google-token`
4. Backend validates token with Google's public keys
5. User redirected to dashboard

### Microsoft SSO
1. User clicks Microsoft sign-in button
2. MSAL popup opens for authentication
3. ID token received from Microsoft Azure AD
4. Token sent to backend `/auth/verify-microsoft-token`
5. Backend validates JWT (audience, tenant, expiration)
6. User redirected to dashboard

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Security

- **User Secrets**: OAuth credentials stored outside source control
- **Backend Validation**: All tokens verified server-side
- **HTTPS**: Development uses self-signed certificates
- **CORS**: Configured for specific frontend origin

## Documentation

- [Setup Guide](./README_SETUP.md) - Complete setup instructions
- [Microsoft SSO Setup](./MICROSOFT_SSO_SETUP.md) - Azure AD configuration
- [Backend Documentation](./backend/README.md) - API endpoints and validation

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
