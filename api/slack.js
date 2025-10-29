// Fonction serverless Vercel pour proxy Slack Webhook
// Utilise la variable d'environnement SLACK_WEBHOOK_URL côté serveur

export default async function handler(req, res) {
    // Headers de sécurité
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Méthode autorisée uniquement: POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Protection simple CORS / Origin (optionnelle, ajustez selon votre domaine)
    const origin = req.headers.origin || '*';
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const allowThisOrigin = allowedOrigins.length === 0 || allowedOrigins.includes(req.headers.origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', allowThisOrigin ? (req.headers.origin || '*') : 'null');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (!allowThisOrigin) {
        return res.status(403).json({ error: 'Forbidden origin' });
    }
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Valider payload minimal
    let body;
    try {
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json') && typeof req.body === 'string') {
            body = JSON.parse(req.body);
        } else if (typeof req.body === 'object') {
            body = req.body;
        } else if (typeof req.body === 'string') {
            body = JSON.parse(req.body);
        } else {
            body = {};
        }
    } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }
    if (!body || typeof body.text !== 'string' || body.text.trim().length === 0) {
        return res.status(400).json({ error: 'Missing "text" field' });
    }

    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) {
        return res.status(500).json({ error: 'Server misconfigured: SLACK_WEBHOOK_URL not set' });
    }

    try {
        const resp = await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: body.text })
        });
        if (!resp.ok) {
            const errText = await resp.text();
            return res.status(502).json({ error: 'Upstream Slack error', details: errText });
        }
        return res.status(200).json({ ok: true });
    } catch (e) {
        return res.status(500).json({ error: 'Proxy error', details: e.message });
    }
}