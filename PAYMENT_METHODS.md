# Méthodes de paiement - Guide technique

## 🇹🇬 Paiements mobiles (Togo uniquement)

### 📱 Flooz
- **Code USSD** : `*155*1*1*[DESTINATAIRE]*[DESTINATAIRE]*[MONTANT]*1#`
- **Variable** : `FLOOZ_PHONE`
- **Format** : Numéro sans indicatif (ex: `97572346`)
- **Particularité** : Le numéro destinataire apparaît 2 fois dans le code

### 💳 Mixx by Yas
- **Code USSD** : `*145*1*[MONTANT]*[DESTINATAIRE]*1#`
- **Variable** : `MIXX_PHONE`
- **Format** : Numéro sans indicatif (ex: `90123456`)
- **Particularité** : Le montant apparaît avant le destinataire

## 🌍 Paiements internationaux

### ₿ Cryptomonnaies (TRC-20 uniquement)
- **USDT** : Variable `USDT_WALLET`
- **BTC** : Variable `BTC_WALLET`
- **Réseau** : TRON (TRC-20) exclusivement
- **Format** : Adresse TRC-20 (ex: `TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE`)

## 🔔 Notifications Slack

Toutes les tentatives de paiement génèrent une notification Slack avec :
- Méthode de paiement utilisée
- Montant et détails de la commande
- Informations client
- Horodatage

## ⚙️ Configuration requise

### GitHub Secrets :
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
FLOOZ_PHONE=97572346
MIXX_PHONE=90123456
USDT_WALLET=TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE
BTC_WALLET=TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE
```

### Vercel Environment Variables :
Mêmes variables que GitHub Secrets si déployé sur Vercel.