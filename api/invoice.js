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

    let clientName, clientEmail, clientPhone, clientService, clientPrice, clientDelivery, clientPayment;

    // Vérifier si les données sont encodées en Base64 (URL optimisée)
    if (data && !name) {
      try {
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        clientName = decodedData.name || 'Nom du client';
        clientEmail = decodedData.email || 'email@client.com';
        clientPhone = decodedData.phone || '+228 XX XX XX XX';
        clientService = decodedData.service || 'Service demandé';
        clientPrice = parseInt(decodedData.price) || 0;
        clientDelivery = decodedData.delivery || 'standard';
        clientPayment = decodedData.payment || 'Paiement validé';
        console.log('✅ Données décodées depuis Base64');
      } catch (decodeError) {
        console.error('❌ Erreur décodage Base64:', decodeError);
        // Fallback vers les valeurs par défaut
        clientName = 'Nom du client';
        clientEmail = 'email@client.com';
        clientPhone = '+228 XX XX XX XX';
        clientService = 'Service demandé';
        clientPrice = 0;
        clientDelivery = 'standard';
        clientPayment = 'Paiement validé';
      }
    } else {
      // Méthode traditionnelle avec paramètres URL séparés
      clientName = name ? decodeURIComponent(name) : 'Nom du client';
      clientEmail = email ? decodeURIComponent(email) : 'email@client.com';
      clientPhone = phone ? decodeURIComponent(phone) : '+228 XX XX XX XX';
      clientService = service ? decodeURIComponent(service) : 'Service demandé';
      clientPrice = price ? parseInt(price) : 0;
      clientDelivery = delivery || 'standard';
      clientPayment = payment ? decodeURIComponent(payment) : 'Paiement validé';
      console.log('✅ Données extraites depuis paramètres URL');
    }
    
    // Formater le prix
    const formattedPrice = clientPrice > 0 ? new Intl.NumberFormat('fr-FR').format(clientPrice) + ' F CFA' : '0 F CFA';
    
    // Formater le délai
    const deliveryText = clientDelivery === 'urgent' ? 'Urgent (24h)' : 
                        clientDelivery === 'short' ? 'Court terme (3-7j)' : 
                        clientDelivery === 'medium' ? 'Moyen terme (2-4 sem.)' : 
                        clientDelivery === 'long' ? 'Long terme (1-6 mois)' : 'Standard';
    
    // Générer les dates
    const currentDate = new Date();
    const invoiceDate = currentDate.toLocaleDateString('fr-FR');
    const invoiceTime = currentDate.toLocaleTimeString('fr-FR');
    const validityDate = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000)).toLocaleDateString('fr-FR');

    // Créer une page HTML avec le modèle de facture Enixis Corp
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoice} - Enixis Corp</title>

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
        
        /* Styles d'impression optimisés pour A4 */
        @media print {
            @page {
                size: A4;
                margin: 12mm;
            }
            
            body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
                color: black !important;
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
                width: 100% !important;
            }
            
            .invoice-document {
                padding: 0 !important;
                background: white !important;
                width: 100% !important;
                max-width: none !important;
            }
            
            .invoice-header {
                margin-bottom: 15px !important;
                page-break-inside: avoid;
            }
            
            .invoice-header h2 {
                font-size: 18px !important;
            }
            
            .company-details p {
                font-size: 10px !important;
                margin: 1px 0 !important;
            }
            
            .invoice-dates p {
                font-size: 10px !important;
                margin: 2px 0 !important;
            }
            
            .client-service-section {
                margin-bottom: 15px !important;
                page-break-inside: avoid;
            }
            
            .info-box {
                padding: 12px !important;
                margin-bottom: 10px !important;
            }
            
            .info-box h4 {
                font-size: 12px !important;
                margin-bottom: 8px !important;
            }
            
            .client-details p, .service-details p {
                font-size: 10px !important;
                margin: 4px 0 !important;
            }
            
            .invoice-table {
                margin: 12px 0 !important;
                page-break-inside: avoid;
                font-size: 10px !important;
            }
            
            .invoice-table th {
                padding: 6px 4px !important;
                font-size: 9px !important;
                font-weight: bold !important;
            }
            
            .invoice-table td {
                padding: 6px 4px !important;
                font-size: 10px !important;
            }
            
            .invoice-totals {
                margin-top: 12px !important;
                page-break-inside: avoid;
            }
            
            .total-final {
                padding: 10px !important;
                font-size: 14px !important;
            }
            
            .payment-info-section {
                margin: 12px 0 !important;
                page-break-inside: avoid;
                background: #f0f8f0 !important;
                border-left: 3px solid #28a745 !important;
                padding: 12px !important;
            }
            
            .payment-info-section h4 {
                font-size: 12px !important;
                margin-bottom: 8px !important;
            }
            
            .payment-row {
                padding: 4px 0 !important;
                font-size: 10px !important;
            }
            
            .invoice-footer {
                margin-top: 15px !important;
                page-break-inside: avoid;
                font-size: 9px !important;
            }
            
            .invoice-footer p {
                margin: 3px 0 !important;
            }
            
            /* Assurer que tous les éléments sont visibles à l'impression */
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .invoice-table thead {
                background: #1e3a8a !important;
                color: white !important;
            }
            
            .info-box {
                background: #f8f9fa !important;
                border-left: 3px solid #0A0F2C !important;
            }
            
            .company-logo-img {
                max-width: 50px !important;
                max-height: 50px !important;
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
                        <p><strong>Date:</strong> <span id="invoice-date">${invoiceDate}</span></p>
                        <p><strong>Date de validité:</strong> <span id="validity-date">${validityDate}</span></p>
                        <p><strong>Heure:</strong> <span id="invoice-time">${invoiceTime}</span></p>
                    </div>
                </div>
            </div>
            
            <!-- Section client et prestation -->
            <div class="client-service-section">
                <div class="info-box">
                    <h4>📋 Informations Client</h4>
                    <div class="client-details" id="client-details">
                        <p><strong id="client-name">${clientName}</strong></p>
                        <p id="client-email">${clientEmail}</p>
                        <p id="client-phone">${clientPhone}</p>
                    </div>
                </div>
                
                <div class="info-box">
                    <h4>🎯 Prestation Demandée</h4>
                    <div class="service-details" id="service-details">
                        <p><strong id="service-name">${clientService}</strong></p>
                        <p><strong>Délai:</strong> <span id="service-delay">${deliveryText}</span></p>
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
                        <td>→ <span id="item-description">${clientService}</span></td>
                        <td id="item-date">${invoiceDate}</td>
                        <td>1,00</td>
                        <td>pcs</td>
                        <td id="item-unit-price">${formattedPrice}</td>
                        <td id="item-total">${formattedPrice}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Total -->
            <div class="invoice-totals">
                <div class="total-final">
                    <div class="total-row">
                        <span><strong>Total TTC</strong></span>
                        <span><strong id="final-total">${formattedPrice}</strong></span>
                    </div>
                </div>
            </div>
            
            <!-- Informations de paiement -->
            <div class="payment-info-section">
                <h4>💳 Informations de Paiement</h4>
                <div class="payment-details">
                    <div class="payment-row">
                        <span class="payment-label">Méthode de paiement:</span>
                        <span class="payment-value" id="payment-method">${clientPayment}</span>
                    </div>
                    <div class="payment-row">
                        <span class="payment-label">Statut:</span>
                        <span class="payment-value status-paid" id="payment-status">✅ Payé le ${invoiceDate} à ${invoiceTime}</span>
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
                console.log('📦 Données reçues:', data);
                
                // Si les données sont déjà un objet (cas des données directes)
                let decodedData = data;
                
                // Si c'est une string, essayer de la décoder
                if (typeof data === 'string') {
                    try {
                        const urlDecoded = decodeURIComponent(data);
                        const base64Decoded = atob(urlDecoded);
                        decodedData = JSON.parse(base64Decoded);
                        console.log('✅ Décodage string réussi');
                    } catch (e) {
                        console.log('⚠️ Impossible de décoder la string, utilisation directe');
                        return false;
                    }
                }
                
                console.log('📊 Données à traiter:', decodedData);
                
                // Extraire les données de commande
                let orderData;
                if (decodedData.orderData) {
                    orderData = decodedData.orderData;
                } else {
                    // Les données sont directement dans l'objet principal
                    orderData = decodedData;
                }
                
                console.log('👤 Données client extraites:', orderData);
                
                // Normaliser les données (avec valeurs par défaut seulement si vraiment vides)
                const normalizedData = {
                    name: orderData.name || 'Nom du client',
                    email: orderData.email || 'email@client.com',
                    phone: orderData.phone || '+228 XX XX XX XX',
                    serviceLabel: orderData.serviceLabel || 'Service demandé',
                    finalPrice: orderData.finalPrice || 0,
                    basePrice: orderData.basePrice || orderData.finalPrice || 0,
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
                
                // Mise à jour des informations client
                console.log('🔄 Mise à jour des éléments HTML...');
                
                const clientNameEl = document.getElementById('client-name');
                const clientEmailEl = document.getElementById('client-email');
                const clientPhoneEl = document.getElementById('client-phone');
                
                console.log('📋 Éléments trouvés:', {
                    clientName: !!clientNameEl,
                    clientEmail: !!clientEmailEl,
                    clientPhone: !!clientPhoneEl
                });
                
                if (clientNameEl) {
                    clientNameEl.textContent = normalizedData.name;
                    console.log('✅ Nom client mis à jour:', normalizedData.name);
                    console.log('📝 Contenu élément nom:', clientNameEl.textContent);
                } else {
                    console.error('❌ Élément client-name non trouvé !');
                }
                
                if (clientEmailEl) {
                    clientEmailEl.textContent = normalizedData.email;
                    console.log('✅ Email client mis à jour:', normalizedData.email);
                } else {
                    console.error('❌ Élément client-email non trouvé !');
                }
                
                if (clientPhoneEl) {
                    clientPhoneEl.textContent = normalizedData.phone;
                    console.log('✅ Téléphone client mis à jour:', normalizedData.phone);
                } else {
                    console.error('❌ Élément client-phone non trouvé !');
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
        
        // Fonction pour télécharger la facture en PDF
        async function downloadInvoice() {
            console.log('🔥 Téléchargement PDF demandé');
            
            const statusMessage = document.getElementById('status-message');
            const downloadBtn = document.getElementById('download-btn');
            
            // Désactiver le bouton pendant le traitement
            if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.textContent = '⏳ Génération PDF...';
            }
            
            // Afficher un message de statut
            if (statusMessage) {
                statusMessage.innerHTML = '<span style="color: #ffc107;">📄 Génération du PDF format A4...</span>';
            }
            
            try {
                // Charger jsPDF dynamiquement si pas déjà chargé
                if (!window.jspdf) {
                    console.log('📦 Chargement de jsPDF...');
                    await loadJsPDF();
                }
                
                if (!window.jspdf) {
                    throw new Error('Impossible de charger jsPDF');
                }
                
                const { jsPDF } = window.jspdf;
                
                // Créer le PDF A4 avec du contenu textuel optimisé
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });
                
                // Données de la facture depuis les éléments HTML
                const invoiceNumber = document.getElementById('invoice-number')?.textContent || 'FACTURE';
                const clientName = document.getElementById('client-name')?.textContent || '${clientName}';
                const clientEmail = document.getElementById('client-email')?.textContent || '${clientEmail}';
                const clientPhone = document.getElementById('client-phone')?.textContent || '${clientPhone}';
                const serviceName = document.getElementById('service-name')?.textContent || '${clientService}';
                const serviceDelay = document.getElementById('service-delay')?.textContent || 'Standard';
                const finalTotal = document.getElementById('final-total')?.textContent || '${formattedPrice}';
                const paymentMethod = document.getElementById('payment-method')?.textContent || '${clientPayment}';
                const invoiceDate = document.getElementById('invoice-date')?.textContent || '${invoiceDate}';
                const validityDate = document.getElementById('validity-date')?.textContent || '${validityDate}';
                const invoiceTime = document.getElementById('invoice-time')?.textContent || '${invoiceTime}';
                
                // Dimensions A4 et marges
                const pageWidth = 210;
                const pageHeight = 297;
                const margin = 15;
                const contentWidth = pageWidth - (margin * 2);
                
                // Position Y courante
                let currentY = margin;
                
                // Couleurs
                const primaryColor = [10, 15, 44]; // #0A0F2C
                const secondaryColor = [40, 167, 69]; // #28a745
                const textColor = [51, 51, 51]; // #333333
                const grayColor = [102, 102, 102]; // #666666
                
                // Fonction pour ajouter du texte avec retour à la ligne automatique
                function addText(text, x, y, options = {}) {
                    const fontSize = options.fontSize || 10;
                    const maxWidth = options.maxWidth || contentWidth;
                    const lineHeight = options.lineHeight || fontSize * 0.4;
                    
                    pdf.setFontSize(fontSize);
                    if (options.color) pdf.setTextColor(...options.color);
                    if (options.style) pdf.setFont('helvetica', options.style);
                    
                    const lines = pdf.splitTextToSize(text, maxWidth);
                    pdf.text(lines, x, y);
                    
                    return y + (lines.length * lineHeight);
                }
                
                // En-tête de la facture
                pdf.setFillColor(...primaryColor);
                pdf.rect(0, 0, pageWidth, 25, 'F');
                
                // Logo et nom de l'entreprise (en blanc sur fond bleu)
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(20);
                pdf.setFont('helvetica', 'bold');
                pdf.text('ENIXIS CORP', margin, 15);
                
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.text('Solutions IA & Optimisation Business', margin, 20);
                
                // Numéro de facture (à droite)
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                const invoiceText = invoiceNumber;
                const invoiceWidth = pdf.getTextWidth(invoiceText);
                pdf.text(invoiceText, pageWidth - margin - invoiceWidth, 15);
                
                currentY = 35;
                
                // Informations de l'entreprise
                pdf.setTextColor(...textColor);
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                
                currentY = addText('ENIXIS CORP', margin, currentY, { fontSize: 12, style: 'bold', color: primaryColor });
                currentY = addText('Email: contacteccorp@gmail.com', margin, currentY + 2);
                currentY = addText('Téléphone: +228 97 57 23 46', margin, currentY + 2);
                currentY = addText('Site web: https://enixis-corp.vercel.app', margin, currentY + 2);
                
                // Dates (à droite)
                const dateX = pageWidth - margin - 60;
                let dateY = 35;
                dateY = addText(\`Date: \${invoiceDate}\`, dateX, dateY, { fontSize: 9 });
                dateY = addText(\`Validité: \${validityDate}\`, dateX, dateY + 2, { fontSize: 9 });
                dateY = addText(\`Heure: \${invoiceTime}\`, dateX, dateY + 2, { fontSize: 9 });
                
                currentY += 15;
                
                // Ligne de séparation
                pdf.setDrawColor(...grayColor);
                pdf.line(margin, currentY, pageWidth - margin, currentY);
                currentY += 10;
                
                // Section client et service (deux colonnes)
                const colWidth = (contentWidth - 10) / 2;
                
                // Informations client
                pdf.setFillColor(248, 249, 250);
                pdf.rect(margin, currentY, colWidth, 35, 'F');
                pdf.setDrawColor(...primaryColor);
                pdf.rect(margin, currentY, colWidth, 35);
                
                let clientY = currentY + 5;
                clientY = addText('📋 INFORMATIONS CLIENT', margin + 5, clientY, { fontSize: 11, style: 'bold', color: primaryColor });
                clientY = addText(\`Nom: \${clientName}\`, margin + 5, clientY + 5, { fontSize: 10 });
                clientY = addText(\`Email: \${clientEmail}\`, margin + 5, clientY + 3, { fontSize: 10 });
                clientY = addText(\`Téléphone: \${clientPhone}\`, margin + 5, clientY + 3, { fontSize: 10 });
                
                // Informations service
                const serviceX = margin + colWidth + 10;
                pdf.setFillColor(248, 249, 250);
                pdf.rect(serviceX, currentY, colWidth, 35, 'F');
                pdf.setDrawColor(...primaryColor);
                pdf.rect(serviceX, currentY, colWidth, 35);
                
                let serviceY = currentY + 5;
                serviceY = addText('🎯 PRESTATION DEMANDÉE', serviceX + 5, serviceY, { fontSize: 11, style: 'bold', color: primaryColor });
                serviceY = addText(\`Service: \${serviceName}\`, serviceX + 5, serviceY + 5, { fontSize: 10, maxWidth: colWidth - 10 });
                serviceY = addText(\`Délai: \${serviceDelay}\`, serviceX + 5, serviceY + 3, { fontSize: 10 });
                
                currentY += 45;
                
                // Tableau des prestations
                const tableY = currentY;
                const rowHeight = 8;
                const colWidths = [60, 25, 15, 15, 35, 35]; // Largeurs des colonnes
                const headers = ['DESCRIPTION', 'DATE', 'QTÉ', 'UNITÉ', 'PRIX UNITAIRE', 'MONTANT'];
                
                // En-tête du tableau
                pdf.setFillColor(30, 58, 138);
                pdf.rect(margin, tableY, contentWidth, rowHeight, 'F');
                
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                
                let colX = margin;
                headers.forEach((header, i) => {
                    pdf.text(header, colX + 2, tableY + 5.5);
                    colX += colWidths[i];
                });
                
                // Ligne de données
                const dataY = tableY + rowHeight;
                pdf.setFillColor(255, 255, 255);
                pdf.rect(margin, dataY, contentWidth, rowHeight, 'F');
                pdf.setDrawColor(...grayColor);
                pdf.rect(margin, dataY, contentWidth, rowHeight);
                
                pdf.setTextColor(...textColor);
                pdf.setFont('helvetica', 'normal');
                
                const rowData = [
                    \`→ \${serviceName}\`,
                    invoiceDate,
                    '1,00',
                    'pcs',
                    finalTotal,
                    finalTotal
                ];
                
                colX = margin;
                rowData.forEach((data, i) => {
                    const maxColWidth = colWidths[i] - 4;
                    const lines = pdf.splitTextToSize(data, maxColWidth);
                    pdf.text(lines, colX + 2, dataY + 5.5);
                    colX += colWidths[i];
                });
                
                currentY = dataY + rowHeight + 10;
                
                // Section totaux
                const totalX = pageWidth - margin - 80;
                
                // Total final
                pdf.setFillColor(...secondaryColor);
                pdf.rect(totalX - 5, currentY + 2, 85, 12, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFont('helvetica', 'bold');
                currentY = addText(\`TOTAL TTC: \${finalTotal}\`, totalX, currentY + 9, { fontSize: 12, color: [255, 255, 255] });
                
                currentY += 20;
                
                // Informations de paiement
                pdf.setFillColor(232, 245, 232);
                pdf.rect(margin, currentY, contentWidth, 25, 'F');
                pdf.setDrawColor(...secondaryColor);
                pdf.rect(margin, currentY, contentWidth, 25);
                
                pdf.setTextColor(...textColor);
                pdf.setFont('helvetica', 'bold');
                currentY = addText('💳 INFORMATIONS DE PAIEMENT', margin + 5, currentY + 7, { fontSize: 11, color: secondaryColor });
                
                pdf.setFont('helvetica', 'normal');
                currentY = addText(\`Méthode: \${paymentMethod}\`, margin + 5, currentY + 5, { fontSize: 10 });
                currentY = addText(\`Statut: ✅ Payé le \${invoiceDate} à \${invoiceTime}\`, margin + 5, currentY + 3, { fontSize: 10, color: secondaryColor });
                currentY = addText('Transaction: 🔒 Sécurisée et validée', margin + 5, currentY + 3, { fontSize: 10 });
                
                currentY += 30;
                
                // Footer
                pdf.setTextColor(...grayColor);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                
                currentY = addText('🎉 Merci pour votre commande !', margin, currentY, { fontSize: 11, style: 'bold', color: secondaryColor });
                currentY = addText('Cette facture a été générée automatiquement. Nous commencerons le travail selon le délai convenu.', margin, currentY + 5, { fontSize: 9 });
                currentY = addText('Contact: contacteccorp@gmail.com | +228 97 57 23 46', margin, currentY + 5, { fontSize: 9 });
                currentY = addText('✨ N\'hésitez pas à explorer nos autres services sur notre site !', margin, currentY + 5, { fontSize: 9, color: secondaryColor });
                
                // Métadonnées du PDF
                pdf.setProperties({
                    title: \`\${invoiceNumber} - Enixis Corp\`,
                    subject: 'Facture Enixis Corp - Solutions IA & Optimisation Business',
                    author: 'Enixis Corp',
                    creator: 'Enixis Corp - Solutions IA & Optimisation Business',
                    producer: 'Enixis Corp PDF Generator',
                    keywords: \`facture, enixis corp, ia, optimisation, business, \${serviceName}\`
                });
                
                // Téléchargement automatique avec nom de fichier optimisé
                const fileName = \`\${invoiceNumber.replace(/\\s+/g, '_')}_EnixisCorp.pdf\`;
                pdf.save(fileName);
                
                console.log(\`✅ PDF A4 textuel téléchargé avec succès: \${fileName}\`);
                
                // Message de succès
                if (statusMessage) {
                    statusMessage.innerHTML = '<span style="color: #28a745;">✅ PDF téléchargé avec succès ! Format A4 optimisé pour impression</span>';
                }
                
                if (downloadBtn) {
                    downloadBtn.textContent = '✅ PDF Téléchargé !';
                    downloadBtn.style.background = '#28a745';
                }
                
                // Restaurer le bouton après 3 secondes
                setTimeout(() => {
                    if (downloadBtn) {
                        downloadBtn.disabled = false;
                        downloadBtn.textContent = '📥 Télécharger PDF';
                        downloadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                    }
                }, 3000);
                
            } catch (error) {
                console.error('❌ Erreur génération PDF:', error);
                
                if (statusMessage) {
                    statusMessage.innerHTML = \`<span style="color: #dc3545;">❌ Erreur: \${error.message}</span>\`;
                }
                
                if (downloadBtn) {
                    downloadBtn.textContent = '❌ Erreur - Réessayer';
                    downloadBtn.style.background = '#dc3545';
                    downloadBtn.disabled = false;
                }
                
                // Restaurer le bouton après 3 secondes
                setTimeout(() => {
                    if (downloadBtn) {
                        downloadBtn.textContent = '📥 Télécharger PDF';
                        downloadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                    }
                }, 3000);
            }
        }
        
        // Fonction pour charger jsPDF dynamiquement
        function loadJsPDF() {
            return new Promise((resolve, reject) => {
                if (window.jspdf) {
                    resolve();
                    return;
                }
                
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = () => {
                    console.log('✅ jsPDF chargé avec succès');
                    resolve();
                };
                script.onerror = () => {
                    console.error('❌ Erreur chargement jsPDF');
                    reject(new Error('Impossible de charger jsPDF'));
                };
                document.head.appendChild(script);
            });
        }
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
        
        // Initialisation simple
        window.addEventListener('load', function() {
            console.log('✅ Facture chargée avec les données:', {
                nom: '${clientName}',
                email: '${clientEmail}',
                service: '${clientService}',
                prix: '${formattedPrice}'
            });
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