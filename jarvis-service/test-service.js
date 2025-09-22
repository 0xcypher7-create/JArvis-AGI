#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class JarvisTester {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  async runTests() {
    console.log('🧪 Running JARVIS Service Tests...\n');

    for (const test of this.tests) {
      try {
        console.log(`📋 Testing: ${test.name}`);
        await test.testFunction();
        console.log('✅ PASSED\n');
        this.passed++;
      } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        this.failed++;
      }
    }

    this.showResults();
  }

  showResults() {
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.tests.length}`);

    if (this.failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the issues above.');
    }
  }

  async testFileExists(filePath, description) {
    return new Promise((resolve, reject) => {
      const exists = fs.existsSync(filePath);
      if (exists) {
        resolve();
      } else {
        reject(new Error(`${description} not found at ${filePath}`));
      }
    });
  }

  async testJsonFileValid(filePath, description) {
    return new Promise((resolve, reject) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        resolve();
      } catch (error) {
        reject(new Error(`${description} is not valid JSON: ${error.message}`));
      }
    });
  }

  async testPackageJson() {
    await this.testFileExists('package.json', 'Package.json file');
    await this.testJsonFileValid('package.json', 'Package.json content');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!packageJson.name) {
      throw new Error('Package.json missing name field');
    }
    
    if (!packageJson.dependencies) {
      throw new Error('Package.json missing dependencies');
    }
    
    const requiredDeps = ['z-ai-web-dev-sdk', 'winston', 'dotenv'];
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies[dep]) {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
  }

  async testConfigFiles() {
    await this.testFileExists('config/jarvis.json', 'Configuration file');
    await this.testJsonFileValid('config/jarvis.json', 'Configuration file content');
    
    const config = JSON.parse(fs.readFileSync('config/jarvis.json', 'utf8'));
    
    if (!config.jarvis) {
      throw new Error('Configuration missing jarvis section');
    }
    
    if (!config.jarvis.wakeWord) {
      throw new Error('Configuration missing wakeWord');
    }
    
    if (!config.system) {
      throw new Error('Configuration missing system section');
    }
    
    if (!config.ai) {
      throw new Error('Configuration missing ai section');
    }
  }

  async testEnvironmentFile() {
    const envPath = '.env';
    const envExamplePath = '.env.example';
    
    await this.testFileExists(envExamplePath, 'Environment example file');
    
    // Check if .env exists (it's optional but should be created from example)
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('ZAI_API_KEY')) {
        throw new Error('Environment file should contain ZAI_API_KEY');
      }
    }
  }

  async testSourceFiles() {
    const requiredFiles = [
      'src/index.ts',
      'src/services/JarvisService.ts',
      'src/services/AIService.ts',
      'src/managers/SystemManager.ts',
      'src/managers/AudioManager.ts',
      'src/managers/WakeWordDetector.ts',
      'src/utils/Logger.ts',
      'src/utils/ConfigManager.ts'
    ];

    for (const file of requiredFiles) {
      await this.testFileExists(file, `Source file ${file}`);
    }
  }

  async testScriptFiles() {
    const requiredScripts = [
      'scripts/install-service.js',
      'scripts/status.js',
      'jarvis-cli.js'
    ];

    for (const script of requiredScripts) {
      await this.testFileExists(script, `Script file ${script}`);
    }
  }

  async testTypeScriptConfig() {
    await this.testFileExists('tsconfig.json', 'TypeScript configuration');
    await this.testJsonFileValid('tsconfig.json', 'TypeScript configuration content');
    
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    if (tsConfig.compilerOptions.outDir !== './dist') {
      throw new Error('TypeScript outDir should be ./dist');
    }
  }

  async testBuildDirectory() {
    // Check if dist directory exists (it might not if not built yet)
    const distPath = 'dist';
    if (fs.existsSync(distPath)) {
      await this.testFileExists('dist/index.js', 'Built JavaScript file');
    } else {
      console.log('⚠️  Build directory not found. Run "npm run build" to build the service.');
    }
  }

  async testDependencies() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const nodeModulesPath = 'node_modules';
    
    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error('node_modules directory not found. Run "npm install"');
    }
    
    // Check if key dependencies are installed
    const keyDeps = ['z-ai-web-dev-sdk', 'winston', 'dotenv'];
    for (const dep of keyDeps) {
      const depPath = path.join(nodeModulesPath, dep);
      if (!fs.existsSync(depPath)) {
        throw new Error(`Dependency ${dep} not installed`);
      }
    }
  }
}

// Main execution
const tester = new JarvisTester();

// Add tests
tester.addTest('Package.json', () => tester.testPackageJson());
tester.addTest('Configuration Files', () => tester.testConfigFiles());
tester.addTest('Environment File', () => tester.testEnvironmentFile());
tester.addTest('Source Files', () => tester.testSourceFiles());
tester.addTest('Script Files', () => tester.testScriptFiles());
tester.addTest('TypeScript Configuration', () => tester.testTypeScriptConfig());
tester.addTest('Build Directory', () => tester.testBuildDirectory());
tester.addTest('Dependencies', () => tester.testDependencies());

// Run tests
tester.runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});