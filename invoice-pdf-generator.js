// Générateur de PDF pour factures Enixis Corp
// Utilise html2canvas + jsPDF pour capturer le design HTML existant

async function generateInvoicePDFFromHTML(orderData, paymentMethod, invoiceNumber) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🔄 Génération du PDF depuis HTML...');

      // Vérifier que les bibliothèques sont chargées
      if (typeof html2canvas === 'undefined') {
        console.error('❌ html2canvas non chargé');
        reject(new Error('html2canvas non disponible'));
        return;
      }

      if (typeof window.jspdf === 'undefined') {
        console.error('❌ jsPDF non chargé');
        reject(new Error('jsPDF non disponible'));
        return;
      }

      // Calculer les dates
      const currentDate = new Date();
      const invoiceDate = currentDate.toLocaleDateString('fr-FR');
      const invoiceTime = currentDate.toLocaleTimeString('fr-FR');
      
      const validityDate = new Date();
      switch (orderData.delivery) {
        case 'urgent': validityDate.setDate(validityDate.getDate() + 1); break;
        case 'short': validityDate.setDate(validityDate.getDate() + 7); break;
        case 'medium': validityDate.setDate(validityDate.getDate() + 28); break;
        case 'long': validityDate.setMonth(validityDate.getMonth() + 6); break;
        default: validityDate.setDate(validityDate.getDate() + 14);
      }
      const validityDateStr = validityDate.toLocaleDateString('fr-FR');

      // Délai formaté
      const deliveryText = orderData.delivery === 'urgent' ? '🚨 Urgent (24h – tarification double)' : 
                          orderData.delivery === 'short' ? '⏳ Court terme (3 – 7 jours)' : 
                          orderData.delivery === 'medium' ? '📅 Moyen terme (2 – 4 semaines)' : 
                          orderData.delivery === 'long' ? '🕰️ Long terme (1 – 6 mois)' : 'Standard';

      // Créer un conteneur caché pour la facture
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        top: -10000px;
        left: -10000px;
        width: 210mm;
        background: white;
        padding: 0;
        margin: 0;
      `;

      // HTML de la facture avec le design existant
      container.innerHTML = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          padding: 40px;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
        ">
          <!-- Header -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
          ">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="
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
              ">E</div>
              <div>
                <h2 style="color: #0A0F2C; font-size: 24px; margin: 0 0 5px 0;">Enixis Corp</h2>
                <p style="color: #666; font-size: 14px; margin: 2px 0;">contacteccorp@gmail.com</p>
                <p style="color: #666; font-size: 14px; margin: 2px 0;">+228 97 57 23 46</p>
                <p style="color: #666; font-size: 14px; margin: 2px 0;">https://enixis-corp.vercel.app</p>
              </div>
            </div>
            
            <div style="text-align: right;">
              <div style="
                background: linear-gradient(135deg, #dc3545, #c82333);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 10px;
                display: inline-block;
              ">${invoiceNumber}</div>
              <div>
                <p style="color: #666; font-size: 14px; margin: 3px 0;"><strong>Date:</strong> ${invoiceDate}</p>
                <p style="color: #666; font-size: 14px; margin: 3px 0;"><strong>Validité:</strong> ${validityDateStr}</p>
                <p style="color: #666; font-size: 14px; margin: 3px 0;"><strong>Heure:</strong> ${invoiceTime}</p>
              </div>
            </div>
          </div>

          <!-- Client et Service -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div style="
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #0A0F2C;
            ">
              <h4 style="color: #0A0F2C; margin: 0 0 15px 0; font-size: 16px;">📋 Informations Client</h4>
              <p style="margin: 8px 0; color: #333;"><strong style="color: #0A0F2C;">${orderData.name}</strong></p>
              <p style="margin: 8px 0; color: #333;">${orderData.email}</p>
              <p style="margin: 8px 0; color: #333;">${orderData.phone}</p>
            </div>
            
            <div style="
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #0A0F2C;
            ">
              <h4 style="color: #0A0F2C; margin: 0 0 15px 0; font-size: 16px;">🎯 Prestation Demandée</h4>
              <p style="margin: 8px 0; color: #333;"><strong style="color: #0A0F2C;">${orderData.serviceLabel}</strong></p>
              <p style="margin: 8px 0; color: #333;"><strong>Délai:</strong> ${deliveryText}</p>
            </div>
          </div>

          <!-- Tableau -->
          <table style="
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          ">
            <thead style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white;">
              <tr>
                <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px;">DESCRIPTION</th>
                <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px;">DATE</th>
                <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px;">QTÉ</th>
                <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px;">UNITÉ</th>
                <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px;">PRIX UNIT.</th>
                <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px;">MONTANT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 15px 12px; border-bottom: 1px solid #e0e0e0; color: #333;">→ ${orderData.serviceLabel}</td>
                <td style="padding: 15px 12px; border-bottom: 1px solid #e0e0e0; color: #333;">${invoiceDate}</td>
                <td style="padding: 15px 12px; border-bottom: 1px solid #e0e0e0; color: #333;">1,00</td>
                <td style="padding: 15px 12px; border-bottom: 1px solid #e0e0e0; color: #333;">pcs</td>
                <td style="padding: 15px 12px; border-bottom: 1px solid #e0e0e0; color: #333;">${formatFcfa(orderData.basePrice || orderData.finalPrice)}</td>
                <td style="padding: 15px 12px; border-bottom: 1px solid #e0e0e0; color: #333;">${formatFcfa(orderData.finalPrice)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totaux -->
          <div style="margin-top: 30px; text-align: right;">
            ${orderData.coupon ? `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
              <span>Sous-total TTC</span>
              <span>${formatFcfa(orderData.basePrice || orderData.finalPrice)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #dc3545; font-weight: 600;">
              <span>Remise (${orderData.coupon.code} - ${orderData.coupon.percent}%)</span>
              <span>-${formatFcfa((orderData.basePrice || orderData.finalPrice) - orderData.finalPrice)}</span>
            </div>` : ''}
            <div style="
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              font-size: 18px;
              font-weight: bold;
              color: #0A0F2C;
              border: 2px solid #0A0F2C;
              margin-top: 10px;
            ">
              <div style="display: flex; justify-content: space-between;">
                <span><strong>Total TTC</strong></span>
                <span><strong>${formatFcfa(orderData.finalPrice)}</strong></span>
              </div>
            </div>
          </div>

          <!-- Paiement -->
          <div style="
            background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            border-left: 4px solid #28a745;
          ">
            <h4 style="color: #28a745; margin: 0 0 15px 0;">💳 Informations de Paiement</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #666; font-weight: 500;">Méthode de paiement:</span>
                <span style="color: #333; font-weight: 600;">${paymentMethod}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #666; font-weight: 500;">Statut:</span>
                <span style="color: #28a745; font-weight: bold;">✅ Payé le ${invoiceDate} à ${invoiceTime}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #666; font-weight: 500;">Transaction:</span>
                <span style="color: #333; font-weight: 600;">🔒 Sécurisée et validée</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            color: #666;
          ">
            <p style="margin: 8px 0;"><strong>🎉 Merci pour votre commande !</strong></p>
            <p style="margin: 8px 0;">Cette facture a été générée automatiquement et envoyée à notre équipe.</p>
            <p style="margin: 8px 0;">Nous commencerons le travail selon le délai convenu.</p>
            <p style="margin: 8px 0;"><strong>Contact:</strong> contacteccorp@gmail.com | +228 97 57 23 46</p>
            <p style="margin-top: 15px; color: #28a745; font-weight: 600;">
              ✨ N'hésitez pas à explorer nos autres services sur notre site !
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      // Attendre un peu pour que le rendu soit complet
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capturer avec html2canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794, // 210mm en pixels à 96 DPI
        height: 1123 // 297mm en pixels à 96 DPI
      });

      // Créer le PDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Nettoyer
      document.body.removeChild(container);

      // Convertir en base64
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      
      console.log('✅ PDF généré depuis HTML, taille:', pdfBase64.length, 'caractères');
      resolve(pdfBase64);

    } catch (error) {
      console.error('❌ Erreur génération PDF depuis HTML:', error);
      reject(error);
    }
  });
}

// Fonction helper pour formater les montants
function formatFcfa(amount) {
  if (amount === null || amount === undefined || amount === '') return 'Tarif à définir';
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return 'Tarif à définir';
  return `${n.toLocaleString('fr-FR')} F CFA`;
}

// Rendre la fonction accessible globalement
window.generateInvoicePDFFromHTML = generateInvoicePDFFromHTML;
