#!/usr/bin/env node

// Simple build script for Vercel deployment
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting build process...');

// Ensure env.js exists with default values if not already generated
const envPath = path.join(__dirname, 'env.js');
if (!fs.existsSync(envPath)) {
  console.log('📄 Creating default env.js file...');
  const defaultEnv = `// Configuration d'environnement pour Enixis Corp
// Ce fichier est généré automatiquement

window.env = {
  // Base API pour les requêtes (vide = même domaine)
  API_BASE: "",
  
  // Webhook Slack (sera remplacé par les variables d'environnement)
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || "",
  FLOOZ_PHONE: process.env.FLOOZ_PHONE || "",
  MIXX_PHONE: process.env.MIXX_PHONE || "",
  USDT_WALLET: process.env.USDT_WALLET || "",
  BTC_WALLET: process.env.BTC_WALLET || ""
};`;
  
  fs.writeFileSync(envPath, defaultEnv);
  console.log('✅ env.js created successfully');
}

// Validate critical files
const criticalFiles = ['index.html', 'style.css', 'script.js', 'request.js'];
let allFilesExist = true;

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} found`);
  } else {
    console.error(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('❌ Build failed: Missing critical files');
  process.exit(1);
}

console.log('✅ Build completed successfully');