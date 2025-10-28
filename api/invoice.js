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
    const { invoice, data, download, name, email, phone, service, price, delivery, payment } = req.query;
    
    if (!invoice) {
      return res.status(400).json({ error: 'Invoice number required' });
    }

    // Si le téléchargement PDF est demandé, rediriger vers la page avec instructions
    if (download === 'pdf') {
      // Rediriger vers la page normale qui utilisera window.print()
      const redirectUrl = `/api/invoice?invoice=${invoice}${data ? `&data=${data}` : ''}`;
      res.writeHead(302, { Location: redirectUrl });
      return res.end();
    }

    // Créer une page HTML avec le modèle de facture Enixis Corp
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoice} - Enixis Corp</title>
    <!-- Bibliothèques pour génération PDF -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }
        
        .page-container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .slack-badge {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4A154B, #611f69);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: none;
            z-index: 1000;
        }
        
        .download-section {
            background: linear-gradient(135deg, #0A0F2C, #1a237e);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .download-btn {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
        }
        
        .secondary-btn {
            background: linear-gradient(135deg, #007bff, #0056b3);
        }
        
        .invoice-document {
            padding: 40px;
            background: white;
            min-height: 800px;
        }
        
        /* Header de la facture */
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .company-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .company-logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #0A0F2C, #1a237e);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        
        .company-logo-img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #0A0F2C;
        }
        
        .company-details h2 {
            color: #0A0F2C;
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        .company-details p {
            color: #666;
            font-size: 14px;
            margin: 2px 0;
        }
        
        .invoice-number-section {
            text-align: right;
        }
        
        .invoice-number {
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            display: inline-block;
        }
        
        .invoice-dates p {
            color: #666;
            font-size: 14px;
            margin: 3px 0;
        }
        
        /* Section client et prestation */
        .client-service-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .info-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #0A0F2C;
        }
        
        .info-box h4 {
            color: #0A0F2C;
            margin-bottom: 15px;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .client-details p, .service-details p {
            margin: 8px 0;
            color: #333;
        }
        
        .client-details strong, .service-details strong {
            color: #0A0F2C;
        }
        
        /* Tableau de la facture */
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .invoice-table thead {
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: white;
        }
        
        .invoice-table th {
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }
        
        .invoice-table td {
            padding: 15px 12px;
            border-bottom: 1px solid #e0e0e0;
            color: #333;
        }
        
        .invoice-table tbody tr:hover {
            background: #f8f9fa;
        }
        
        /* Total */
        .invoice-totals {
            margin-top: 30px;
            text-align: right;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .total-final {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            color: #0A0F2C;
            border: 2px solid #0A0F2C;
        }
        
        /* Informations de paiement */
        .payment-info-section {
            background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            border-left: 4px solid #28a745;
        }
        
        .payment-info-section h4 {
            color: #28a745;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .payment-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .payment-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
        }
        
        .payment-label {
            color: #666;
            font-weight: 500;
        }
        
        .payment-value {
            color: #333;
            font-weight: 600;
        }
        
        .status-paid {
            color: #28a745 !important;
            font-weight: bold;
        }
        
        /* Footer */
        .invoice-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            color: #666;
        }
        
        .invoice-footer p {
            margin: 8px 0;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .page-container {
                margin: 10px;
                border-radius: 5px;
            }
            
            .invoice-document {
                padding: 20px;
            }
            
            .invoice-header {
                flex-direction: column;
                gap: 20px;
                text-align: center;
            }
            
            .client-service-section {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .payment-details {
                grid-template-columns: 1fr;
            }
            
            .invoice-table {
                font-size: 12px;
            }
            
            .invoice-table th,
            .invoice-table td {
                padding: 8px 6px;
            }
        }
        
        /* Styles d'impression */
        @media print {
            body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            
            .download-section,
            .slack-badge {
                display: none !important;
            }
            
            .page-container {
                box-shadow: none !important;
                border-radius: 0 !important;
                max-width: none !important;
                margin: 0 !important;
                background: white !important;
            }
            
            .invoice-document {
                padding: 20px !important;
                background: white !important;
            }
            
            /* Assurer que tous les éléments sont visibles à l'impression */
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            .invoice-table thead {
                background: #1e3a8a !important;
                color: white !important;
            }
            
            .payment-info-section {
                background: #e8f5e8 !important;
                border-left: 4px solid #28a745 !important;
            }
            
            .info-box {
                background: #f8f9fa !important;
                border-left: 4px solid #0A0F2C !important;
            }
        }
    </style>
</head>
<body>
    <div class="slack-badge" id="slack-badge">📱 Depuis Slack</div>
    
    <div class="page-container">
        <!-- Section de téléchargement -->
        <div class="download-section">
            <h3>📄 Facture ${invoice} - Enixis Corp</h3>
            <p>Cliquez sur le bouton ci-dessous pour télécharger la facture au format PDF</p>
            <button class="download-btn" onclick="downloadInvoice()" id="download-btn">📥 Télécharger PDF</button>
            <a href="https://enixis-corp.vercel.app" class="download-btn secondary-btn">🏠 Retour au site</a>
            <div id="status-message" style="margin-top: 15px; font-size: 14px;">
                <p style="color: #666; font-size: 12px; margin: 5px 0;">
                    💡 Astuce: Utilisez Ctrl+P (Windows) ou Cmd+P (Mac) puis "Enregistrer au format PDF"
                </p>
            </div>
        </div>
        
        <!-- Document de facture -->
        <div class="invoice-document" id="invoice-document">
            <!-- Header -->
            <div class="invoice-header">
                <div class="company-info">
                    <img src="https://enixis-corp.vercel.app/images/enixis corp_logo.png" alt="Enixis Corp" class="company-logo-img">
                    <div class="company-details">
                        <h2>Enixis Corp</h2>
                        <p>contacteccorp@gmail.com</p>
                        <p>+228 97 57 23 46</p>
                        <p>https://enixis-corp.vercel.app</p>
                    </div>
                </div>
                
                <div class="invoice-number-section">
                    <div class="invoice-number" id="invoice-number">${invoice}</div>
                    <div class="invoice-dates">
                        <p><strong>Date:</strong> <span id="invoice-date">--/--/----</span></p>
                        <p><strong>Date de validité:</strong> <span id="validity-date">--/--/----</span></p>
                        <p><strong>Heure:</strong> <span id="invoice-time">--:--:--</span></p>
                    </div>
                </div>
            </div>
            
            <!-- Section client et prestation -->
            <div class="client-service-section">
                <div class="info-box">
                    <h4>📋 Informations Client</h4>
                    <div class="client-details" id="client-details">
                        <p><strong id="client-name">Nom du client</strong></p>
                        <p id="client-email">email@client.com</p>
                        <p id="client-phone">+228 XX XX XX XX</p>
                    </div>
                </div>
                
                <div class="info-box">
                    <h4>🎯 Prestation Demandée</h4>
                    <div class="service-details" id="service-details">
                        <p><strong id="service-name">Service demandé</strong></p>
                        <p><strong>Délai:</strong> <span id="service-delay">Standard</span></p>
                    </div>
                </div>
            </div>
            
            <!-- Tableau -->
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
                <tbody id="invoice-items">
                    <tr>
                        <td>→ <span id="item-description">Service</span></td>
                        <td id="item-date">--/--/----</td>
                        <td>1,00</td>
                        <td>pcs</td>
                        <td id="item-unit-price">0 F CFA</td>
                        <td id="item-total">0 F CFA</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Total -->
            <div class="invoice-totals">
                <div class="total-final">
                    <div class="total-row">
                        <span><strong>Total TTC</strong></span>
                        <span><strong id="final-total">0 F CFA</strong></span>
                    </div>
                </div>
            </div>
            
            <!-- Informations de paiement -->
            <div class="payment-info-section">
                <h4>💳 Informations de Paiement</h4>
                <div class="payment-details">
                    <div class="payment-row">
                        <span class="payment-label">Méthode de paiement:</span>
                        <span class="payment-value" id="payment-method">--</span>
                    </div>
                    <div class="payment-row">
                        <span class="payment-label">Statut:</span>
                        <span class="payment-value status-paid" id="payment-status">✅ Payé</span>
                    </div>
                    <div class="payment-row">
                        <span class="payment-label">Transaction:</span>
                        <span class="payment-value">🔒 Sécurisée et validée</span>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="invoice-footer">
                <p><strong>🎉 Merci pour votre commande !</strong></p>
                <p>Cette facture a été générée automatiquement et envoyée à notre équipe.</p>
                <p>Nous commencerons le travail selon le délai convenu.</p>
                <p><strong>Contact:</strong> contacteccorp@gmail.com | +228 97 57 23 46</p>
                <p style="margin-top: 15px; color: #28a745; font-weight: 600;">
                    ✨ N'hésitez pas à explorer nos autres services sur notre site !
                </p>
            </div>
        </div>
    </div>
    
    <script>
        const invoiceNumber = '${invoice}';
        const invoiceData = ${data ? `'${data}'` : 'null'};
        
        // Données directes depuis les paramètres URL
        const directData = {
            name: '${name || ''}',
            email: '${email || ''}',
            phone: '${phone || ''}',
            service: '${service || ''}',
            price: '${price || ''}',
            delivery: '${delivery || ''}',
            payment: '${payment || ''}'
        };
        
        // Fonction pour imprimer la facture
        function printInvoice() {
            const statusMessage = document.getElementById('status-message');
            statusMessage.innerHTML = '<span style="color: #28a745;">🖨️ Ouverture de la boîte de dialogue d\'impression...</span>';
            
            // Masquer les éléments non nécessaires
            const downloadSection = document.querySelector('.download-section');
            const slackBadge = document.getElementById('slack-badge');
            
            if (downloadSection) downloadSection.style.display = 'none';
            if (slackBadge) slackBadge.style.display = 'none';
            
            // Déclencher l'impression
            setTimeout(() => {
                window.print();
                
                // Restaurer l'affichage
                setTimeout(() => {
                    if (downloadSection) downloadSection.style.display = 'block';
                    if (slackBadge && invoiceData) slackBadge.style.display = 'block';
                    statusMessage.innerHTML = '<span style="color: #28a745;">✅ Facture prête ! Dans la boîte d\'impression, choisissez "Enregistrer au format PDF"</span>';
                }, 500);
            }, 100);
        }
        
        // Fonction pour générer le PDF avec les bibliothèques JavaScript
        async function generatePDFWithLibraries() {
            const statusMessage = document.getElementById('status-message');
            const pdfLibBtn = document.getElementById('pdf-lib-btn');
            
            try {
                pdfLibBtn.disabled = true;
                pdfLibBtn.textContent = '⏳ Génération...';
                statusMessage.innerHTML = '<span style="color: #ffc107;">🔥 Génération PDF avec bibliothèques JavaScript...</span>';
                
                // Vérifier que les bibliothèques sont chargées
                if (typeof html2canvas === 'undefined') {
                    throw new Error('Bibliothèque html2canvas non chargée');
                }
                
                if (typeof window.jsPDF === 'undefined') {
                    throw new Error('Bibliothèque jsPDF non chargée');
                }
                
                // Masquer les éléments non nécessaires
                const downloadSection = document.querySelector('.download-section');
                const slackBadge = document.getElementById('slack-badge');
                
                if (downloadSection) downloadSection.style.display = 'none';
                if (slackBadge) slackBadge.style.display = 'none';
                
                // Capturer la facture en image
                const invoiceElement = document.getElementById('invoice-document');
                if (!invoiceElement) {
                    throw new Error('Élément facture non trouvé');
                }
                
                console.log('📸 Capture de la facture...');
                statusMessage.innerHTML = '<span style="color: #ffc107;">📸 Capture de la facture en cours...</span>';
                
                const canvas = await html2canvas(invoiceElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: invoiceElement.scrollWidth,
                    height: invoiceElement.scrollHeight,
                    logging: false,
                    removeContainer: true
                });
                
                console.log('✅ Capture réussie, génération PDF...');
                statusMessage.innerHTML = '<span style="color: #ffc107;">✅ Capture réussie, génération du PDF...</span>';
                
                // Créer le PDF
                const { jsPDF } = window.jsPDF;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });
                
                // Calculer les dimensions pour A4
                const imgWidth = 210; // A4 width in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Ajouter l'image au PDF
                const imgData = canvas.toDataURL('image/png', 0.95);
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
                
                // Ajouter les métadonnées
                pdf.setProperties({
                    title: \`Facture \${invoiceNumber}\`,
                    subject: 'Facture Enixis Corp',
                    author: 'Enixis Corp',
                    creator: 'Enixis Corp - Solutions IA & Optimisation Business'
                });
                
                // Télécharger le PDF
                const filename = \`Facture_\${invoiceNumber}.pdf\`;
                pdf.save(filename);
                
                console.log('✅ PDF téléchargé:', filename);
                statusMessage.innerHTML = '<span style="color: #28a745;">✅ PDF téléchargé avec succès !</span>';
                
            } catch (error) {
                console.error('❌ Erreur génération PDF:', error);
                statusMessage.innerHTML = \`<span style="color: #dc3545;">❌ Erreur: \${error.message}</span>\`;
                
                // Fallback vers l'impression classique
                setTimeout(() => {
                    statusMessage.innerHTML = '<span style="color: #ffc107;">🔄 Tentative avec l\'impression classique...</span>';
                    downloadInvoice();
                }, 2000);
                
            } finally {
                // Restaurer l'affichage
                const downloadSection = document.querySelector('.download-section');
                const slackBadge = document.getElementById('slack-badge');
                
                if (downloadSection) downloadSection.style.display = 'block';
                if (slackBadge && (invoiceData || document.querySelector('[data-test-mode]'))) {
                    slackBadge.style.display = 'block';
                }
                
                pdfLibBtn.disabled = false;
                pdfLibBtn.textContent = '🔥 PDF Direct';
            }
        }
        
        // Fonction pour formater les montants en F CFA
        function formatFcfa(amount) {
            if (!amount || amount === 0) return '0 F CFA';
            return new Intl.NumberFormat('fr-FR').format(amount) + ' F CFA';
        }
        
        // Fonction pour formater les dates
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        }
        
        // Fonction pour formater l'heure
        function formatTime(dateString) {
            const date = new Date(dateString);
            return date.toLocaleTimeString('fr-FR');
        }
        
        // Fonction pour remplir les données de la facture
        function populateInvoiceData(data) {
            try {
                console.log('🔍 Traitement des données de facture...');
                console.log('📦 Données brutes reçues:', data ? data.substring(0, 100) + '...' : 'null');
                
                let decodedData;
                
                // Essayer différentes méthodes de décodage
                if (typeof data === 'string') {
                    try {
                        // Méthode 1: Décoder URL puis Base64 puis JSON
                        const urlDecoded = decodeURIComponent(data);
                        const base64Decoded = atob(urlDecoded);
                        decodedData = JSON.parse(base64Decoded);
                        console.log('✅ Décodage URL->Base64->JSON réussi');
                    } catch (e1) {
                        try {
                            // Méthode 2: Décoder directement Base64 puis JSON
                            const base64Decoded = atob(data);
                            decodedData = JSON.parse(base64Decoded);
                            console.log('✅ Décodage Base64->JSON réussi');
                        } catch (e2) {
                            try {
                                // Méthode 3: Parser directement comme JSON
                                decodedData = JSON.parse(data);
                                console.log('✅ Décodage JSON direct réussi');
                            } catch (e3) {
                                throw new Error('Impossible de décoder les données: ' + e3.message);
                            }
                        }
                    }
                } else {
                    // Si ce n'est pas une string, essayer de l'utiliser directement
                    decodedData = data;
                }
                
                console.log('📊 Données décodées:', decodedData);
                
                // Vérifier la structure des données
                let orderData;
                if (decodedData.orderData) {
                    orderData = decodedData.orderData;
                } else if (decodedData.name && decodedData.email) {
                    // Les données sont directement dans l'objet principal
                    orderData = decodedData;
                } else {
                    throw new Error('Structure de données non reconnue');
                }
                
                console.log('👤 Données client extraites:', {
                    name: orderData.name,
                    email: orderData.email,
                    phone: orderData.phone,
                    service: orderData.serviceLabel || orderData.service,
                    price: orderData.finalPrice || orderData.price
                });
                
                // Normaliser les données pour compatibilité
                const normalizedData = {
                    name: orderData.name || orderData.client_name || 'Client',
                    email: orderData.email || orderData.client_email || 'email@client.com',
                    phone: orderData.phone || orderData.client_phone || '+228 XX XX XX XX',
                    serviceLabel: orderData.serviceLabel || orderData.service || 'Service demandé',
                    finalPrice: orderData.finalPrice || orderData.price || 0,
                    basePrice: orderData.basePrice || orderData.finalPrice || orderData.price || 0,
                    delivery: orderData.delivery || 'standard',
                    coupon: orderData.coupon || null
                };
                
                console.log('🔄 Données normalisées:', normalizedData);
                
                // Calcul des dates selon le délai choisi
                const createdDate = new Date(decodedData.createdAt || Date.now());
                const validityDate = new Date(createdDate);
                
                // Calculer la date de validité selon le délai
                switch(normalizedData.delivery) {
                    case 'urgent':
                        validityDate.setDate(validityDate.getDate() + 1); // 24h
                        break;
                    case 'short':
                        validityDate.setDate(validityDate.getDate() + 7); // 7 jours
                        break;
                    case 'medium':
                        validityDate.setDate(validityDate.getDate() + 28); // 4 semaines
                        break;
                    case 'long':
                        validityDate.setMonth(validityDate.getMonth() + 6); // 6 mois
                        break;
                    default:
                        validityDate.setDate(validityDate.getDate() + 14); // 2 semaines par défaut
                }
                
                // Remplir les dates avec vérification
                const invoiceDateEl = document.getElementById('invoice-date');
                const validityDateEl = document.getElementById('validity-date');
                const invoiceTimeEl = document.getElementById('invoice-time');
                
                if (invoiceDateEl) {
                    invoiceDateEl.textContent = formatDate(createdDate);
                    console.log('✅ Date facture mise à jour:', formatDate(createdDate));
                }
                if (validityDateEl) {
                    validityDateEl.textContent = formatDate(validityDate);
                    console.log('✅ Date validité mise à jour:', formatDate(validityDate));
                }
                if (invoiceTimeEl) {
                    invoiceTimeEl.textContent = formatTime(createdDate);
                    console.log('✅ Heure mise à jour:', formatTime(createdDate));
                }
                
                // Informations client avec vérification
                const clientNameEl = document.getElementById('client-name');
                const clientEmailEl = document.getElementById('client-email');
                const clientPhoneEl = document.getElementById('client-phone');
                
                if (clientNameEl) {
                    clientNameEl.textContent = normalizedData.name;
                    console.log('✅ Nom client mis à jour:', normalizedData.name);
                }
                if (clientEmailEl) {
                    clientEmailEl.textContent = normalizedData.email;
                    console.log('✅ Email client mis à jour:', normalizedData.email);
                }
                if (clientPhoneEl) {
                    clientPhoneEl.textContent = normalizedData.phone;
                    console.log('✅ Téléphone client mis à jour:', normalizedData.phone);
                }
                
                // Informations service avec vérification
                const serviceNameEl = document.getElementById('service-name');
                const serviceDelayEl = document.getElementById('service-delay');
                
                if (serviceNameEl) {
                    serviceNameEl.textContent = normalizedData.serviceLabel;
                    console.log('✅ Service mis à jour:', normalizedData.serviceLabel);
                }
                
                const delayText = normalizedData.delivery === 'urgent' ? 'Urgent (24h)' : 
                                 normalizedData.delivery === 'short' ? 'Court terme (3-7j)' : 
                                 normalizedData.delivery === 'medium' ? 'Moyen terme (2-4 sem.)' : 
                                 normalizedData.delivery === 'long' ? 'Long terme (1-6 mois)' : 'Standard';
                
                if (serviceDelayEl) {
                    serviceDelayEl.textContent = delayText;
                    console.log('✅ Délai mis à jour:', delayText);
                }
                
                // Calcul des prix avec gestion des codes promotionnels
                const basePrice = normalizedData.basePrice;
                const finalPrice = normalizedData.finalPrice;
                const hasDiscount = basePrice > finalPrice;
                
                // Tableau avec vérification
                const itemDescEl = document.getElementById('item-description');
                const itemDateEl = document.getElementById('item-date');
                const itemUnitPriceEl = document.getElementById('item-unit-price');
                const itemTotalEl = document.getElementById('item-total');
                
                if (itemDescEl) {
                    itemDescEl.textContent = normalizedData.serviceLabel;
                    console.log('✅ Description item mise à jour:', normalizedData.serviceLabel);
                }
                if (itemDateEl) {
                    itemDateEl.textContent = formatDate(createdDate);
                    console.log('✅ Date item mise à jour');
                }
                if (itemUnitPriceEl) {
                    itemUnitPriceEl.textContent = formatFcfa(basePrice);
                    console.log('✅ Prix unitaire mis à jour:', formatFcfa(basePrice));
                }
                if (itemTotalEl) {
                    itemTotalEl.textContent = formatFcfa(finalPrice);
                    console.log('✅ Total item mis à jour:', formatFcfa(finalPrice));
                }
                
                // Gestion des remises (codes promotionnels)
                const totalsContainer = document.querySelector('.invoice-totals');
                if (hasDiscount && normalizedData.coupon && totalsContainer) {
                    console.log('💰 Application de la remise:', normalizedData.coupon);
                    const discountAmount = basePrice - finalPrice;
                    const discountHtml = \`
                        <div class="total-row">
                            <span>Sous-total TTC</span>
                            <span>\${formatFcfa(basePrice)}</span>
                        </div>
                        <div class="total-row" style="color: #dc3545;">
                            <span>Remise (\${normalizedData.coupon.code} - \${normalizedData.coupon.percent}%)</span>
                            <span>-\${formatFcfa(discountAmount)}</span>
                        </div>
                    \`;
                    
                    // Insérer avant le total final
                    const finalTotalDiv = totalsContainer.querySelector('.total-final');
                    if (finalTotalDiv) {
                        finalTotalDiv.insertAdjacentHTML('beforebegin', discountHtml);
                        console.log('✅ Remise ajoutée à la facture');
                    }
                }
                
                // Total final avec vérification
                const finalTotalEl = document.getElementById('final-total');
                if (finalTotalEl) {
                    finalTotalEl.textContent = formatFcfa(finalPrice);
                    console.log('✅ Total final mis à jour:', formatFcfa(finalPrice));
                }
                
                // Paiement avec vérification
                const paymentMethodEl = document.getElementById('payment-method');
                const paymentStatusEl = document.getElementById('payment-status');
                
                if (paymentMethodEl) {
                    paymentMethodEl.textContent = decodedData.paymentMethod || 'Paiement validé';
                    console.log('✅ Méthode paiement mise à jour:', decodedData.paymentMethod);
                }
                if (paymentStatusEl) {
                    paymentStatusEl.textContent = '✅ Payé le ' + formatDate(createdDate) + ' à ' + formatTime(createdDate);
                    console.log('✅ Statut paiement mis à jour');
                }
                
                console.log('✅ Données remplies avec succès');
                console.log('Prix de base:', basePrice, 'Prix final:', finalPrice);
                console.log('Code promo:', orderData.coupon);
                return true;
            } catch (error) {
                console.error('Erreur lors du remplissage des données:', error);
                console.error('Données reçues:', data);
                return false;
            }
        }
        
        // Fonction pour télécharger la facture
        function downloadInvoice() {
            const statusMessage = document.getElementById('status-message');
            const downloadBtn = document.getElementById('download-btn');
            
            console.log('🔥 Fonction downloadInvoice appelée');
            console.log('📊 Données disponibles:', invoiceData ? 'Oui' : 'Non');
            
            downloadBtn.disabled = true;
            downloadBtn.textContent = '⏳ Téléchargement...';
            statusMessage.innerHTML = '<span style="color: #ffc107;">⏳ Préparation du téléchargement PDF...</span>';
            
            try {
                // Masquer les éléments non nécessaires pour l'impression
                const downloadSection = document.querySelector('.download-section');
                const slackBadge = document.getElementById('slack-badge');
                
                console.log('🎯 Masquage des éléments pour impression');
                if (downloadSection) {
                    downloadSection.style.display = 'none';
                    console.log('✅ Section téléchargement masquée');
                }
                if (slackBadge) {
                    slackBadge.style.display = 'none';
                    console.log('✅ Badge Slack masqué');
                }
                
                // Détecter le type d'appareil
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                console.log('📱 Appareil mobile détecté:', isMobile);
                console.log('🍎 Appareil iOS détecté:', isIOS);
                
                // Instructions spécifiques selon l'appareil
                if (isIOS) {
                    statusMessage.innerHTML = '<span style="color: #28a745;">🍎 iOS : Appuyez sur Partager > Imprimer > Pincer pour zoomer > Partager > Enregistrer dans Fichiers</span>';
                } else if (isMobile) {
                    statusMessage.innerHTML = '<span style="color: #28a745;">📱 Mobile : Menu (⋮) > Imprimer > Enregistrer au format PDF</span>';
                } else {
                    statusMessage.innerHTML = '<span style="color: #28a745;">💻 Desktop : Dans la boîte d\'impression, choisissez "Enregistrer au format PDF"</span>';
                }
                
                // Déclencher l'impression après un court délai
                setTimeout(() => {
                    console.log('🖨️ Déclenchement de window.print()');
                    
                    // Essayer différentes méthodes selon le navigateur
                    try {
                        window.print();
                        console.log('✅ window.print() exécuté');
                    } catch (printError) {
                        console.error('❌ Erreur window.print():', printError);
                        
                        // Fallback : ouvrir dans un nouvel onglet
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                            printWindow.document.write(document.documentElement.outerHTML);
                            printWindow.document.close();
                            printWindow.print();
                            console.log('✅ Fallback : impression dans nouvel onglet');
                        } else {
                            throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
                        }
                    }
                }, 500);
                
                // Restaurer l'affichage après l'impression
                setTimeout(() => {
                    console.log('🔄 Restauration de l\'affichage');
                    if (downloadSection) downloadSection.style.display = 'block';
                    if (slackBadge && (invoiceData || document.querySelector('[data-test-mode]'))) {
                        slackBadge.style.display = 'block';
                    }
                    
                    downloadBtn.disabled = false;
                    downloadBtn.textContent = '📥 Télécharger PDF';
                    
                    // Message de confirmation
                    statusMessage.innerHTML = '<span style="color: #28a745;">✅ Boîte d\'impression ouverte ! Choisissez "Enregistrer au format PDF"</span>';
                }, 2000);
                
            } catch (error) {
                console.error('❌ Erreur génération PDF:', error);
                statusMessage.innerHTML = '<span style="color: #dc3545;">❌ Erreur : ' + error.message + '</span>';
                downloadBtn.disabled = false;
                downloadBtn.textContent = '📥 Télécharger PDF';
                
                // Restaurer l'affichage en cas d'erreur
                const downloadSection = document.querySelector('.download-section');
                const slackBadge = document.getElementById('slack-badge');
                if (downloadSection) downloadSection.style.display = 'block';
                if (slackBadge) slackBadge.style.display = 'block';
            }
        }
        
        // Initialisation au chargement de la page
        window.addEventListener('load', function() {
            const statusMessage = document.getElementById('status-message');
            
            console.log('Initialisation de la page facture');
            console.log('Numéro de facture:', invoiceNumber);
            console.log('Données disponibles:', invoiceData ? 'Oui' : 'Non');
            
            // Vérifier d'abord les données directes depuis l'URL
            if (directData.name && directData.email) {
                console.log('🔍 Utilisation des données directes depuis l\'URL...');
                console.log('📦 Données directes:', directData);
                
                // Créer un objet de données compatible
                const urlData = {
                    invoiceNumber: invoiceNumber,
                    orderData: {
                        name: decodeURIComponent(directData.name),
                        email: decodeURIComponent(directData.email),
                        phone: decodeURIComponent(directData.phone),
                        serviceLabel: decodeURIComponent(directData.service),
                        finalPrice: parseInt(directData.price) || 0,
                        basePrice: parseInt(directData.price) || 0,
                        delivery: directData.delivery || 'standard'
                    },
                    paymentMethod: decodeURIComponent(directData.payment) || 'Paiement validé',
                    createdAt: new Date().toISOString()
                };
                
                if (populateInvoiceData(urlData)) {
                    statusMessage.innerHTML = '<span style="color: #28a745;">✅ Facture personnalisée chargée - Prête pour téléchargement</span>';
                    console.log('✅ Données URL appliquées avec succès');
                } else {
                    statusMessage.innerHTML = '<span style="color: #dc3545;">❌ Erreur lors du chargement des données URL</span>';
                }
                return;
            }
            
            // Si des données de facture sont disponibles dans l'URL (depuis Slack)
            else if (invoiceData && invoiceData !== 'null') {
                try {
                    console.log('🔍 Traitement des données Slack...');
                    console.log('📦 Données brutes:', invoiceData.substring(0, 100) + '...');
                    
                    // Afficher le badge Slack
                    document.getElementById('slack-badge').style.display = 'block';
                    
                    // Remplir les données de la facture
                    if (populateInvoiceData(invoiceData)) {
                        statusMessage.innerHTML = '<span style="color: #28a745;">✅ Facture chargée depuis Slack - Prête pour téléchargement</span>';
                        console.log('✅ Données Slack chargées avec succès');
                    } else {
                        statusMessage.innerHTML = '<span style="color: #dc3545;">⚠️ Erreur lors du chargement des données</span>';
                        console.error('❌ Erreur lors du remplissage des données');
                    }
                    
                    return;
                } catch (error) {
                    console.error('❌ Erreur décodage données Slack:', error);
                    statusMessage.innerHTML = '<span style="color: #dc3545;">❌ Erreur décodage: ' + error.message + '</span>';
                }
            } else {
                console.log('⚠️ Aucune donnée Slack disponible - Utilisation de données de test');
                statusMessage.innerHTML = '<span style="color: #ffc107;">⚠️ Aucune donnée Slack - Chargement de données de test</span>';
                
                // Créer des données de test réalistes
                const testData = {
                    invoiceNumber: invoiceNumber,
                    orderData: {
                        name: "Client Test",
                        email: "client.test@example.com",
                        phone: "+228 90 12 34 56",
                        serviceLabel: "✍️ Création de CV sur mesure + Lettre",
                        finalPrice: 7000,
                        basePrice: 7000,
                        delivery: "short"
                    },
                    paymentMethod: "Test - Données de démonstration",
                    createdAt: new Date().toISOString()
                };
                
                console.log('🧪 Utilisation de données de test:', testData);
                
                // Appliquer les données de test
                if (populateInvoiceData(testData)) {
                    statusMessage.innerHTML = '<span style="color: #28a745;">✅ Données de test chargées - Facture prête pour téléchargement</span>';
                    console.log('✅ Données de test appliquées avec succès');
                } else {
                    statusMessage.innerHTML = '<span style="color: #dc3545;">❌ Erreur lors du chargement des données de test</span>';
                }
                
                return; // Sortir ici pour éviter le fallback localStorage
            }
            
            // Fallback: essayer localStorage
            try {
                const storageKey = 'enixis_invoice_' + invoiceNumber;
                const localInvoiceData = localStorage.getItem(storageKey);
                
                if (localInvoiceData) {
                    const invoice = JSON.parse(localInvoiceData);
                    
                    // Remplir avec les données localStorage
                    document.getElementById('invoice-date').textContent = formatDate(invoice.createdAt);
                    document.getElementById('validity-date').textContent = formatDate(new Date(Date.now() + 30*24*60*60*1000));
                    document.getElementById('invoice-time').textContent = formatTime(invoice.createdAt);
                    
                    document.getElementById('client-name').textContent = invoice.clientInfo.name;
                    document.getElementById('client-email').textContent = invoice.clientInfo.email;
                    document.getElementById('client-phone').textContent = invoice.clientInfo.phone;
                    
                    document.getElementById('service-name').textContent = invoice.serviceInfo.label;
                    document.getElementById('item-description').textContent = invoice.serviceInfo.label;
                    document.getElementById('item-date').textContent = formatDate(invoice.createdAt);
                    document.getElementById('item-unit-price').textContent = formatFcfa(invoice.serviceInfo.amount);
                    document.getElementById('item-total').textContent = formatFcfa(invoice.serviceInfo.amount);
                    document.getElementById('final-total').textContent = formatFcfa(invoice.serviceInfo.amount);
                    
                    document.getElementById('payment-method').textContent = invoice.paymentMethod;
                    
                    statusMessage.innerHTML = '<span style="color: #28a745;">✅ Facture chargée depuis le stockage local</span>';
                } else {
                    statusMessage.innerHTML = '<span style="color: #dc3545;">❌ Facture non trouvée - Accédez via le lien Slack</span>';
                }
            } catch (error) {
                console.error('Erreur localStorage:', error);
                statusMessage.innerHTML = '<span style="color: #dc3545;">❌ Erreur lors du chargement de la facture</span>';
            }
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