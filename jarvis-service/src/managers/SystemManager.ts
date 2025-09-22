import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

import { Logger } from '../utils/Logger';
import { ConfigManager, JarvisConfig } from '../utils/ConfigManager';

const execAsync = promisify(exec);

export class SystemManager {
  private config: JarvisConfig;
  private logger: Logger;
  private platform: string;

  constructor(config: ConfigManager, logger: Logger) {
    this.config = config.getConfig();
    this.logger = logger;
    this.platform = os.platform();
  }

  async getSystemInfo(): Promise<any> {
    const info = {
      platform: this.platform,
      hostname: os.hostname(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpus: os.cpus(),
      loadAverage: os.loadavg(),
      networkInterfaces: os.networkInterfaces(),
      user: os.userInfo()
    };

    if (this.platform === 'win32') {
      try {
        const windowsInfo = await this.getWindowsInfo();
        info.windows = windowsInfo;
      } catch (error) {
        this.logger.warn('Failed to get Windows info:', error);
      }
    } else if (this.platform === 'linux') {
      try {
        const linuxInfo = await this.getLinuxInfo();
        info.linux = linuxInfo;
      } catch (error) {
        this.logger.warn('Failed to get Linux info:', error);
      }
    }

    return info;
  }

  private async getWindowsInfo(): Promise<any> {
    const info: any = {};
    
    try {
      // Get system information using wmic
      const [computerSystem, bios, os] = await Promise.all([
        execAsync('wmic computersystem get manufacturer,model,name /format:list'),
        execAsync('wmic bios get serialnumber,version /format:list'),
        execAsync('wmic os get version,buildnumber,serialnumber /format:list')
      ]);

      info.computerSystem = this.parseWmicOutput(computerSystem.stdout);
      info.bios = this.parseWmicOutput(bios.stdout);
      info.os = this.parseWmicOutput(os.stdout);
    } catch (error) {
      this.logger.warn('Failed to get Windows system info:', error);
    }

    return info;
  }

  private async getLinuxInfo(): Promise<any> {
    const info: any = {};

    try {
      // Get system information
      const [osRelease, cpuInfo, memInfo] = await Promise.all([
        fs.readFile('/etc/os-release', 'utf-8'),
        fs.readFile('/proc/cpuinfo', 'utf-8'),
        fs.readFile('/proc/meminfo', 'utf-8')
      ]);

      info.osRelease = this.parseKeyValue(osRelease);
      info.cpuInfo = this.parseCpuInfo(cpuInfo);
      info.memInfo = this.parseKeyValue(memInfo);
    } catch (error) {
      this.logger.warn('Failed to get Linux system info:', error);
    }

    return info;
  }

  private parseWmicOutput(output: string): any {
    const lines = output.split('\n').filter(line => line.includes('='));
    const result: any = {};
    
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        result[key.trim()] = value.trim();
      }
    });

    return result;
  }

  private parseKeyValue(output: string): any {
    const lines = output.split('\n').filter(line => line.includes('='));
    const result: any = {};
    
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        result[key.trim()] = value.trim().replace(/"/g, '');
      }
    });

    return result;
  }

  private parseCpuInfo(cpuInfo: string): any {
    const lines = cpuInfo.split('\n');
    const processors: any[] = [];
    let currentProcessor: any = {};

    lines.forEach(line => {
      if (line.startsWith('processor')) {
        if (Object.keys(currentProcessor).length > 0) {
          processors.push(currentProcessor);
        }
        currentProcessor = {};
      }
      
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          currentProcessor[key] = value;
        }
      }
    });

    if (Object.keys(currentProcessor).length > 0) {
      processors.push(currentProcessor);
    }

    return processors;
  }

  async executeCommand(command: string, args: string[] = []): Promise<any> {
    if (!this.config.system.enableSystemAccess) {
      throw new Error('System access is disabled');
    }

    // Check if command is allowed
    const commandName = command.split(' ')[0];
    if (!this.config.system.allowedCommands.includes(commandName)) {
      throw new Error(`Command '${commandName}' is not allowed`);
    }

    try {
      this.logger.info(`Executing command: ${command} ${args.join(' ')}`);
      
      const result = await execAsync(`${command} ${args.join(' ')}`, {
        timeout: this.config.jarvis.responseTimeout,
        maxBuffer: 1024 * 1024 * 2 // 2MB
      });

      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr
      };
    } catch (error: any) {
      this.logger.error(`Command execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info('System shutdown initiated');
      
      if (this.platform === 'win32') {
        await execAsync('shutdown /s /t 10');
      } else {
        await execAsync('sudo shutdown -h now');
      }
    } catch (error) {
      this.logger.error('Failed to shutdown system:', error);
      throw error;
    }
  }

  async restart(): Promise<void> {
    try {
      this.logger.info('System restart initiated');
      
      if (this.platform === 'win32') {
        await execAsync('shutdown /r /t 10');
      } else {
        await execAsync('sudo reboot');
      }
    } catch (error) {
      this.logger.error('Failed to restart system:', error);
      throw error;
    }
  }

  async getProcesses(): Promise<any[]> {
    try {
      let command: string;
      
      if (this.platform === 'win32') {
        command = 'tasklist /fo csv /nh';
      } else {
        command = 'ps aux --no-headers';
      }

      const result = await execAsync(command);
      
      if (this.platform === 'win32') {
        return this.parseWindowsTasklist(result.stdout);
      } else {
        return this.parseLinuxPs(result.stdout);
      }
    } catch (error) {
      this.logger.error('Failed to get process list:', error);
      return [];
    }
  }

  private parseWindowsTasklist(output: string): any[] {
    const lines = output.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const [name, pid, sessionName, sessionNum, memUsage] = line.split('","').map(s => s.replace(/"/g, ''));
      return {
        name,
        pid: parseInt(pid),
        sessionName,
        sessionNum: parseInt(sessionNum),
        memUsage
      };
    });
  }

  private parseLinuxPs(output: string): any[] {
    const lines = output.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const parts = line.split(/\s+/);
      return {
        user: parts[0],
        pid: parseInt(parts[1]),
        cpu: parseFloat(parts[2]),
        mem: parseFloat(parts[3]),
        vsz: parseInt(parts[4]),
        rss: parseInt(parts[5]),
        tty: parts[6],
        stat: parts[7],
        start: parts[8],
        time: parts[9],
        command: parts.slice(10).join(' ')
      };
    });
  }

  async killProcess(pid: number): Promise<boolean> {
    try {
      if (this.platform === 'win32') {
        await execAsync(`taskkill /PID ${pid} /F`);
      } else {
        await execAsync(`kill -9 ${pid}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to kill process ${pid}:`, error);
      return false;
    }
  }
}