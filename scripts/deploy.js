/**
 * Deployment automation script
 * This script handles deployment to different environments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper function for cross-platform file copying
function copyFiles() {
  console.log('Copying files to dist...');
  
  // Create directories
  if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist', { recursive: true });
  }
  
  if (!fs.existsSync('./dist/css')) {
    fs.mkdirSync('./dist/css', { recursive: true });
  }
  
  if (!fs.existsSync('./dist/js')) {
    fs.mkdirSync('./dist/js', { recursive: true });
  }
  
  if (!fs.existsSync('./dist/images')) {
    fs.mkdirSync('./dist/images', { recursive: true });
  }
  
  // Copy HTML and JS files in the root
  fs.readdirSync('./').forEach(file => {
    if (file.endsWith('.html') || file.endsWith('.js')) {
      fs.copyFileSync(file, `./dist/${file}`);
    }
  });
  
  // Copy CSS files
  if (fs.existsSync('./css')) {
    fs.readdirSync('./css').forEach(file => {
      fs.copyFileSync(`./css/${file}`, `./dist/css/${file}`);
    });
  }
  
  // Copy JS files and subdirectories
  if (fs.existsSync('./js')) {
    copyDir('./js', './dist/js');
  }
  
  // Copy images
  if (fs.existsSync('./images')) {
    copyDir('./images', './dist/images');
  }
  
  console.log('Files copied successfully to dist/');
}

// Helper function to recursively copy directories
function copyDir(src, dest) {
  fs.readdirSync(src).forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    const stats = fs.statSync(srcPath);
    if (stats.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

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
    username: 'yourdomain_username', // Replace with your Namecheap FTP username
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
  copyFiles();

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
      
      // Instructions for actual deployment
      console.log('\nTo complete FTP deployment:');
      console.log('1. Install ftp-deploy: npm install ftp-deploy');
      console.log('2. Set FTP_PASSWORD environment variable with your password');
      console.log('3. Use this code for actual deployment:');
      console.log(`
// Deployment code for production:
const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();

const ftpConfig = {
  user: '${config.username}',
  password: process.env.FTP_PASSWORD,
  host: '${config.host}',
  port: 21,
  localRoot: path.resolve('./dist'),
  remoteRoot: '${config.path}',
  include: ['**/*'],
  exclude: [],
  deleteRemote: false
};

ftpDeploy.deploy(ftpConfig)
  .then(res => console.log('Deployment complete!'))
  .catch(err => {
    console.error('Deployment failed:', err);
    process.exit(1);
  });
`);
    }
    
    console.log('\nSimulation complete!');
    console.log('For actual deployment, update this script with your credentials and use the provided code.');
  }
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
} 