#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LinuxServiceInstaller {
  constructor() {
    this.serviceName = 'jarvis';
    this.serviceFile = `/etc/systemd/system/${this.serviceName}.service`;
    this.nodePath = process.execPath;
    this.scriptPath = path.join(__dirname, '..', 'dist', 'index.js');
    this.workingDirectory = process.cwd();
  }

  async install() {
    try {
      console.log('Installing JARVIS service for Linux...');

      // Check if running as root
      if (process.getuid && process.getuid() !== 0) {
        console.error('This script must be run as root (use sudo)');
        process.exit(1);
      }

      // Create systemd service file
      await this.createServiceFile();

      // Reload systemd
      execSync('systemctl daemon-reload');

      // Enable service
      execSync(`systemctl enable ${this.serviceName}`);

      // Start service
      execSync(`systemctl start ${this.serviceName}`);

      console.log('JARVIS service installed and started successfully');
      console.log(`Service name: ${this.serviceName}`);
      console.log('To check status: systemctl status jarvis');
      console.log('To stop service: systemctl stop jarvis');
      console.log('To restart service: systemctl restart jarvis');

    } catch (error) {
      console.error('Failed to install JARVIS service:', error.message);
      process.exit(1);
    }
  }

  async uninstall() {
    try {
      console.log('Uninstalling JARVIS service...');

      // Check if running as root
      if (process.getuid && process.getuid() !== 0) {
        console.error('This script must be run as root (use sudo)');
        process.exit(1);
      }

      // Stop service
      try {
        execSync(`systemctl stop ${this.serviceName}`);
      } catch (error) {
        console.log('Service was not running');
      }

      // Disable service
      try {
        execSync(`systemctl disable ${this.serviceName}`);
      } catch (error) {
        console.log('Service was not enabled');
      }

      // Remove service file
      try {
        fs.unlinkSync(this.serviceFile);
      } catch (error) {
        console.log('Service file was not found');
      }

      // Reload systemd
      execSync('systemctl daemon-reload');

      console.log('JARVIS service uninstalled successfully');

    } catch (error) {
      console.error('Failed to uninstall JARVIS service:', error.message);
      process.exit(1);
    }
  }

  async createServiceFile() {
    const serviceContent = `[Unit]
Description=JARVIS AI Assistant Background Service
After=network.target

[Service]
Type=simple
User=${process.env.USER || 'root'}
WorkingDirectory=${this.workingDirectory}
ExecStart=${this.nodePath} ${this.scriptPath}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;

    fs.writeFileSync(this.serviceFile, serviceContent);
    console.log(`Service file created at: ${this.serviceFile}`);
  }

  async getStatus() {
    try {
      const output = execSync(`systemctl status ${this.serviceName}`).toString();
      console.log(output);
    } catch (error) {
      console.error('Failed to get service status:', error.message);
    }
  }
}

// Main execution
const action = process.argv[2];
const installer = new LinuxServiceInstaller();

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
    console.log('Usage: node install-linux.js [install|uninstall|status]');
    process.exit(1);
}