# 📄 Intégration du Modèle de Facture Enixis Corp

## 🎯 Objectif

Intégrer le modèle de facture professionnel Enixis Corp dans le système de téléchargement PDF depuis Slack, avec personnalisation automatique selon chaque commande client.

## 🎨 Design du Modèle

### Éléments Visuels
- **Header** : Logo Enixis Corp + informations entreprise + numéro de facture rouge
- **Sections** : Informations client et prestation dans des boîtes grises
- **Tableau** : Style professionnel avec header bleu et lignes alternées
- **Total** : Encadré avec bordure bleue pour mise en évidence
- **Paiement** : Section verte avec statut de paiement
- **Footer** : Message de remerciement et contact

### Couleurs Utilisées
- **Bleu Enixis** : `#0A0F2C` (logo, titres, bordures)
- **Bleu tableau** : `#1e3a8a` → `#3b82f6` (dégradé header)
- **Rouge facture** : `#dc3545` (numéro de facture)
- **Vert paiement** : `#28a745` (section paiement, statut)
- **Gris sections** : `#f8f9fa` (fond des boîtes d'information)

## 🔧 Structure HTML

### Header de Facture
```html
<div class="invoice-header">
  <div class="company-info">
    <div class="company-logo">EC</div>
    <div class="company-details">
      <h2>Enixis Corp</h2>
      <p>contacteccorp@gmail.com</p>
      <p>+228 97 57 23 46</p>
      <p>https://enixis-corp.vercel.app</p>
    </div>
  </div>
  
  <div class="invoice-number-section">
    <div class="invoice-number">ENIXIS_20251027_71</div>
    <div class="invoice-dates">
      <p>Date: 27/10/2025</p>
      <p>Date de validité: 03/11/2025</p>
      <p>Heure: 01:21:44</p>
    </div>
  </div>
</div>
```

### Sections Client et Prestation
```html
<div class="client-service-section">
  <div class="info-box">
    <h4>📋 Informations Client</h4>
    <div class="client-details">
      <p><strong>Nom du Client</strong></p>
      <p>email@client.com</p>
      <p>+228 XX XX XX XX</p>
    </div>
  </div>
  
  <div class="info-box">
    <h4>🎯 Prestation Demandée</h4>
    <div class="service-details">
      <p><strong>Service demandé</strong></p>
      <p>Délai: Court terme (3-7j)</p>
    </div>
  </div>
</div>
```

### Tableau Professionnel
```html
<table class="invoice-table">
  <thead>
    <tr>
      <th>DESCRIPTION</th>
      <th>DATE</th>
      <th>QTÉ</th>
      <th>UNITÉ</th>
      <th>PRIX UNITAIRE</th>
      <th>MONTANT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>→ Optimisation de Procédures Support Client</td>
      <td>27/10/2025</td>
      <td>1,00</td>
      <td>pcs</td>
      <td>100 000 F CFA</td>
      <td>100 000 F CFA</td>
    </tr>
  </tbody>
</table>
```

## 📊 Personnalisation Automatique

### Données Dynamiques
```javascript
// Remplissage automatique depuis les données Slack
function populateInvoiceData(data) {
  const decodedData = JSON.parse(atob(decodeURIComponent(data)));
  const orderData = decodedData.orderData;
  
  // Dates
  document.getElementById('invoice-date').textContent = formatDate(decodedData.createdAt);
  document.getElementById('validity-date').textContent = formatDate(validityDate);
  document.getElementById('invoice-time').textContent = formatTime(decodedData.createdAt);
  
  // Client
  document.getElementById('client-name').textContent = orderData.name;
  document.getElementById('client-email').textContent = orderData.email;
  document.getElementById('client-phone').textContent = orderData.phone;
  
  // Service
  document.getElementById('service-name').textContent = orderData.serviceLabel;
  document.getElementById('service-delay').textContent = delayText;
  
  // Montants
  document.getElementById('final-total').textContent = formatFcfa(orderData.finalPrice);
  document.getElementById('payment-method').textContent = decodedData.paymentMethod;
}
```

### Formatage des Données
```javascript
// Formatage des montants
function formatFcfa(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' F CFA';
}

// Formatage des dates
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('fr-FR');
}

// Formatage des délais
const delayText = orderData.delivery === 'urgent' ? 'Urgent (24h)' : 
                 orderData.delivery === 'short' ? 'Court terme (3-7j)' : 
                 orderData.delivery === 'medium' ? 'Moyen terme (2-4 sem.)' : 
                 orderData.delivery === 'long' ? 'Long terme (1-6 mois)' : 'Standard';
```

## 🎭 Interface Utilisateur

### Section de Téléchargement
- **Header bleu Enixis** : Titre et instructions
- **Bouton principal** : "📥 Télécharger PDF" (vert)
- **Bouton secondaire** : "🏠 Retour au site" (bleu)
- **Badge Slack** : "📱 Depuis Slack" (violet, coin supérieur)
- **Messages de statut** : Feedback en temps réel

### Aperçu de Facture
- **Modèle complet** : Reproduction exacte du design
- **Données réelles** : Informations client personnalisées
- **Responsive** : Adaptation mobile/tablet/desktop
- **Impression** : Optimisé pour impression PDF

## 📱 Responsive Design

### Mobile (< 768px)
```css
@media (max-width: 768px) {
  .invoice-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .client-service-section {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .invoice-table {
    font-size: 12px;
  }
}
```

### Impression
```css
@media print {
  .download-section,
  .slack-badge {
    display: none !important;
  }
  
  .page-container {
    box-shadow: none;
    border-radius: 0;
  }
}
```

## 🔄 Workflow Complet

### 1. Génération Slack
```
Commande client → Facture générée → Données encodées → Lien Slack
```

### 2. Accès depuis Slack
```
Clic lien → Page Enixis → Modèle personnalisé → Données remplies
```

### 3. Téléchargement
```
Bouton télécharger → API PDF → Fichier téléchargé
```

## 🎨 Exemples de Personnalisation

### Client Standard
```
Client: Jean DUPONT
Email: jean.dupont@email.com
Service: ✍️ Création de CV sur mesure
Montant: 7 000 F CFA
Délai: Court terme (3-7j)
Paiement: Flooz
```

### Client Entreprise
```
Client: SARL TECH SOLUTIONS
Email: contact@techsolutions.tg
Service: 🛠 Optimisation de Procédures Support Client
Montant: 100 000 F CFA
Délai: Moyen terme (2-4 sem.)
Paiement: Mixx by Yas
```

## 🚀 Avantages

### Professionnalisme
- **Design cohérent** : Identité visuelle Enixis Corp
- **Mise en page claire** : Information structurée et lisible
- **Qualité impression** : Optimisé pour PDF haute qualité

### Automatisation
- **Remplissage automatique** : Aucune saisie manuelle
- **Formatage intelligent** : Dates, montants, délais
- **Personnalisation complète** : Chaque facture unique

### Accessibilité
- **Multi-plateforme** : Web, mobile, impression
- **Téléchargement direct** : Un clic depuis Slack
- **Fallback intelligent** : Fonctionne même sans données Slack

---

✅ **Modèle intégré avec succès**  
🎨 **Design professionnel Enixis Corp**  
📊 **Personnalisation automatique**  
📱 **Compatible tous appareils**