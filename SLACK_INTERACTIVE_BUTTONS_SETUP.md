# 🔘 Configuration des Boutons Interactifs Slack

## 🎯 Objectif
Permettre aux boutons Slack de changer de couleur et de texte quand on clique dessus :
- **⏳ PAIEMENT EN ATTENTE** (Orange) → **✅ PAIEMENT CONFIRMÉ** (Vert)
- **⏳ COMMANDE EN COURS** (Orange) → **✅ COMMANDE FINALISÉE** (Vert)

## 🔧 Configuration Requise

### 1. **Créer une App Slack**
1. Allez sur [https://api.slack.com/apps](https://api.slack.com/apps)
2. Cliquez "Create New App" → "From scratch"
3. Nommez votre app "Enixis Corp Bot"
4. Sélectionnez votre workspace

### 2. **Configurer les Permissions**
Dans votre app Slack :
1. Allez dans "OAuth & Permissions"
2. Ajoutez ces scopes :
   - `chat:write` - Envoyer des messages
   - `chat:write.public` - Envoyer dans les channels publics
   - `im:write` - Envoyer des messages directs

### 3. **Configurer les Interactive Components**
1. Allez dans "Interactivity & Shortcuts"
2. Activez "Interactivity"
3. **Request URL :** `https://enixis-corp.vercel.app/api/slack-webhook`
4. Sauvegardez

### 4. **Installer l'App dans votre Workspace**
1. Allez dans "Install App"
2. Cliquez "Install to Workspace"
3. Autorisez les permissions
4. **Copiez le Bot User OAuth Token** (commence par `xoxb-`)

### 5. **Configurer les Variables d'Environnement Vercel**
Dans les paramètres Vercel, ajoutez :
```bash
SLACK_BOT_TOKEN=xoxb-votre-token-ici
SLACK_SIGNING_SECRET=votre-signing-secret-ici
```

**Pour obtenir le Signing Secret :**
1. Dans votre app Slack, allez dans "Basic Information"
2. Copiez le "Signing Secret"

## 🔄 Fonctionnement

### **Flux des Boutons Interactifs**
1. **Notification envoyée** → Boutons orange "EN ATTENTE"
2. **Clic sur bouton** → Webhook reçu par `/api/slack-webhook`
3. **Traitement** → Mise à jour du message original
4. **Résultat** → Bouton devient vert "CONFIRMÉ"

### **Code des Boutons**
```javascript
// État initial (Orange)
{
  text: '⏳ PAIEMENT EN ATTENTE',
  style: 'danger', // Orange
  name: 'confirm_payment'
}

// Après clic (Vert)
{
  text: '✅ PAIEMENT CONFIRMÉ',
  style: 'primary', // Vert
  name: 'payment_confirmed'
}
```

## 🧪 Test du Système

### **1. Test Local (Développement)**
```bash
# Installer ngrok pour exposer localhost
npm install -g ngrok

# Exposer le port local
ngrok http 3000

# Utiliser l'URL ngrok dans la configuration Slack
https://abc123.ngrok.io/api/slack-webhook
```

### **2. Test en Production**
1. Déployez sur Vercel avec les variables d'environnement
2. L'URL webhook sera automatiquement : `https://enixis-corp.vercel.app/api/slack-webhook`
3. Testez en créant une commande et en cliquant sur les boutons

## 📋 Vérification

### **Checklist de Configuration**
- [ ] App Slack créée et configurée
- [ ] Permissions OAuth accordées
- [ ] Interactive Components activés
- [ ] Request URL configurée
- [ ] Variables d'environnement Vercel ajoutées
- [ ] App installée dans le workspace
- [ ] Webhook endpoint déployé

### **Test des Boutons**
1. Créez une commande sur le site
2. Vérifiez la réception de la notification Slack
3. Cliquez sur "⏳ PAIEMENT EN ATTENTE"
4. Confirmez l'action
5. Vérifiez que le bouton devient "✅ PAIEMENT CONFIRMÉ" (vert)
6. Répétez pour "⏳ COMMANDE EN COURS"

## 🚨 Dépannage

### **Boutons ne changent pas**
- Vérifiez les logs Vercel Functions
- Vérifiez que l'URL webhook est correcte
- Vérifiez les variables d'environnement

### **Erreur de signature**
- Vérifiez le `SLACK_SIGNING_SECRET`
- Vérifiez que l'horodatage n'est pas trop ancien

### **Webhook non reçu**
- Vérifiez l'URL dans la configuration Slack
- Vérifiez que la function Vercel est déployée
- Testez l'endpoint manuellement

## 📚 Ressources

- [Slack API - Interactive Components](https://api.slack.com/interactivity)
- [Slack API - Verifying Requests](https://api.slack.com/authentication/verifying-requests-from-slack)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)

---

## 🚨 **Correction Déploiement Vercel**

### **Problème Résolu**
```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`
```

### **Solution Appliquée**
- ❌ **Supprimé** : Configuration `functions` invalide dans `vercel.json`
- ✅ **Correction** : Les functions dans `/api/` sont auto-détectées par Vercel
- ✅ **Ajouté** : Endpoint de test `/api/test` pour vérifier le fonctionnement

### **Test du Déploiement**
1. **Endpoint de test** : `https://enixis-corp.vercel.app/api/test`
2. **Webhook Slack** : `https://enixis-corp.vercel.app/api/slack-webhook`

---

**Status** : ✅ Déploiement corrigé  
**Priorité** : Haute - Fonctionnalité clé pour le suivi des commandes