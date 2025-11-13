# GitHub Repository Setup Guide

## Repository Information

**Repository Name:** `angular-dotnet-sso`  
**Description:** 🔐 Secure Single Sign-On application with Google and Microsoft authentication - Angular 20 frontend with .NET Core 8 backend featuring dual SSO support, token verification, and modern UI

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Fill in the repository details:
   - **Repository name:** `angular-dotnet-sso`
   - **Description:** `🔐 Secure Single Sign-On application with Google and Microsoft authentication - Angular 20 frontend with .NET Core 8 backend featuring dual SSO support, token verification, and modern UI`
   - **Visibility:** Public
   - **Do NOT initialize** with README, .gitignore, or license (we already have these)
3. Click **Create repository**

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these commands in your terminal:

```powershell
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/angular-dotnet-sso.git

# Verify the remote was added
git remote -v

# Push your code to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Add Repository Topics (Optional but Recommended)

On your GitHub repository page, click on the gear icon next to "About" and add these topics:
- `angular`
- `dotnet-core`
- `single-sign-on`
- `google-oauth`
- `microsoft-oauth`
- `msal`
- `authentication`
- `typescript`
- `csharp`
- `tailwindcss`
- `sso`
- `oauth2`

## Alternative: Using SSH

If you prefer SSH authentication:

```powershell
# Add the remote repository using SSH (replace YOUR_USERNAME)
git remote add origin git@github.com:YOUR_USERNAME/angular-dotnet-sso.git

# Push your code
git branch -M main
git push -u origin main
```

## Verify Upload

After pushing, visit your repository URL:
`https://github.com/YOUR_USERNAME/angular-dotnet-sso`

You should see all your files including:
- ✅ README.md with project description
- ✅ Frontend code (Angular)
- ✅ Backend code (.NET Core)
- ✅ Documentation files
- ✅ Configuration files

## Future Updates

To push future changes:

```powershell
git add .
git commit -m "Your commit message"
git push
```

## Repository Features to Enable

Consider enabling these GitHub features:
1. **Issues** - For bug tracking
2. **Projects** - For project management
3. **Wiki** - For additional documentation
4. **Discussions** - For community Q&A

## Security Notice

⚠️ **Important:** Make sure your environment files with actual credentials are NOT pushed to GitHub. The `.gitignore` file is configured to protect sensitive files, but always verify that:
- No actual OAuth Client IDs/Secrets are in committed files
- The `appsettings.json` contains placeholder values only
- User secrets are stored locally and not in the repository

## License

Consider adding a license file (MIT License recommended for open source projects):
- Go to your repository on GitHub
- Click "Add file" → "Create new file"
- Name it `LICENSE`
- Choose a license template from the right sidebar
