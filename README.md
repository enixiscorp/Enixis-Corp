# Enixis Corp – Site web

## Soumission de demande (Slack)

- La page `demande.html` collecte les informations du client et propose une sélection de prestations avec prix indicatif dynamique.
- À la soumission, le front envoie un `POST` JSON vers l'endpoint `/api/slack` avec la forme:
  `{ "text": "...message formaté..." }`.
- Pour ne pas exposer le webhook Slack, créez un proxy serveur qui lit le secret `SLACK_WEBHOOK_URL` dans les variables du dépôt.

### Exemple de proxy minimal (Node / Express)

```js
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/api/slack', async (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text_required' });
  const url = process.env.SLACK_WEBHOOK_URL; // stocké en secret GitHub
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
  return res.status(r.ok ? 200 : 500).end();
});

app.listen(process.env.PORT || 3000);
```

### Hébergement (options)

- Option sécurisée (recommandée): proxy `/api/slack` (Cloudflare/Vercel/Netlify).
- Option rapide (expérimentale): `env.js` public et envoi direct vers Slack.

## Utilisation

- Accueil: `index.html`
- Soumission: `demande.html` (bouton "Soumettre ma demande" disponible depuis le héro de l'accueil)

## Déploiement Cloudflare Pages via GitHub Actions
- Alternative GitHub Pages pure (sans proxy): utilisez le workflow `.github/workflows/deploy-pages.yml` qui génère `env.js` depuis `SLACK_WEBHOOK_URL` (secret repo). Le front enverra directement vers Slack (CORS en no-cors, sans lecture de réponse).

- Renseignez les secrets du dépôt:
  - `CF_API_TOKEN` (Pages: Edit, Cloudflare API Token avec Pages Write)
  - `CF_ACCOUNT_ID` (votre Account ID Cloudflare)
  - `CF_PAGES_PROJECT_NAME` (nom du projet Pages)
- Optionnel: configurez dans Cloudflare Pages > Settings > Variables:
  - `SLACK_WEBHOOK_URL` (obligatoire pour le proxy)
  - `ALLOWED_ORIGINS` (ex: `https://handock-max.github.io`)
  - `SLACK_AUTH_TOKEN` (optionnel, si vous activez l'auth Bearer)
- Le workflow: `.github/workflows/deploy-cloudflare-pages.yml` (push sur `main` ou déclenchement manuel).
