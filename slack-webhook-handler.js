// Gestionnaire de webhook Slack pour les boutons interactifs
// Ce fichier doit être déployé sur un serveur (Vercel Functions, Netlify Functions, etc.)

// Configuration Slack
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN; // Token du bot Slack
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET; // Secret de signature

// Fonction principale pour gérer les interactions Slack
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vérifier la signature Slack (sécurité)
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    
    // Valider la signature (code de validation à implémenter)
    if (!verifySlackSignature(req.body, signature, timestamp)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parser le payload Slack
    const payload = JSON.parse(req.body.payload);
    
    // Gérer les différents types d'actions
    if (payload.type === 'interactive_message') {
      await handleButtonClick(payload);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Erreur webhook Slack:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Fonction pour gérer les clics sur les boutons
async function handleButtonClick(payload) {
  const action = payload.actions[0];
  const originalMessage = payload.original_message;
  const responseUrl = payload.response_url;
  
  console.log('🔔 Clic sur bouton Slack:', action.name, action.value);

  let updatedMessage = { ...originalMessage };
  
  switch (action.name) {
    case 'confirm_payment':
      updatedMessage = updatePaymentStatus(originalMessage, action.value);
      break;
      
    case 'finalize_order':
      updatedMessage = updateOrderStatus(originalMessage, action.value);
      break;
      
    default:
      console.log('Action non reconnue:', action.name);
      return;
  }

  // Mettre à jour le message original dans Slack
  await updateSlackMessage(responseUrl, updatedMessage);
}

// Fonction pour mettre à jour le statut de paiement
function updatePaymentStatus(originalMessage, invoiceNumber) {
  const updatedMessage = { ...originalMessage };
  
  // Mettre à jour les boutons dans les attachments
  if (updatedMessage.attachments && updatedMessage.attachments[0]) {
    const attachment = updatedMessage.attachments[0];
    
    if (attachment.actions) {
      attachment.actions = attachment.actions.map(action => {
        if (action.name === 'confirm_payment') {
          return {
            ...action,
            text: '✅ PAIEMENT CONFIRMÉ',
            style: 'primary', // Vert
            name: 'payment_confirmed',
            value: invoiceNumber
          };
        }
        return action;
      });
    }
    
    // Mettre à jour le champ de statut
    if (attachment.fields) {
      attachment.fields = attachment.fields.map(field => {
        if (field.title === 'Status Actuel') {
          return {
            ...field,
            value: '✅ Paiement confirmé - En cours de traitement'
          };
        }
        return field;
      });
    }
    
    // Changer la couleur de l'attachment
    attachment.color = 'good';
  }
  
  return updatedMessage;
}

// Fonction pour mettre à jour le statut de commande
function updateOrderStatus(originalMessage, invoiceNumber) {
  const updatedMessage = { ...originalMessage };
  
  // Mettre à jour les boutons dans les attachments
  if (updatedMessage.attachments && updatedMessage.attachments[0]) {
    const attachment = updatedMessage.attachments[0];
    
    if (attachment.actions) {
      attachment.actions = attachment.actions.map(action => {
        if (action.name === 'finalize_order') {
          return {
            ...action,
            text: '✅ COMMANDE FINALISÉE',
            style: 'primary', // Vert
            name: 'order_finalized',
            value: invoiceNumber
          };
        }
        return action;
      });
    }
    
    // Mettre à jour le champ de statut
    if (attachment.fields) {
      attachment.fields = attachment.fields.map(field => {
        if (field.title === 'Status Actuel') {
          return {
            ...field,
            value: '🎉 Commande finalisée et livrée'
          };
        }
        return field;
      });
    }
    
    // Changer la couleur de l'attachment
    attachment.color = 'good';
    
    // Mettre à jour le titre si les deux actions sont complétées
    const paymentConfirmed = attachment.actions.some(a => a.name === 'payment_confirmed');
    const orderFinalized = attachment.actions.some(a => a.name === 'order_finalized');
    
    if (paymentConfirmed && orderFinalized) {
      attachment.title = `✅ COMMANDE TERMINÉE - ${invoiceNumber}`;
    }
  }
  
  return updatedMessage;
}

// Fonction pour mettre à jour le message dans Slack
async function updateSlackMessage(responseUrl, updatedMessage) {
  try {
    const response = await fetch(responseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replace_original: true,
        ...updatedMessage
      })
    });
    
    if (response.ok) {
      console.log('✅ Message Slack mis à jour avec succès');
    } else {
      console.error('❌ Erreur mise à jour Slack:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur réseau Slack:', error);
  }
}

// Fonction pour vérifier la signature Slack (sécurité)
function verifySlackSignature(body, signature, timestamp) {
  // Implémentation de la vérification de signature Slack
  // Voir: https://api.slack.com/authentication/verifying-requests-from-slack
  
  const crypto = require('crypto');
  
  // Vérifier que la requête n'est pas trop ancienne (5 minutes max)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    return false;
  }
  
  // Créer la signature de base
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', SLACK_SIGNING_SECRET)
    .update(sigBasestring, 'utf8')
    .digest('hex');
  
  // Comparer les signatures
  return crypto.timingSafeEqual(
    Buffer.from(mySignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}