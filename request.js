// Logique du formulaire de demande + prix dynamique + envoi Slack

// Configuration des services (modifiable facilement)
const SERVICES = {
  cv_creation: {
    label: "✍️ Création de CV sur mesure + Lettre",
    price: 7000
  },
  cv_optimisation: {
    label: "✍️ Optimisation de CV sur mesure",
    price: 3500
  },
  partnership_letters: {
    label: "🤝 Rédaction Demandes Partenariat/Sponsoring",
    price: 10000
  },
  linkedin_branding: {
    label: "🧑‍💼 Personal Branding & LinkedIn",
    price: 15000
  },
  coaching_emploi: {
    label: "🎓 Formation Coaching Emploi",
    price: 15000
  },
  productivity: {
    label: "🚀 Formation Booster la productivité",
    price: 10000
  },
  excel_analytics: {
    label: "📊 Formation Analyse de données via Excel",
    price: 25000
  },
  ai_training: {
    label: "🤖 Formation IA",
    price: 5000
  },
  office_suite: {
    label: "💼 Formation Optimisée Suite Office",
    price: 30000
  },
  marketing_strategy: {
    label: "📈 Optimisation de Procédures Marketing & Stratégie",
    price: 50000
  },
  support_procedures: {
    label: "🛠 Optimisation de Procédures Support Client",
    price: 100000
  },
  project_procedures: {
    label: "🔍 Optimisation de Procédures Projets",
    price: 150000
  },
  erp_ai: {
    label: "🔗 Intégration et Automatisations ERP/IA",
    price: 250000
  },
  simple_sheet: {
    label: "📄 Système Excel ou Google Sheets simple",
    price: 30000
  },
  dashboard_file: {
    label: "📊 Système Fichier automatisé avec tableaux de bord",
    price: 50000
  },
  semi_pro_system: {
    label: "💻 Système semi-professionnel (Web/PC)",
    price: 100000
  },
  custom_app: {
    label: "📱 Système d'Application personnalisée (Web/App)",
    price: 200000
  },
  website_creation: {
    label: "🌐 Création de Site Web",
    price: 80000
  }
};

const formEl = document.getElementById('request-form');
const serviceEl = document.getElementById('service');
const priceBox = document.getElementById('price-box');
const noteEl = document.getElementById('request-note');
const deliveryTimeEl = document.getElementById('delivery_time');

// Promo elements
const hasPromoEl = document.getElementById('has_promo');
const promoBlock = document.getElementById('promo_block');
const promoCodeEl = document.getElementById('promo_code');
const applyPromoBtn = document.getElementById('apply_promo_btn');
const removePromoBtn = document.getElementById('remove_promo_btn');

const hasIssueEl = document.getElementById('has_issue');
const issueBlock = document.getElementById('issue_block');
const issueTypeEl = document.getElementById('issue_type');
const issueDetailsRow = document.getElementById('issue_details_row');
const issueDetailsEl = document.getElementById('issue_details');
const budgetRow = document.getElementById('budget_row');
const budgetAmountEl = document.getElementById('budget_amount');

// Envoi Slack direct via webhook (depuis variables d'environnement)

function getSlackWebhookUrl() {
  const fromEnv = (window.env && window.env.SLACK_WEBHOOK_URL) ? String(window.env.SLACK_WEBHOOK_URL) : '';
  return fromEnv.trim();
}



function formatFcfa(amount) {
  if (amount === null || amount === undefined || amount === '') return 'Tarif à définir';
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return 'Tarif à définir';
  return `${n.toLocaleString('fr-FR')} F CFA`;
}

// Gestion promo
const ACTIVE_COUPONS = {
  'ENX_RUTH_12': { percent: 14.3, label: 'Réduction 14,3% (6 mois)' },
  'ENX_MARTIN_11': { percent: 14.3, label: 'Réduction 14,3% (6 mois)' }
};

let appliedCoupon = null; // { code, percent }

function computeDiscountedPrice(basePrice) {
  if (!appliedCoupon) return basePrice;
  const pct = appliedCoupon.percent / 100;
  const discounted = Math.round(basePrice * (1 - pct));
  return Math.max(0, discounted);
}

function computeDeliveryAdjustedPrice(price) {
  if (!deliveryTimeEl) return price;
  const val = deliveryTimeEl.value;
  // Urgent double
  if (val === 'urgent') return price * 2;
  return price;
}

function serviceLabel(value) {
  const service = SERVICES[value];
  return service ? service.label : value;
}

function updatePrice() {
  const serviceValue = serviceEl.value;
  if (!serviceValue) { priceBox.textContent = '—'; return; }
  const service = SERVICES[serviceValue];
  const base = service ? service.price : null;
  if (base === null) { priceBox.textContent = '—'; return; }
  const discounted = computeDiscountedPrice(base);
  const isUrgent = deliveryTimeEl?.value === 'urgent';
  const finalPrice = computeDeliveryAdjustedPrice(discounted);

  // Affichages:
  // - Urgent: montrer le prix doublé comme principal, et le prix actuel (remisé) entre parenthèses
  // - Non urgent + promo: montrer le prix remisé comme principal, et le prix de base entre parenthèses
  // - Non urgent sans promo: montrer le prix de base
  if (isUrgent) {
    priceBox.textContent = `${formatFcfa(finalPrice)} (au lieu de ${formatFcfa(discounted)})`;
  } else if (appliedCoupon) {
    priceBox.textContent = `${formatFcfa(discounted)} (au lieu de ${formatFcfa(base)})`;
  } else {
    priceBox.textContent = formatFcfa(base);
  }
}

function toggleIssueBlock() {
  const show = hasIssueEl.checked;
  issueBlock.style.display = show ? '' : 'none';
  if (!show) {
    issueTypeEl.value = '';
    issueDetailsEl.value = '';
    budgetAmountEl.value = '';
    issueDetailsRow.style.display = 'none';
    budgetRow.style.display = 'none';
  }
}

function onIssueTypeChange() {
  const type = issueTypeEl.value;
  // Affichages conditionnels
  if (type === 'montant') {
    budgetRow.style.display = '';
    issueDetailsRow.style.display = 'none';
  } else if (type === 'disponibilite') {
    budgetRow.style.display = 'none';
    issueDetailsRow.style.display = '';
  } else if (type === 'autre') {
    budgetRow.style.display = 'none';
    issueDetailsRow.style.display = '';
  } else {
    budgetRow.style.display = 'none';
    issueDetailsRow.style.display = 'none';
  }
}

// Alert popup helpers (réutilisé pour code invalide)
const alertPopup = document.getElementById('alert-popup');
const alertMsg = document.getElementById('alert-message');
const alertClose = alertPopup ? alertPopup.querySelector('.popup-close') : null;

function showAlert(message) {
  if (!alertPopup) { alert(message); return; }

  // Vérifier si le message contient du HTML
  if (message.includes('<')) {
    alertMsg.innerHTML = message;
  } else {
    alertMsg.textContent = message;
  }

  alertPopup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function hideAlert() {
  if (!alertPopup) return;
  alertPopup.style.display = 'none';
  document.body.style.overflow = '';
}
alertClose?.addEventListener('click', hideAlert);
alertPopup?.addEventListener('click', (e) => { if (e.target === alertPopup) hideAlert(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && alertPopup?.style.display === 'flex') hideAlert(); });

function togglePromoBlock() {
  const show = hasPromoEl?.checked;
  if (!promoBlock) return;
  promoBlock.style.display = show ? '' : 'none';
  if (!show) {
    appliedCoupon = null;
    promoCodeEl.value = '';
    removePromoBtn.style.display = 'none';
    applyPromoBtn.style.display = '';
    updatePrice();
  }
}

function applyCouponFromInput() {
  const code = (promoCodeEl.value || '').trim().toUpperCase();
  const def = ACTIVE_COUPONS[code];
  if (!def) {
    showAlert('Code Promotionnel Ou Coupon Inexistant');
    return;
  }
  appliedCoupon = { code, percent: def.percent };
  removePromoBtn.style.display = '';
  applyPromoBtn.style.display = 'none';
  updatePrice();
}

function removeCoupon() {
  appliedCoupon = null;
  removePromoBtn.style.display = 'none';
  applyPromoBtn.style.display = '';
  updatePrice();
}

async function submitToSlack(payload) {
  // Validation du payload
  if (!payload || !payload.text || typeof payload.text !== 'string') {
    throw new Error('Données invalides pour l\'envoi');
  }

  // Récupérer l'URL du webhook depuis les variables d'environnement
  const webhookUrl = getSlackWebhookUrl();
  console.log('🔍 URL Webhook Slack:', webhookUrl ? 'Configurée' : 'NON CONFIGURÉE');

  if (!webhookUrl) {
    console.warn('⚠️ URL Slack webhook non configurée - simulation d\'envoi');
    console.log('📋 Payload qui aurait été envoyé:', JSON.stringify(payload, null, 2));
    return; // Simuler un envoi réussi pour les tests
  }

  try {
    // Envoi direct vers Slack
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'no-cors',
      keepalive: true
    });
    console.log('✅ Message envoyé vers Slack');
    return;
  } catch (e) {
    // Fallback avec sendBeacon
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const ok = navigator.sendBeacon(webhookUrl, blob);
      if (ok) {
        console.log('✅ Message envoyé vers Slack (beacon)');
        return;
      }
    } catch { }
    throw new Error(`Erreur d'envoi vers Slack: ${e.message}`);
  }
}

function buildSlackText(data) {
  const lines = [
    'Nouvelle demande – Enixis Corp',
    `• Nom: ${data.name}`,
    `• Email: ${data.email}`,
    `• Téléphone: ${data.phone}`,
    `• Prestation: ${serviceLabel(data.service)}`,
    `• Prix indicatif: ${formatFcfa(data.price)}`
  ];
  if (data.delivery) {
    const label = data.delivery === 'urgent' ? 'Urgent (24h – x2)' : data.delivery === 'short' ? 'Court terme (3–7j)' : data.delivery === 'medium' ? 'Moyen terme (2–4 sem.)' : data.delivery === 'long' ? 'Long terme (1–6 mois)' : data.delivery;
    lines.push(`• Délai: ${label}`);
  }
  if (data.details) lines.push(`• Détails: ${data.details}`);
  if (data.issue) {
    lines.push(`• Souci: ${data.issue.type}`);
    if (data.issue.type === 'montant' && data.issue.budget) {
      lines.push(`• Budget proposé: ${formatFcfa(data.issue.budget)}`);
    }
    if (data.issue.explain) lines.push(`• Explication: ${data.issue.explain}`);
  }
  return lines.join('\n');
}

// Validation en temps réel
function validateField(field) {
  const value = field.value.trim();
  let isValid = true;
  let message = '';

  switch (field.id) {
    case 'client_name':
      isValid = value.length >= 2;
      message = isValid ? '' : 'Le nom doit contenir au moins 2 caractères';
      break;
    case 'client_email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(value);
      message = isValid ? '' : 'Format d\'email invalide';
      break;
    case 'client_phone':
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
      isValid = phoneRegex.test(value);
      message = isValid ? '' : 'Format de téléphone invalide';
      break;
  }

  // Affichage visuel de la validation
  field.style.borderColor = isValid ? '#28a745' : '#dc3545';

  // Affichage du message d'erreur
  let errorEl = field.parentNode.querySelector('.field-error');
  if (!errorEl) {
    errorEl = document.createElement('small');
    errorEl.className = 'field-error';
    errorEl.style.color = '#dc3545';
    errorEl.style.fontSize = '0.8rem';
    field.parentNode.appendChild(errorEl);
  }
  errorEl.textContent = message;

  return isValid;
}

formEl?.addEventListener('change', (e) => {
  if (e.target === serviceEl) updatePrice();

  // Validation en temps réel pour les champs critiques
  if (['client_name', 'client_email', 'client_phone'].includes(e.target.id)) {
    validateField(e.target);
  }
});

formEl?.addEventListener('input', (e) => {
  // Validation pendant la saisie (avec délai)
  if (['client_name', 'client_email', 'client_phone'].includes(e.target.id)) {
    clearTimeout(e.target.validationTimeout);
    e.target.validationTimeout = setTimeout(() => validateField(e.target), 500);
  }
});

hasIssueEl?.addEventListener('change', toggleIssueBlock);
issueTypeEl?.addEventListener('change', onIssueTypeChange);
deliveryTimeEl?.addEventListener('change', updatePrice);
hasPromoEl?.addEventListener('change', togglePromoBlock);
applyPromoBtn?.addEventListener('click', applyCouponFromInput);
removePromoBtn?.addEventListener('click', removeCoupon);

