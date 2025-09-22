#!/usr/bin/env node

const os = require('os');
const path = require('path');
const fs = require('fs');

class ServiceStatus {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isLinux = this.platform === 'linux';
  }

  async checkStatus() {
    console.log('=== JARVIS Service Status ===');
    console.log(`Platform: ${this.platform}`);
    console.log(`Node.js: ${process.version}`);
    console.log('');

    try {
      // Check if service files exist
      await this.checkServiceFiles();

      // Check if service is installed
      await this.checkServiceInstallation();

      // Check if service is running
      await this.checkServiceRunning();

      // Check dependencies
      await this.checkDependencies();

      // Check configuration
      await this.checkConfiguration();

      console.log('\n=== Status Check Complete ===');

    } catch (error) {
      console.error('Error checking status:', error.message);
      process.exit(1);
    }
  }

  async checkServiceFiles() {
    console.log('Checking service files...');
    
    const requiredFiles = [
      'dist/index.js',
      'config/jarvis.json',
      '.env'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      console.log(`  ${file}: ${exists ? '✓' : '✗'}`);
      
      if (!exists) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    console.log('');
  }

  async checkServiceInstallation() {
    console.log('Checking service installation...');
    
    if (this.isWindows) {
      await this.checkWindowsInstallation();
    } else if (this.isLinux) {
      await this.checkLinuxInstallation();
    } else {
      console.log('  Service installation: Not supported on this platform');
    }
    
    console.log('');
  }

  async checkWindowsInstallation() {
    try {
      const Service = require('node-windows').Service;
      const svc = new Service({
        name: 'JARVIS'
      });

      return new Promise((resolve, reject) => {
        svc.on('exists', () => {
          console.log('  Windows service: ✓ Installed');
          resolve();
        });

        svc.on('doesnotexist', () => {
          console.log('  Windows service: ✗ Not installed');
          resolve();
        });

        svc.on('error', (error) => {
          console.log(`  Windows service: ✗ Error - ${error.message}`);
          resolve();
        });

        svc.exists();
      });
    } catch (error) {
      console.log(`  Windows service: ✗ Error - ${error.message}`);
    }
  }

  async checkLinuxInstallation() {
    try {
      const { execSync } = require('child_process');
      const output = execSync('systemctl is-enabled jarvis 2>/dev/null || echo "not-enabled"').toString().trim();
      
      if (output === 'enabled') {
        console.log('  Linux service: ✓ Installed and enabled');
      } else {
        console.log('  Linux service: ✗ Not installed or not enabled');
      }
    } catch (error) {
      console.log(`  Linux service: ✗ Error - ${error.message}`);
    }
  }

  async checkServiceRunning() {
    console.log('Checking if service is running...');
    
    if (this.isWindows) {
      await this.checkWindowsRunning();
    } else if (this.isLinux) {
      await this.checkLinuxRunning();
    } else {
      console.log('  Service running: Not supported on this platform');
    }
    
    console.log('');
  }

  async checkWindowsRunning() {
    try {
      const Service = require('node-windows').Service;
      const svc = new Service({
        name: 'JARVIS'
      });

      return new Promise((resolve, reject) => {
        svc.on('status', (status) => {
          console.log(`  Windows service running: ${status}`);
          resolve();
        });

        svc.on('error', (error) => {
          console.log(`  Windows service running: ✗ Error - ${error.message}`);
          resolve();
        });

        svc.getStatus();
      });
    } catch (error) {
      console.log(`  Windows service running: ✗ Error - ${error.message}`);
    }
  }

  async checkLinuxRunning() {
    try {
      const { execSync } = require('child_process');
      const output = execSync('systemctl is-active jarvis 2>/dev/null || echo "inactive"').toString().trim();
      
      console.log(`  Linux service running: ${output}`);
    } catch (error) {
      console.log(`  Linux service running: ✗ Error - ${error.message}`);
    }
  }

  async checkDependencies() {
    console.log('Checking dependencies...');
    
    const dependencies = [
      'z-ai-web-dev-sdk',
      'node-record-lpcm16',
      'speaker',
      'winston',
      'dotenv'
    ];

    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const installedDeps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});
    const allDeps = [...installedDeps, ...devDeps];

    for (const dep of dependencies) {
      const installed = allDeps.includes(dep);
      console.log(`  ${dep}: ${installed ? '✓' : '✗'}`);
    }
    
    console.log('');
  }

  async checkConfiguration() {
    console.log('Checking configuration...');
    
    try {
      const configPath = path.join(process.cwd(), 'config', 'jarvis.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      console.log(`  Wake word: ${config.jarvis?.wakeWord || 'Not set'}`);
      console.log(`  System access: ${config.system?.enableSystemAccess ? 'Enabled' : 'Disabled'}`);
      console.log(`  Log level: ${config.logging?.level || 'Not set'}`);
      console.log(`  AI model: ${config.ai?.model || 'Not set'}`);
      
      // Check environment variables
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const hasApiKey = envContent.includes('ZAI_API_KEY');
        console.log(`  ZAI API key: ${hasApiKey ? '✓ Set' : '✗ Not set'}`);
      } else {
        console.log('  .env file: ✗ Not found');
      }
      
    } catch (error) {
      console.log(`  Configuration: ✗ Error - ${error.message}`);
    }
    
    console.log('');
  }
}

// Main execution
const status = new ServiceStatus();
status.checkStatus();