#!/usr/bin/env node

// Script de build spécifique pour Vercel
const fs = require('fs');
const path = require('path');

console.log('🔧 Build Vercel - Génération env.js...');

// Générer env.js avec les variables d'environnement Vercel
const envContent = `// Configuration d'environnement pour Enixis Corp
// Généré automatiquement par Vercel

window.env = {
  API_BASE: "",
  SLACK_WEBHOOK_URL: "${process.env.SLACK_WEBHOOK_URL || ''}",
  FLOOZ_PHONE: "${process.env.FLOOZ_PHONE || ''}",
  MIXX_PHONE: "${process.env.MIXX_PHONE || ''}",
  USDT_WALLET: "${process.env.USDT_WALLET || ''}",
  BTC_WALLET: "${process.env.BTC_WALLET || ''}"
};`;

fs.writeFileSync('env.js', envContent);
console.log('✅ env.js généré avec les variables Vercel');

// Vérifier les fichiers critiques
const criticalFiles = ['index.html', 'demande.html', 'style.css', 'script.js', 'request.js'];
let allFilesExist = true;

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} trouvé`);
  } else {
    console.error(`❌ ${file} manquant`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('❌ Build échoué: Fichiers critiques manquants');
  process.exit(1);
}

console.log('✅ Build Vercel terminé avec succès');