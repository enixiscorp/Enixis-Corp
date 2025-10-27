// Vercel Function pour gérer les webhooks Slack
const crypto = require('crypto');

// Configuration
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

export default async function handler(req, res) {
  // Configurer CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Slack-Signature, X-Slack-Request-Timestamp');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📨 Webhook Slack reçu');
    
    // Vérifier la signature Slack
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    const body = JSON.stringify(req.body);
    
    if (!verifySlackSignature(body, signature, timestamp)) {
      console.error('❌ Signature Slack invalide');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parser le payload
    let payload;
    if (req.body.payload) {
      payload = JSON.parse(req.body.payload);
    } else {
      payload = req.body;
    }
    
    console.log('🔔 Type d\'interaction:', payload.type);
    console.log('🔔 Action:', payload.actions?.[0]?.name);

    // Gérer les interactions de boutons
    if (payload.type === 'interactive_message' || payload.type === 'block_actions') {
      const result = await handleButtonInteraction(payload);
      return res.status(200).json(result);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Erreur webhook Slack:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Gérer les interactions de boutons
async function handleButtonInteraction(payload) {
  const action = payload.actions[0];
  const originalMessage = payload.original_message || payload.message;
  
  console.log('🔄 Traitement action:', action.name, 'pour:', action.value);

  let updatedMessage = JSON.parse(JSON.stringify(originalMessage));
  
  switch (action.name) {
    case 'confirm_payment':
      updatedMessage = updatePaymentButton(updatedMessage, action.value);
      break;
      
    case 'finalize_order':
      updatedMessage = updateOrderButton(updatedMessage, action.value);
      break;
      
    default:
      console.log('⚠️ Action non reconnue:', action.name);
      return { replace_original: false };
  }

  console.log('✅ Message mis à jour');
  return {
    replace_original: true,
    ...updatedMessage
  };
}

// Mettre à jour le bouton de paiement
function updatePaymentButton(message, invoiceNumber) {
  console.log('💳 Mise à jour bouton paiement pour:', invoiceNumber);
  
  if (message.attachments && message.attachments[0] && message.attachments[0].actions) {
    message.attachments[0].actions = message.attachments[0].actions.map(action => {
      if (action.name === 'confirm_payment') {
        return {
          ...action,
          text: '✅ PAIEMENT CONFIRMÉ',
          style: 'primary',
          name: 'payment_confirmed'
        };
      }
      return action;
    });
    
    // Mettre à jour le statut dans les fields
    if (message.attachments[0].fields) {
      message.attachments[0].fields = message.attachments[0].fields.map(field => {
        if (field.title === 'Status Actuel') {
          return {
            ...field,
            value: '✅ Paiement confirmé - Commande en traitement'
          };
        }
        return field;
      });
    }
    
    // Changer la couleur
    message.attachments[0].color = 'good';
  }
  
  return message;
}

// Mettre à jour le bouton de commande
function updateOrderButton(message, invoiceNumber) {
  console.log('📦 Mise à jour bouton commande pour:', invoiceNumber);
  
  if (message.attachments && message.attachments[0] && message.attachments[0].actions) {
    message.attachments[0].actions = message.attachments[0].actions.map(action => {
      if (action.name === 'finalize_order') {
        return {
          ...action,
          text: '✅ COMMANDE FINALISÉE',
          style: 'primary',
          name: 'order_finalized'
        };
      }
      return action;
    });
    
    // Mettre à jour le statut dans les fields
    if (message.attachments[0].fields) {
      message.attachments[0].fields = message.attachments[0].fields.map(field => {
        if (field.title === 'Status Actuel') {
          return {
            ...field,
            value: '🎉 Commande finalisée et livrée avec succès'
          };
        }
        return field;
      });
    }
    
    // Vérifier si les deux boutons sont confirmés
    const paymentConfirmed = message.attachments[0].actions.some(a => a.name === 'payment_confirmed');
    const orderFinalized = message.attachments[0].actions.some(a => a.name === 'order_finalized');
    
    if (paymentConfirmed && orderFinalized) {
      message.attachments[0].title = `🎉 COMMANDE TERMINÉE - ${invoiceNumber}`;
      message.attachments[0].color = 'good';
    }
  }
  
  return message;
}

// Vérifier la signature Slack
function verifySlackSignature(body, signature, timestamp) {
  if (!SLACK_SIGNING_SECRET) {
    console.warn('⚠️ SLACK_SIGNING_SECRET non configuré - signature non vérifiée');
    return true; // En développement, on peut ignorer la vérification
  }
  
  try {
    // Vérifier l'âge de la requête (max 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > 300) {
      console.error('❌ Requête trop ancienne');
      return false;
    }
    
    // Créer la signature
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
  } catch (error) {
    console.error('❌ Erreur vérification signature:', error);
    return false;
  }
}