formEl?.addEventListener('submit', async (e) => {
  e.preventDefault();
  noteEl.textContent = '';

  // Validation complète avant soumission
  const name = document.getElementById('client_name').value.trim();
  const email = document.getElementById('client_email').value.trim();
  const phone = document.getElementById('client_phone').value.trim();
  const service = serviceEl.value;

  const details = document.getElementById('additional_details').value.trim();

  // Validation des champs requis avec messages spécifiques
  const validations = [
    { field: name, message: 'Le nom est requis' },
    { field: email, message: 'L\'email est requis' },
    { field: phone, message: 'Le téléphone est requis' },
    { field: service, message: 'Veuillez sélectionner une prestation' },
    { field: details, message: 'Les détails complémentaires sont obligatoires pour personnaliser votre service' }
  ];

  for (const validation of validations) {
    if (!validation.field) {
      noteEl.textContent = validation.message;
      noteEl.style.color = '#dc3545';
      return;
    }
  }

  // Validation des formats
  const nameField = document.getElementById('client_name');
  const emailField = document.getElementById('client_email');
  const phoneField = document.getElementById('client_phone');

  if (!validateField(nameField) || !validateField(emailField) || !validateField(phoneField)) {
    noteEl.textContent = 'Veuillez corriger les erreurs dans le formulaire.';
    noteEl.style.color = '#dc3545';
    return;
  }

  const serviceData = SERVICES[service];
  const basePrice = serviceData ? serviceData.price : '';
  const price = basePrice ? computeDeliveryAdjustedPrice(computeDiscountedPrice(basePrice)) : '';
  const delivery = deliveryTimeEl?.value || '';

  let issue = null;
  if (hasIssueEl.checked) {
    const type = issueTypeEl.value;
    if (!type) {
      noteEl.textContent = 'Merci de préciser la nature de votre souci.';
      return;
    }
    if (type === 'montant') {
      const budget = Number(budgetAmountEl.value || 0);
      if (!budget || budget <= 0) {
        noteEl.textContent = 'Indiquez un budget valide en FCFA.';
        return;
      }
      issue = { type, budget };
    } else {
      const explain = issueDetailsEl.value.trim();
      if (!explain) {
        noteEl.textContent = 'Merci d\'expliquer brièvement votre souci.';
        return;
      }
      issue = { type, explain };
    }
  }

  const slackText = buildSlackText({ name, email, phone, service, price, details, issue, delivery });
  // Afficher le récapitulatif; n'envoyer à Slack qu'après confirmation
  showOrderSummary({
    name, email, phone,
    serviceLabel: serviceLabel(service),
    basePrice,
    finalPrice: price,
    coupon: appliedCoupon,
    details,
    issue,
    delivery
  }, async () => {
    try {
      // Pas de notification Slack ici - seulement les 2 notifications principales lors du paiement
      noteEl.textContent = 'Votre demande a été envoyée. Merci !';
      resetRequestForm();
    } catch {
      noteEl.textContent = "Erreur lors de l'envoi. Veuillez réessayer plus tard.";
    }
  });
});

// Génération automatique des options
function populateServiceOptions() {
  if (!serviceEl) {
    console.error('Element serviceEl not found');
    return;
  }

  // Vider le select
  serviceEl.innerHTML = '';

  // Ajouter l'option par défaut (non sélectionnable)
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Choisissez une prestation…';
  serviceEl.appendChild(defaultOption);

  // Ajouter toutes les options depuis SERVICES
  Object.keys(SERVICES).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = SERVICES[key].label;
    serviceEl.appendChild(option);
  });
}

// Init - Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function () {
  populateServiceOptions();
  updatePrice();
  toggleIssueBlock();
  togglePromoBlock();
});

// Configuration des destinataires de paiement (depuis les variables d'environnement)
const PAYMENT_CONFIG = {
  // Numéros de téléphone pour les paiements mobiles (depuis env.js)
  FLOOZ_PHONE: (window.env && window.env.FLOOZ_PHONE) ? String(window.env.FLOOZ_PHONE) : '',
  MIXX_PHONE: (window.env && window.env.MIXX_PHONE) ? String(window.env.MIXX_PHONE) : '',

  // Adresses crypto TRC-20 (depuis env.js)
  CRYPTO_WALLETS: {
    USDT: (window.env && window.env.USDT_WALLET) ? String(window.env.USDT_WALLET) : '',
    BTC: (window.env && window.env.BTC_WALLET) ? String(window.env.BTC_WALLET) : ''
  }
};

// Order summary popup
const orderPopup = document.getElementById('order-popup');
const orderClose = orderPopup ? orderPopup.querySelector('.popup-close') : null;
const orderSummaryEl = document.getElementById('order-summary');
const paymentBtn = document.getElementById('payment-btn');
const orderCancelBtn = document.getElementById('cancel-order-btn');

// Country selection popup
const countryPopup = document.getElementById('country-popup');
const countryClose = countryPopup ? countryPopup.querySelector('.popup-close') : null;
const countryBtns = document.querySelectorAll('.country-btn');

// Payment options popup
const paymentPopup = document.getElementById('payment-popup');
const paymentClose = paymentPopup ? paymentPopup.querySelector('.popup-close') : null;
const paymentInfo = document.getElementById('payment-info');
const paymentOptions = document.getElementById('payment-options');

// Crypto payment popup
const cryptoPopup = document.getElementById('crypto-popup');
const cryptoClose = cryptoPopup ? cryptoPopup.querySelector('.popup-close') : null;
const cryptoContent = document.getElementById('crypto-content');

let currentOrderData = null;

function currencyPair(base, final) {
  if (final !== undefined && final !== null && final !== '' && final !== base) {
    return `${formatFcfa(final)} (au lieu de ${formatFcfa(base)})`;
  }
  return formatFcfa(base);
}

function showOrderSummary(data, onConfirm) {
  if (!orderPopup) return;

  // Stocker les données de commande pour le paiement
  currentOrderData = { ...data, onConfirm };

  const lines = [];
  lines.push(`<p><strong>Nom:</strong> ${data.name}</p>`);
  lines.push(`<p><strong>Email:</strong> ${data.email}</p>`);
  lines.push(`<p><strong>Téléphone:</strong> ${data.phone}</p>`);
  lines.push(`<p><strong>Prestation:</strong> ${data.serviceLabel}</p>`);
  if (data.delivery) {
    const deliveryLabel = data.delivery === 'urgent' ? '🚨 Urgent (24h – tarification double)' : data.delivery === 'short' ? '⏳ Court terme (3 – 7 jours)' : data.delivery === 'medium' ? '📅 Moyen terme (2 – 4 semaines)' : data.delivery === 'long' ? '🕰️ Long terme (1 – 6 mois)' : data.delivery;
    lines.push(`<p><strong>Délai:</strong> ${deliveryLabel}</p>`);
  }
  if (data.coupon) {
    lines.push(`<p><strong>Code promo:</strong> ${data.coupon.code} (−${data.coupon.percent}% )</p>`);
  }
  lines.push(`<p><strong>Prix:</strong> ${currencyPair(data.basePrice, data.finalPrice)}</p>`);
  if (data.delivery === 'urgent') {
    lines.push(`<p style="color:#c00; font-weight:700;">🚨 Urgent : En raison du délai souhaité le prix de votre prestation doublera. Merci ! 🚨</p>`);
  }
  if (data.details) lines.push(`<p><strong>Détails:</strong> ${data.details}</p>`);
  if (data.issue) {
    lines.push(`<p><strong>Souci:</strong> ${data.issue.type}</p>`);
    if (data.issue.type === 'montant' && data.issue.budget) {
      lines.push(`<p><strong>Budget proposé:</strong> ${formatFcfa(data.issue.budget)}</p>`);
    }
    if (data.issue.explain) lines.push(`<p><strong>Explication:</strong> ${data.issue.explain}</p>`);
  }
  orderSummaryEl.innerHTML = lines.join('');

  // Ajout du message de remerciement
  const thanks = document.createElement('div');
  thanks.innerHTML = `<p style="margin-top:12px;">💬 Merci pour votre commande !<br>Cliquez sur "Payer" pour procéder au paiement sécurisé.</p>`;
  orderSummaryEl.appendChild(thanks);

  orderPopup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function showCountrySelection() {
  hideOrderSummary();
  countryPopup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function hideCountrySelection() {
  countryPopup.style.display = 'none';
  document.body.style.overflow = '';
  // Réinitialiser l'état des listes
  backToMainOptions();
}

function showPaymentOptions(country) {
  hideCountrySelection();

  if (!currentOrderData) return;

  const amount = currentOrderData.finalPrice;
  const amountText = formatFcfa(amount);

  // Envoyer la première notification pour le Togo (informations client et pays)
  if (country === 'togo') {
    const countryLabel = '🇹🇬 Togo';
    sendClientInfoNotification(countryLabel, amount, currentOrderData);
  }

  paymentInfo.innerHTML = `
    <div class="amount-highlight">
      💰 Montant à payer: ${amountText}
    </div>
    <p>Choisissez votre méthode de paiement :</p>
  `;

  let optionsHTML = '';

  if (country === 'togo') {
    // Options pour le Togo : Flooz, Mixx, et Crypto
    optionsHTML = `
      <div class="payment-method" data-method="flooz">
        <img src="images/moov_money_enixis.png" alt="Moov Money" class="payment-logo-img">
        <div class="details">
          <h4>Flooz</h4>
          <p>Paiement mobile via Flooz</p>
        </div>
      </div>
      <div class="payment-method" data-method="mixx">
        <img src="images/mixx_by_yas_enixis.png" alt="Mixx by Yas" class="payment-logo-img">
        <div class="details">
          <h4>Mixx by Yas</h4>
          <p>Paiement mobile via Mixx</p>
        </div>
      </div>
      <div class="payment-method" data-method="crypto">
        <div class="icon">₿</div>
        <div class="details">
          <h4>Cryptomonnaie</h4>
          <p>USDT (TRC-20) ou BTC (BEP-20)</p>
        </div>
      </div>
    `;
  } else {
    // Autres pays : uniquement crypto
    optionsHTML = `
      <div class="payment-method" data-method="crypto">
        <div class="icon">₿</div>
        <div class="details">
          <h4>Cryptomonnaie</h4>
          <p>USDT (TRC-20) ou BTC (BEP-20)</p>
        </div>
      </div>
    `;
  }

  paymentOptions.innerHTML = optionsHTML;

  // Ajouter les event listeners
  document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', () => {
      const methodType = method.getAttribute('data-method');
      handlePaymentMethod(methodType, amount);
    });
  });

  paymentPopup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function hidePaymentOptions() {
  paymentPopup.style.display = 'none';
  document.body.style.overflow = '';
}

function handlePaymentMethod(method, amount) {
  switch (method) {
    case 'flooz':
      handleFloozPayment(amount);
      break;
    case 'mixx':
      handleMixxPayment(amount);
      break;
    case 'crypto':
      showCryptoOptions(amount);
      break;
  }
}

function handleFloozPayment(amount) {
  const recipient = PAYMENT_CONFIG.FLOOZ_PHONE;
  const ussdCode = `*155*1*1*${recipient}*${recipient}*${amount}*1#`;

  hidePaymentOptions();

  const instructions = `
    <div class="payment-instructions">
      <h4>📱 Paiement Flooz</h4>
      <p><strong>Montant:</strong> ${formatFcfa(amount)}</p>
      <p><strong>Destinataire:</strong> ${recipient}</p>
      
      <div class="ussd-code">${ussdCode}</div>
      
      <ol>
        <li>Composez le code USSD ci-dessus sur votre téléphone</li>
        <li>Suivez les instructions à l'écran</li>
        <li>Confirmez le paiement avec votre code PIN</li>
        <li>Vous recevrez un SMS de confirmation</li>
      </ol>
      
      <p style="color: #c00; font-weight: bold;">
        ⚠️ Une fois le paiement effectué, nous recevrons automatiquement une notification.
      </p>
    </div>
  `;

  showAlert(instructions);

  // Pas de notification ici - sera envoyée avec la validation de paiement

  // Ouvrir l'application de téléphone avec le code USSD
  setTimeout(() => {
    window.location.href = `tel:${encodeURIComponent(ussdCode)}`;
  }, 2000);

  // Générer et envoyer la facture avec validation de paiement après 3 secondes
  setTimeout(() => {
    hideAlert();
    generateAndSendInvoiceWithValidation(currentOrderData, 'Flooz');
    // Pas de redirection automatique - attendre le clic utilisateur
  }, 3000);
}

function handleMixxPayment(amount) {
  const recipient = PAYMENT_CONFIG.MIXX_PHONE;
  const ussdCode = `*145*1*${amount}*${recipient}*1#`;

  hidePaymentOptions();

  const instructions = `
    <div class="payment-instructions">
      <h4>💳 Paiement Mixx by Yas</h4>
      <p><strong>Montant:</strong> ${formatFcfa(amount)}</p>
      <p><strong>Destinataire:</strong> ${recipient}</p>
      
      <div class="ussd-code">${ussdCode}</div>
      
      <ol>
        <li>Composez le code USSD ci-dessus sur votre téléphone</li>
        <li>Suivez les instructions à l'écran</li>
        <li>Confirmez le paiement avec votre code PIN</li>
        <li>Vous recevrez un SMS de confirmation</li>
      </ol>
      
      <p style="color: #c00; font-weight: bold;">
        ⚠️ Une fois le paiement effectué, nous recevrons automatiquement une notification.
      </p>
    </div>
  `;

  showAlert(instructions);

  // Pas de notification ici - sera envoyée avec la validation de paiement

  // Ouvrir l'application de téléphone avec le code USSD
  setTimeout(() => {
    window.location.href = `tel:${encodeURIComponent(ussdCode)}`;
  }, 2000);

  // Générer et envoyer la facture avec validation de paiement après 3 secondes
  setTimeout(() => {
    hideAlert();
    generateAndSendInvoiceWithValidation(currentOrderData, 'Mixx by Yas');
    // Pas de redirection automatique - attendre le clic utilisateur
  }, 3000);
}

