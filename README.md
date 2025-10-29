# Enixis Corp – Site web

[![Deploy Status](https://img.shields.io/badge/status-production-brightgreen)](https://enixis-corp.vercel.app/)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fenixis-corp.vercel.app%2F)](https://enixis-corp.vercel.app/)

Site web professionnel pour Enixis Corp - Solutions IA, analyse de données et optimisation business.

🌐 **Site en production** : [https://enixis-corp.vercel.app/](https://enixis-corp.vercel.app/)

## 🚀 Fonctionnalités

- ✅ **Site vitrine** : Présentation des services et projets
- ✅ **Système de commande** : Formulaire avec estimation de prix automatique
- ✅ **Paiements intégrés** : Flooz, Mixx by Yas, Cryptomonnaies (USDT, BTC)
- ✅ **Notifications Slack** : Avec boutons interactifs pour suivi des commandes
- ✅ **Génération PDF** : Factures automatiques avec téléchargement
- ✅ **Design responsive** : Optimisé mobile, tablette et desktop
- ✅ **Témoignages dynamiques** : Système par catégorie avec rotation automatique
- ✅ **Optimisations SEO** : Meta tags, sitemap, robots.txt
- ✅ **Performance** : Chargement optimisé, images compressées

## 🛠️ Technologies

- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **Backend** : Vercel Functions (Node.js)
- **Intégrations** : Slack API, EmailJS, Crypto wallets
- **Déploiement** : Vercel avec CI/CD automatique

## 📱 Utilisation

### Pages principales
- **Accueil** : `index.html` - Présentation des services et témoignages
- **Demande** : `demande.html` - Formulaire de commande avec paiement

### Processus de commande
1. **Sélection du service** : Choix parmi les prestations disponibles
2. **Estimation automatique** : Calcul du prix selon le délai et options
3. **Informations client** : Saisie des coordonnées
4. **Paiement sécurisé** : Flooz, Mixx by Yas ou cryptomonnaies
5. **Notification Slack** : Envoi automatique à l'équipe avec boutons interactifs
6. **Facture PDF** : Génération et téléchargement automatique

## 🔧 Configuration

### Variables d'environnement requises
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
FLOOZ_PHONE=97572346
MIXX_PHONE=90123456
USDT_WALLET=TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE
BTC_WALLET=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
COMPANY_EMAIL=contacteccorp@gmail.com
```

### Déploiement Vercel
Le site est automatiquement déployé sur Vercel avec les API Functions intégrées.
