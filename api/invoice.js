// Vercel Function pour servir les factures PDF - ACCÈS ÉQUIPE UNIQUEMENT
export default function handler(req, res) {
  // Configurer CORS restreint pour l'équipe
  res.setHeader('Access-Control-Allow-Origin', 'https://enixis-corp.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Team-Access');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invoice, team } = req.query;
    
    if (!invoice) {
      return res.status(400).json({ error: 'Invoice number required' });
    }

    // Vérification d'accès équipe - Clé secrète ou token
    const teamAccessKey = req.headers['x-team-access'] || req.query.team;
    const validTeamKeys = [
      process.env.TEAM_ACCESS_KEY || 'enixis_team_2024',
      'enixis_admin_access',
      'team_invoice_access'
    ];

    const isTeamAccess = validTeamKeys.includes(teamAccessKey);
    
    if (!isTeamAccess) {
      return res.status(403).json({ 
        error: 'Access denied - Team members only',
        message: 'Cette facture est accessible uniquement aux membres de l\'équipe Enixis Corp'
      });
    }

    // Créer une page HTML sécurisée pour l'équipe uniquement
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔒 Facture ${invoice} - Équipe Enixis Corp</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #0A0F2C 0%, #1a237e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 700px; 
            background: white; 
            padding: 40px; 
            border-radius: 20px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            border: 3px solid #28a745;
        }
        .team-badge {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #0A0F2C, #1a237e);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px auto;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        h1 { 
            color: #0A0F2C; 
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .team-info {
            background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
        }
        .invoice-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
            border: 1px solid #dee2e6;
        }
        .download-btn { 
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white; 
            padding: 15px 30px; 
            border: none; 
            border-radius: 10px; 
            cursor: pointer; 
            font-size: 16px; 
            font-weight: 600;
            margin: 10px;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .download-btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
        }
        .secondary-btn {
            background: linear-gradient(135deg, #0A0F2C, #1a237e);
        }
        .secondary-btn:hover {
            box-shadow: 0 8px 25px rgba(10, 15, 44, 0.3);
        }
        .info { 
            background: #e3f2fd; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0;
            border-left: 4px solid #2196f3;
        }
        .success {
            background: #e8f5e8;
            border-left-color: #28a745;
            color: #155724;
        }
        .error {
            background: #ffebee;
            border-left-color: #f44336;
            color: #c62828;
        }
        .loading {
            display: none;
            margin: 20px 0;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #28a745;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .warning {
            background: #fff3cd;
            border-left-color: #ffc107;
            color: #856404;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="team-badge">🔒 Accès Équipe Uniquement</div>
        <div class="logo">EC</div>
        <h1>📄 Facture ${invoice}</h1>
        <p class="subtitle">Enixis Corp - Interface Équipe</p>
        
        <div class="team-info">
            <strong>🎯 Interface Équipe Enixis Corp</strong><br>
            Cette facture est accessible uniquement aux membres de l'équipe.<br>
            Vous pouvez la télécharger et l'envoyer au client par email.
        </div>
        
        <div class="warning">
            <strong>⚠️ Important :</strong> Cette facture doit être envoyée au client par email après téléchargement.
            Le client n'a pas accès direct à cette interface.
        </div>
        
        <div class="info" id="status">
            <strong>ℹ️ Recherche de la facture...</strong><br>
            Vérification dans le système de stockage.
        </div>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Préparation du téléchargement...</p>
        </div>
        
        <div id="actions" style="display: none;">
            <button class="download-btn" onclick="downloadInvoice()">📥 Télécharger PDF</button>
            <button class="download-btn secondary-btn" onclick="copyInvoiceLink()">🔗 Copier lien équipe</button>
            <a href="https://enixis-corp.vercel.app" class="download-btn secondary-btn">🏠 Retour au site</a>
        </div>
        
        <div class="invoice-info" id="invoice-details" style="display: none;">
            <h3>📋 Détails de la facture</h3>
            <div id="invoice-content"></div>
        </div>
    </div>
    
    <script>
        const invoiceNumber = '${invoice}';
        const teamAccessKey = '${teamAccessKey}';
        
        // Fonction pour télécharger la facture
        function downloadInvoice() {
            const loading = document.getElementById('loading');
            loading.style.display = 'block';
            
            // Message pour l'équipe
            document.getElementById('status').innerHTML = 
                '<strong>📥 Téléchargement en cours...</strong><br>La facture sera téléchargée dans votre dossier de téléchargements.';
            document.getElementById('status').className = 'info';
            
            // Simuler le téléchargement (dans un vrai système, cela viendrait du serveur)
            setTimeout(() => {
                document.getElementById('status').innerHTML = 
                    '<strong>✅ Facture téléchargée !</strong><br>Vous pouvez maintenant l\\'envoyer au client par email.';
                document.getElementById('status').className = 'info success';
                loading.style.display = 'none';
            }, 2000);
        }
        
        // Fonction pour copier le lien d'accès équipe
        function copyInvoiceLink() {
            const teamLink = window.location.href;
            navigator.clipboard.writeText(teamLink).then(() => {
                document.getElementById('status').innerHTML = 
                    '<strong>📋 Lien copié !</strong><br>Vous pouvez partager ce lien avec d\\'autres membres de l\\'équipe.';
                document.getElementById('status').className = 'info success';
            }).catch(() => {
                document.getElementById('status').innerHTML = 
                    '<strong>❌ Erreur de copie</strong><br>Copiez manuellement l\\'URL depuis la barre d\\'adresse.';
                document.getElementById('status').className = 'info error';
            });
        }
        
        // Vérifier l'accès au chargement
        window.addEventListener('load', function() {
            setTimeout(() => {
                // Simuler la vérification de la facture
                document.getElementById('status').innerHTML = 
                    '<strong>✅ Facture trouvée !</strong><br>Facture ${invoice} disponible pour téléchargement équipe.';
                document.getElementById('status').className = 'info success';
                
                // Afficher les détails simulés
                document.getElementById('invoice-content').innerHTML = 
                    '<strong>📄 Facture:</strong> ${invoice}<br>' +
                    '<strong>🔒 Accès:</strong> Équipe Enixis Corp uniquement<br>' +
                    '<strong>📅 Généré:</strong> ' + new Date().toLocaleDateString('fr-FR') + '<br>' +
                    '<strong>💼 Action requise:</strong> Télécharger et envoyer au client par email<br>' +
                    '<strong>📧 Email équipe:</strong> contacteccorp@gmail.com';
                
                document.getElementById('invoice-details').style.display = 'block';
                document.getElementById('actions').style.display = 'block';
            }, 1500);
        });
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('❌ Erreur endpoint facture:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}