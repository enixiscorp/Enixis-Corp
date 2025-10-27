console.log('🔧 Build Vercel - Génération des fichiers...');

const fs = require('fs');
const path = require('path');

try {
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
  COMPANY_EMAIL: "${process.env.COMPANY_EMAIL || 'contacteccorp@gmail.com'}",
  EMAILJS_SERVICE_ID: "${process.env.EMAILJS_SERVICE_ID || ''}",
  EMAILJS_TEMPLATE_ID: "${process.env.EMAILJS_TEMPLATE_ID || ''}",
  EMAILJS_PUBLIC_KEY: "${process.env.EMAILJS_PUBLIC_KEY || ''}",
  SLACK_WEBHOOK_ENDPOINT: "${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL + '/api/slack-webhook' : 'https://enixis-corp.vercel.app/api/slack-webhook'}"
};`;

  // Écrire le fichier env.js
  fs.writeFileSync('env.js', envContent);
  console.log('✅ env.js généré avec succès');

  // Vérifier que les fichiers essentiels existent
  const requiredFiles = ['index.html', 'demande.html', 'style.css', 'request.js', 'script.js'];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} trouvé`);
    } else {
      console.error(`❌ ${file} manquant`);
      process.exit(1);
    }
  }

  // Créer un fichier de build info
  const buildInfo = {
    buildTime: new Date().toISOString(),
    version: "2.1.0",
    environment: "production",
    files: fs.readdirSync('.').filter(f => f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.css'))
  };

  fs.writeFileSync('build-info.json', JSON.stringify(buildInfo, null, 2));
  console.log('✅ build-info.json créé');

  console.log('✅ Build terminé avec succès');
  console.log('📁 Fichiers dans le répertoire de sortie:', buildInfo.files.length);

} catch (error) {
  console.error('❌ Erreur lors du build:', error);
  process.exit(1);
}