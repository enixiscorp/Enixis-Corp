// Logique du formulaire de demande + prix dynamique + envoi Slack

const formEl = document.getElementById('request-form');
const serviceEl = document.getElementById('service');
const priceBox = document.getElementById('price-box');
const noteEl = document.getElementById('request-note');

const hasIssueEl = document.getElementById('has_issue');
const issueBlock = document.getElementById('issue_block');
const issueTypeEl = document.getElementById('issue_type');
const issueDetailsRow = document.getElementById('issue_details_row');
const issueDetailsEl = document.getElementById('issue_details');
const budgetRow = document.getElementById('budget_row');
const budgetAmountEl = document.getElementById('budget_amount');

// Envoi Slack: 2 modes
// - Mode A (proxy): POST vers /api/slack (recommandé)
// - Mode B (env.js public): POST direct vers Slack via window.env.SLACK_WEBHOOK_URL (expérimental)
const SLACK_PROXY_ENDPOINT = '/api/slack';

function getSlackWebhookUrl() {
  const fromEnv = (window.env && window.env.SLACK_WEBHOOK_URL) ? String(window.env.SLACK_WEBHOOK_URL) : '';
  return fromEnv.trim();
}

function formatFcfa(amount) {
  if (amount === null || amount === undefined || amount === '') return 'Tarif à définir';
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return 'Tarif à définir';
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

function serviceLabel(value) {
  const map = {
    cv_creation: "✍️ Création de CV sur mesure + Lettre – 7 000 FCFA",
    cv_optimisation: "✍️ Optimisation de CV sur mesure – 3 500 FCFA",
    partnership_letters: "🤝 Rédaction Demandes Partenariat/Sponsoring – 10 000 FCFA",
    linkedin_branding: "🧑‍💼 Personal Branding & LinkedIn – tarif à définir",
    coaching_emploi: "🎓 Formation Coaching Emploi – 15 000 FCFA",
    productivity: "🚀 Formation Booster la productivité – 10 000 FCFA",
    excel_analytics: "📊 Formation Analyse de données via Excel – 25 000 FCFA",
    ai_training: "🤖 Formation IA – 5 000 FCFA",
    office_suite: "💼 Formation Optimisée Suite Office – 30 000 FCFA",
    marketing_strategy: "📈 Optimisation de Procédures Marketing & Stratégie – 50 000 FCFA",
    support_procedures: "🛠 Optimisation de Procédures Support Client – 100 000 FCFA",
    project_procedures: "🔍 Optimisation de Procédures Projets – 150 000 FCFA",
    erp_ai: "🔗 Intégration et Automatisations ERP/IA – 250 000 FCFA",
    simple_sheet: "📄 Système Excel ou Google Sheets simple – 30 000 FCFA",
    dashboard_file: "📊 Système Fichier automatisé avec tableaux de bord – 50 000 FCFA",
    semi_pro_system: "💻 Système semi-professionnel (Web/PC) – 100 000 FCFA",
    custom_app: "📱 Système d'Application personnalisée (Web/App) – 200 000 FCFA",
    website_creation: "🌐 Création de Site Web – 80 000 FCFA"
  };
  return map[value] || value;
}

function updatePrice() {
  const option = serviceEl.options[serviceEl.selectedIndex];
  if (!option) { priceBox.textContent = '—'; return; }
  const raw = option.getAttribute('data-price');
  priceBox.textContent = formatFcfa(raw);
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

async function submitToSlack(payload) {
  const directUrl = getSlackWebhookUrl();
  // Mode B: envoi direct (no-cors), sinon fallback proxy
  if (directUrl) {
    try {
      // no-cors: on ne lit pas la réponse, mais l'appel est déclenché
      await fetch(directUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
        keepalive: true
      });
      return; // considérer comme envoyé (pas de lecture de réponse en no-cors)
    } catch (e) {
      // Fallback sendBeacon si fetch échoue
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const ok = navigator.sendBeacon(directUrl, blob);
        if (ok) return; // considérer comme envoyé
      } catch {}
      // En mode GitHub Pages (statique), ne pas tenter de proxy inexistant
      throw new Error(`Erreur d'envoi direct: ${e.message}`);
    }
  }

  // Si aucune URL directe n'est fournie, lever une erreur explicite
  throw new Error('SLACK_WEBHOOK_URL manquant dans window.env - veuillez configurer env.js');
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

formEl?.addEventListener('submit', async (e) => {
  e.preventDefault();
  noteEl.textContent = '';

  const name = document.getElementById('client_name').value.trim();
  const email = document.getElementById('client_email').value.trim();
  const phone = document.getElementById('client_phone').value.trim();
  const service = serviceEl.value;
  const price = serviceEl.options[serviceEl.selectedIndex]?.getAttribute('data-price') || '';
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

  const slackText = buildSlackText({ name, email, phone, service, price, details, issue });

  try {
    await submitToSlack({ text: slackText });
    noteEl.textContent = 'Votre demande a été envoyée. Merci !';
    formEl.reset();
    updatePrice();
    toggleIssueBlock();
  } catch {
    noteEl.textContent = "Erreur lors de l'envoi. Veuillez réessayer plus tard.";
  }
});

// Init
updatePrice();
toggleIssueBlock();


