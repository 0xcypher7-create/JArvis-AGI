#!/usr/bin/env node

const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

class ServiceInstaller {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isLinux = this.platform === 'linux';
  }

  async install() {
    console.log(`Installing JARVIS service for ${this.platform}...`);

    try {
      if (this.isWindows) {
        await this.installWindows();
      } else if (this.isLinux) {
        await this.installLinux();
      } else {
        throw new Error(`Unsupported platform: ${this.platform}`);
      }

      console.log('JARVIS service installation completed successfully!');
      console.log('The service will now run in the background.');
      console.log('Say "JARVIS" to activate the assistant.');

    } catch (error) {
      console.error('Installation failed:', error.message);
      process.exit(1);
    }
  }

  async uninstall() {
    console.log(`Uninstalling JARVIS service from ${this.platform}...`);

    try {
      if (this.isWindows) {
        await this.uninstallWindows();
      } else if (this.isLinux) {
        await this.uninstallLinux();
      } else {
        throw new Error(`Unsupported platform: ${this.platform}`);
      }

      console.log('JARVIS service uninstalled successfully!');

    } catch (error) {
      console.error('Uninstallation failed:', error.message);
      process.exit(1);
    }
  }

  async installWindows() {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'install-windows.js');
      const child = spawn('node', [scriptPath], { stdio: 'inherit' });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Windows installation script exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async uninstallWindows() {
    return new Promise((resolve, reject) => {
      const Service = require('node-windows').Service;
      const svc = new Service({
        name: 'JARVIS'
      });

      svc.on('uninstall', () => {
        console.log('Windows service uninstalled successfully');
        resolve();
      });

      svc.on('error', (error) => {
        reject(error);
      });

      svc.uninstall();
    });
  }

  async installLinux() {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'install-linux.js');
      const child = spawn('sudo', ['node', scriptPath, 'install'], { stdio: 'inherit' });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Linux installation script exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async uninstallLinux() {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'install-linux.js');
      const child = spawn('sudo', ['node', scriptPath, 'uninstall'], { stdio: 'inherit' });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Linux uninstallation script exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async getStatus() {
    console.log(`Checking JARVIS service status on ${this.platform}...`);

    try {
      if (this.isWindows) {
        await this.getWindowsStatus();
      } else if (this.isLinux) {
        await this.getLinuxStatus();
      } else {
        throw new Error(`Unsupported platform: ${this.platform}`);
      }
    } catch (error) {
      console.error('Failed to get status:', error.message);
    }
  }

  async getWindowsStatus() {
    const Service = require('node-windows').Service;
    const svc = new Service({
      name: 'JARVIS'
    });

    svc.on('status', (status) => {
      console.log(`Windows service status: ${status}`);
    });

    svc.on('error', (error) => {
      console.error('Error getting Windows service status:', error.message);
    });

    svc.getStatus();
  }

  async getLinuxStatus() {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'install-linux.js');
      const child = spawn('sudo', ['node', scriptPath, 'status'], { stdio: 'inherit' });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Linux status script exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// Main execution
const action = process.argv[2];
const installer = new ServiceInstaller();

switch (action) {
  case 'install':
    installer.install();
    break;
  case 'uninstall':
    installer.uninstall();
    break;
  case 'status':
    installer.getStatus();
    break;
  default:
    console.log('Usage: node install-service.js [install|uninstall|status]');
    console.log('');
    console.log('Commands:');
    console.log('  install   - Install JARVIS as a background service');
    console.log('  uninstall - Uninstall JARVIS service');
    console.log('  status    - Check service status');
    process.exit(1);
}