/**
 * Deployment automation script
 * This script handles deployment to different environments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration for different environments
const environments = {
  development: {
    description: 'Local development environment',
    path: './dist',
    isLocal: true
  },
  production: {
    description: 'Namecheap production hosting',
    host: 'ftp.yourdomain.com', // Replace with your Namecheap FTP host
    username: 'yourusername', // Replace with your Namecheap FTP username
    path: '/public_html',
    protocol: 'ftp'
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const env = args[0] || 'development';

if (!environments[env]) {
  console.error(`Unknown environment: ${env}`);
  console.error('Available environments: ' + Object.keys(environments).join(', '));
  process.exit(1);
}

// Get configuration for the specified environment
const config = environments[env];
console.log(`Deploying to ${env} environment (${config.description})...`);

try {
  // Run tests before deployment
  console.log('Running tests...');
  execSync('npm test', { stdio: 'inherit' });

  // Generate code coverage report
  console.log('Generating code coverage report...');
  execSync('npm run test:coverage', { stdio: 'inherit' });

  // Build the project
  console.log('Building project...');
  
  // Create dist directory if it doesn't exist (for development)
  if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist', { recursive: true });
  }
  
  // Copy HTML, CSS, JS files
  console.log('Copying files to dist...');
  execSync('cp -r index.html *.js css js images dist/', { stdio: 'inherit' });

  // For local development environment
  if (config.isLocal) {
    console.log(`Files prepared in ${config.path}`);
    console.log('To test locally: cd dist && npx http-server');
  } 
  // For production environment
  else {
    console.log(`Deploying to ${config.host}:${config.path} via ${config.protocol}...`);
    
    if (config.protocol === 'ftp') {
      console.log('Using FTP deployment...');
      
      // For actual deployment, uncomment and update with your credentials:
      /*
      const FtpDeploy = require('ftp-deploy');
      const ftpDeploy = new FtpDeploy();
      
      const ftpConfig = {
        user: config.username,
        password: process.env.FTP_PASSWORD, // Store password in environment variable
        host: config.host,
        port: 21,
        localRoot: path.resolve('./dist'),
        remoteRoot: config.path,
        include: ['*', '**/*'],
        deleteRemote: false // Set to true to delete files on the remote that don't exist locally
      };
      
      ftpDeploy.deploy(ftpConfig)
        .then(res => console.log('Deployment complete!'))
        .catch(err => {
          console.error('Deployment failed:', err);
          process.exit(1);
        });
      */
      
      console.log('\nTo complete FTP deployment:');
      console.log('1. Install ftp-deploy: npm install ftp-deploy');
      console.log('2. Set FTP_PASSWORD environment variable with your password');
      console.log('3. Uncomment the FTP deployment code in this script');
      console.log('4. Update the FTP configuration with your credentials');
    }
    
    console.log('\nSimulation complete!');
    console.log('To enable actual deployment, update the script with your credentials and uncomment the deployment code.');
  }
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
} 