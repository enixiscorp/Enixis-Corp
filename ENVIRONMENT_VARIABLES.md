# Variables d'environnement requises

## GitHub Pages (Secrets du repository)

Configurez ces secrets dans votre repository GitHub :

### Obligatoires :
- `SLACK_WEBHOOK_URL` : URL du webhook Slack pour les notifications
  - Format : `https://hooks.slack.com/services/XXX/YYY/ZZZ`

### Optionnelles (paiements) :
- `FLOOZ_PHONE` : Numéro de téléphone pour Flooz (sans indicatif)
  - Exemple : `97572346`
- `MIXX_PHONE` : Numéro de téléphone pour Mixx by Yas (sans indicatif)
  - Exemple : `90123456`
- `USDT_WALLET` : Adresse wallet USDT (TRC-20)
  - Exemple : `TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE`
- `BTC_WALLET` : Adresse wallet BTC (TRC-20)
  - Exemple : `TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE`

## Vercel (Variables d'environnement)

Si vous déployez sur Vercel, configurez les mêmes variables dans :
Dashboard Vercel > Project > Settings > Environment Variables

## Sécurité

✅ **Avantages de cette approche :**
- Aucun secret exposé dans le code source
- Variables injectées uniquement au moment du build
- Possibilité de changer les secrets sans modifier le code
- Séparation claire entre développement et production

⚠️ **Important :**
- Ne jamais commiter le fichier `env.js` avec de vraies valeurs
- Utiliser `env.example.js` comme template
- Les secrets sont injectés côté client (visible dans le navigateur)
- Pour une sécurité maximale, utilisez un backend pour les opérations sensibles