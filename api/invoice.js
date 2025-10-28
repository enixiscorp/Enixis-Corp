// Vercel Function pour servir les factures PDF
export default function handler(req, res) {
  // Configurer CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invoice, data, download } = req.query;
    
    if (!invoice) {
      return res.status(400).json({ error: 'Invoice number required' });
    }

    // Si des données de facture sont fournies et que le téléchargement direct est demandé
    if (data && download === 'pdf') {
      try {
        const invoiceData = JSON.parse(atob(decodeURIComponent(data)));
        
        // Servir directement le PDF
        const pdfBuffer = Buffer.from(invoiceData.pdfBase64, 'base64');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Facture_${invoice}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        return res.status(200).send(pdfBuffer);
      } catch (error) {
        console.error('Erreur décodage données facture:', error);
        return res.status(400).json({ error: 'Invalid invoice data' });
      }
    }

    // Créer une page HTML pour afficher et télécharger la facture
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoice} - Enixis Corp</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 600px; 
            background: white; 
            padding: 40px; 
            border-radius: 20px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            text-align: center;
            position: relative;
        }
        .slack-badge {
            position: absolute;
            top: -10px;
            right: -10px;
            background: linear-gradient(135deg, #4A154B, #611f69);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: none;
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
            color: #333; 
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .invoice-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
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
            background: linear-gradient(135deg, #007bff, #0056b3);
        }
        .secondary-btn:hover {
            box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
        }
        .info { 
            background: #e3f2fd; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0;
            border-left: 4px solid #2196f3;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="slack-badge" id="slack-badge">📱 Depuis Slack</div>
        <div class="logo">EC</div>
        <h1>📄 Facture ${invoice}</h1>
        <p class="subtitle">Enixis Corp - Solutions IA & Optimisation Business</p>
        
        <div class="info" id="status">
            <strong>ℹ️ Chargement de votre facture...</strong><br>
            <span id="source-info">Recherche de la facture dans le système.</span>
        </div>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Préparation du téléchargement...</p>
        </div>
        
        <div id="actions" style="display: none;">
            <button class="download-btn" onclick="downloadInvoice()">📥 Télécharger PDF</button>
            <a href="https://enixis-corp.vercel.app" class="download-btn secondary-btn">🏠 Retour au site</a>
        </div>
        
        <div class="invoice-info" id="invoice-details" style="display: none;">
            <h3>📋 Détails de la facture</h3>
            <div id="invoice-content"></div>
        </div>
    </div>
    
    <script>
        const invoiceNumber = '${invoice}';
        const invoiceData = '${data || ''}';
        
        // Fonction pour télécharger la facture
        function downloadInvoice() {
            const loading = document.getElementById('loading');
            loading.style.display = 'block';
            
            // Si des données de facture sont disponibles dans l'URL (depuis Slack)
            if (invoiceData) {
                try {
                    // Téléchargement direct via l'API
                    const downloadUrl = window.location.href + '&download=pdf';
                    
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = 'Facture_' + invoiceNumber + '.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    document.getElementById('status').innerHTML = 
                        '<strong>✅ Téléchargement démarré !</strong><br>Votre facture PDF a été téléchargée depuis Slack.';
                    document.getElementById('status').className = 'info';
                    
                    loading.style.display = 'none';
                    return;
                } catch (error) {
                    console.error('Erreur téléchargement direct:', error);
                }
            }
            
            // Fallback: essayer de récupérer depuis localStorage
            try {
                const storageKey = 'enixis_invoice_' + invoiceNumber;
                const localInvoiceData = localStorage.getItem(storageKey);
                
                if (localInvoiceData) {
                    const invoice = JSON.parse(localInvoiceData);
                    const pdfDataUrl = 'data:application/pdf;base64,' + invoice.pdfBase64;
                    
                    const link = document.createElement('a');
                    link.href = pdfDataUrl;
                    link.download = 'Facture_' + invoiceNumber + '.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    document.getElementById('status').innerHTML = 
                        '<strong>✅ Téléchargement démarré !</strong><br>Votre facture PDF a été téléchargée.';
                    document.getElementById('status').className = 'info';
                } else {
                    throw new Error('Facture non trouvée');
                }
            } catch (error) {
                console.error('Erreur téléchargement:', error);
                document.getElementById('status').innerHTML = 
                    '<strong>❌ Facture non disponible</strong><br>La facture n\\'a pas pu être trouvée. Contactez notre équipe à contacteccorp@gmail.com';
                document.getElementById('status').className = 'info error';
            }
            
            loading.style.display = 'none';
        }
        
        // Vérifier la disponibilité de la facture au chargement
        window.addEventListener('load', function() {
            setTimeout(() => {
                // Si des données de facture sont disponibles dans l'URL (depuis Slack)
                if (invoiceData) {
                    try {
                        const decodedData = JSON.parse(atob(decodeURIComponent(invoiceData)));
                        
                        // Afficher le badge Slack
                        document.getElementById('slack-badge').style.display = 'block';
                        
                        document.getElementById('status').innerHTML = 
                            '<strong>✅ Facture trouvée depuis Slack !</strong><br>Facture prête pour téléchargement direct.';
                        document.getElementById('status').className = 'info';
                        
                        // Afficher les détails depuis les données Slack
                        document.getElementById('invoice-content').innerHTML = 
                            '<strong>Client:</strong> ' + decodedData.orderData.name + '<br>' +
                            '<strong>Email:</strong> ' + decodedData.orderData.email + '<br>' +
                            '<strong>Service:</strong> ' + decodedData.orderData.serviceLabel + '<br>' +
                            '<strong>Montant:</strong> ' + new Intl.NumberFormat('fr-FR').format(decodedData.orderData.finalPrice) + ' F CFA<br>' +
                            '<strong>Méthode de paiement:</strong> ' + decodedData.paymentMethod + '<br>' +
                            '<strong>Date:</strong> ' + new Date(decodedData.createdAt).toLocaleDateString('fr-FR') + '<br>' +
                            '<strong>Source:</strong> 📱 Accès depuis Slack';
                        
                        document.getElementById('invoice-details').style.display = 'block';
                        document.getElementById('actions').style.display = 'block';
                        return;
                    } catch (error) {
                        console.error('Erreur décodage données Slack:', error);
                    }
                }
                
                // Fallback: essayer localStorage
                try {
                    const storageKey = 'enixis_invoice_' + invoiceNumber;
                    const localInvoiceData = localStorage.getItem(storageKey);
                    
                    if (localInvoiceData) {
                        const invoice = JSON.parse(localInvoiceData);
                        
                        document.getElementById('status').innerHTML = 
                            '<strong>✅ Facture trouvée !</strong><br>Votre facture est disponible pour téléchargement.';
                        document.getElementById('status').className = 'info';
                        
                        // Afficher les détails
                        document.getElementById('invoice-content').innerHTML = 
                            '<strong>Client:</strong> ' + invoice.clientInfo.name + '<br>' +
                            '<strong>Email:</strong> ' + invoice.clientInfo.email + '<br>' +
                            '<strong>Service:</strong> ' + invoice.serviceInfo.label + '<br>' +
                            '<strong>Montant:</strong> ' + new Intl.NumberFormat('fr-FR').format(invoice.serviceInfo.amount) + ' F CFA<br>' +
                            '<strong>Date:</strong> ' + new Date(invoice.createdAt).toLocaleDateString('fr-FR') + '<br>' +
                            '<strong>Source:</strong> 💾 Stockage local';
                        
                        document.getElementById('invoice-details').style.display = 'block';
                        document.getElementById('actions').style.display = 'block';
                    } else {
                        document.getElementById('status').innerHTML = 
                            '<strong>❌ Facture non trouvée</strong><br>Cette facture n\\'est pas disponible. Accédez via le lien Slack ou contactez l\\'équipe.';
                        document.getElementById('status').className = 'info error';
                        document.getElementById('actions').style.display = 'block';
                    }
                } catch (error) {
                    document.getElementById('status').innerHTML = 
                        '<strong>❌ Erreur de chargement</strong><br>Une erreur s\\'est produite lors de la vérification de la facture.';
                    document.getElementById('status').className = 'info error';
                    document.getElementById('actions').style.display = 'block';
                }
            }, 1000);
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