function showCryptoOptions(amount) {
  hidePaymentOptions();

  const cryptoHTML = `
    <div class="payment-instructions">
      <h4>₿ Paiement Cryptomonnaie</h4>
      <p><strong>Montant:</strong> ${formatFcfa(amount)}</p>
      <p>Choisissez votre cryptomonnaie :</p>
    </div>
    
    <button class="crypto-option usdt" data-crypto="USDT">
      <span>💚</span>
      <div>
        <strong>USDT (TRC-20)</strong><br>
        <small>Tether sur réseau TRON</small>
      </div>
    </button>
    
    <button class="crypto-option btc" data-crypto="BTC">
      <span>₿</span>
      <div>
        <strong>BTC (BEP-20)</strong><br>
        <small>Bitcoin sur réseau Binance Smart Chain</small>
      </div>
    </button>
  `;

  cryptoContent.innerHTML = cryptoHTML;

  // Ajouter les event listeners
  document.querySelectorAll('.crypto-option').forEach(option => {
    option.addEventListener('click', () => {
      const cryptoType = option.getAttribute('data-crypto');
      showCryptoPayment(cryptoType, amount);
    });
  });

  cryptoPopup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function showCryptoPayment(cryptoType, amount) {
  const walletAddress = PAYMENT_CONFIG.CRYPTO_WALLETS[cryptoType];

  if (!walletAddress || walletAddress.trim() === '') {
    showAlert(`❌ Adresse ${cryptoType} non configurée. Veuillez contacter le support.`);
    return;
  }

  const network = cryptoType === 'BTC' ? 'BEP-20' : 'TRC-20';
  const networkName = cryptoType === 'BTC' ? 'Binance Smart Chain' : 'TRON';

  const cryptoHTML = `
    <div class="payment-instructions">
      <h4>₿ Paiement ${cryptoType} (${network})</h4>
      <p><strong>Montant:</strong> ${formatFcfa(amount)}</p>
      
      <div class="wallet-info">
        <h4>📍 Adresse de réception :</h4>
        <div class="wallet-address" id="wallet-address">${walletAddress}</div>
        <button class="copy-btn" onclick="copyWalletAddress()" id="copy-address-btn">📋 Copier l'adresse</button>
      </div>
      
      <ol>
        <li>Ouvrez votre wallet crypto (Trust Wallet, Binance, etc.)</li>
        <li>Sélectionnez ${cryptoType} sur le <strong>réseau ${network}</strong> (${networkName})</li>
        <li>Collez l'adresse ci-dessus comme destinataire</li>
        <li>Entrez le montant équivalent en ${cryptoType}</li>
        <li>Confirmez la transaction</li>
      </ol>
      
      <p style="color: #c00; font-weight: bold;">
        ⚠️ IMPORTANT : Utilisez uniquement le réseau ${network} !<br>
        Une fois l'adresse copiée et le paiement effectué, votre facture sera générée automatiquement.
      </p>
    </div>
  `;

  cryptoContent.innerHTML = cryptoHTML;

  // Variable pour suivre si l'adresse a été copiée
  let addressCopied = false;

  // Attendre que l'utilisateur copie l'adresse avant de générer la facture
  const copyBtn = document.getElementById('copy-address-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      addressCopied = true;

      // Pas de notification ici - sera envoyée avec la validation de paiement

      // Générer et envoyer la facture avec validation de paiement après 3 secondes
      setTimeout(() => {
        hideCryptoPayment();
        generateAndSendInvoiceWithValidation(currentOrderData, `${cryptoType} (${network})`);
        // Pas de redirection automatique - attendre le clic utilisateur
      }, 3000);
    });
  }

  // Fallback : si l'utilisateur n'a pas copié après 30 secondes, générer quand même
  setTimeout(() => {
    if (!addressCopied) {
      // Pas de notification ici - sera envoyée avec la validation de paiement

      hideCryptoPayment();
      generateAndSendInvoiceWithValidation(currentOrderData, `${cryptoType} (${network})`);
      // Pas de redirection automatique - attendre le clic utilisateur
    }
  }, 30000);
}

function hideCryptoPayment() {
  cryptoPopup.style.display = 'none';
  document.body.style.overflow = '';
}

// Fonction pour copier l'adresse wallet
function copyWalletAddress() {
  const addressEl = document.getElementById('wallet-address');
  if (addressEl) {
    navigator.clipboard.writeText(addressEl.textContent).then(() => {
      const copyBtn = document.querySelector('.copy-btn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅ Copié !';
      copyBtn.style.background = '#28a745';
      copyBtn.style.color = 'white';
      copyBtn.style.transform = 'scale(1.05)';

      // Ajouter un message de confirmation
      const confirmationMsg = document.createElement('p');
      confirmationMsg.innerHTML = '✅ <strong>Adresse copiée !</strong> Votre facture sera générée dans quelques secondes.';
      confirmationMsg.style.color = '#28a745';
      confirmationMsg.style.fontWeight = '600';
      confirmationMsg.style.textAlign = 'center';
      confirmationMsg.style.marginTop = '15px';
      confirmationMsg.style.padding = '10px';
      confirmationMsg.style.background = 'rgba(40, 167, 69, 0.1)';
      confirmationMsg.style.borderRadius = '8px';
      confirmationMsg.style.border = '1px solid rgba(40, 167, 69, 0.3)';

      const walletInfo = document.querySelector('.wallet-info');
      if (walletInfo && !walletInfo.querySelector('.copy-confirmation')) {
        confirmationMsg.className = 'copy-confirmation';
        walletInfo.appendChild(confirmationMsg);
      }

      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
        copyBtn.style.color = '';
        copyBtn.style.transform = '';

        // Supprimer le message de confirmation
        const existingMsg = walletInfo?.querySelector('.copy-confirmation');
        if (existingMsg) {
          existingMsg.remove();
        }
      }, 5000);
    }).catch(() => {
      showAlert('Impossible de copier automatiquement. Veuillez sélectionner et copier manuellement.');
    });
  }
}

