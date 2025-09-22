#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

class JarvisCLI {
  constructor() {
    this.servicePath = path.join(__dirname, '..', 'dist', 'index.js');
  }

  async executeCommand(command) {
    switch (command) {
      case 'start':
        await this.startService();
        break;
      case 'stop':
        await this.stopService();
        break;
      case 'status':
        await this.checkStatus();
        break;
      case 'restart':
        await this.restartService();
        break;
      case 'emergency-stop':
        await this.emergencyStop();
        break;
      default:
        this.showHelp();
    }
  }

  async startService() {
    console.log('Starting JARVIS service...');
    
    const child = spawn('node', [this.servicePath], {
      stdio: 'inherit',
      detached: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('JARVIS service started successfully');
      } else {
        console.error(`JARVIS service failed to start (exit code: ${code})`);
      }
    });

    child.on('error', (error) => {
      console.error('Failed to start JARVIS service:', error.message);
    });

    // Don't wait for the child process to exit
    child.unref();
  }

  async stopService() {
    console.log('Stopping JARVIS service...');
    
    try {
      // Try to stop gracefully first
      const { exec } = require('child_process');
      
      if (process.platform === 'win32') {
        exec('net stop JARVIS', (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to stop JARVIS service:', error.message);
          } else {
            console.log('JARVIS service stopped successfully');
          }
        });
      } else {
        exec('sudo systemctl stop jarvis', (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to stop JARVIS service:', error.message);
          } else {
            console.log('JARVIS service stopped successfully');
          }
        });
      }
    } catch (error) {
      console.error('Error stopping JARVIS service:', error.message);
    }
  }

  async checkStatus() {
    console.log('Checking JARVIS service status...');
    
    try {
      const { exec } = require('child_process');
      
      if (process.platform === 'win32') {
        exec('sc query JARVIS', (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to get JARVIS service status:', error.message);
          } else {
            console.log(stdout);
          }
        });
      } else {
        exec('sudo systemctl status jarvis', (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to get JARVIS service status:', error.message);
          } else {
            console.log(stdout);
          }
        });
      }
    } catch (error) {
      console.error('Error checking JARVIS service status:', error.message);
    }
  }

  async restartService() {
    console.log('Restarting JARVIS service...');
    
    try {
      const { exec } = require('child_process');
      
      if (process.platform === 'win32') {
        exec('net stop JARVIS && net start JARVIS', (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to restart JARVIS service:', error.message);
          } else {
            console.log('JARVIS service restarted successfully');
          }
        });
      } else {
        exec('sudo systemctl restart jarvis', (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to restart JARVIS service:', error.message);
          } else {
            console.log('JARVIS service restarted successfully');
          }
        });
      }
    } catch (error) {
      console.error('Error restarting JARVIS service:', error.message);
    }
  }

  async emergencyStop() {
    console.log('⚠️  EMERGENCY STOP - Forcing JARVIS service to stop...');
    
    try {
      const { exec } = require('child_process');
      
      // Kill the process forcefully
      if (process.platform === 'win32') {
        exec('taskkill /F /IM node.exe /FI "WINDOWTITLE eq JARVIS*"', (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to force stop JARVIS service:', error.message);
          } else {
            console.log('✅ JARVIS service force stopped successfully');
          }
        });
      } else {
        exec('pkill -f "node.*jarvis" || pkill -f "jarvis"', (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to force stop JARVIS service:', error.message);
          } else {
            console.log('✅ JARVIS service force stopped successfully');
          }
        });
      }
    } catch (error) {
      console.error('Error during emergency stop:', error.message);
    }
  }

  showHelp() {
    console.log(`
JARVIS CLI - Control your JARVIS AI Assistant

Usage: node jarvis-cli.js <command>

Commands:
  start           Start the JARVIS service
  stop            Stop the JARVIS service gracefully
  restart         Restart the JARVIS service
  status          Check the service status
  emergency-stop  Force stop the service (emergency only)
  help            Show this help message

Examples:
  node jarvis-cli.js start
  node jarvis-cli.js stop
  node jarvis-cli.js status
  node jarvis-cli.js emergency-stop

Note: Some commands may require administrator privileges.
    `);
  }
}

// Main execution
const command = process.argv[2];
const cli = new JarvisCLI();

if (!command) {
  cli.showHelp();
  process.exit(1);
}

cli.executeCommand(command);