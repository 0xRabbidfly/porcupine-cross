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

// Add this function after copyDir function
function testFtpConnection(config) {
  console.log('Testing FTP connection...');
  
  try {
    const FtpDeploy = require('ftp-deploy');
    const ftpDeploy = new FtpDeploy();
    
    if (!process.env.FTP_PASSWORD) {
      console.error('FTP_PASSWORD environment variable is not set.');
      console.log('Please set it using:');
      console.log('$env:FTP_PASSWORD = "your-password"  # For Windows PowerShell');
      console.log('export FTP_PASSWORD="your-password"  # For Mac/Linux');
      return false;
    }
    
    const testDir = path.join(__dirname, '..', 'dist', 'test');
    
    // Create test directory and file for FTP testing
    if (!fs.existsSync(path.join(__dirname, '..', 'dist'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'dist'), { recursive: true });
    }
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testFile = path.join(testDir, 'connection-test.txt');
    fs.writeFileSync(testFile, 'FTP connection test ' + new Date().toISOString());
    
    // Add debug listeners
    ftpDeploy.on('uploaded', function(data) {
      console.log('Uploaded: ' + data.filename);
    });
    
    ftpDeploy.on('upload-error', function(data) {
      console.log('Upload error: ' + data.filename + ' - ' + data.err);
    });
    
    ftpDeploy.on('log', function(data) {
      console.log('Log: ' + data);
    });
    
    const ftpConfig = {
      user: config.username,
      password: process.env.FTP_PASSWORD,
      host: config.host,
      port: 21,
      localRoot: path.join(__dirname, '..', 'dist'),
      remoteRoot: config.path,
      include: ['test/**'],
      exclude: [],
      deleteRemote: false,
      forcePasv: true
    };
    
    console.log('Connecting to FTP server...');
    console.log(`Host: ${config.host}`);
    console.log(`Username: ${config.username}`);
    console.log(`Remote path: ${config.path || '(default FTP directory)'}`);
    
    return ftpDeploy.deploy(ftpConfig)
      .then(() => {
        console.log('FTP connection successful!');
        return true;
      })
      .catch((err) => {
        console.error('FTP connection test failed:', err);
        return false;
      });
  } catch (error) {
    console.error('Failed to test FTP connection:', error.message);
    return false;
  }
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
    host: 'ftp.prologuecross.ca', // Replace with your Namecheap FTP host
    username: 'rabbidfly@prologuecross.ca', // Replace with your Namecheap FTP username
    path: '/',
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
      
      // Check if this is a test run
      const isTest = args.includes('--test');
      
      if (isTest) {
        console.log('Running in test mode - only testing connection...');
        testFtpConnection(config)
          .then(success => {
            if (success) {
              console.log('\nTest successful! FTP credentials work correctly.');
              console.log('You can now commit your changes and push to GitHub.');
            } else {
              console.error('\nFTP connection test failed. Please check your credentials.');
            }
          })
          .catch(() => {
            console.error('\nFTP connection test failed. Please check your credentials.');
          });
      } else {
        // Add actual deployment code here - modify existing code to use this:
        const FtpDeploy = require('ftp-deploy');
        const ftpDeploy = new FtpDeploy();
        
        if (!process.env.FTP_PASSWORD) {
          console.error('FTP_PASSWORD environment variable is not set.');
          console.log('Please set it using:');
          console.log('$env:FTP_PASSWORD = "your-password"  # For Windows PowerShell');
          console.log('export FTP_PASSWORD="your-password"  # For Mac/Linux');
          process.exit(1);
        }
        
        // Add debug listeners
        ftpDeploy.on('uploaded', function(data) {
          console.log('Uploaded: ' + data.filename);
        });
        
        ftpDeploy.on('upload-error', function(data) {
          console.log('Upload error: ' + data.filename + ' - ' + data.err);
        });
        
        ftpDeploy.on('log', function(data) {
          console.log('Log: ' + data);
        });
        
        const ftpConfig = {
          user: config.username,
          password: process.env.FTP_PASSWORD,
          host: config.host,
          port: 21,
          localRoot: path.resolve('./dist'),
          remoteRoot: config.path,
          include: ['**/*'],
          exclude: [],
          deleteRemote: false,
          forcePasv: true
        };
        
        console.log('Starting FTP deployment...');
        console.log(`Configuration: Host=${config.host}, User=${config.username}, RemotePath=${config.path || '(default)'}`);
        ftpDeploy.deploy(ftpConfig)
          .then(res => console.log('Deployment complete!'))
          .catch(err => {
            console.error('Deployment failed:', err);
            process.exit(1);
          });
      }
    }
    
    console.log('\nSimulation complete!');
    console.log('For actual deployment, update this script with your credentials and use the provided code.');
  }
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
} 