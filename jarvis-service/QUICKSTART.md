# JARVIS Background Service - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Prerequisites
- Node.js 18+ installed
- Microphone and speakers working
- Internet connection

### 2. Installation
```bash
# Navigate to the service directory
cd jarvis-service

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit the environment file
nano .env
```

### 3. Configure API Key
Add your ZAI API key to `.env`:
```
ZAI_API_KEY=your_api_key_here
```

### 4. Build and Install
```bash
# Build the service
npm run build

# Install as system service
npm run install-service
```

### 5. Start Using
```bash
# The service starts automatically
# Say "JARVIS" to activate
# Then speak your command
```

## 🎯 Basic Commands

### Voice Commands:
- **"JARVIS"** - Wake up the assistant
- **"What time is it?"** - Get current time
- **"Show system info"** - Display system details
- **"JARVIS shutdown"** - Turn off the service

### CLI Commands:
```bash
# Start service
node jarvis-cli.js start

# Stop service
node jarvis-cli.js stop

# Check status
node jarvis-cli.js status

# Emergency stop
node jarvis-cli.js emergency-stop
```

## 🔧 Troubleshooting

### Service Won't Start
```bash
# Check dependencies
npm install

# Check configuration
npm run status

# Reinstall service
npm run uninstall-service
npm run install-service
```

### Wake Word Not Detected
- Check microphone permissions
- Increase volume
- Try speaking closer to microphone
- Adjust sensitivity in `config/jarvis.json`

### No Audio Response
- Check speaker volume
- Verify audio device is selected
- Check system sound settings

## 📝 Configuration

### Key Settings in `config/jarvis.json`:
```json
{
  "jarvis": {
    "wakeWord": "jarvis",
    "wakeWordSensitivity": 0.5
  },
  "system": {
    "enableSystemAccess": true
  },
  "logging": {
    "level": "info"
  }
}
```

### Environment Variables in `.env`:
```
ZAI_API_KEY=your_key
LOG_LEVEL=info
ENABLE_SYSTEM_ACCESS=true
```

## 🎮 Advanced Usage

### System Commands (when enabled):
- "Show processes"
- "System information"
- "Open calculator"
- "Search for weather"

### Custom Wake Word:
1. Edit `config/jarvis.json`
2. Change `wakeWord` value
3. Restart service

### Adjust Sensitivity:
1. Edit `config/jarvis.json`
2. Change `wakeWordSensitivity` (0.1-1.0)
3. Higher = more sensitive

## 🚨 Emergency Stop

If the service becomes unresponsive:

```bash
# Force stop
node jarvis-cli.js emergency-stop

# Or use system commands:
# Windows: taskkill /F /IM node.exe
# Linux: pkill -f jarvis
```

## 📊 Monitoring

### Check Logs:
```bash
# View service logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log
```

### Check Status:
```bash
npm run status
```

## 🔄 Updates

### To Update Service:
```bash
# Stop service
node jarvis-cli.js stop

# Pull updates
git pull

# Reinstall dependencies
npm install

# Rebuild
npm run build

# Reinstall service
npm run uninstall-service
npm run install-service
```

## 🎉 You're Ready!

Your JARVIS assistant is now running in the background. Just say "JARVIS" to activate it!

**Remember:**
- Service runs automatically on system boot
- Say "JARVIS" to wake it up
- Use "JARVIS shutdown" to turn it off
- Check logs if you encounter issues

Enjoy your AI assistant! 🤖