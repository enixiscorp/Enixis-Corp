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

  // Validation des champs requis avec messages spécifiques
  const validations = [
    { field: name, message: 'Le nom est requis' },
    { field: email, message: 'L\'email est requis' },
    { field: phone, message: 'Le téléphone est requis' },
    { field: service, message: 'Veuillez sélectionner une prestation' }
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
  const details = document.getElementById('additional_details').value.trim();

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
}

function showPaymentOptions(country) {
  hideCountrySelection();

  if (!currentOrderData) return;

  const amount = currentOrderData.finalPrice;
  const amountText = formatFcfa(amount);

  // Envoyer notification de sélection de pays
  const countryLabel = country === 'togo' ? '🇹🇬 Togo' : country === 'africa' ? '🌍 Afrique (autres pays)' : '🌎 Reste du Monde';
  sendCountrySelectionNotification(countryLabel, amount, currentOrderData);

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
        <div class="icon">📱</div>
        <div class="details">
          <h4>Flooz</h4>
          <p>Paiement mobile via Flooz</p>
        </div>
      </div>
      <div class="payment-method" data-method="mixx">
        <div class="icon">💳</div>
        <div class="details">
          <h4>Mixx by Yas</h4>
          <p>Paiement mobile via Mixx</p>
        </div>
      </div>
      <div class="payment-method" data-method="crypto">
        <div class="icon">₿</div>
        <div class="details">
          <h4>Cryptomonnaie</h4>
          <p>USDT ou BTC sur réseau TRC-20</p>
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
          <p>USDT ou BTC sur réseau TRC-20</p>
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

  // Envoyer notification Slack
  sendPaymentNotification('Flooz', amount, currentOrderData);

  // Ouvrir l'application de téléphone avec le code USSD
  setTimeout(() => {
    window.location.href = `tel:${encodeURIComponent(ussdCode)}`;
  }, 2000);
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

  // Envoyer notification Slack
  sendPaymentNotification('Mixx by Yas', amount, currentOrderData);

  // Ouvrir l'application de téléphone avec le code USSD
  setTimeout(() => {
    window.location.href = `tel:${encodeURIComponent(ussdCode)}`;
  }, 2000);
}

function showCryptoOptions(amount) {
  hidePaymentOptions();

  const cryptoHTML = `
    <div class="payment-instructions">
      <h4>₿ Paiement Cryptomonnaie</h4>
      <p><strong>Montant:</strong> ${formatFcfa(amount)}</p>
      <p>Choisissez votre cryptomonnaie (réseau TRC-20 uniquement) :</p>
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
        <strong>BTC (TRC-20)</strong><br>
        <small>Bitcoin sur réseau TRON</small>
      </div>
    </button>
  `;

  cryptoContent.innerHTML = cryptoHTML;

  // Envoyer notification Slack pour sélection crypto
  sendPaymentNotification('Cryptomonnaie (sélection)', amount, currentOrderData);

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

  const cryptoHTML = `
    <div class="payment-instructions">
      <h4>₿ Paiement ${cryptoType} (TRC-20)</h4>
      <p><strong>Montant:</strong> ${formatFcfa(amount)}</p>
      
      <div class="wallet-info">
        <h4>📍 Adresse de réception :</h4>
        <div class="wallet-address" id="wallet-address">${walletAddress}</div>
        <button class="copy-btn" onclick="copyWalletAddress()">📋 Copier l'adresse</button>
      </div>
      
      <ol>
        <li>Ouvrez votre wallet crypto (Trust Wallet, Binance, etc.)</li>
        <li>Sélectionnez ${cryptoType} sur le <strong>réseau TRC-20</strong></li>
        <li>Collez l'adresse ci-dessus comme destinataire</li>
        <li>Entrez le montant équivalent en ${cryptoType}</li>
        <li>Confirmez la transaction</li>
      </ol>
      
      <p style="color: #c00; font-weight: bold;">
        ⚠️ IMPORTANT : Utilisez uniquement le réseau TRC-20 !<br>
        Une fois le paiement effectué, nous recevrons automatiquement une notification.
      </p>
    </div>
  `;

  cryptoContent.innerHTML = cryptoHTML;

  // Envoyer notification Slack
  sendPaymentNotification(`${cryptoType} (TRC-20)`, amount, currentOrderData);
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

      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
      }, 2000);
    }).catch(() => {
      showAlert('Impossible de copier automatiquement. Veuillez sélectionner et copier manuellement.');
    });
  }
}

// Fonction pour envoyer la notification de sélection de pays à Slack
async function sendCountrySelectionNotification(country, amount, orderData) {
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

⏰ ${new Date().toLocaleString('fr-FR')}

ℹ️ Le client va maintenant choisir sa méthode de paiement.
  `.trim();

  try {
    await submitToSlack({ text: slackText });
    console.log('✅ Notification de sélection de pays envoyée');
  } catch (error) {
    console.error('❌ Erreur envoi notification pays:', error);
  }
}

// Fonction pour envoyer la notification de paiement à Slack
async function sendPaymentNotification(paymentMethod, amount, orderData) {
  const slackText = `
🔔 TENTATIVE DE PAIEMENT - Enixis Corp

💳 Méthode: ${paymentMethod}
💰 Montant: ${formatFcfa(amount)}

👤 Client:
• Nom: ${orderData.name}
• Email: ${orderData.email}
• Téléphone: ${orderData.phone}

📦 Commande:
• Prestation: ${orderData.serviceLabel}
• Délai: ${orderData.delivery || 'Non spécifié'}

⏰ ${new Date().toLocaleString('fr-FR')}

⚠️ Vérifiez la réception du paiement et confirmez la commande.
  `.trim();

  try {
    await submitToSlack({ text: slackText });
    console.log('✅ Notification de paiement envoyée');
  } catch (error) {
    console.error('❌ Erreur envoi notification paiement:', error);
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

// Country selection popup
countryClose?.addEventListener('click', hideCountrySelection);
countryPopup?.addEventListener('click', (e) => { if (e.target === countryPopup) hideCountrySelection(); });

countryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const country = btn.getAttribute('data-country');
    showPaymentOptions(country);
  });
});

// Payment options popup
paymentClose?.addEventListener('click', hidePaymentOptions);
paymentPopup?.addEventListener('click', (e) => { if (e.target === paymentPopup) hidePaymentOptions(); });

// Crypto payment popup
cryptoClose?.addEventListener('click', hideCryptoPayment);
cryptoPopup?.addEventListener('click', (e) => { if (e.target === cryptoPopup) hideCryptoPayment(); });

// Gestion des touches Escape pour tous les pop-ups
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (cryptoPopup?.style.display === 'flex') {
      hideCryptoPayment();
    } else if (paymentPopup?.style.display === 'flex') {
      hidePaymentOptions();
    } else if (countryPopup?.style.display === 'flex') {
      hideCountrySelection();
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

// Rendre la fonction copyWalletAddress accessible globalement
window.copyWalletAddress = copyWalletAddress;


