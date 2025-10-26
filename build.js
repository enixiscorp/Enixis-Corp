const fs = require('fs');

console.log('🔧 Génération du fichier env.js avec les variables Vercel...');

// Générer env.js avec les variables d'environnement
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

// Debug - afficher les variables (sans les valeurs sensibles)
console.log('Variables détectées:');
console.log('- SLACK_WEBHOOK_URL:', process.env.SLACK_WEBHOOK_URL ? '✅ Configuré' : '❌ Manquant');
console.log('- FLOOZ_PHONE:', process.env.FLOOZ_PHONE ? '✅ Configuré' : '❌ Manquant');
console.log('- MIXX_PHONE:', process.env.MIXX_PHONE ? '✅ Configuré' : '❌ Manquant');
console.log('- USDT_WALLET:', process.env.USDT_WALLET ? '✅ Configuré' : '❌ Manquant');
console.log('- BTC_WALLET:', process.env.BTC_WALLET ? '✅ Configuré' : '❌ Manquant');