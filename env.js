// Configuration d'environnement pour Enixis Corp
// Ce fichier est généré automatiquement

window.env = {
  // Base API pour les requêtes (vide = même domaine)
  API_BASE: "",

  // Variables d'environnement (seront remplacées par les vraies valeurs)
  SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
  FLOOZ_PHONE: "97572346",
  MIXX_PHONE: "97572346", 
  USDT_WALLET: "TYourUSDTWalletAddressHere123456789",
  BTC_WALLET: "bc1qyourbtcwalletaddresshere123456789",
  COMPANY_EMAIL: "contacteccorp@gmail.com",

  // Configuration EmailJS pour envoi d'emails réels
  EMAILJS_SERVICE_ID: "service_enixis",
  EMAILJS_TEMPLATE_ID: "template_invoice",
  EMAILJS_PUBLIC_KEY: "your_emailjs_public_key",

  // Configuration Slack Webhook pour boutons interactifs
  SLACK_WEBHOOK_ENDPOINT: "https://enixis-corp.vercel.app/api/slack-webhook",
  
  // Configuration supplémentaire
  SITE_URL: "https://enixis-corp.vercel.app",
  VERSION: "2.1.0",
  
  // Paramètres de performance
  CACHE_DURATION: 3600000, // 1 heure en ms
  MAX_INVOICES_STORED: 10,
  
  // Messages personnalisés
  SUCCESS_MESSAGE: "Votre commande a été traitée avec succès !",
  ERROR_MESSAGE: "Une erreur s'est produite. Veuillez réessayer.",
  
  // Configuration des délais
  PAYMENT_TIMEOUT: 30000, // 30 secondes
  NOTIFICATION_DELAY: 3000, // 3 secondes
  
  // Paramètres de sécurité
  ENABLE_SIGNATURE_VERIFICATION: true,
  ENABLE_RATE_LIMITING: true,
  
  // Clé d'accès équipe pour les factures
  TEAM_ACCESS_KEY: "enixis_team_2024"
};