// Fonction pour envoyer la première notification - Informations client et pays
async function sendClientInfoNotification(country, amount, orderData) {
  const isTogoPayment = country.includes('🇹🇬');
  const paymentContext = isTogoPayment ?
    'Le client peut choisir entre Flooz, Mixx by Yas ou Crypto.' :
    'Le client va procéder au paiement par cryptomonnaie.';

  const slackText = `
📋 NOUVELLE DEMANDE CLIENT - Enixis Corp

🏳️ Pays sélectionné: ${country}
💰 Montant: ${formatFcfa(amount)}

👤 INFORMATIONS CLIENT:
• Nom: ${orderData.name}
• Email: ${orderData.email}
• Téléphone: ${orderData.phone}

📦 DÉTAILS COMMANDE:
• Prestation: ${orderData.serviceLabel}
• Délai: ${orderData.delivery || 'Non spécifié'}
${orderData.details ? `• Détails: ${orderData.details.substring(0, 150)}${orderData.details.length > 150 ? '...' : ''}` : ''}

⏰ ${new Date().toLocaleString('fr-FR')}

🔄 ${paymentContext}
⏳ En attente de validation du paiement...
  `.trim();

  try {
    const payload = {
      text: slackText,
      attachments: [{
        color: '#36a64f',
        title: '📋 Récapitulatif Client',
        fields: [
          {
            title: 'Client',
            value: `${orderData.name}\n${orderData.email}\n${orderData.phone}`,
            short: true
          },
          {
            title: 'Commande',
            value: `${orderData.serviceLabel}\nMontant: ${formatFcfa(amount)}\nDélai: ${orderData.delivery || 'Standard'}`,
            short: true
          },
          {
            title: 'Pays de Paiement',
            value: country,
            short: true
          },
          {
            title: 'Status',
            value: '⏳ En attente de paiement',
            short: true
          }
        ],
        footer: 'Enixis Corp - Nouvelle Demande',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    await submitToSlack(payload);
    console.log('✅ Notification informations client envoyée');
  } catch (error) {
    console.error('❌ Erreur envoi notification client:', error);
  }
}

// Fonction pour envoyer la notification WhatsApp à Slack
async function sendWhatsAppNotification(orderData) {
  const slackText = `
💬 CONTACT WHATSAPP - Enixis Corp

📱 Le client souhaite discuter avant paiement

👤 Client:
• Nom: ${orderData.name}
• Email: ${orderData.email}
• Téléphone: ${orderData.phone}

📦 Commande:
• Prestation: ${orderData.serviceLabel}
• Montant: ${formatFcfa(orderData.finalPrice)}
• Délai: ${orderData.delivery || 'Non spécifié'}

⏰ ${new Date().toLocaleString('fr-FR')}

ℹ️ Le client a été redirigé vers WhatsApp (+228 97 57 23 46)
  `.trim();

  try {
    await submitToSlack({ text: slackText });
    console.log('✅ Notification WhatsApp envoyée');
  } catch (error) {
    console.error('❌ Erreur envoi notification WhatsApp:', error);
  }
}

// Fonction pour envoyer la validation de paiement avec facture PDF
async function sendPaymentValidationWithInvoice(paymentMethod, orderData, invoiceBase64, invoiceNumber) {
  const companyEmail = (window.env && window.env.COMPANY_EMAIL) ? window.env.COMPANY_EMAIL : 'contacteccorp@gmail.com';

  // Afficher les informations sur les codes promotionnels s'ils sont appliqués
  let promoInfo = '';
  if (orderData.coupon) {
    const discountAmount = (orderData.basePrice || orderData.finalPrice) - orderData.finalPrice;
    promoInfo = `\n🎟️ Code promo: ${orderData.coupon.code} (-${orderData.coupon.percent}% = -${formatFcfa(discountAmount)})`;
  }

  const slackText = `
✅ PAIEMENT VALIDÉ - Enixis Corp

💳 Méthode: ${paymentMethod}
💰 Montant: ${formatFcfa(orderData.finalPrice)}${promoInfo}
📄 Facture: ${invoiceNumber}

👤 Client:
• Nom: ${orderData.name}
• Email: ${orderData.email}
• Téléphone: ${orderData.phone}

📦 Commande:
• Prestation: ${orderData.serviceLabel}
• Délai: ${orderData.delivery || 'Non spécifié'}
${orderData.details ? `• Détails: ${orderData.details.substring(0, 120)}${orderData.details.length > 120 ? '...' : ''}` : ''}

⏰ ${new Date().toLocaleString('fr-FR')}

✅ PAIEMENT CONFIRMÉ - Commencez le travail selon le délai convenu.
📎 Facture PDF accessible via le bouton ci-dessous.
📧 Facture également envoyée par email à ${companyEmail}
  `.trim();

  try {
    // Créer le Data URL du PDF pour téléchargement direct
    let invoiceUrl;
    
    if (invoiceBase64) {
      // Si on a le PDF en base64, créer un Data URL
      invoiceUrl = `data:application/pdf;base64,${invoiceBase64}`;
      console.log('✅ PDF Data URL créé, taille:', invoiceBase64.length, 'caractères');
    } else {
      // Fallback: URL vers la page web (ancien système)
      invoiceUrl = `https://enixis-corp.vercel.app/api/invoice?invoice=${invoiceNumber}&name=${encodeURIComponent(orderData.name || '')}&email=${encodeURIComponent(orderData.email || '')}&phone=${encodeURIComponent(orderData.phone || '')}&service=${encodeURIComponent(orderData.serviceLabel || '')}&price=${orderData.finalPrice || 0}&delivery=${orderData.delivery || 'standard'}&payment=${encodeURIComponent(paymentMethod)}`;
      
      if (orderData.coupon) {
        invoiceUrl += `&basePrice=${orderData.basePrice || orderData.finalPrice}&couponCode=${encodeURIComponent(orderData.coupon.code)}&couponPercent=${orderData.coupon.percent}`;
      }
      console.log('⚠️ Fallback: URL page web utilisée');
    }

    const payload = {
      text: slackText,
      attachments: [
        {
          color: 'good',
          title: `✅ PAIEMENT VALIDÉ - ${invoiceNumber}`,
          text: invoiceBase64 ? 
            `📄 Facture PDF prête - Cliquez sur le bouton pour télécharger directement` : 
            `Facture PDF disponible - Cliquez pour ouvrir et télécharger`,
          fields: [
            {
              title: 'Client',
              value: `${orderData.name}\n${orderData.email}\n${orderData.phone}`,
              short: true
            },
            {
              title: 'Commande',
              value: `${orderData.serviceLabel}\n${formatFcfa(orderData.finalPrice)}\n${paymentMethod}`,
              short: true
            },
            {
              title: 'Status Actuel',
              value: '⏳ En attente de confirmation',
              short: false
            }
          ],
          actions: [
            {
              type: 'button',
              text: '📥 Télécharger Facture PDF',
              style: 'primary',
              name: 'download_invoice',
              value: invoiceNumber,
              url: invoiceUrl
            },
            {
              type: 'button',
              text: '💳 Confirmer Paiement',
              style: 'default',
              name: 'confirm_payment',
              value: invoiceNumber
            },
            {
              type: 'button',
              text: '📦 Finaliser Commande',
              style: 'default',
              name: 'finalize_order',
              value: invoiceNumber
            }
          ],
          footer: `Facture ${invoiceNumber} - Paiement validé`,
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    console.log('✅ Payload Slack préparé avec', invoiceBase64 ? 'PDF Data URL' : 'URL page web');

    await submitToSlack(payload);
    console.log('✅ Notification de validation avec facture PDF et boutons de gestion envoyée');

    // Envoyer aussi par email à l'équipe
    try {
      await sendInvoiceByEmail(orderData, paymentMethod, invoiceBase64, invoiceNumber);
      console.log('✅ Facture envoyée par email à l\'équipe');
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError);
    }

  } catch (error) {
    console.error('❌ Erreur envoi notification validation:', error);

    // Fallback sans boutons
    try {
      const fallbackPayload = {
        text: slackText,
        attachments: [{
          color: 'good',
          title: `✅ PAIEMENT VALIDÉ - ${invoiceNumber}`,
          text: `Facture générée (boutons non disponibles)`,
          fields: [
            {
              title: 'Client',
              value: `${orderData.name} (${orderData.email})`,
              short: true
            },
            {
              title: 'Montant',
              value: formatFcfa(orderData.finalPrice),
              short: true
            }
          ]
        }]
      };

      await submitToSlack(fallbackPayload);
      console.log('✅ Notification validation envoyée (sans boutons)');
    } catch (fallbackError) {
      console.error('❌ Erreur fallback notification:', fallbackError);
    }
  }
}



// Fonction pour générer la facture en arrière-plan sans l'afficher
async function generateInvoiceInBackground(orderData, paymentMethod) {
  const invoiceNumber = generateInvoiceNumber();
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const currentDateTime = new Date().toLocaleString('fr-FR');

  // Calculer la date de validité selon le délai
  const validityDate = new Date();
  switch (orderData.delivery) {
    case 'urgent':
      validityDate.setDate(validityDate.getDate() + 1);
      break;
    case 'short':
      validityDate.setDate(validityDate.getDate() + 7);
      break;
    case 'medium':
      validityDate.setDate(validityDate.getDate() + 28);
      break;
    case 'long':
      validityDate.setMonth(validityDate.getMonth() + 6);
      break;
    default:
      validityDate.setDate(validityDate.getDate() + 14);
  }
  const validityDateStr = validityDate.toLocaleDateString('fr-FR');

  // Stocker les données pour le traitement
  window.currentInvoiceData = { orderData, paymentMethod, invoiceNumber, currentDate, validityDateStr };

  // Créer la facture dans un élément caché
  const hiddenContainer = document.createElement('div');
  hiddenContainer.id = 'hidden-invoice-container';
  hiddenContainer.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: 210mm;
    height: 297mm;
    background: white;
    visibility: hidden;
  `;

  const invoiceHTML = `
    <div class="invoice-document" id="invoice-document">
      <div class="invoice-header">
        <div class="company-section">
          <img src="images/enixis corp_logo.png" alt="Enixis Corp" class="company-logo">
          <div class="company-details">
            <h4>Enixis Corp</h4>
            <p>contacteccorp@gmail.com</p>
            <p>+228 97 57 23 46</p>
            <p><a href="https://enixis-corp.vercel.app" target="_blank" rel="noopener noreferrer" class="website-link">https://enixis-corp.vercel.app</a></p>
          </div>
        </div>
        
        <div class="invoice-number-section">
          <div class="invoice-number">${invoiceNumber}</div>
          <div class="invoice-dates">
            <p>Date: ${currentDate}</p>
            <p>Date de validité: ${validityDateStr}</p>
            <p>Heure: ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
        </div>
      </div>
      
      <div class="client-service-section">
        <div class="client-info">
          <h4>📋 Informations Client</h4>
          <div class="client-details">
            <p><strong>${orderData.name}</strong></p>
            <p>${orderData.email}</p>
            <p>${orderData.phone}</p>
          </div>
        </div>
        
        <div class="service-info">
          <h4>🎯 Prestation Demandée</h4>
          <div class="service-details">
            <p><strong>${orderData.serviceLabel}</strong></p>
            <p>Délai: ${orderData.delivery === 'urgent' ? 'Urgent (24h)' :
      orderData.delivery === 'short' ? 'Court terme (3-7j)' :
        orderData.delivery === 'medium' ? 'Moyen terme (2-4 sem.)' :
          orderData.delivery === 'long' ? 'Long terme (1-6 mois)' : 'Standard'}</p>
          </div>
        </div>
      </div>
      
      <table class="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Date</th>
            <th>Qté</th>
            <th>Unité</th>
            <th>Prix unitaire</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>→ ${orderData.serviceLabel}</td>
            <td>${currentDate}</td>
            <td>1,00</td>
            <td>pcs</td>
            <td>${formatFcfa(orderData.basePrice || orderData.finalPrice)}</td>
            <td>${formatFcfa(orderData.finalPrice)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="invoice-totals">
        ${orderData.coupon ? `
        <div class="totals-row">
          <span>Sous-total TTC</span>
          <span>${formatFcfa(orderData.basePrice || orderData.finalPrice)}</span>
        </div>
        <div class="totals-row">
          <span>Remise (${orderData.coupon.code} - ${orderData.coupon.percent}%)</span>
          <span>-${formatFcfa((orderData.basePrice || orderData.finalPrice) - orderData.finalPrice)}</span>
        </div>` : ''}
        <div class="totals-row total-final">
          <span><strong>Total TTC</strong></span>
          <span><strong>${formatFcfa(orderData.finalPrice)}</strong></span>
        </div>
      </div>
      
      <div class="payment-info-section">
        <h4>💳 Informations de Paiement</h4>
        <div class="payment-details">
          <div class="payment-row">
            <span class="payment-label">Méthode de paiement:</span>
            <span class="payment-value">${paymentMethod}</span>
          </div>
          <div class="payment-row">
            <span class="payment-label">Statut:</span>
            <span class="payment-value status-paid">✅ Payé le ${currentDateTime}</span>
          </div>
          <div class="payment-row">
            <span class="payment-label">Transaction:</span>
            <span class="payment-value">🔒 Sécurisée et validée</span>
          </div>
        </div>
      </div>
      
      <div class="invoice-footer">
        <p><strong>🎉 Merci pour votre commande !</strong></p>
        <p>Cette facture a été générée automatiquement et envoyée à notre équipe.</p>
        <p>Nous commencerons le travail selon le délai convenu.</p>
        <p><strong>Contact :</strong> contacteccorp@gmail.com | +228 97 57 23 46</p>
        <p style="margin-top: 15px; color: #28a745; font-weight: 600;">
          ✨ N'hésitez pas à explorer nos autres services sur notre site !
        </p>
      </div>
    </div>
  `;

  hiddenContainer.innerHTML = invoiceHTML;
  document.body.appendChild(hiddenContainer);

  console.log('✅ Facture générée en arrière-plan pour traitement');
}

// Fonction pour afficher la confirmation de paiement (sans téléchargement automatique)
function showPaymentConfirmation(orderData, paymentMethod, invoiceNumber) {
  // Créer le pop-up de confirmation simple
  const confirmationPopup = document.createElement('div');
  confirmationPopup.id = 'payment-confirmation-popup';
  confirmationPopup.className = 'popup-overlay';
  confirmationPopup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  confirmationPopup.innerHTML = `
    <div class="popup-content" style="
      background: white;
      border-radius: 15px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    ">
      <div style="
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #28a745, #20c997);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px auto;
        font-size: 36px;
      ">✅</div>
      
      <h2 style="color: #28a745; margin-bottom: 15px; font-size: 24px;">
        Paiement Confirmé !
      </h2>
      
      <p style="color: #666; margin-bottom: 25px; font-size: 16px; line-height: 1.5;">
        Merci <strong>${orderData.name}</strong> pour votre commande !<br>
        Votre paiement de <strong>${formatFcfa(orderData.finalPrice)}</strong> a été validé.
      </p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px; text-align: left;">
        <h4 style="margin: 0 0 15px 0; color: #333;">📋 Récapitulatif :</h4>
        <p style="margin: 5px 0; color: #666;"><strong>Service :</strong> ${orderData.serviceLabel}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Email :</strong> ${orderData.email}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Paiement :</strong> ${paymentMethod}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Numéro de facture :</strong> ${invoiceNumber}</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 20px; border-radius: 10px; margin-bottom: 25px;">
        <h4 style="margin: 0 0 15px 0; color: #1976d2;">📱 Prochaines étapes :</h4>
        <ul style="text-align: left; color: #666; margin: 0; padding-left: 20px;">
          <li>Notre équipe a été notifiée de votre commande</li>
          <li>Vous recevrez votre facture via notre équipe</li>
          <li>Nous commencerons le travail selon le délai convenu</li>
          <li>Nous vous contacterons si nous avons des questions</li>
        </ul>
      </div>
      
      <button id="close-confirmation-btn" style="
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        border: none;
        padding: 15px 40px;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        transition: all 0.3s ease;
      ">
        ✅ Parfait, merci !
      </button>
    </div>
  `;

  // Ajouter au DOM
  document.body.appendChild(confirmationPopup);
  document.body.style.overflow = 'hidden';

  // Event listener pour fermer
  document.getElementById('close-confirmation-btn').addEventListener('click', () => {
    confirmationPopup.remove();
    document.body.style.overflow = '';

    // Rediriger vers l'accueil avec message de succès
    sessionStorage.setItem('orderCompleted', 'true');
    window.location.href = 'index.html#success';
  });
}

// Fonction pour afficher le pop-up de synthèse statique (DEPRECATED - remplacée par showPaymentConfirmation)
function showOrderSummaryPopup(orderData, paymentMethod) {
  // Créer le pop-up de synthèse
  const summaryPopup = document.createElement('div');
  summaryPopup.id = 'order-summary-popup';
  summaryPopup.className = 'popup-overlay';
  summaryPopup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  const invoiceNumber = window.currentInvoiceData ? window.currentInvoiceData.invoiceNumber : generateInvoiceNumber();

  summaryPopup.innerHTML = `
    <div class="popup-content" style="
      background: white;
      border-radius: 15px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div class="popup-header" style="text-align: center; margin-bottom: 25px;">
        <div style="
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #28a745, #20c997);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px auto;
          font-size: 24px;
        ">✅</div>
        <h3 style="color: #28a745; margin: 0; font-size: 24px; font-weight: 600;">
          Paiement Validé !
        </h3>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">
          Votre commande a été traitée avec succès
        </p>
      </div>
      
      <div class="summary-content" style="margin-bottom: 25px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">📄 Récapitulatif de votre commande</h4>
          <div style="display: grid; gap: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Numéro de commande:</span>
              <span style="font-weight: 600; color: #333;">${invoiceNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Client:</span>
              <span style="font-weight: 600; color: #333;">${orderData.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Email:</span>
              <span style="font-weight: 600; color: #333;">${orderData.email}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Prestation:</span>
              <span style="font-weight: 600; color: #333;">${orderData.serviceLabel}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Montant:</span>
              <span style="font-weight: 600; color: #28a745;">${formatFcfa(orderData.finalPrice)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Méthode de paiement:</span>
              <span style="font-weight: 600; color: #333;">${paymentMethod}</span>
            </div>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 20px; border-radius: 10px; border-left: 4px solid #28a745;">
          <h4 style="margin: 0 0 10px 0; color: #28a745; font-size: 16px;">✅ Prochaines étapes</h4>
          <ul style="margin: 0; padding-left: 20px; color: #666;">
            <li>📧 Votre facture a été envoyée à notre équipe</li>
            <li>🚀 Nous commencerons le travail selon le délai convenu</li>
            <li>📄 Vous recevrez votre facture par email</li>
            <li>💬 Notre équipe vous contactera si nécessaire</li>
          </ul>
        </div>
      </div>
      
      <div style="text-align: center;">
        <p style="color: #dc3545; font-weight: 600; margin-bottom: 20px; font-size: 16px;">
          ⚠️ IMPORTANT : Cliquez sur le bouton ci-dessous pour finaliser votre commande
        </p>
        <button id="complete-order-final-btn" style="
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 10px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          animation: pulseGreen 2s infinite;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
          transition: all 0.3s ease;
          width: 100%;
          max-width: 300px;
        ">
          ✅ Terminer ma commande
        </button>
        <p style="color: #666; margin-top: 15px; font-size: 14px;">
          Cette action vous redirigera vers la page d'accueil
        </p>
      </div>
    </div>
  `;

  // Ajouter l'animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulseGreen {
      0% { 
        transform: scale(1);
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
      }
      50% { 
        transform: scale(1.02);
        box-shadow: 0 6px 20px rgba(40, 167, 69, 0.5);
      }
      100% { 
        transform: scale(1);
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
      }
    }
    
    #complete-order-final-btn:hover {
      animation-play-state: paused;
      background: linear-gradient(135deg, #218838, #1e7e34) !important;
      transform: scale(1.05) !important;
    }
    
    @media (max-width: 768px) {
      #order-summary-popup .popup-content {
        margin: 20px;
        padding: 20px;
        max-height: calc(100vh - 40px);
      }
    }
  `;
  document.head.appendChild(style);

  // Ajouter au DOM
  document.body.appendChild(summaryPopup);

  // Empêcher la fermeture du pop-up
  document.body.style.overflow = 'hidden';

  // Ajouter l'event listener pour le bouton
  document.getElementById('complete-order-final-btn').addEventListener('click', () => {
    console.log('✅ Utilisateur a finalisé sa commande via le pop-up de synthèse');

    // Supprimer le pop-up
    summaryPopup.remove();
    document.body.style.overflow = '';

    // Rediriger vers l'accueil avec message de succès
    sessionStorage.setItem('orderCompleted', 'true');
    window.location.href = 'index.html#success';
  });

  // Empêcher la fermeture en cliquant à l'extérieur
  summaryPopup.addEventListener('click', (e) => {
    if (e.target === summaryPopup) {
      // Faire clignoter le bouton pour attirer l'attention
      const btn = document.getElementById('complete-order-final-btn');
      if (btn) {
        btn.style.animation = 'pulseGreen 0.5s ease-in-out 3';
        setTimeout(() => {
          btn.style.animation = 'pulseGreen 2s infinite';
        }, 1500);
      }
    }
  });
}

// Fonction pour afficher le bouton "Terminer ma commande" clignotant (DEPRECATED - remplacée par showOrderSummaryPopup)
function showBlinkingCompleteButton() {
  // Créer le conteneur du bouton
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'complete-button-container';
  buttonContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    text-align: center;
  `;

  buttonContainer.innerHTML = `
    <div style="background: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); backdrop-filter: blur(10px);">
      <p style="margin: 0 0 15px 0; color: #28a745; font-weight: 600; font-size: 16px;">
        ✅ Votre commande a été traitée avec succès !
      </p>
      <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
        📧 Notre équipe a reçu votre facture et commencera le travail selon le délai convenu.
      </p>
      <button id="complete-order-btn-final" class="btn primary blinking-btn" style="
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        animation: blinkGreen 1.5s infinite;
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        transition: all 0.3s ease;
      ">
        ✅ Terminer ma commande
      </button>
    </div>
  `;

  document.body.appendChild(buttonContainer);

  // Ajouter l'animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes blinkGreen {
      0%, 50% { 
        background: linear-gradient(135deg, #28a745, #20c997);
        transform: scale(1);
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
      }
      25%, 75% { 
        background: linear-gradient(135deg, #34ce57, #2dd4aa);
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(40, 167, 69, 0.5);
      }
    }
    
    .blinking-btn:hover {
      animation-play-state: paused;
      background: linear-gradient(135deg, #218838, #1e7e34) !important;
      transform: scale(1.02) !important;
    }
    
    @media (max-width: 768px) {
      #complete-button-container {
        bottom: 10px;
        left: 10px;
        right: 10px;
        transform: none;
      }
    }
  `;
  document.head.appendChild(style);

  // Ajouter l'event listener
  document.getElementById('complete-order-btn-final').addEventListener('click', () => {
    console.log('✅ Utilisateur a validé sa commande avec le bouton clignotant');

    // Supprimer le bouton
    buttonContainer.remove();

    // Rediriger vers l'accueil avec message de succès
    sessionStorage.setItem('orderCompleted', 'true');
    window.location.href = 'index.html#success';
  });
}

// Fonction pour stocker la facture dans le localStorage
async function storeInvoiceInLocalStorage(invoiceNumber, pdfBase64, orderData, paymentMethod) {
  try {
    const invoiceData = {
      invoiceNumber: invoiceNumber,
      pdfBase64: pdfBase64,
      orderData: orderData,
      paymentMethod: paymentMethod,
      createdAt: new Date().toISOString(),
      clientInfo: {
        name: orderData.name,
        email: orderData.email,
        phone: orderData.phone
      },
      serviceInfo: {
        label: orderData.serviceLabel,
        amount: orderData.finalPrice,
        delivery: orderData.delivery
      }
    };

    // Stocker dans localStorage avec une clé unique
    const storageKey = `enixis_invoice_${invoiceNumber}`;
    localStorage.setItem(storageKey, JSON.stringify(invoiceData));

    // Maintenir une liste des factures pour référence
    let invoicesList = JSON.parse(localStorage.getItem('enixis_invoices_list') || '[]');
    if (!invoicesList.includes(invoiceNumber)) {
      invoicesList.push(invoiceNumber);
      localStorage.setItem('enixis_invoices_list', JSON.stringify(invoicesList));
    }

    console.log('✅ Facture stockée dans localStorage:', invoiceNumber);

    // Nettoyer les anciennes factures (garder seulement les 10 dernières)
    if (invoicesList.length > 10) {
      const oldInvoices = invoicesList.slice(0, invoicesList.length - 10);
      oldInvoices.forEach(oldInvoice => {
        localStorage.removeItem(`enixis_invoice_${oldInvoice}`);
      });
      invoicesList = invoicesList.slice(-10);
      localStorage.setItem('enixis_invoices_list', JSON.stringify(invoicesList));
    }

  } catch (error) {
    console.error('❌ Erreur stockage facture:', error);
  }
}

// Fonction pour récupérer une facture depuis le localStorage
function getInvoiceFromLocalStorage(invoiceNumber) {
  try {
    const storageKey = `enixis_invoice_${invoiceNumber}`;
    const invoiceData = localStorage.getItem(storageKey);

    if (invoiceData) {
      return JSON.parse(invoiceData);
    }

    console.warn('⚠️ Facture non trouvée dans localStorage:', invoiceNumber);
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération facture:', error);
    return null;
  }
}

// Fonction pour télécharger une facture depuis le localStorage
function downloadInvoiceFromStorage(invoiceNumber) {
  try {
    const invoiceData = getInvoiceFromLocalStorage(invoiceNumber);

    if (!invoiceData) {
      console.error('❌ Facture non trouvée pour téléchargement:', invoiceNumber);
      return false;
    }

    // Créer un lien de téléchargement
    const pdfDataUrl = `data:application/pdf;base64,${invoiceData.pdfBase64}`;
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = `Facture_${invoiceNumber}.pdf`;

    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ Téléchargement facture déclenché:', invoiceNumber);
    return true;

  } catch (error) {
    console.error('❌ Erreur téléchargement facture:', error);
    return false;
  }
}

// Fonction pour créer un lien de téléchargement PDF pour Slack
async function createPDFDownloadLink(invoiceBase64, invoiceNumber) {
  try {
    // Créer un blob PDF à partir du base64
    const binaryString = atob(invoiceBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    console.log('✅ Lien de téléchargement PDF créé');
    return url;
  } catch (error) {
    console.error('❌ Erreur création lien PDF:', error);
    return null;
  }
}

// Fonction pour créer une page temporaire avec le PDF
async function createTemporaryPDFPage(invoiceBase64, invoiceNumber) {
  try {
    // Créer une page HTML temporaire avec le PDF intégré
    const pdfDataUrl = `data:application/pdf;base64,${invoiceBase64}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoiceNumber} - Enixis Corp</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 20px; }
        .pdf-viewer { width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 5px; }
        .download-btn { background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 10px 5px; }
        .download-btn:hover { background: #218838; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 Facture ${invoiceNumber}</h1>
            <p>Enixis Corp - Solutions IA & Optimisation Business</p>
        </div>
        
        <div class="info">
            <strong>ℹ️ Information :</strong> Cette facture a été générée automatiquement. 
            Vous pouvez la visualiser ci-dessous ou la télécharger au format PDF.
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <button class="download-btn" onclick="downloadPDF()">📥 Télécharger PDF</button>
            <button class="download-btn" onclick="window.print()" style="background: #007bff;">🖨️ Imprimer</button>
        </div>
        
        <embed class="pdf-viewer" src="${pdfDataUrl}" type="application/pdf">
        
        <div style="text-align: center; margin-top: 20px; color: #666;">
            <p>Si le PDF ne s'affiche pas, <a href="${pdfDataUrl}" download="Facture_${invoiceNumber}.pdf">cliquez ici pour le télécharger</a></p>
        </div>
    </div>
    
    <script>
        function downloadPDF() {
            const link = document.createElement('a');
            link.href = '${pdfDataUrl}';
            link.download = 'Facture_${invoiceNumber}.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    </script>
</body>
</html>`;

    // Créer un blob avec le contenu HTML
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);

    console.log('✅ Page temporaire PDF créée');
    return htmlUrl;

  } catch (error) {
    console.error('❌ Erreur création page PDF:', error);
    return null;
  }
}

// Fonction pour créer une image téléchargeable de la facture
async function createInvoiceDownloadableImage(invoiceBase64, invoiceNumber) {
  try {
    // Convertir le PDF base64 en image pour Slack
    // Note: Slack ne supporte pas les PDF directement, on crée une image

    const invoiceElement = document.getElementById('invoice-document');
    if (!invoiceElement) {
      console.log('❌ Élément facture non trouvé pour capture');
      return null;
    }

    // Créer une capture haute qualité de la facture
    const canvas = await html2canvas(invoiceElement, {
      backgroundColor: '#ffffff',
      scale: 1.5, // Qualité élevée pour téléchargement
      useCORS: true,
      allowTaint: true,
      width: 800,
      height: 1200,
      logging: false,
      removeContainer: true
    });

    // Convertir en blob pour upload
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          // Créer une URL temporaire pour l'image
          const imageUrl = URL.createObjectURL(blob);
          console.log('✅ Image facture créée pour téléchargement');

          // Dans un environnement réel, vous uploaderiez cette image vers un service
          // Pour l'instant, on retourne l'URL locale
          resolve(imageUrl);
        } else {
          console.log('❌ Impossible de créer l\'image facture');
          resolve(null);
        }
      }, 'image/png', 0.9);
    });

  } catch (error) {
    console.error('❌ Erreur création image facture:', error);
    return null;
  }
}

// Fonction pour envoyer un email réel avec EmailJS
async function sendRealEmail(toEmail, subject, body, pdfBase64, invoiceNumber, orderData) {
  try {
    // Configuration EmailJS depuis les variables d'environnement
    const emailjsConfig = {
      serviceId: (window.env && window.env.EMAILJS_SERVICE_ID) || 'service_enixis',
      templateId: (window.env && window.env.EMAILJS_TEMPLATE_ID) || 'template_invoice',
      publicKey: (window.env && window.env.EMAILJS_PUBLIC_KEY) || ''
    };

    console.log('📧 Configuration EmailJS:', {
      serviceId: emailjsConfig.serviceId,
      templateId: emailjsConfig.templateId,
      publicKeyPresent: !!emailjsConfig.publicKey
    });

    // Vérifier si EmailJS est disponible
    if (typeof emailjs === 'undefined') {
      console.error('❌ EmailJS non chargé');
      throw new Error('EmailJS non disponible - bibliothèque non chargée');
    }

    // Vérifier la configuration
    if (!emailjsConfig.publicKey) {
      console.error('❌ Clé publique EmailJS manquante');
      throw new Error('Configuration EmailJS incomplète - clé publique manquante');
    }

    // Initialiser EmailJS
    emailjs.init(emailjsConfig.publicKey);
    console.log('✅ EmailJS initialisé avec succès');

    // Préparer les données pour le template
    const templateParams = {
      to_email: toEmail,
      to_name: 'Équipe Enixis Corp',
      subject: subject,
      message: body,
      invoice_number: invoiceNumber,
      client_name: orderData.name,
      client_email: orderData.email,
      client_phone: orderData.phone,
      service: orderData.serviceLabel,
      amount: formatFcfa(orderData.finalPrice),
      payment_method: 'Validé',
      date: new Date().toLocaleString('fr-FR'),
      from_name: 'Système Enixis Corp'
    };

    console.log('📧 Envoi email avec params:', templateParams);

    // Envoyer l'email
    const response = await emailjs.send(
      emailjsConfig.serviceId,
      emailjsConfig.templateId,
      templateParams
    );

    console.log('✅ Email envoyé via EmailJS:', response);
    return response;

  } catch (error) {
    console.error('❌ Erreur EmailJS détaillée:', error);
    throw error;
  }
}

// Fonction pour envoyer la facture par email à l'équipe
async function sendInvoiceByEmail(orderData, paymentMethod, invoiceBase64, invoiceNumber) {
  const companyEmail = (window.env && window.env.COMPANY_EMAIL) ? window.env.COMPANY_EMAIL : 'contacteccorp@gmail.com';

  try {
    // Préparer les données pour l'envoi d'email réel
    const emailSubject = `📄 Nouvelle Facture ${invoiceNumber} - Paiement Validé`;
    const emailBody = `
Bonjour équipe Enixis Corp,

Une nouvelle facture a été générée suite à la validation d'un paiement.

DÉTAILS DE LA FACTURE:
• Numéro: ${invoiceNumber}
• Client: ${orderData.name} (${orderData.email})
• Téléphone: ${orderData.phone}
• Prestation: ${orderData.serviceLabel}
• Montant: ${formatFcfa(orderData.finalPrice)}
• Méthode de paiement: ${paymentMethod}
• Date: ${new Date().toLocaleString('fr-FR')}

PROCHAINES ÉTAPES:
1. ✅ Le paiement a été validé
2. 📧 Envoyez cette facture au client par email
3. 🚀 Commencez le travail selon le délai convenu: ${orderData.delivery || 'Standard'}

La facture PDF est jointe à cet email.

Cordialement,
Système automatisé Enixis Corp
    `.trim();

    // Envoi d'email réel via EmailJS
    try {
      await sendRealEmail(companyEmail, emailSubject, emailBody, invoiceBase64, invoiceNumber, orderData);
      console.log('✅ Email envoyé avec succès à:', companyEmail);

    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError);

      // Fallback: ouvrir le client email par défaut
      const mailtoLink = `mailto:${companyEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      if (typeof window !== 'undefined') {
        window.open(mailtoLink, '_blank');
        console.log('📧 Client email ouvert en fallback');
      }
    }

    // Email envoyé - pas de notification Slack supplémentaire
    console.log('✅ Email envoyé à:', companyEmail);

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi email:', error);

    // Notification d'erreur sur Slack
    const errorText = `
❌ ERREUR ENVOI EMAIL - Enixis Corp

Impossible d'envoyer la facture ${invoiceNumber} par email à ${companyEmail}

👤 Client: ${orderData.name}
💰 Montant: ${formatFcfa(orderData.finalPrice)}

⚠️ Téléchargez la facture depuis Slack et envoyez-la manuellement au client.
    `.trim();

    try {
      await submitToSlack({ text: errorText });
    } catch (slackError) {
      console.error('❌ Erreur notification Slack:', slackError);
    }
  }
}

function hideOrderSummary() {
  if (!orderPopup) return;
  orderPopup.style.display = 'none';
  document.body.style.overflow = '';
}

// Event listeners pour les pop-ups
orderClose?.addEventListener('click', hideOrderSummary);
orderCancelBtn?.addEventListener('click', hideOrderSummary);
orderPopup?.addEventListener('click', (e) => { if (e.target === orderPopup) hideOrderSummary(); });

// Bouton Payer - ouvre la sélection de pays
paymentBtn?.addEventListener('click', () => {
  showCountrySelection();
});

// Bouton WhatsApp - redirige vers WhatsApp
const whatsappBtn = document.getElementById('whatsapp-btn');
whatsappBtn?.addEventListener('click', () => {
  const whatsappNumber = '22897572346';
  const message = encodeURIComponent(`Bonjour Enixis Corp,

Je souhaite discuter de ma commande avant de procéder au paiement.

Détails de ma commande :
• Nom : ${currentOrderData?.name || 'Non spécifié'}
• Prestation : ${currentOrderData?.serviceLabel || 'Non spécifiée'}
• Montant : ${formatFcfa(currentOrderData?.finalPrice || 0)}

Merci !`);

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
  window.open(whatsappUrl, '_blank');

  // Pas de notification Slack pour WhatsApp - seulement les 2 notifications principales
});

// Listes de pays
const AFRICA_COUNTRIES = [
  { name: 'Afrique du Sud', flag: '🇿🇦' },
  { name: 'Algérie', flag: '🇩🇿' },
  { name: 'Angola', flag: '🇦🇴' },
  { name: 'Bénin', flag: '🇧🇯' },
  { name: 'Botswana', flag: '🇧🇼' },
  { name: 'Burkina Faso', flag: '🇧🇫' },
  { name: 'Burundi', flag: '🇧🇮' },
  { name: 'Cameroun', flag: '🇨🇲' },
  { name: 'Cap-Vert', flag: '🇨🇻' },
  { name: 'Comores', flag: '🇰🇲' },
  { name: 'Congo (Rép.)', flag: '🇨🇬' },
  { name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { name: 'Djibouti', flag: '🇩🇯' },
  { name: 'Égypte', flag: '🇪🇬' },
  { name: 'Érythrée', flag: '🇪🇷' },
  { name: 'Eswatini', flag: '🇸🇿' },
  { name: 'Éthiopie', flag: '🇪🇹' },
  { name: 'Gabon', flag: '🇬🇦' },
  { name: 'Gambie', flag: '🇬🇲' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Guinée', flag: '🇬🇳' },
  { name: 'Guinée-Bissau', flag: '🇬🇼' },
  { name: 'Guinée équatoriale', flag: '🇬🇶' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Lesotho', flag: '🇱🇸' },
  { name: 'Liberia', flag: '🇱🇷' },
  { name: 'Libye', flag: '🇱🇾' },
  { name: 'Madagascar', flag: '🇲🇬' },
  { name: 'Malawi', flag: '🇲🇼' },
  { name: 'Mali', flag: '🇲🇱' },
  { name: 'Maroc', flag: '🇲🇦' },
  { name: 'Maurice', flag: '🇲🇺' },
  { name: 'Mauritanie', flag: '🇲🇷' },
  { name: 'Mozambique', flag: '🇲🇿' },
  { name: 'Namibie', flag: '🇳🇦' },
  { name: 'Niger', flag: '🇳🇪' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Ouganda', flag: '🇺🇬' },
  { name: 'Rwanda', flag: '🇷🇼' },
  { name: 'São Tomé-et-Principe', flag: '🇸🇹' },
  { name: 'Sénégal', flag: '🇸🇳' },
  { name: 'Seychelles', flag: '🇸🇨' },
  { name: 'Sierra Leone', flag: '🇸🇱' },
  { name: 'Somalie', flag: '🇸🇴' },
  { name: 'Soudan', flag: '🇸🇩' },
  { name: 'Soudan du Sud', flag: '🇸🇸' },
  { name: 'Tanzanie', flag: '🇹🇿' },
  { name: 'Tchad', flag: '🇹🇩' },
  { name: 'Togo', flag: '🇹🇬' },
  { name: 'Tunisie', flag: '🇹🇳' },
  { name: 'Zambie', flag: '🇿🇲' },
  { name: 'Zimbabwe', flag: '🇿🇼' }
];

const WORLD_COUNTRIES = [
  { name: 'Afghanistan', flag: '🇦🇫' },
  { name: 'Albanie', flag: '🇦🇱' },
  { name: 'Allemagne', flag: '🇩🇪' },
  { name: 'Andorre', flag: '🇦🇩' },
  { name: 'Antigua-et-Barbuda', flag: '🇦🇬' },
  { name: 'Arabie saoudite', flag: '🇸🇦' },
  { name: 'Argentine', flag: '🇦🇷' },
  { name: 'Arménie', flag: '🇦🇲' },
  { name: 'Australie', flag: '🇦🇺' },
  { name: 'Autriche', flag: '🇦🇹' },
  { name: 'Azerbaïdjan', flag: '🇦🇿' },
  { name: 'Bahamas', flag: '🇧🇸' },
  { name: 'Bahreïn', flag: '🇧🇭' },
  { name: 'Bangladesh', flag: '🇧🇩' },
  { name: 'Barbade', flag: '🇧🇧' },
  { name: 'Biélorussie', flag: '🇧🇾' },
  { name: 'Belgique', flag: '🇧🇪' },
  { name: 'Belize', flag: '🇧🇿' },
  { name: 'Bhoutan', flag: '🇧🇹' },
  { name: 'Bolivie', flag: '🇧🇴' },
  { name: 'Bosnie-Herzégovine', flag: '🇧🇦' },
  { name: 'Brésil', flag: '🇧🇷' },
  { name: 'Brunei', flag: '🇧🇳' },
  { name: 'Bulgarie', flag: '🇧🇬' },
  { name: 'Cambodge', flag: '🇰🇭' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Chili', flag: '🇨🇱' },
  { name: 'Chine', flag: '🇨🇳' },
  { name: 'Chypre', flag: '🇨🇾' },
  { name: 'Colombie', flag: '🇨🇴' },
  { name: 'Corée du Nord', flag: '🇰🇵' },
  { name: 'Corée du Sud', flag: '🇰🇷' },
  { name: 'Costa Rica', flag: '🇨🇷' },
  { name: 'Croatie', flag: '🇭🇷' },
  { name: 'Cuba', flag: '🇨🇺' },
  { name: 'Danemark', flag: '🇩🇰' },
  { name: 'Dominique', flag: '🇩🇲' },
  { name: 'Émirats arabes unis', flag: '🇦🇪' },
  { name: 'Équateur', flag: '🇪🇨' },
  { name: 'Espagne', flag: '🇪🇸' },
  { name: 'Estonie', flag: '🇪🇪' },
  { name: 'États-Unis', flag: '🇺🇸' },
  { name: 'Fidji', flag: '🇫🇯' },
  { name: 'Finlande', flag: '🇫🇮' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Géorgie', flag: '🇬🇪' },
  { name: 'Grèce', flag: '🇬🇷' },
  { name: 'Grenade', flag: '🇬🇩' },
  { name: 'Guatemala', flag: '🇬🇹' },
  { name: 'Guyana', flag: '🇬🇾' },
  { name: 'Haïti', flag: '🇭🇹' },
  { name: 'Honduras', flag: '🇭🇳' },
  { name: 'Hongrie', flag: '🇭🇺' },
  { name: 'Inde', flag: '🇮🇳' },
  { name: 'Indonésie', flag: '🇮🇩' },
  { name: 'Iran', flag: '🇮🇷' },
  { name: 'Iraq', flag: '🇮🇶' },
  { name: 'Irlande', flag: '🇮🇪' },
  { name: 'Islande', flag: '🇮🇸' },
  { name: 'Israël', flag: '🇮🇱' },
  { name: 'Italie', flag: '🇮🇹' },
  { name: 'Jamaïque', flag: '🇯🇲' },
  { name: 'Japon', flag: '🇯🇵' },
  { name: 'Jordanie', flag: '🇯🇴' },
  { name: 'Kazakhstan', flag: '🇰🇿' },
  { name: 'Kirghizistan', flag: '🇰🇬' },
  { name: 'Kiribati', flag: '🇰🇮' },
  { name: 'Koweït', flag: '🇰🇼' },
  { name: 'Laos', flag: '🇱🇦' },
  { name: 'Lettonie', flag: '🇱🇻' },
  { name: 'Liban', flag: '🇱🇧' },
  { name: 'Liechtenstein', flag: '🇱🇮' },
  { name: 'Lituanie', flag: '🇱🇹' },
  { name: 'Luxembourg', flag: '🇱🇺' },
  { name: 'Macédoine du Nord', flag: '🇲🇰' },
  { name: 'Malaisie', flag: '🇲🇾' },
  { name: 'Maldives', flag: '🇲🇻' },
  { name: 'Malte', flag: '🇲🇹' },
  { name: 'Marshall', flag: '🇲🇭' },
  { name: 'Mexique', flag: '🇲🇽' },
  { name: 'Micronésie', flag: '🇫🇲' },
  { name: 'Moldavie', flag: '🇲🇩' },
  { name: 'Monaco', flag: '🇲🇨' },
  { name: 'Mongolie', flag: '🇲🇳' },
  { name: 'Monténégro', flag: '🇲🇪' },
  { name: 'Myanmar', flag: '🇲🇲' },
  { name: 'Nauru', flag: '🇳🇷' },
  { name: 'Népal', flag: '🇳🇵' },
  { name: 'Nicaragua', flag: '🇳🇮' },
  { name: 'Norvège', flag: '🇳🇴' },
  { name: 'Nouvelle-Zélande', flag: '🇳🇿' },
  { name: 'Oman', flag: '🇴🇲' },
  { name: 'Ouzbékistan', flag: '🇺🇿' },
  { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Palau', flag: '🇵🇼' },
  { name: 'Palestine', flag: '🇵🇸' },
  { name: 'Panama', flag: '🇵🇦' },
  { name: 'Papouasie-Nouvelle-Guinée', flag: '🇵🇬' },
  { name: 'Paraguay', flag: '🇵🇾' },
  { name: 'Pays-Bas', flag: '🇳🇱' },
  { name: 'Pérou', flag: '🇵🇪' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Pologne', flag: '🇵🇱' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Qatar', flag: '🇶🇦' },
  { name: 'République centrafricaine', flag: '🇨🇫' },
  { name: 'République dominicaine', flag: '🇩🇴' },
  { name: 'République tchèque', flag: '🇨🇿' },
  { name: 'Roumanie', flag: '🇷🇴' },
  { name: 'Royaume-Uni', flag: '🇬🇧' },
  { name: 'Russie', flag: '🇷🇺' },
  { name: 'Saint-Christophe-et-Niévès', flag: '🇰🇳' },
  { name: 'Saint-Marin', flag: '🇸🇲' },
  { name: 'Saint-Vincent-et-les-Grenadines', flag: '🇻🇨' },
  { name: 'Sainte-Lucie', flag: '🇱🇨' },
  { name: 'Salvador', flag: '🇸🇻' },
  { name: 'Samoa', flag: '🇼🇸' },
  { name: 'Serbie', flag: '🇷🇸' },
  { name: 'Singapour', flag: '🇸🇬' },
  { name: 'Slovaquie', flag: '🇸🇰' },
  { name: 'Slovénie', flag: '🇸🇮' },
  { name: 'Solomon', flag: '🇸🇧' },
  { name: 'Sri Lanka', flag: '🇱🇰' },
  { name: 'Suède', flag: '🇸🇪' },
  { name: 'Suisse', flag: '🇨🇭' },
  { name: 'Syrie', flag: '🇸🇾' },
  { name: 'Tadjikistan', flag: '🇹🇯' },
  { name: 'Thaïlande', flag: '🇹🇭' },
  { name: 'Timor oriental', flag: '🇹🇱' },
  { name: 'Tonga', flag: '🇹🇴' },
  { name: 'Trinité-et-Tobago', flag: '🇹🇹' },
  { name: 'Turkménistan', flag: '🇹🇲' },
  { name: 'Turquie', flag: '🇹🇷' },
  { name: 'Tuvalu', flag: '🇹🇻' },
  { name: 'Ukraine', flag: '🇺🇦' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Vanuatu', flag: '🇻🇺' },
  { name: 'Venezuela', flag: '🇻🇪' },
  { name: 'Vietnam', flag: '🇻🇳' },
  { name: 'Yémen', flag: '🇾🇪' }
];

// Éléments DOM pour les listes de pays
const countryMainOptions = document.getElementById('country-main-options');
const africaCountries = document.getElementById('africa-countries');
const worldCountries = document.getElementById('world-countries');
const africaSearch = document.getElementById('africa-search');
const worldSearch = document.getElementById('world-search');
const africaList = document.getElementById('africa-list');
const worldList = document.getElementById('world-list');
const backToMainAfrica = document.getElementById('back-to-main-africa');
const backToMainWorld = document.getElementById('back-to-main-world');

// Fonctions pour afficher les listes de pays
function showAfricaCountries() {
  countryMainOptions.style.display = 'none';
  africaCountries.style.display = 'block';
  populateCountryList(AFRICA_COUNTRIES, africaList, 'africa');
  africaSearch.focus();
}

function showWorldCountries() {
  countryMainOptions.style.display = 'none';
  worldCountries.style.display = 'block';
  populateCountryList(WORLD_COUNTRIES, worldList, 'world');
  worldSearch.focus();
}

function backToMainOptions() {
  countryMainOptions.style.display = 'block';
  africaCountries.style.display = 'none';
  worldCountries.style.display = 'none';
  africaSearch.value = '';
  worldSearch.value = '';
}

function populateCountryList(countries, container, region) {
  container.innerHTML = '';
  countries.forEach(country => {
    const countryItem = document.createElement('div');
    countryItem.className = 'country-item';
    countryItem.innerHTML = `
      <span class="country-flag">${country.flag}</span>
      <span class="country-name">${country.name}</span>
    `;
    countryItem.addEventListener('click', () => {
      selectCountry(country.name, region);
    });
    container.appendChild(countryItem);
  });
}

function filterCountries(searchTerm, countries, container, region) {
  const filtered = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  populateCountryList(filtered, container, region);
}

function selectCountry(countryName, region) {
  hideCountrySelection();
  const countryLabel = `${region === 'africa' ? '🌍' : '🌎'} ${countryName}`;

  // Stocker le pays sélectionné et envoyer la notification de sélection
  if (currentOrderData) {
    currentOrderData.selectedCountry = countryLabel;
    // Envoyer immédiatement la notification de sélection de pays
    sendClientInfoNotification(countryLabel, currentOrderData.finalPrice, currentOrderData);
  }

  showPaymentOptions('crypto'); // Seule option crypto pour les autres pays
}

// Event listeners pour les boutons principaux
countryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const country = btn.getAttribute('data-country');
    if (country === 'africa') {
      showAfricaCountries();
    } else if (country === 'world') {
      showWorldCountries();
    } else {
      showPaymentOptions(country);
    }
  });
});

// Event listeners pour les boutons retour
backToMainAfrica?.addEventListener('click', backToMainOptions);
backToMainWorld?.addEventListener('click', backToMainOptions);

// Event listeners pour la recherche
africaSearch?.addEventListener('input', (e) => {
  filterCountries(e.target.value, AFRICA_COUNTRIES, africaList, 'africa');
});

worldSearch?.addEventListener('input', (e) => {
  filterCountries(e.target.value, WORLD_COUNTRIES, worldList, 'world');
});

// Country selection popup
countryClose?.addEventListener('click', hideCountrySelection);
countryPopup?.addEventListener('click', (e) => { if (e.target === countryPopup) hideCountrySelection(); });

// Payment options popup
paymentClose?.addEventListener('click', hidePaymentOptions);
paymentPopup?.addEventListener('click', (e) => { if (e.target === paymentPopup) hidePaymentOptions(); });

// Crypto payment popup
cryptoClose?.addEventListener('click', hideCryptoPayment);
cryptoPopup?.addEventListener('click', (e) => { if (e.target === cryptoPopup) hideCryptoPayment(); });

// Gestion des touches Escape pour tous les pop-ups
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Empêcher la fermeture du pop-up de synthèse avec Escape
    if (document.getElementById('order-summary-popup')) {
      // Faire clignoter le bouton pour attirer l'attention
      const btn = document.getElementById('complete-order-final-btn');
      if (btn) {
        btn.style.animation = 'pulseGreen 0.5s ease-in-out 3';
        setTimeout(() => {
          btn.style.animation = 'pulseGreen 2s infinite';
        }, 1500);
      }
      return; // Ne pas traiter les autres pop-ups
    }

    if (invoicePopup?.style.display === 'flex') {
      // Rediriger vers l'accueil au lieu de fermer
      window.location.href = 'index.html';
    } else if (cryptoPopup?.style.display === 'flex') {
      hideCryptoPayment();
    } else if (paymentPopup?.style.display === 'flex') {
      hidePaymentOptions();
    } else if (countryPopup?.style.display === 'flex') {
      // Si on est dans une liste de pays, revenir au menu principal
      if (africaCountries?.style.display === 'block' || worldCountries?.style.display === 'block') {
        backToMainOptions();
      } else {
        hideCountrySelection();
      }
    } else if (orderPopup?.style.display === 'flex') {
      hideOrderSummary();
    }
  }
});

// Reset complet (bouton Annuler et après envoi)
function resetRequestForm() {
  formEl.reset();
  appliedCoupon = null;
  updatePrice();
  toggleIssueBlock();
  togglePromoBlock();
  noteEl.textContent = '';
}

// Bouton Annuler: forcer le reset complet
document.querySelector('#request-form .btn.cancel')?.addEventListener('click', (e) => {
  e.preventDefault();
  resetRequestForm();
});

// Système de facture
const invoicePopup = document.getElementById('invoice-popup');
const invoiceContent = document.getElementById('invoice-content');

function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100);
  return `ENIXIS_${year}${month}${day}_${random}`;
}

function showInvoice(orderData, paymentMethod) {
  const invoiceNumber = generateInvoiceNumber();
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const currentDateTime = new Date().toLocaleString('fr-FR');

  // Calculer la date de validité selon le délai
  const validityDate = new Date();
  switch (orderData.delivery) {
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
  const validityDateStr = validityDate.toLocaleDateString('fr-FR');

  // Stocker les données pour le téléchargement
  window.currentInvoiceData = { orderData, paymentMethod, invoiceNumber, currentDate, validityDateStr };

  const invoiceHTML = `
    <div class="invoice-document" id="invoice-document">
      <div class="invoice-header">
        <div class="company-section">
          <img src="images/enixis corp_logo.png" alt="Enixis Corp" class="company-logo">
          <div class="company-details">
            <h4>Enixis Corp</h4>
            <p>contacteccorp@gmail.com</p>
            <p>+228 97 57 23 46</p>
            <p><a href="https://enixis-corp.vercel.app" target="_blank" rel="noopener noreferrer" class="website-link">https://enixis-corp.vercel.app</a></p>
          </div>
        </div>
        
        <div class="invoice-number-section">
          <div class="invoice-number">${invoiceNumber}</div>
          <div class="invoice-dates">
            <p>Date: ${currentDate}</p>
            <p>Date de validité: ${validityDateStr}</p>
            <p>Heure: ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
        </div>
      </div>
      
      <div class="client-service-section">
        <div class="client-info">
          <h4>📋 Informations Client</h4>
          <div class="client-details">
            <p><strong>${orderData.name}</strong></p>
            <p>${orderData.email}</p>
            <p>${orderData.phone}</p>
          </div>
        </div>
        
        <div class="service-info">
          <h4>🎯 Prestation Demandée</h4>
          <div class="service-details">
            <p><strong>${orderData.serviceLabel}</strong></p>
            <p>Délai: ${orderData.delivery === 'urgent' ? 'Urgent (24h)' :
      orderData.delivery === 'short' ? 'Court terme (3-7j)' :
        orderData.delivery === 'medium' ? 'Moyen terme (2-4 sem.)' :
          orderData.delivery === 'long' ? 'Long terme (1-6 mois)' : 'Standard'}</p>
          </div>
        </div>
      </div>
      
      <table class="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Date</th>
            <th>Qté</th>
            <th>Unité</th>
            <th>Prix unitaire</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>→ ${orderData.serviceLabel}</td>
            <td>${currentDate}</td>
            <td>1,00</td>
            <td>pcs</td>
            <td>${formatFcfa(orderData.basePrice || orderData.finalPrice)}</td>
            <td>${formatFcfa(orderData.finalPrice)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="invoice-totals">
        ${orderData.coupon ? `
        <div class="totals-row">
          <span>Sous-total TTC</span>
          <span>${formatFcfa(orderData.basePrice || orderData.finalPrice)}</span>
        </div>
        <div class="totals-row">
          <span>Remise (${orderData.coupon.code} - ${orderData.coupon.percent}%)</span>
          <span>-${formatFcfa((orderData.basePrice || orderData.finalPrice) - orderData.finalPrice)}</span>
        </div>` : ''}
        <div class="totals-row total-final">
          <span><strong>Total TTC</strong></span>
          <span><strong>${formatFcfa(orderData.finalPrice)}</strong></span>
        </div>
      </div>
      
      <div class="payment-info-section">
        <h4>💳 Informations de Paiement</h4>
        <div class="payment-details">
          <div class="payment-row">
            <span class="payment-label">Méthode de paiement:</span>
            <span class="payment-value">${paymentMethod}</span>
          </div>
          <div class="payment-row">
            <span class="payment-label">Statut:</span>
            <span class="payment-value status-paid">✅ Payé le ${currentDateTime}</span>
          </div>
          <div class="payment-row">
            <span class="payment-label">Transaction:</span>
            <span class="payment-value">🔒 Sécurisée et validée</span>
          </div>
        </div>
      </div>
      
      <div class="invoice-footer">
        <p><strong>🎉 Merci pour votre commande !</strong></p>
        <p>Cette facture a été générée automatiquement et téléchargée sur votre appareil.</p>
        <p>Nous commencerons le travail selon le délai convenu.</p>
        <p><strong>Contact :</strong> contacteccorp@gmail.com | +228 97 57 23 46</p>
        <p style="margin-top: 15px; color: #28a745; font-weight: 600;">
          ✨ N'hésitez pas à explorer nos autres services sur notre site !
        </p>
      </div>
      
      <!-- Bouton de téléchargement PDF -->
      <div class="pdf-download-section" style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #28a745;">
        <p style="margin-bottom: 15px; color: #666; font-size: 14px;">
          📄 Téléchargez votre facture au format PDF (optimisé pour impression A4)
        </p>
        <button id="download-pdf-btn" class="btn primary" style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
          📥 Télécharger PDF
        </button>
        <p style="margin-top: 10px; color: #666; font-size: 12px;">
          💡 Le PDF sera optimisé pour le format A4 et prêt à imprimer
        </p>
      </div>
    </div>
  `;

  invoiceContent.innerHTML = invoiceHTML;
  invoicePopup.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Ajouter l'événement click au bouton PDF après l'insertion du HTML
  setTimeout(() => {
    const downloadBtn = document.getElementById('download-pdf-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', async () => {
        downloadBtn.disabled = true;
        downloadBtn.textContent = '⏳ Génération PDF...';
        downloadBtn.style.background = '#6c757d';

        try {
          await downloadInvoiceAsPDF();
          downloadBtn.textContent = '✅ PDF Téléchargé !';
          downloadBtn.style.background = '#28a745';

          setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.textContent = '📥 Télécharger PDF';
            downloadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
          }, 3000);
        } catch (error) {
          console.error('❌ Erreur téléchargement PDF:', error);
          downloadBtn.textContent = '❌ Erreur - Réessayer';
          downloadBtn.style.background = '#dc3545';
          downloadBtn.disabled = false;

          setTimeout(() => {
            downloadBtn.textContent = '📥 Télécharger PDF';
            downloadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
          }, 3000);
        }
      });
    }
  }, 100);
}

async function downloadInvoiceAsPDF() {
  const invoiceElement = document.getElementById('invoice-document');
  const invoiceData = window.currentInvoiceData;

  if (!invoiceElement || !invoiceData) {
    console.error('❌ Erreur lors de la génération du PDF');
    throw new Error('Données de facture manquantes');
  }

  try {
    console.log('🔄 Génération du PDF A4 optimisé...');

    // Vérifier que jsPDF est disponible
    if (!window.jspdf) {
      throw new Error('Bibliothèque jsPDF non disponible');
    }

    const { jsPDF } = window.jspdf;

    // Créer le PDF A4 avec du contenu textuel optimisé
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

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
    const invoiceText = `FACTURE ${invoiceData.invoiceNumber}`;
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
    dateY = addText(`Date: ${invoiceData.currentDate}`, dateX, dateY, { fontSize: 9 });
    dateY = addText(`Validité: ${invoiceData.validityDateStr}`, dateX, dateY + 2, { fontSize: 9 });
    dateY = addText(`Heure: ${new Date().toLocaleTimeString('fr-FR')}`, dateX, dateY + 2, { fontSize: 9 });

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
    clientY = addText(`Nom: ${invoiceData.orderData.name}`, margin + 5, clientY + 5, { fontSize: 10 });
    clientY = addText(`Email: ${invoiceData.orderData.email}`, margin + 5, clientY + 3, { fontSize: 10 });
    clientY = addText(`Téléphone: ${invoiceData.orderData.phone}`, margin + 5, clientY + 3, { fontSize: 10 });

    // Informations service
    const serviceX = margin + colWidth + 10;
    pdf.setFillColor(248, 249, 250);
    pdf.rect(serviceX, currentY, colWidth, 35, 'F');
    pdf.setDrawColor(...primaryColor);
    pdf.rect(serviceX, currentY, colWidth, 35);

    let serviceY = currentY + 5;
    serviceY = addText('🎯 PRESTATION DEMANDÉE', serviceX + 5, serviceY, { fontSize: 11, style: 'bold', color: primaryColor });
    serviceY = addText(`Service: ${invoiceData.orderData.serviceLabel}`, serviceX + 5, serviceY + 5, { fontSize: 10, maxWidth: colWidth - 10 });

    const delayText = invoiceData.orderData.delivery === 'urgent' ? 'Urgent (24h)' :
      invoiceData.orderData.delivery === 'short' ? 'Court terme (3-7j)' :
        invoiceData.orderData.delivery === 'medium' ? 'Moyen terme (2-4 sem.)' :
          invoiceData.orderData.delivery === 'long' ? 'Long terme (1-6 mois)' : 'Standard';
    serviceY = addText(`Délai: ${delayText}`, serviceX + 5, serviceY + 3, { fontSize: 10 });

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
      `→ ${invoiceData.orderData.serviceLabel}`,
      invoiceData.currentDate,
      '1,00',
      'pcs',
      formatFcfa(invoiceData.orderData.basePrice || invoiceData.orderData.finalPrice),
      formatFcfa(invoiceData.orderData.finalPrice)
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

    // Si remise appliquée
    if (invoiceData.orderData.coupon) {
      currentY = addText(`Sous-total TTC: ${formatFcfa(invoiceData.orderData.basePrice)}`, totalX, currentY, { fontSize: 10 });
      currentY = addText(`Remise (${invoiceData.orderData.coupon.code} - ${invoiceData.orderData.coupon.percent}%): -${formatFcfa((invoiceData.orderData.basePrice || invoiceData.orderData.finalPrice) - invoiceData.orderData.finalPrice)}`, totalX, currentY + 3, { fontSize: 10, color: [220, 53, 69] });
    }

    // Total final
    pdf.setFillColor(...secondaryColor);
    pdf.rect(totalX - 5, currentY + 2, 85, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    currentY = addText(`TOTAL TTC: ${formatFcfa(invoiceData.orderData.finalPrice)}`, totalX, currentY + 9, { fontSize: 12, color: [255, 255, 255] });

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
    currentY = addText(`Méthode: ${invoiceData.paymentMethod}`, margin + 5, currentY + 5, { fontSize: 10 });
    currentY = addText(`Statut: ✅ Payé le ${new Date().toLocaleString('fr-FR')}`, margin + 5, currentY + 3, { fontSize: 10, color: secondaryColor });
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
      title: `Facture ${invoiceData.invoiceNumber} - Enixis Corp`,
      subject: 'Facture Enixis Corp - Solutions IA & Optimisation Business',
      author: 'Enixis Corp',
      creator: 'Enixis Corp - Solutions IA & Optimisation Business',
      producer: 'Enixis Corp PDF Generator',
      keywords: 'facture, enixis corp, ia, optimisation, business, ' + invoiceData.orderData.serviceLabel
    });

    // Téléchargement automatique avec nom de fichier optimisé
    const fileName = `Facture_${invoiceData.invoiceNumber}_EnixisCorp.pdf`;
    pdf.save(fileName);

    console.log(`✅ PDF A4 textuel téléchargé avec succès: ${fileName}`);
    console.log('📄 Contenu: Format A4 optimisé avec texte sélectionnable et imprimable');

    return true;

  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    console.error('📋 Détails:', {
      hasInvoiceElement: !!invoiceElement,
      hasInvoiceData: !!invoiceData,
      hasJsPDF: !!window.jspdf,
      errorMessage: error.message
    });

    // Relancer l'erreur pour que le bouton puisse l'afficher
    throw error;
  }
}





// Event listeners pour la facture
const completeOrderBtn = document.getElementById('complete-order-btn');

completeOrderBtn?.addEventListener('click', () => {
  // L'utilisateur valide manuellement sa commande
  console.log('✅ Utilisateur a validé sa commande manuellement');

  // Rediriger vers la page d'accueil avec un message de succès
  sessionStorage.setItem('orderCompleted', 'true');
  window.location.href = 'index.html#success';
});

// Empêcher la fermeture accidentelle - l'utilisateur doit cliquer sur le bouton
invoicePopup?.addEventListener('click', (e) => {
  if (e.target === invoicePopup) {
    // Ne pas fermer automatiquement - afficher un message
    const completeBtn = document.getElementById('complete-order-btn');
    if (completeBtn) {
      completeBtn.style.animation = 'pulse 1s ease-in-out 3';
      completeBtn.style.background = '#28a745';
      completeBtn.style.transform = 'scale(1.05)';

      setTimeout(() => {
        completeBtn.style.animation = '';
        completeBtn.style.transform = '';
      }, 3000);
    }
  }
});

// Fonction pour générer un PDF avec jsPDF
async function generatePDFWithJsPDF(orderData, paymentMethod, invoiceNumber) {
  return new Promise((resolve, reject) => {
    try {
      // Attendre que jsPDF soit chargé
      if (typeof window.jspdf === 'undefined') {
        console.error('❌ jsPDF non chargé');
        reject(new Error('jsPDF non disponible'));
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

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
      const deliveryText = orderData.delivery === 'urgent' ? 'Urgent (24h)' : 
                          orderData.delivery === 'short' ? 'Court terme (3-7j)' : 
                          orderData.delivery === 'medium' ? 'Moyen terme (2-4 sem.)' : 
                          orderData.delivery === 'long' ? 'Long terme (1-6 mois)' : 'Standard';

      // Couleurs
      const primaryColor = [10, 15, 44]; // #0A0F2C
      const greenColor = [40, 167, 69]; // #28a745
      const grayColor = [102, 102, 102]; // #666

      let yPos = 20;

      // === HEADER ===
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('ENIXIS CORP', 20, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('contacteccorp@gmail.com', 20, 27);
      doc.text('+228 97 57 23 46', 20, 32);
      doc.text('https://enixis-corp.vercel.app', 20, 37);

      // Numéro de facture (à droite)
      doc.setFillColor(220, 53, 69);
      doc.roundedRect(140, 15, 55, 10, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(invoiceNumber, 167.5, 21.5, { align: 'center' });

      doc.setTextColor(...grayColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${invoiceDate}`, 195, 28, { align: 'right' });
      doc.text(`Validité: ${validityDateStr}`, 195, 33, { align: 'right' });
      doc.text(`Heure: ${invoiceTime}`, 195, 38, { align: 'right' });

      yPos = 50;

      // === INFORMATIONS CLIENT ET SERVICE ===
      doc.setFillColor(248, 249, 250);
      doc.rect(15, yPos, 85, 35, 'F');
      doc.rect(110, yPos, 85, 35, 'F');

      // Bordure gauche bleue
      doc.setFillColor(...primaryColor);
      doc.rect(15, yPos, 2, 35, 'F');
      doc.rect(110, yPos, 2, 35, 'F');

      // Client
      doc.setTextColor(...primaryColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('📋 Informations Client', 20, yPos + 7);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(orderData.name, 20, yPos + 15);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(orderData.email, 20, yPos + 21);
      doc.text(orderData.phone, 20, yPos + 27);

      // Service
      doc.setTextColor(...primaryColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('🎯 Prestation Demandée', 115, yPos + 7);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const serviceLines = doc.splitTextToSize(orderData.serviceLabel, 75);
      doc.text(serviceLines, 115, yPos + 15);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Délai: ${deliveryText}`, 115, yPos + 15 + (serviceLines.length * 5));

      yPos += 45;

      // === TABLEAU ===
      doc.setFillColor(30, 58, 138);
      doc.rect(15, yPos, 180, 10, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPTION', 20, yPos + 7);
      doc.text('DATE', 90, yPos + 7);
      doc.text('QTÉ', 120, yPos + 7);
      doc.text('PRIX UNIT.', 140, yPos + 7);
      doc.text('MONTANT', 175, yPos + 7, { align: 'right' });

      yPos += 10;

      // Ligne du tableau
      doc.setFillColor(255, 255, 255);
      doc.rect(15, yPos, 180, 12, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.line(15, yPos + 12, 195, yPos + 12);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(orderData.serviceLabel, 65);
      doc.text(descLines, 20, yPos + 7);
      doc.text(invoiceDate, 90, yPos + 7);
      doc.text('1,00', 120, yPos + 7);
      doc.text(formatFcfa(orderData.basePrice || orderData.finalPrice), 140, yPos + 7);
      doc.text(formatFcfa(orderData.finalPrice), 190, yPos + 7, { align: 'right' });

      yPos += 20;

      // === TOTAUX ===
      const totalsX = 120;
      
      // Si code promo
      if (orderData.coupon) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Sous-total TTC', totalsX, yPos);
        doc.text(formatFcfa(orderData.basePrice || orderData.finalPrice), 190, yPos, { align: 'right' });
        yPos += 7;

        doc.setTextColor(220, 53, 69);
        doc.setFont('helvetica', 'bold');
        doc.text(`Remise (${orderData.coupon.code} - ${orderData.coupon.percent}%)`, totalsX, yPos);
        doc.text(`-${formatFcfa((orderData.basePrice || orderData.finalPrice) - orderData.finalPrice)}`, 190, yPos, { align: 'right' });
        yPos += 10;
      }

      // Total final
      doc.setFillColor(248, 249, 250);
      doc.rect(totalsX - 5, yPos - 5, 75, 12, 'F');
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.rect(totalsX - 5, yPos - 5, 75, 12);

      doc.setTextColor(...primaryColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Total TTC', totalsX, yPos + 3);
      doc.text(formatFcfa(orderData.finalPrice), 190, yPos + 3, { align: 'right' });

      yPos += 20;

      // === INFORMATIONS DE PAIEMENT ===
      doc.setFillColor(232, 245, 232);
      doc.rect(15, yPos, 180, 30, 'F');
      doc.setFillColor(...greenColor);
      doc.rect(15, yPos, 2, 30, 'F');

      doc.setTextColor(...greenColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('💳 Informations de Paiement', 20, yPos + 7);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Méthode de paiement: ${paymentMethod}`, 20, yPos + 15);
      
      doc.setTextColor(...greenColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`✅ Payé le ${invoiceDate} à ${invoiceTime}`, 20, yPos + 21);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('🔒 Transaction sécurisée et validée', 20, yPos + 27);

      // === FOOTER ===
      yPos = 260;
      doc.setDrawColor(224, 224, 224);
      doc.line(15, yPos, 195, yPos);

      doc.setTextColor(...grayColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('🎉 Merci pour votre commande !', 105, yPos + 7, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Cette facture a été générée automatiquement et envoyée à notre équipe.', 105, yPos + 13, { align: 'center' });
      doc.text('Nous commencerons le travail selon le délai convenu.', 105, yPos + 18, { align: 'center' });
      doc.text('Contact: contacteccorp@gmail.com | +228 97 57 23 46', 105, yPos + 23, { align: 'center' });

      // Convertir en base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      console.log('✅ PDF généré avec jsPDF');
      resolve(pdfBase64);

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      reject(error);
    }
  });
}

// Fonction principale pour générer et envoyer la facture avec validation de paiement
async function generateAndSendInvoiceWithValidation(orderData, paymentMethod) {
  try {
    // Générer un numéro de facture
    const invoiceNumber = generateInvoiceNumber();

    console.log('🔄 Génération du PDF depuis HTML avec design complet...');
    
    let pdfBase64;
    
    // Essayer d'abord avec la nouvelle méthode HTML (design complet)
    if (typeof window.generateInvoicePDFFromHTML === 'function') {
      try {
        pdfBase64 = await window.generateInvoicePDFFromHTML(orderData, paymentMethod, invoiceNumber);
        console.log('✅ PDF généré avec html2canvas (design complet), taille:', pdfBase64.length, 'caractères');
      } catch (htmlError) {
        console.warn('⚠️ Erreur avec html2canvas, fallback vers jsPDF simple:', htmlError);
        // Fallback vers la méthode jsPDF simple
        pdfBase64 = await generatePDFWithJsPDF(orderData, paymentMethod, invoiceNumber);
        console.log('✅ PDF généré avec jsPDF (fallback), taille:', pdfBase64.length, 'caractères');
      }
    } else {
      // Si la fonction n'est pas disponible, utiliser jsPDF simple
      console.warn('⚠️ generateInvoicePDFFromHTML non disponible, utilisation de jsPDF simple');
      pdfBase64 = await generatePDFWithJsPDF(orderData, paymentMethod, invoiceNumber);
      console.log('✅ PDF généré avec jsPDF, taille:', pdfBase64.length, 'caractères');
    }

    // Envoyer la notification de validation de paiement avec le PDF en Data URL
    await sendPaymentValidationWithInvoice(paymentMethod, orderData, pdfBase64, invoiceNumber);

    // Afficher un message de confirmation simple à l'utilisateur
    showPaymentConfirmation(orderData, paymentMethod, invoiceNumber);

    console.log('✅ Notification Slack envoyée avec PDF téléchargeable');

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification:', error);

    // Afficher quand même la confirmation à l'utilisateur
    showPaymentConfirmation(orderData, paymentMethod, 'ERREUR_' + Date.now());
  }
}

// Rendre les fonctions accessibles globalement
window.copyWalletAddress = copyWalletAddress;
window.downloadInvoiceFromStorage = downloadInvoiceFromStorage;
window.getInvoiceFromLocalStorage = getInvoiceFromLocalStorage;


// Fonctions pour gérer les changements d'état des boutons Slack (pour future intégration webhook)

// Fonction pour mettre à jour le statut d'un bouton (simulation)
function updateSlackButtonStatus(buttonName, invoiceNumber, newStatus) {
  console.log(`🔄 Mise à jour statut bouton: ${buttonName} pour ${invoiceNumber} -> ${newStatus}`);

  // Dans un environnement réel avec webhook Slack, cette fonction :
  // 1. Recevrait les événements de clic de bouton depuis Slack
  // 2. Mettrait à jour le message original avec les nouveaux statuts
  // 3. Changerait les couleurs des boutons (orange -> vert)

  const statusUpdates = {
    'confirm_payment': {
      text: '✅ PAIEMENT CONFIRMÉ',
      style: 'primary', // Vert dans Slack
      color: 'good'
    },
    'finalize_order': {
      text: '✅ COMMANDE FINALISÉE',
      style: 'primary', // Vert dans Slack
      color: 'good'
    }
  };

  return statusUpdates[buttonName] || null;
}

// Fonction pour créer un message Slack mis à jour (pour webhook)
function createUpdatedSlackMessage(originalPayload, buttonUpdates) {
  // Cette fonction serait utilisée par un webhook pour mettre à jour
  // le message original avec les nouveaux statuts des boutons

  const updatedPayload = { ...originalPayload };

  if (updatedPayload.attachments && updatedPayload.attachments[0]) {
    // Mettre à jour les boutons avec les nouveaux statuts
    if (updatedPayload.attachments[0].actions) {
      updatedPayload.attachments[0].actions = updatedPayload.attachments[0].actions.map(action => {
        if (buttonUpdates[action.name]) {
          return {
            ...action,
            text: buttonUpdates[action.name].text,
            style: buttonUpdates[action.name].style
          };
        }
        return action;
      });
    }

    // Mettre à jour la couleur de l'attachment si tous les boutons sont confirmés
    const allConfirmed = Object.keys(buttonUpdates).length >= 2;
    if (allConfirmed) {
      updatedPayload.attachments[0].color = 'good';
    }
  }

  return updatedPayload;
}

// Note: Pour implémenter complètement cette fonctionnalité, il faudrait :
// 1. Configurer un webhook Slack dans les paramètres de l'app Slack
// 2. Créer un endpoint serveur pour recevoir les événements de boutons
// 3. Utiliser l'API Slack pour mettre à jour les messages originaux
// 4. Gérer l'authentification et les tokens Slack

console.log('📱 Fonctions de gestion des boutons Slack chargées (webhook requis pour activation complète)');