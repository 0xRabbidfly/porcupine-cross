# Porcupine-Cross Deployment Guide

This guide explains how to set up the GitHub repository and configure deployment to Namecheap hosting for the Porcupine-Cross website.

## GitHub Repository Setup

1. **Create a new GitHub repository**

   ```
   # Navigate to https://github.com/new 
   # Fill in:
   - Repository name: porcupine-cross
   - Description: Porcupine-Cross Cyclocross Website
   - Visibility: Public or Private (your choice)
   ```

2. **Link your local repository**

   ```bash
   # In your local project directory
   git remote add origin https://github.com/yourusername/porcupine-cross.git
   git push -u origin master
   ```

3. **Configure GitHub Secrets**

   Navigate to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret
   
   Add the following secrets:
   - `FTP_SERVER`: Your Namecheap FTP server (e.g., ftp.yourdomain.com)
   - `FTP_USERNAME`: Your Namecheap FTP username
   - `FTP_PASSWORD`: Your Namecheap FTP password

## Namecheap Hosting Setup

1. **Get FTP credentials from your Namecheap account**

   - Log in to your Namecheap account
   - Go to "Account Panel" → "Hosting List"
   - Find your hosting package and click "Manage"
   - Look for "FTP/File Manager" or "FTP details" section
   - Note the FTP hostname, username, and password

2. **Update your deployment configuration**

   Edit `scripts/deploy.js` to include your actual Namecheap FTP credentials:

   ```javascript
   production: {
     description: 'Namecheap production hosting',
     host: 'ftp.yourdomain.com', // Replace with your Namecheap FTP host
     username: 'yourdomain_username', // Replace with your Namecheap FTP username
     path: '/public_html',
     protocol: 'ftp'
   }
   ```

3. **Install the FTP deployment package**

   ```bash
   npm install --save-dev ftp-deploy
   ```

## Testing and Deployment

1. **Test local deployment**

   ```bash
   # For Windows PowerShell
   $env:FTP_PASSWORD = 'your-password'
   
   # For Mac/Linux
   export FTP_PASSWORD='your-password'
   
   # Run deployment
   npm run deploy:production
   ```

2. **Enable automated GitHub deployment**

   1. Make a small change to the codebase
   2. Commit and push to GitHub
   3. GitHub Actions will run tests and deploy to production automatically
   4. Check the Actions tab to monitor the deployment process

## Deployment Workflow

The CI/CD pipeline is configured for a simplified workflow:

1. **Developer Workflow**:
   - Make changes locally
   - Tests run via pre-commit hooks
   - Commit and push to GitHub

2. **GitHub Actions**:
   - Run tests on multiple Node.js versions
   - On successful tests, build the project
   - Deploy to production via FTP

3. **Production Updates**:
   - Files are deployed directly to your Namecheap hosting
   - No staging environment is used
   - Changed files are updated without deleting existing files

## Troubleshooting

- **FTP Connection Issues**: Check that your FTP credentials are correct and that your network allows FTP connections.
- **GitHub Actions Failure**: Check the GitHub Actions logs for details on any build or deployment failures.
- **Local Deployment Errors**: Ensure that the `FTP_PASSWORD` environment variable is set correctly.

## Security Considerations

- Never commit FTP credentials directly to the repository
- Always use GitHub Secrets for sensitive information
- Consider setting up SSH deployment for enhanced security if supported by your hosting provider 