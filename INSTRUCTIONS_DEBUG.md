# 🔧 Instructions Debug - Facture Personnalisée

## 🎯 Problème Identifié

La facture affiche encore "Nom du client", "email@client.com" au lieu des vraies données du formulaire.

## 🔍 Étapes de Diagnostic

### Étape 1 : Test Direct
1. **Ouvrez** : `https://enixis-corp.vercel.app/test-debug.html`
2. **Cliquez** sur "🚀 Tester Facture Debug"
3. **Ouvrez F12 → Console** pour voir les logs

### Étape 2 : Vérifier les Logs
Dans la console, vous devriez voir :
```
🔍 Données directes reçues: {name: "Jean MARTIN", email: "jean.martin@example.com", ...}
📊 Nom: Jean MARTIN Email: jean.martin@example.com
🔍 Utilisation des données directes depuis l'URL...
```

### Étape 3 : Identifier le Problème

#### ✅ Si vous voyez les logs ci-dessus ET "Jean MARTIN" dans la facture
→ **Le système fonctionne !** Le problème vient du processus de paiement qui ne transmet pas les bonnes données.

#### ❌ Si vous voyez les logs mais toujours "Nom du client"
→ **Problème dans populateInvoiceData()** - La fonction ne met pas à jour les éléments HTML.

#### ❌ Si vous ne voyez pas les logs
→ **Problème dans la réception des paramètres** - Les données n'arrivent pas dans api/invoice.js.

## 🔧 Solutions selon le Problème

### Solution A : Problème de Réception des Paramètres

Si les logs ne s'affichent pas, le problème est dans `api/invoice.js` :

```javascript
// Dans api/invoice.js, vérifier que cette ligne existe :
const { invoice, data, download, name, email, phone, service, price, delivery, payment } = req.query;

// Et que directData est bien définie :
const directData = {
    name: '${name || ''}',
    email: '${email || ''}',
    phone: '${phone || ''}',
    service: '${service || ''}',
    price: '${price || ''}',
    delivery: '${delivery || ''}',
    payment: '${payment || ''}'
};
```

### Solution B : Problème de Condition

Si les logs s'affichent mais la condition ne fonctionne pas :

```javascript
// Remplacer cette condition :
if (directData.name && directData.name !== '' && directData.email && directData.email !== '') {

// Par celle-ci (plus permissive) :
if (directData.name || directData.email) {
```

### Solution C : Problème de populateInvoiceData

Si les données arrivent mais ne s'affichent pas, vérifier que les éléments HTML existent :

```javascript
// Dans populateInvoiceData, ajouter des logs :
const clientNameEl = document.getElementById('client-name');
console.log('Element client-name trouvé:', clientNameEl);
if (clientNameEl) {
    clientNameEl.textContent = normalizedData.name;
    console.log('Nom mis à jour vers:', normalizedData.name);
}
```

## 🚀 Test du Processus Complet

Une fois le test direct fonctionnel, testez le processus complet :

1. **Remplissez** le formulaire sur `/demande.html`
2. **Procédez** au paiement (Flooz, Mixx, ou Crypto)
3. **Vérifiez** la notification Slack
4. **Cliquez** sur "📥 Ouvrir PDF" dans Slack
5. **Confirmez** que vos données s'affichent

## 📊 URLs de Test Direct

### Test Simple
```
/api/invoice?invoice=TEST_001&name=Marie%20DUPONT&email=marie@example.com&service=CV&price=7000
```

### Test Complet
```
/api/invoice?invoice=TEST_002&name=Jean%20MARTIN&email=jean.martin@example.com&phone=%2B228%2090%2012%2034%2056&service=Creation%20de%20CV&price=7000&delivery=short&payment=Flooz
```

## 🔍 Diagnostic Avancé

### Vérifier les Paramètres URL
Dans la console du navigateur, tapez :
```javascript
// Voir les paramètres de l'URL actuelle
console.log(new URLSearchParams(window.location.search));
```

### Vérifier les Éléments HTML
```javascript
// Vérifier que les éléments existent
console.log('client-name:', document.getElementById('client-name'));
console.log('client-email:', document.getElementById('client-email'));
console.log('service-name:', document.getElementById('service-name'));
```

## 📞 Que Faire Ensuite

1. **Testez** avec `test-debug.html`
2. **Identifiez** le problème selon les logs
3. **Appliquez** la solution correspondante
4. **Retestez** jusqu'à ce que ça fonctionne
5. **Testez** le processus complet

---

💡 **Astuce :** Commencez toujours par le test direct pour isoler le problème avant de tester le processus complet.