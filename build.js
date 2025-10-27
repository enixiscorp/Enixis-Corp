console.log('🔧 Build Vercel - Génération des fichiers...');

// Générer env.js avec les variables d'environnement
const envContent = `// Configuration d'environnement pour Enixis Corp
// Généré automatiquement par Vercel

window.env = {
  API_BASE: "",
  SLACK_WEBHOOK_URL: "${process.env.SLACK_WEBHOOK_URL || ''}",
  FLOOZ_PHONE: "${process.env.FLOOZ_PHONE || ''}",
  MIXX_PHONE: "${process.env.MIXX_PHONE || ''}",
  USDT_WALLET: "${process.env.USDT_WALLET || ''}",
  BTC_WALLET: "${process.env.BTC_WALLET || ''}",
  COMPANY_EMAIL: "${process.env.COMPANY_EMAIL || 'contacteccorp@gmail.com'}"
};`;

require('fs').writeFileSync('env.js', envContent);
console.log('✅ env.js généré avec succès');

console.log('✅ Build terminé avec succès');