# Google OAuth2 Setup Guide

This guide walks you through setting up Google OAuth2 authentication for the skola-alpha application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Create a Google Cloud Project](#step-1-create-a-google-cloud-project)
- [Step 2: Configure OAuth Consent Screen](#step-2-configure-oauth-consent-screen)
- [Step 3: Create OAuth 2.0 Credentials](#step-3-create-oauth-20-credentials)
- [Step 4: Configure Your Application](#step-4-configure-your-application)
- [Step 5: Test the Authentication](#step-5-test-the-authentication)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Your application running locally (default: `http://localhost:5173`)

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter a project name (e.g., "skola-alpha")
5. Click **"Create"**
6. Wait for the project to be created and select it from the dropdown

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, navigate to **APIs & Services** > **OAuth consent screen**
2. Select **External** as the user type (unless you have a Google Workspace organization)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: `skola-alpha` (or your preferred name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. On the **Scopes** page:
   - Click **"Add or Remove Scopes"**
   - Select the following scopes:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Click **"Update"**
   - Click **"Save and Continue"**
7. On the **Test users** page (for external apps):
   - Click **"Add Users"**
   - Add your email address and any other test user emails
   - Click **"Save and Continue"**
8. Review the summary and click **"Back to Dashboard"**

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**
4. Choose **"Web application"** as the application type
5. Configure the OAuth client:
   - **Name**: `skola-alpha Web Client` (or your preferred name)
   - **Authorized JavaScript origins**:
     - Click **"+ Add URI"**
     - Add: `http://localhost:5173` (for local development)
     - Add: `http://127.0.0.1:5173` (alternative local URL)
     - For production, add your production domain (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - Click **"+ Add URI"**
     - Add: `http://localhost:5173` (for local development)
     - Add: `http://127.0.0.1:5173` (alternative local URL)
     - For production, add your production domain (e.g., `https://yourdomain.com`)
6. Click **"Create"**
7. A dialog will appear with your credentials:
   - **Client ID**: Copy this value
   - **Client Secret**: Copy this value
   - Keep these values secure and private!

## Step 4: Configure Your Application

### Backend Configuration

1. Navigate to the backend directory: `cd backend`
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Edit the `.env` file and add your Google OAuth credentials:
   ```env
   # Google OAuth2 Configuration
   GOOGLE_CLIENT_ID=your-client-id-from-google-console
   GOOGLE_CLIENT_SECRET=your-client-secret-from-google-console

   # Security - Generate a strong secret key
   SECRET_KEY=generate-a-strong-random-key-here
   ```
4. Generate a strong secret key:
   ```bash
   openssl rand -hex 32
   ```
   Copy the output and replace `generate-a-strong-random-key-here` in your `.env` file

### Frontend Configuration

1. Navigate to the frontend directory: `cd ../frontend`
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Edit the `.env` file and add your Google Client ID:
   ```env
   # Google OAuth2 Configuration
   VITE_GOOGLE_CLIENT_ID=your-client-id-from-google-console

   # API Configuration (make sure this matches your backend)
   VITE_API_BASE_URL=http://localhost:8000
   ```

**Important**: Use the same Client ID in both frontend and backend!

## Step 5: Test the Authentication

1. Start the backend server:
   ```bash
   cd backend
   uv sync  # Install dependencies if needed
   .venv/bin/uvicorn app.main:app --reload
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm install  # Install dependencies if needed
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

4. You should see the login screen with a "Sign in with Google" button

5. Click the button and sign in with a Google account that you added as a test user

6. After successful authentication, you should see:
   - Your name and avatar in the top-left corner
   - A logout button
   - A theme toggle button (Light/Dark)
   - The backend health status

## Troubleshooting

### "Error 400: redirect_uri_mismatch"

This error means the redirect URI in your request doesn't match the ones configured in Google Cloud Console.

**Solution**:
- Go to Google Cloud Console > APIs & Services > Credentials
- Click on your OAuth 2.0 Client ID
- Verify that the **Authorized redirect URIs** include the exact URL you're using (e.g., `http://localhost:5173`)
- Make sure there are no trailing slashes or typos

### "Error 401: invalid_client"

This error means your Client ID or Client Secret is incorrect.

**Solution**:
- Double-check the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your backend `.env` file
- Make sure you copied the full values from Google Cloud Console
- Ensure there are no extra spaces or quotes

### "Failed to authenticate with Google"

This is a generic backend error that can have multiple causes.

**Solution**:
- Check the backend logs for specific error messages
- Verify that your backend server is running and accessible
- Ensure the `VITE_API_BASE_URL` in frontend `.env` matches your backend URL
- Check browser console for network errors

### "User not found" after successful Google login

This error occurs if the JWT token is invalid or the user wasn't saved to the database.

**Solution**:
- Check that the database is properly initialized: `cd backend && .venv/bin/alembic upgrade head`
- Verify the `SECRET_KEY` in backend `.env` is set
- Check backend logs for database errors

### Login button doesn't appear

**Solution**:
- Check the browser console for errors
- Verify `VITE_GOOGLE_CLIENT_ID` is set in frontend `.env`
- Clear your browser cache and reload
- Make sure you ran `npm install` to install `@react-oauth/google`

### "Access blocked: This app's request is invalid"

This error appears when testing with a Google account that isn't added as a test user.

**Solution**:
- Go to Google Cloud Console > APIs & Services > OAuth consent screen
- Scroll to **Test users** section
- Click **"+ Add Users"**
- Add the email address you're trying to sign in with
- Try logging in again

## Production Deployment

When deploying to production:

1. **Update OAuth Consent Screen**:
   - Change from "Testing" to "In Production" status
   - Complete the verification process if required

2. **Add Production URLs**:
   - Add your production domain to **Authorized JavaScript origins**
   - Add your production domain to **Authorized redirect URIs**
   - Example: `https://yourdomain.com`

3. **Update Environment Variables**:
   - Set production `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Generate a new strong `SECRET_KEY` for production
   - Update `VITE_API_BASE_URL` to your production API URL
   - Use a production database (PostgreSQL recommended)

4. **Enable HTTPS**:
   - Google OAuth requires HTTPS in production
   - Use a reverse proxy (e.g., Nginx, Traefik) with SSL/TLS certificates

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different credentials** for development and production
3. **Rotate secrets regularly**, especially if compromised
4. **Limit OAuth scopes** to only what's necessary
5. **Monitor OAuth usage** in Google Cloud Console
6. **Use HTTPS** in production environments
7. **Implement rate limiting** on authentication endpoints
8. **Set short token expiration times** (default: 30 minutes)

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)

## Support

If you encounter issues not covered in this guide:
- Check the [GitHub Issues](https://github.com/radek-zitek-cloud/skola-alpha/issues)
- Review backend logs: `cd backend && .venv/bin/uvicorn app.main:app --reload --log-level debug`
- Check frontend console for errors
- Verify all environment variables are set correctly
