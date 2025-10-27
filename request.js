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
  if (!webhookUrl) {
    throw new Error('URL Slack webhook non configurée');
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
      await submitToSlack({ text: slackText });
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
document.addEventListener('DOMContentLoaded', function() {
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

  // Envoyer notification seulement pour le Togo (paiement direct)
  if (country === 'togo') {
    const countryLabel = '🇹🇬 Togo';
    sendCountrySelectionNotification(countryLabel, amount, currentOrderData);
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
    // Rediriger vers l'accueil après envoi
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
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
    // Rediriger vers l'accueil après envoi
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
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
        // Rediriger vers l'accueil après envoi
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      }, 3000);
    });
  }

  // Fallback : si l'utilisateur n'a pas copié après 30 secondes, générer quand même
  setTimeout(() => {
    if (!addressCopied) {
      // Pas de notification ici - sera envoyée avec la validation de paiement
      
      hideCryptoPayment();
      generateAndSendInvoiceWithValidation(currentOrderData, `${cryptoType} (${network})`);
      // Rediriger vers l'accueil après envoi
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
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

// Fonction pour envoyer la notification de sélection de pays à Slack
async function sendCountrySelectionNotification(country, amount, orderData) {
  const isTogoPayment = country.includes('🇹🇬');
  const paymentContext = isTogoPayment ? 
    'Le client peut choisir entre Flooz, Mixx by Yas ou Crypto.' :
    'Le client va procéder au paiement par cryptomonnaie.';

  const slackText = `
🌍 SÉLECTION DE PAYS - Enixis Corp

🏳️ Pays sélectionné: ${country}
💰 Montant: ${formatFcfa(amount)}

👤 Client:
• Nom: ${orderData.name}
• Email: ${orderData.email}
• Téléphone: ${orderData.phone}

📦 Commande:
• Prestation: ${orderData.serviceLabel}
• Délai: ${orderData.delivery || 'Non spécifié'}
${orderData.details ? `• Détails: ${orderData.details.substring(0, 100)}${orderData.details.length > 100 ? '...' : ''}` : ''}

⏰ ${new Date().toLocaleString('fr-FR')}

ℹ️ ${paymentContext}
  `.trim();

  try {
    await submitToSlack({ text: slackText });
    console.log('✅ Notification de sélection de pays envoyée');
  } catch (error) {
    console.error('❌ Erreur envoi notification pays:', error);
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

// Fonction sendPaymentNotification supprimée - remplacée par sendPaymentValidationWithInvoice

// Fonction pour envoyer la notification de validation de paiement avec facture
async function sendPaymentValidationWithInvoice(paymentMethod, orderData, invoiceBase64, invoiceNumber) {
  const companyEmail = (window.env && window.env.COMPANY_EMAIL) ? window.env.COMPANY_EMAIL : 'contacteccorp@gmail.com';
  
  const slackText = `
✅ PAIEMENT VALIDÉ - Enixis Corp

💳 Méthode: ${paymentMethod}
💰 Montant: ${formatFcfa(orderData.finalPrice)}
📄 Facture: ${invoiceNumber}

👤 Client:
• Nom: ${orderData.name}
• Email: ${orderData.email}
• Téléphone: ${orderData.phone}

📦 Commande:
• Prestation: ${orderData.serviceLabel}
• Délai: ${orderData.delivery || 'Non spécifié'}
${orderData.details ? `• Détails: ${orderData.details.substring(0, 100)}${orderData.details.length > 100 ? '...' : ''}` : ''}

⏰ ${new Date().toLocaleString('fr-FR')}

✅ PAIEMENT CONFIRMÉ - Commencez le travail selon le délai convenu.
📎 Facture PDF jointe ci-dessous.
📧 Facture également envoyée par email à ${companyEmail}
🚫 Pas de téléchargement automatique pour le client.
  `.trim();

  try {
    // Envoyer avec la facture en pièce jointe
    const payload = {
      text: slackText,
      attachments: [{
        color: 'good',
        title: `📄 ${invoiceNumber}.pdf`,
        text: `Facture générée automatiquement - ${formatFcfa(orderData.finalPrice)}`,
        fields: [
          {
            title: 'Client',
            value: `${orderData.name}\n${orderData.email}`,
            short: true
          },
          {
            title: 'Prestation',
            value: orderData.serviceLabel,
            short: true
          },
          {
            title: 'Montant Total',
            value: formatFcfa(orderData.finalPrice),
            short: true
          },
          {
            title: 'Méthode de Paiement',
            value: paymentMethod,
            short: true
          },
          {
            title: 'Email Équipe',
            value: companyEmail,
            short: true
          },
          {
            title: 'Status Téléchargement',
            value: '🚫 Pas de téléchargement client',
            short: true
          }
        ],
        footer: 'Enixis Corp - Système de Facturation',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    await submitToSlack(payload);
    console.log('✅ Notification de validation avec facture envoyée sur Slack');
  } catch (error) {
    console.error('❌ Erreur envoi validation paiement:', error);
    
    // Fallback sans pièce jointe
    try {
      await submitToSlack({ text: slackText });
      console.log('✅ Notification de validation envoyée (sans pièce jointe)');
    } catch (fallbackError) {
      console.error('❌ Erreur fallback:', fallbackError);
    }
  }
}

// Fonction pour envoyer un email réel avec EmailJS
async function sendRealEmail(toEmail, subject, body, pdfBase64, invoiceNumber, orderData) {
  try {
    // Configuration EmailJS (à configurer dans les variables d'environnement)
    const emailjsConfig = {
      serviceId: (window.env && window.env.EMAILJS_SERVICE_ID) || 'service_enixis',
      templateId: (window.env && window.env.EMAILJS_TEMPLATE_ID) || 'template_invoice',
      publicKey: (window.env && window.env.EMAILJS_PUBLIC_KEY) || ''
    };

    // Vérifier si EmailJS est disponible
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS non disponible');
    }

    // Initialiser EmailJS
    emailjs.init(emailjsConfig.publicKey);

    // Préparer les données pour le template
    const templateParams = {
      to_email: toEmail,
      subject: subject,
      message: body,
      invoice_number: invoiceNumber,
      client_name: orderData.name,
      client_email: orderData.email,
      client_phone: orderData.phone,
      service: orderData.serviceLabel,
      amount: formatFcfa(orderData.finalPrice),
      payment_method: orderData.paymentMethod || 'Non spécifié',
      date: new Date().toLocaleString('fr-FR'),
      pdf_attachment: pdfBase64 // Note: EmailJS a des limitations sur les pièces jointes
    };

    // Envoyer l'email
    const response = await emailjs.send(
      emailjsConfig.serviceId,
      emailjsConfig.templateId,
      templateParams
    );

    console.log('✅ Email envoyé via EmailJS:', response);
    return response;

  } catch (error) {
    console.error('❌ Erreur EmailJS:', error);
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
  
  // Envoyer notification Slack
  sendWhatsAppNotification(currentOrderData);
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
    sendCountrySelectionNotification(countryLabel, currentOrderData.finalPrice, currentOrderData);
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
  switch(orderData.delivery) {
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
    </div>
  `;
  
  invoiceContent.innerHTML = invoiceHTML;
  invoicePopup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

async function downloadInvoiceAsPDF() {
  const invoiceElement = document.getElementById('invoice-document');
  const invoiceData = window.currentInvoiceData;
  
  if (!invoiceElement || !invoiceData) {
    console.error('❌ Erreur lors de la génération du PDF');
    return;
  }

  try {
    // Créer le PDF avec jsPDF en format A4 universel
    const { jsPDF } = window.jspdf;
    
    // Forcer les dimensions A4 pour la capture
    const originalWidth = invoiceElement.style.width;
    const originalMaxWidth = invoiceElement.style.maxWidth;
    
    // Appliquer temporairement les dimensions A4 exactes
    invoiceElement.style.width = '210mm';
    invoiceElement.style.maxWidth = '210mm';
    
    // Attendre que le DOM se mette à jour
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Capturer avec des paramètres optimisés pour A4
    const canvas = await html2canvas(invoiceElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Équilibre entre qualité et performance
      useCORS: true,
      allowTaint: true,
      width: 794, // 210mm en pixels à 96 DPI
      height: 1123, // 297mm en pixels à 96 DPI
      logging: false,
      removeContainer: true,
      scrollX: 0,
      scrollY: 0
    });
    
    // Restaurer les styles originaux
    invoiceElement.style.width = originalWidth;
    invoiceElement.style.maxWidth = originalMaxWidth;
    
    const imgData = canvas.toDataURL('image/png', 0.95);
    
    // Créer le PDF A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Dimensions A4 exactes
    const pdfWidth = 210;
    const pdfHeight = 297;
    
    // Ajouter l'image en pleine page A4
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
    
    // Métadonnées du PDF
    pdf.setProperties({
      title: `Facture ${invoiceData.invoiceNumber}`,
      subject: 'Facture Enixis Corp',
      author: 'Enixis Corp',
      creator: 'Enixis Corp - Solutions IA & Optimisation Business',
      producer: 'Enixis Corp',
      keywords: 'facture, enixis corp, ia, optimisation'
    });
    
    // Téléchargement automatique
    pdf.save(`Facture_${invoiceData.invoiceNumber}.pdf`);
    
    console.log('✅ PDF A4 téléchargé automatiquement avec succès');
  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    // Fallback silencieux - pas d'alerte pour ne pas perturber l'UX
  }
}





// Event listeners pour la facture
const completeOrderBtn = document.getElementById('complete-order-btn');

completeOrderBtn?.addEventListener('click', () => {
  // Rediriger vers la page d'accueil
  window.location.href = 'index.html';
});

// Garder la possibilité de fermer en cliquant à l'extérieur
invoicePopup?.addEventListener('click', (e) => { 
  if (e.target === invoicePopup) {
    window.location.href = 'index.html';
  }
});

// Fonction principale pour générer et envoyer la facture avec validation de paiement
async function generateAndSendInvoiceWithValidation(orderData, paymentMethod) {
  try {
    // Générer d'abord la facture visible pour l'utilisateur
    showInvoice(orderData, paymentMethod);
    
    // Attendre que la facture soit rendue dans le DOM
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Générer le PDF de la facture
    const invoiceElement = document.getElementById('invoice-document');
    const invoiceData = window.currentInvoiceData;
    
    if (!invoiceElement || !invoiceData) {
      console.error('❌ Éléments de facture non trouvés');
      // Envoyer quand même la notification sans PDF
      await sendPaymentValidationWithInvoice(paymentMethod, orderData, null, 'ERREUR_PDF');
      return;
    }

    // Créer le PDF
    const { jsPDF } = window.jspdf;
    
    // Forcer les dimensions A4 pour la capture
    const originalWidth = invoiceElement.style.width;
    const originalMaxWidth = invoiceElement.style.maxWidth;
    
    invoiceElement.style.width = '210mm';
    invoiceElement.style.maxWidth = '210mm';
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const canvas = await html2canvas(invoiceElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      width: 794,
      height: 1123,
      logging: false,
      removeContainer: true,
      scrollX: 0,
      scrollY: 0
    });
    
    // Restaurer les styles
    invoiceElement.style.width = originalWidth;
    invoiceElement.style.maxWidth = originalMaxWidth;
    
    const imgData = canvas.toDataURL('image/png', 0.95);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, '', 'FAST');
    
    pdf.setProperties({
      title: `Facture ${invoiceData.invoiceNumber}`,
      subject: 'Facture Enixis Corp - Paiement Validé',
      author: 'Enixis Corp',
      creator: 'Enixis Corp - Solutions IA & Optimisation Business',
      producer: 'Enixis Corp'
    });
    
    // Convertir le PDF en base64 pour l'envoi
    const pdfBase64 = pdf.output('datauristring').split(',')[1];
    
    // Envoyer la notification de validation avec la facture sur Slack
    await sendPaymentValidationWithInvoice(paymentMethod, orderData, pdfBase64, invoiceData.invoiceNumber);
    
    // Envoyer la facture par email à l'équipe (simulation)
    await sendInvoiceByEmail(orderData, paymentMethod, pdfBase64, invoiceData.invoiceNumber);
    
    console.log('✅ Facture générée et envoyée sur Slack + Email (pas de téléchargement utilisateur)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération de facture:', error);
    
    // Fallback : envoyer au moins la notification de validation sans PDF
    const invoiceNumber = generateInvoiceNumber();
    await sendPaymentValidationWithInvoice(paymentMethod, orderData, null, invoiceNumber);
    
    // Afficher quand même la facture à l'utilisateur
    showInvoice(orderData, paymentMethod);
  }
}

// Rendre la fonction copyWalletAddress accessible globalement
window.copyWalletAddress = copyWalletAddress;


