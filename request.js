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

// Envoi Slack: 2 modes
// - Mode A (proxy): POST vers /api/slack (recommandé)
// - Mode B (env.js public): POST direct vers Slack via window.env.SLACK_WEBHOOK_URL (repli)
const API_BASE = (window.env && window.env.API_BASE) ? String(window.env.API_BASE).replace(/\/$/, '') : '';
const SLACK_PROXY_ENDPOINT = `${API_BASE}/api/slack`;

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
  alertMsg.textContent = message;
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
  // 1) Essayer le proxy sécurisé
  try {
    const resp = await fetch(SLACK_PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit'
    });
    if (resp.ok) return;
    const err = await resp.json().catch(async () => ({ raw: await resp.text().catch(() => '') }));
    console.error('Proxy Slack error:', resp.status, err);
    // Si le proxy répond mais en erreur, essayer le repli direct si configuré
  } catch {}

  // 2) Repli: envoi direct si une URL publique est définie (optionnel)
  const directUrl = getSlackWebhookUrl();
  if (directUrl) {
    try {
      await fetch(directUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
        keepalive: true
      });
      return;
    } catch (e) {
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const ok = navigator.sendBeacon(directUrl, blob);
        if (ok) return;
      } catch {}
      throw new Error(`Erreur d'envoi direct: ${e.message}`);
    }
  }

  // 3) Aucune option disponible
  throw new Error('Aucun canal d\'envoi disponible (proxy injoignable et SLACK_WEBHOOK_URL absent)');
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

formEl?.addEventListener('change', (e) => {
  if (e.target === serviceEl) updatePrice();
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

  const name = document.getElementById('client_name').value.trim();
  const email = document.getElementById('client_email').value.trim();
  const phone = document.getElementById('client_phone').value.trim();
  const service = serviceEl.value;
  const serviceData = SERVICES[service];
  const basePrice = serviceData ? serviceData.price : '';
  const price = basePrice ? computeDeliveryAdjustedPrice(computeDiscountedPrice(basePrice)) : '';
  const delivery = deliveryTimeEl?.value || '';
  const details = document.getElementById('additional_details').value.trim();

  if (!name || !email || !phone || !service) {
    noteEl.textContent = 'Merci de compléter les champs requis.';
    return;
  }

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
      formEl.reset();
      appliedCoupon = null;
      updatePrice();
      toggleIssueBlock();
      togglePromoBlock();
    } catch {
      noteEl.textContent = "Erreur lors de l'envoi. Veuillez réessayer plus tard.";
    }
  });
});

// Génération automatique des options
function populateServiceOptions() {
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

// Init
populateServiceOptions();
updatePrice();
toggleIssueBlock();
togglePromoBlock();

// Order summary popup
const orderPopup = document.getElementById('order-popup');
const orderClose = orderPopup ? orderPopup.querySelector('.popup-close') : null;
const orderSummaryEl = document.getElementById('order-summary');
const orderConfirmBtn = document.getElementById('confirm-order-btn');
const orderCancelBtn = document.getElementById('cancel-order-btn');

let orderConfirmCallback = null;

function currencyPair(base, final) {
  if (final !== undefined && final !== null && final !== '' && final !== base) {
    return `${formatFcfa(final)} (au lieu de ${formatFcfa(base)})`;
  }
  return formatFcfa(base);
}

function showOrderSummary(data, onConfirm) {
  if (!orderPopup) return;
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
  thanks.innerHTML = `<p style="margin-top:12px;">💬 Merci pour votre commande !<br>Nous vous contacterons sous 15 - 30 minutes pour confirmer les prochaines étapes. Pour toute question urgente, contactez-nous à <a href="mailto:contacteccorp@gmail.com">contacteccorp@gmail.com</a> ou au <a href="https://wa.me/22897572346" target="_blank" rel="noopener">+228 97572346</a>.</p>`;
  orderSummaryEl.appendChild(thanks);
  orderPopup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  orderConfirmCallback = onConfirm;
}

function hideOrderSummary() {
  if (!orderPopup) return;
  orderPopup.style.display = 'none';
  document.body.style.overflow = '';
  orderConfirmCallback = null;
}

orderClose?.addEventListener('click', hideOrderSummary);
orderCancelBtn?.addEventListener('click', hideOrderSummary);
orderPopup?.addEventListener('click', (e) => { if (e.target === orderPopup) hideOrderSummary(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && orderPopup?.style.display === 'flex') hideOrderSummary(); });
orderConfirmBtn?.addEventListener('click', async () => {
  if (typeof orderConfirmCallback === 'function') {
    // état visuel d'envoi
    try {
      orderConfirmBtn.disabled = true;
      orderConfirmBtn.textContent = 'Envoi en cours…';
      await orderConfirmCallback();
    } catch (e) {
      showAlert((e && e.message) ? e.message : 'Échec d\'envoi');
    } finally {
      orderConfirmBtn.disabled = false;
      orderConfirmBtn.textContent = 'Confirmer et envoyer';
      hideOrderSummary();
    }
  } else {
    hideOrderSummary();
  }
});


