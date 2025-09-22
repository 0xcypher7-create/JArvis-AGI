#!/usr/bin/env node

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'JARVIS',
  description: 'JARVIS AI Assistant Background Service',
  script: path.join(__dirname, '..', 'dist', 'index.js'),
  nodeOptions: [
    '--max-old-space-size=4096'
  ],
  env: {
    name: 'NODE_ENV',
    value: 'production'
  }
});

// Listen for the "install" event
svc.on('install', () => {
  console.log('JARVIS service installed successfully');
  svc.start();
});

// Listen for the "uninstall" event
svc.on('uninstall', () => {
  console.log('JARVIS service uninstalled successfully');
});

// Listen for the "alreadyinstalled" event
svc.on('alreadyinstalled', () => {
  console.log('JARVIS service is already installed');
});

// Listen for the "invalidinstallation" event
svc.on('invalidinstallation', () => {
  console.log('Invalid JARVIS service installation');
});

// Install the service
svc.install();