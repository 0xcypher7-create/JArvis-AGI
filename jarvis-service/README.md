# JARVIS Background Service

A non-GUI background service for JARVIS AI Assistant that runs continuously in the background and activates when it hears the wake word "JARVIS".

## Features

- **Background Operation**: Runs as a system service on both Windows and Linux
- **Wake Word Detection**: Activates when it hears "JARVIS"
- **Full System Access**: Complete system integration for both Linux and Windows
- **AI Integration**: Powered by A4F (z-ai-web-dev-sdk) for intelligent responses
- **Cross-Platform**: Works on Windows and Linux with platform-specific optimizations
- **Fail-Safe Design**: Robust error handling and automatic recovery

## System Requirements

- Node.js 18 or higher
- Windows 10/11 or Linux (Ubuntu 18.04+, CentOS 7+)
- Microphone access for wake word detection
- Audio output for responses
- Internet connection for AI services

## Installation

### 1. Prerequisites

```bash
# Install Node.js (if not already installed)
# For Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# For Windows: Download from https://nodejs.org
```

### 2. Install Dependencies

```bash
cd jarvis-service
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required configuration:
```
ZAI_API_KEY=your_zai_api_key_here
ENABLE_SYSTEM_ACCESS=true
```

### 4. Build the Service

```bash
npm run build
```

### 5. Install as System Service

```bash
# Install the service (requires sudo on Linux)
npm run install-service
```

## Usage

### Starting the Service

The service will start automatically after installation. To manually control it:

**Windows:**
```bash
# Start service
net start JARVIS

# Stop service
net stop JARVIS

# Check status
sc query JARVIS
```

**Linux:**
```bash
# Start service
sudo systemctl start jarvis

# Stop service
sudo systemctl stop jarvis

# Check status
sudo systemctl status jarvis

# Enable auto-start on boot
sudo systemctl enable jarvis
```

### Using JARVIS

1. **Activate**: Say "JARVIS" to wake up the assistant
2. **Command**: Speak your command after activation
3. **Response**: JARVIS will respond and execute your command

### Example Commands

- "What time is it?"
- "Show me system information"
- "Open calculator"
- "Search for weather today"
- "Shutdown the system" (requires confirmation)
- "Restart the system" (requires confirmation)

## Configuration

### Main Configuration (config/jarvis.json)

```json
{
  "jarvis": {
    "name": "JARVIS",
    "wakeWord": "jarvis",
    "wakeWordSensitivity": 0.5,
    "listeningTimeout": 10000,
    "responseTimeout": 30000,
    "maxResponseLength": 2000,
    "language": "en-US"
  },
  "audio": {
    "sampleRate": 16000,
    "channels": 1,
    "bitDepth": 16,
    "encoding": "linear16",
    "silenceThreshold": 0.01,
    "silenceDuration": 1000
  },
  "system": {
    "logLevel": "info",
    "enableSystemAccess": true,
    "allowedCommands": [
      "system.info",
      "system.shutdown",
      "system.restart",
      "system.volume",
      "system.brightness",
      "system.network",
      "system.processes",
      "file.read",
      "file.write",
      "file.list",
      "file.delete",
      "app.launch",
      "app.close",
      "web.search",
      "web.browse"
    ],
    "maxCommandLength": 500
  },
  "ai": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 1000,
    "systemPrompt": "You are JARVIS, an advanced AI assistant...",
    "enableMemory": true,
    "memoryRetention": 1000
  },
  "logging": {
    "level": "info",
    "maxFiles": 10,
    "maxSize": "10m",
    "logToFile": true,
    "logToConsole": true,
    "logDir": "./logs"
  }
}
```

### Environment Variables (.env)

```
# AI Configuration
ZAI_API_KEY=your_zai_api_key_here
ZAI_BASE_URL=https://api.a4f.co

# Database Configuration
DATABASE_URL="file:./db/custom.db"

# Service Configuration
SERVICE_NAME=jarvis
SERVICE_DISPLAY_NAME="JARVIS AI Assistant"
SERVICE_DESCRIPTION="JARVIS AI Assistant Background Service"

# Audio Configuration
AUDIO_DEVICE=default
AUDIO_SAMPLE_RATE=16000
AUDIO_CHANNELS=1

# System Configuration
LOG_LEVEL=info
ENABLE_SYSTEM_ACCESS=true
MAX_COMMAND_LENGTH=500

# Security Configuration
ALLOWED_NETWORKS=localhost,127.0.0.1
ENABLE_REMOTE_ACCESS=false
REMOTE_ACCESS_PORT=8080
```

## System Access

The service provides controlled access to system functions:

### Available Commands

- **System Information**: Get system details, processes, memory usage
- **System Control**: Shutdown, restart (with confirmation)
- **File Operations**: Read, write, list, delete files
- **Application Control**: Launch and close applications
- **Web Operations**: Search, browse the web
- **Audio Control**: Volume adjustment, audio playback

### Security Features

- **Command Whitelist**: Only allowed commands can be executed
- **Permission Control**: System access can be disabled
- **Command Length Limit**: Prevents overly complex commands
- **Network Restrictions**: Remote access can be controlled

## Troubleshooting

### Check Service Status

```bash
npm run status
```

### View Logs

**Windows:**
```bash
# View service logs
Get-EventLog -LogName Application -Source JARVIS | Format-List
```

**Linux:**
```bash
# View service logs
sudo journalctl -u jarvis -f

# View log files
tail -f logs/combined.log
tail -f logs/error.log
```

### Common Issues

1. **Service won't start**
   - Check if Node.js is installed correctly
   - Verify all dependencies are installed
   - Check configuration files

2. **Wake word not detected**
   - Ensure microphone is working
   - Adjust wake word sensitivity in config
   - Check audio permissions

3. **No audio response**
   - Check audio output device
   - Verify audio configuration
   - Check system volume

4. **System commands not working**
   - Verify system access is enabled
   - Check if command is in allowed list
   - Run with appropriate permissions (Linux)

### Reinstall Service

```bash
# Uninstall first
npm run uninstall-service

# Reinstall
npm run install-service
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Testing

```bash
# Run tests (if implemented)
npm test

# Check code quality
npm run lint
```

## Uninstallation

To completely remove JARVIS:

```bash
# Uninstall service
npm run uninstall-service

# Remove application files
cd ..
rm -rf jarvis-service
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and support:
- Check the troubleshooting section
- Review log files for error details
- Ensure system requirements are met
- Verify configuration settings

## Security Notes

- The service requires system access for full functionality
- All system commands are whitelisted for security
- Network access can be restricted to localhost
- Audio data is processed locally when possible
- Consider security implications of enabling system access