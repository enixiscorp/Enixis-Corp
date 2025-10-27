# 📧 Configuration EmailJS pour Envoi d'Emails Automatique

## 🎯 Objectif
Configurer EmailJS pour envoyer automatiquement les factures PDF à l'adresse `contacteccorp@gmail.com`.

## 🔧 Étapes de Configuration

### 1. **Créer un Compte EmailJS**
1. Allez sur [https://www.emailjs.com/](https://www.emailjs.com/)
2. Créez un compte gratuit
3. Confirmez votre email

### 2. **Configurer un Service Email**
1. Dans le dashboard EmailJS, allez dans "Email Services"
2. Cliquez "Add New Service"
3. Choisissez votre fournisseur email (Gmail recommandé)
4. Suivez les instructions pour connecter votre compte Gmail
5. Notez le **Service ID** (ex: `service_enixis`)

### 3. **Créer un Template Email**
1. Allez dans "Email Templates"
2. Cliquez "Create New Template"
3. Utilisez ce template :

```html
Sujet: {{subject}}

Bonjour équipe Enixis Corp,

{{message}}

DÉTAILS DE LA FACTURE:
• Numéro: {{invoice_number}}
• Client: {{client_name}} ({{client_email}})
• Téléphone: {{client_phone}}
• Prestation: {{service}}
• Montant: {{amount}}
• Méthode de paiement: {{payment_method}}
• Date: {{date}}

Cordialement,
Système automatisé Enixis Corp
```

4. Notez le **Template ID** (ex: `template_invoice`)

### 4. **Obtenir la Clé Publique**
1. Allez dans "Account" > "General"
2. Copiez votre **Public Key**

### 5. **Configurer les Variables d'Environnement**

#### Sur Vercel :
1. Allez dans votre projet Vercel
2. Settings > Environment Variables
3. Ajoutez :
```
EMAILJS_SERVICE_ID=service_enixis
EMAILJS_TEMPLATE_ID=template_invoice
EMAILJS_PUBLIC_KEY=votre_cle_publique
```

#### Sur GitHub (pour GitHub Pages) :
1. Allez dans Settings > Secrets and variables > Actions
2. Ajoutez les mêmes variables

## 🔄 **Alternative Simple : Configuration Manuelle**

Si EmailJS ne fonctionne pas, le système utilise un fallback qui ouvre le client email par défaut avec les données pré-remplies.

## 📧 **Test de Fonctionnement**

1. Remplissez le formulaire de demande
2. Validez un paiement
3. Vérifiez :
   - ✅ Notification Slack reçue
   - ✅ Email reçu sur contacteccorp@gmail.com
   - ✅ Facture PDF en pièce jointe

## 🚨 **Limitations EmailJS**

- **Plan gratuit** : 200 emails/mois
- **Pièces jointes** : Limitées en taille
- **Alternative** : Utiliser un service backend pour les gros volumes

## 🛠 **Dépannage**

### Email non reçu ?
1. Vérifiez les spams/indésirables
2. Vérifiez la configuration EmailJS
3. Consultez les logs dans la console du navigateur

### Erreur EmailJS ?
1. Vérifiez les variables d'environnement
2. Testez la configuration sur emailjs.com
3. Le fallback mailto s'activera automatiquement

---

**Status** : ⚙️ À configurer  
**Priorité** : Haute - Nécessaire pour recevoir les factures