// Simple test endpoint pour vérifier que les Vercel Functions fonctionnent
export default function handler(req, res) {
  res.status(200).json({
    message: 'Vercel Functions fonctionnent correctement',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}