// Config à compléter: mettez vos variables d'environnement publiques Supabase
const SUPABASE_URL = window.env?.SUPABASE_URL || 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = window.env?.SUPABASE_ANON_KEY || 'YOUR-ANON-KEY';
const SUPABASE_BUCKET = 'orders'; // créez ce bucket côté Supabase Storage

// Webhook Slack (Incoming Webhook) - à définir côté secret (proxy recommandé)
const SLACK_WEBHOOK_URL = window.env?.SLACK_WEBHOOK_URL || '';

// Initialisation Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateFilePath(userEmail, originalName) {
  const safeEmail = (userEmail || 'unknown').replace(/[^a-z0-9@._-]/gi, '_');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `${safeEmail}/${ts}-${originalName}`;
}

function serviceLabel(value) {
  const map = {
    cv_creation: '✍️ Création de CV sur mesure + Lettre – 7 000 FCFA',
    cv_optimisation: '✍️ Optimisation de CV sur mesure – 3 500 FCFA',
    partnership_letters: '🤝 Demandes Partenariat/Sponsoring – 10 000 FCFA',
    linkedin_branding: '🧑‍💼 Personal Branding LinkedIn – tarif à définir',
    coaching_emploi: '🎓 Formation Coaching Emploi – 15 000 FCFA',
    productivity: '🚀 Formation Booster la productivité – 10 000 FCFA',
    excel_analytics: '📊 Formation Analyse de données via Excel – 25 000 FCFA',
    ai_training: '🤖 Formation IA – 5 000 FCFA',
    office_suite: '💼 Formation Optimisée Suite Office – 30 000 FCFA',
    marketing_strategy: '📈 Optimisation Marketing & Stratégie – 50 000 FCFA',
    support_procedures: '🛠️ Optimisation Support Client – 100 000 FCFA',
    project_procedures: '🔍 Optimisation Procédures Projets – 150 000 FCFA',
    erp_ai: '🔗 Intégrations & Automatisations ERP/IA – 250 000 FCFA',
    simple_sheet: '📄 Système Excel/Google Sheets simple – 30 000 FCFA',
    dashboard_file: '📊 Système Fichier + tableaux de bord – 50 000 FCFA',
    semi_pro_system: '💻 Système semi-professionnel (Web/PC) – 100 000 FCFA',
    custom_app: '📱 Application personnalisée (Web/App) – 200 000 FCFA',
    website_creation: '🌐 Création de Site Web – 80 000 FCFA'
  };
  return map[value] || value;
}

async function postToSlack(payload) {
  if (!SLACK_WEBHOOK_URL) return; // facultatif si non configuré
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    // Ignorer l'erreur Slack pour ne pas bloquer l'utilisateur
    console.warn('Slack webhook error:', e);
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const note = document.getElementById('order-note');
  note.textContent = '';

  const full_name = document.getElementById('full_name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const service = document.getElementById('service').value;
  const budget = Number(document.getElementById('budget').value || 0);
  const details = document.getElementById('details').value.trim();
  const fileInput = document.getElementById('attachment');
  const file = fileInput.files && fileInput.files[0];

  if (!full_name || !email || !phone || !service || !budget) {
    note.textContent = 'Merci de compléter tous les champs requis.';
    return;
  }

  // 1) Upload fichier si fourni
  let file_public_url = null;
  let file_path = null;
  if (file) {
    try {
      file_path = generateFilePath(email, file.name);
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from(SUPABASE_BUCKET)
        .upload(file_path, file, { upsert: false });
      if (uploadError) throw uploadError;
      // Récupérer URL publique si la policy du bucket l'autorise
      const { data: publicUrl } = supabaseClient.storage.from(SUPABASE_BUCKET).getPublicUrl(file_path);
      file_public_url = publicUrl?.publicUrl || null;
    } catch (err) {
      note.textContent = "Erreur d'upload du fichier. Réessayez ou envoyez sans fichier.";
      return;
    }
  }

  // 2) Insert en base
  try {
    const { data, error } = await supabaseClient.from('orders').insert({
      full_name,
      email,
      phone,
      service,
      budget,
      details,
      file_path,
      file_public_url
    }).select().single();
    if (error) throw error;

    note.textContent = 'Commande envoyée avec succès. Merci !';
    form.reset();

    // 3) Slack
    const slackText = [
      `Nouvelle commande Enixis Corp`,
      `• Nom: ${full_name}`,
      `• Email: ${email}`,
      `• Téléphone: ${phone}`,
      `• Prestation: ${serviceLabel(service)}`,
      `• Budget estimé: ${budget.toLocaleString('fr-FR')} FCFA`,
      details ? `• Détails: ${details}` : null,
      file_public_url ? `• Fichier: ${file_public_url}` : null
    ].filter(Boolean).join('\n');

    await postToSlack({ text: slackText });
  } catch (err) {
    note.textContent = "Erreur lors de l'enregistrement de la commande.";
  }
}

document.getElementById('order-form')?.addEventListener('submit', handleSubmit);


