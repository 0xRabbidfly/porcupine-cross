/* global URL, process */
/**
 * Deployment automation script
 * This script handles deployment to different environments
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ESM-compatible __dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Helper function for cross-platform file copying
function copyFiles() {
  // console.log('Copying files to dist...');

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
    // Include HTML, main JS files, favicon, and SEO files
    if (
      file.endsWith('.html') ||
      (file.endsWith('.js') &&
        !['babel.config.js', 'eslint.config.js', '.eslintrc.js', 'debug.js'].includes(file)) ||
      file === 'favicon.ico' ||
      file === 'robots.txt' ||
      file === 'sitemap.xml' ||
      file === 'SEO-SETUP.md'
    ) {
      fs.copyFileSync(file, `./dist/${file}`);
    }
  });

  // Copy CSS files
  if (fs.existsSync('./css')) {
    copyDir('./css', './dist/css');
  }

  // Copy JS files and subdirectories
  if (fs.existsSync('./js')) {
    copyDir('./js', './dist/js');
  }

  // Copy images
  if (fs.existsSync('./images')) {
    copyDir('./images', './dist/images');
  }

  // Copy sounds except crosstoberfest.mp3
  if (fs.existsSync('./sounds')) {
    fs.readdirSync('./sounds').forEach(file => {
      if (file !== 'crosstoberfest.mp3') {
        const srcPath = path.join('./sounds', file);
        const destPath = path.join('./dist/sounds', file);
        const stats = fs.statSync(srcPath);
        if (stats.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          if (!fs.existsSync('./dist/sounds')) {
            fs.mkdirSync('./dist/sounds', { recursive: true });
          }
          fs.copyFileSync(srcPath, destPath);
        }
      }
    });
  }

  // Ensure critical SEO files are copied
  const criticalFiles = [
    'robots.txt',
    'sitemap.xml', 
    'SEO-SETUP.md'
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(`./${file}`)) {
      fs.copyFileSync(`./${file}`, `./dist/${file}`);
      console.info(`✅ Copied ${file} to dist/`);
    } else {
      console.warn(`⚠️  Warning: ${file} not found in root directory`);
    }
  });

  // console.log('Files copied successfully to dist/');
}

// Helper function to recursively copy directories
function copyDir(src, dest) {
  // console.log('Copying directory...');

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
async function testFtpConnection(config) {
  // console.log('Testing FTP connection...');
  try {
    // Dynamic import for ESM compatibility
    const { default: FtpDeploy } = await import('ftp-deploy');
    const ftpDeploy = new FtpDeploy();

    // Node-only: process.env
    if (!process.env.FTP_PASSWORD) {
      console.info('FTP_PASSWORD environment variable is not set.');
      // console.log('Please set it using:');
      // console.log('$env:FTP_PASSWORD = "your-password"  # For Windows PowerShell');
      // console.log('export FTP_PASSWORD="your-password"  # For Mac/Linux');
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
    ftpDeploy.on('uploaded', function (data) {
      console.info('Uploaded: ' + data.filename);
    });

    ftpDeploy.on('upload-error', function (data) {
      console.info('Upload error: ' + data.filename + ' - ' + data.err);
    });

    ftpDeploy.on('log', function (data) {
      console.info('Log: ' + data);
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
      forcePasv: true,
      secure: config.secure || false,
      secureOptions: { rejectUnauthorized: false },
    };

    console.info('Connecting to FTP server...');
    console.info(`Host: ${config.host}`);
    console.info(`Username: ${config.username}`);
    console.info(`Remote path: ${config.path || '(default FTP directory)'}`);

    return ftpDeploy
      .deploy(ftpConfig)
      .then(() => {
        console.info('FTP connection successful!');
        return true;
      })
      .catch(err => {
        console.info('FTP connection test failed:', err);
        return false;
      });
  } catch (error) {
    console.info('Failed to test FTP connection:', error.message);
    return false;
  }
}

// Function to show deployment summary
function showDeploymentSummary() {
  console.info('\n📁 DEPLOYMENT SUMMARY:');
  console.info('=====================');
  
  const distFiles = fs.readdirSync('./dist');
  const htmlFiles = distFiles.filter(f => f.endsWith('.html'));
  const seoFiles = ['robots.txt', 'sitemap.xml', 'SEO-SETUP.md'].filter(f => distFiles.includes(f));
  
  console.info(`📄 HTML Pages: ${htmlFiles.length} files`);
  htmlFiles.forEach(file => console.info(`   - ${file}`));
  
  console.info(`🔍 SEO Files: ${seoFiles.length} files`);
  seoFiles.forEach(file => console.info(`   - ${file}`));
  
  console.info(`📁 CSS: ${fs.existsSync('./dist/css') ? 'Included' : 'Missing'}`);
  console.info(`📁 JS: ${fs.existsSync('./dist/js') ? 'Included' : 'Missing'}`);
  console.info(`📁 Images: ${fs.existsSync('./dist/images') ? 'Included' : 'Missing'}`);
  console.info(`📁 Sounds: ${fs.existsSync('./dist/sounds') ? 'Included' : 'Missing'}`);
  
  console.info('=====================\n');
}

// Configuration for different environments
const environments = {
  development: {
    description: 'Local development environment',
    path: './dist',
    isLocal: true,
  },
  production: {
    description: 'Namecheap production hosting',
    host: 'server228.web-hosting.com', // Namecheap server address
    username: 'rabbidfly@prologuecross.ca', // Subdomain FTP account
    path: '/',
    protocol: 'ftpes', // Using FTPES (explicit SSL)
    secure: true,
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
const env = args[0] || 'development';

if (!environments[env]) {
  console.info(`Unknown environment: ${env}`);
  // console.error('Available environments: ' + Object.keys(environments).join(', '));
  throw new Error('Unknown environment');
}

// Get configuration for the specified environment
const config = environments[env];
console.info(`Deploying to ${env} environment (${config.description})...`);

(async () => {
  try {
    // Run tests before deployment
    console.info('Running tests...');
    execSync('npm test', { stdio: 'inherit' });

    // Generate code coverage report
    console.info('Generating code coverage report...');
    execSync('npm run test:coverage', { stdio: 'inherit' });

    // Build the project
    console.info('Building project...');
    copyFiles();
    
    // Show deployment summary
    showDeploymentSummary();

    // For local development environment
    if (config.isLocal) {
      console.info(`Files prepared in ${config.path}`);
      console.info('To test locally: cd dist && npx http-server');
    }
    // For production environment
    else {
      console.info(`Deploying to ${config.host}:${config.path} via ${config.protocol}...`);

      if (config.protocol === 'ftp' || config.protocol === 'ftpes') {
        console.info(`Using ${config.protocol.toUpperCase()} deployment...`);

        // Check if this is a test run
        const isTest = args.includes('--test');

        if (isTest) {
          console.info('Running in test mode - only testing connection...');
          await testFtpConnection(config);
        } else {
          // Dynamic import for ESM compatibility
          const { default: FtpDeploy } = await import('ftp-deploy');
          const ftpDeploy = new FtpDeploy();
          if (!process.env.FTP_PASSWORD) {
            console.info('FTP_PASSWORD environment variable is not set.');
            throw new Error('FTP_PASSWORD not set');
          }
          // Add debug listeners
          ftpDeploy.on('uploaded', function (data) {
            console.info('Uploaded: ' + data.filename);
          });

          ftpDeploy.on('upload-error', function (data) {
            console.info('Upload error: ' + data.filename + ' - ' + data.err);
          });

          ftpDeploy.on('log', function (data) {
            console.info('Log: ' + data);
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
            forcePasv: true,
            secure: config.secure || false,
            secureOptions: { rejectUnauthorized: false },
          };

          console.info('Starting FTP deployment...');
          console.info(
            `Configuration: Host=${config.host}, User=${config.username}, RemotePath=${config.path || '(default)'}`
          );
          console.info(`Protocol: ${config.protocol || 'FTP'} ${config.secure ? '(Secure)' : ''}`);
          ftpDeploy
            .deploy(ftpConfig)
            .then(() => console.info('Deployment complete!'))
            .catch(err => {
              console.info('Deployment failed:', err);
              throw new Error('Deployment failed');
            });
        }
      }
    }
  } catch (error) {
    console.info('Deployment failed:', error.message);
    throw new Error('Deployment failed');
  }
})();
