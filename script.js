// Menu mobile
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#primary-nav');
const links = document.querySelectorAll('.nav-link');

function closeNav() {
  nav.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}

toggle?.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  nav.classList.toggle('open');
});

links.forEach(l => l.addEventListener('click', () => closeNav()));

// Scrollspy: surligner le lien actif
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];

function setActive(hash) {
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
}

const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setActive(`#${entry.target.id}`);
    }
  });
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 });

sections.forEach(sec => spyObserver.observe(sec));

// Reveal on scroll
const revealTargets = document.querySelectorAll('[data-animate]');
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    const el = entry.target;
    if (entry.isIntersecting) {
      el.classList.add('revealed');
      obs.unobserve(el);
    }
  });
}, { threshold: 0.15 });

revealTargets.forEach(el => revealObserver.observe(el));

// Bouton retour en haut
const toTop = document.querySelector('.to-top');
window.addEventListener('scroll', () => {
  const y = window.scrollY || document.documentElement.scrollTop;
  toTop?.classList.toggle('visible', y > 600);
});

toTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Année dynamique footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Formulaire: génération message Mail / WhatsApp
const form = document.querySelector('.contact-form');
const note = document.querySelector('.form-note');
const channel = document.getElementById('channel');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const messageInput = document.getElementById('message');
const preview = document.getElementById('preview');
const copyOnlyBtn = document.getElementById('copy-only');
const cancelBtn = document.getElementById('cancel-form');

const COMPANY_EMAIL = 'contacteccorp@gmail.com';
const COMPANY_WHATSAPP = '22897572346'; // format international sans +

function buildSubject() {
  const ch = channel?.value === 'whatsapp' ? 'WhatsApp' : 'Mail';
  return `Demande de contact via ${ch} – ${nameInput.value || 'Prospect'}`;
}

function buildBody() {
  const lines = [];
  if (nameInput.value) lines.push(`Nom: ${nameInput.value}`);
  if (channel?.value === 'email' && emailInput.value) lines.push(`Email: ${emailInput.value}`);
  if (channel?.value === 'whatsapp' && phoneInput.value) lines.push(`Téléphone: ${phoneInput.value}`);
  if (messageInput.value) lines.push(`Message: ${messageInput.value}`);
  lines.push('\n— Envoyé depuis le site Enixis Corp');
  return lines.join('\n');
}

function updatePreview() {
  const subject = buildSubject();
  const body = buildBody();
  preview.value = `${subject}\n\n${body}`;
}

function updateFieldRequirements() {
  const isEmail = channel?.value === 'email';
  emailInput.required = isEmail;
  phoneInput.required = !isEmail; // whatsapp
}

function clearForm() {
  // Réinitialiser tous les champs
  nameInput.value = '';
  emailInput.value = '';
  phoneInput.value = '';
  messageInput.value = '';
  preview.value = '';
  
  // Réinitialiser le canal à email par défaut
  channel.value = 'email';
  
  // Mettre à jour les exigences des champs
  updateFieldRequirements();
  
  // Mettre à jour l'aperçu
  updatePreview();
  
  // Afficher un message de confirmation
  note.textContent = 'Formulaire effacé. Vous pouvez recommencer.';
  
  // Effacer le message après 3 secondes
  setTimeout(() => {
    note.textContent = '';
  }, 3000);
}

['input','change','keyup'].forEach(evt => {
  form?.addEventListener(evt, updatePreview);
});
channel?.addEventListener('change', () => { updateFieldRequirements(); updatePreview(); });

copyOnlyBtn?.addEventListener('click', async () => {
  updatePreview();
  try {
    await navigator.clipboard.writeText(preview.value);
    note.textContent = 'Aperçu copié dans le presse-papiers.';
  } catch {
    note.textContent = 'Impossible de copier automatiquement. Sélectionnez et copiez manuellement.';
  }
});

cancelBtn?.addEventListener('click', () => {
  clearForm();
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  updateFieldRequirements();
  if (!form.checkValidity()) {
    note.textContent = 'Merci de compléter les champs requis.';
    return;
  }
  updatePreview();
  const subject = buildSubject();
  const body = buildBody();

  try {
    await navigator.clipboard.writeText(preview.value);
  } catch {}

  if (channel.value === 'email') {
    const mailto = `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    note.textContent = 'Ouverture de votre client mail…';
  } else {
    const wa = `https://wa.me/${COMPANY_WHATSAPP}?text=${encodeURIComponent(preview.value)}`;
    window.open(wa, '_blank', 'noopener');
    note.textContent = 'Ouverture de WhatsApp…';
  }
});

// Initial
updateFieldRequirements();
updatePreview();

// Pop-up des partenaires
const partnerData = {
  'clean-team': {
    logo: 'images/clean team service_logo.png',
    title: 'Clean Team Service',
    text: 'Nous avons sollicité Enixis Corp pour l\'optimisation de nos procédures internes, incluant la mise en place d\'un système de devis et de facturation, ainsi que l\'amélioration de la gestion des demandes clients et avis de satisfaction. Leur intervention a permis de rendre nos processus plus fluides, fiables et efficaces. Nous recommandons vivement Enixis Corp à toute entreprise souhaitant professionnaliser et simplifier sa gestion.'
  },
  'dadavi': {
    logo: 'images/dadavi ma nounou_logo.png',
    title: 'Dadavi Ma Nounou',
    text: 'Enixis Corp nous a accompagné dans l\'amélioration de notre organisation interne en prenant en charge le processus de recrutement, ce qui nous a permis de sélectionner efficacement les meilleurs candidats. L\'équipe a également géré nos réseaux sociaux avec des contenus éducatifs et valorisants, renforçant ainsi notre image auprès des parents et partenaires. Leur professionnalisme et leur efficacité font toute la différence.'
  },
  'engage-toi': {
    logo: 'images/engage-toi_logo.png',
    title: 'Engage-Toi',
    text: 'Enixis Corp valorise la culture africaine auprès des jeunes à travers des quiz interactifs, tout en renforçant notre visibilité et en soutenant nos actions sociales. Grâce à leurs partenariats stratégiques, nos lauréats bénéficient aussi de formations en coaching emploi, productivité et entrepreneuriat. Un partenaire fiable et visionnaire.'
  }
};

const popup = document.getElementById('partner-popup');
const popupLogo = document.getElementById('popup-logo');
const popupTitle = document.getElementById('popup-title');
const popupText = document.getElementById('popup-text');
const popupClose = document.querySelector('.popup-close');

function showPartnerPopup(partnerId) {
  const data = partnerData[partnerId];
  if (!data) return;
  
  popupLogo.src = data.logo;
  popupLogo.alt = `Logo ${data.title}`;
  popupTitle.textContent = data.title;
  popupText.textContent = data.text;
  
  popup.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Empêcher le scroll
}

function hidePartnerPopup() {
  popup.style.display = 'none';
  document.body.style.overflow = ''; // Restaurer le scroll
}

// Événements pour les logos cliquables
document.querySelectorAll('.clickable-logo').forEach(logo => {
  logo.addEventListener('click', () => {
    const partnerId = logo.getAttribute('data-partner');
    showPartnerPopup(partnerId);
  });
});

// Événements pour les boutons "Voir plus..."
document.querySelectorAll('.btn-see-more').forEach(button => {
  button.addEventListener('click', () => {
    const partnerId = button.getAttribute('data-partner');
    showPartnerPopup(partnerId);
  });
});

// Fermer le pop-up
popupClose.addEventListener('click', hidePartnerPopup);

// Fermer le pop-up en cliquant sur l'overlay
popup.addEventListener('click', (e) => {
  if (e.target === popup) {
    hidePartnerPopup();
  }
});

// Fermer le pop-up avec la touche Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && popup.style.display === 'flex') {
    hidePartnerPopup();
  }
});

// Carrousel des partenaires
const partnersCarousel = document.getElementById('partners-carousel');
const partnersPrev = document.getElementById('partners-prev');
const partnersNext = document.getElementById('partners-next');
let partnersCurrentIndex = 0;
const partnersItems = partnersCarousel?.querySelectorAll('.card');
const partnersTotalItems = partnersItems?.length || 0;

function updatePartnersCarousel() {
  if (!partnersCarousel || !partnersItems) return;
  const itemWidth = 100 / Math.min(partnersTotalItems, window.innerWidth >= 1000 ? 3 : window.innerWidth >= 700 ? 2 : 1);
  const translateX = -partnersCurrentIndex * itemWidth;
  partnersCarousel.style.transform = `translateX(${translateX}%)`;
  
  // Désactiver les boutons si nécessaire
  partnersPrev.style.opacity = partnersCurrentIndex === 0 ? '0.5' : '1';
  partnersNext.style.opacity = partnersCurrentIndex >= partnersTotalItems - (window.innerWidth >= 1000 ? 3 : window.innerWidth >= 700 ? 2 : 1) ? '0.5' : '1';
}

partnersPrev?.addEventListener('click', () => {
  if (partnersCurrentIndex > 0) {
    partnersCurrentIndex--;
    updatePartnersCarousel();
  }
});

partnersNext?.addEventListener('click', () => {
  const maxIndex = partnersTotalItems - (window.innerWidth >= 1000 ? 3 : window.innerWidth >= 700 ? 2 : 1);
  if (partnersCurrentIndex < maxIndex) {
    partnersCurrentIndex++;
    updatePartnersCarousel();
  }
});

// Carrousel des témoignages
const testimonialsCarousel = document.getElementById('testimonials-carousel');
const testimonialsPrev = document.getElementById('testimonials-prev');
const testimonialsNext = document.getElementById('testimonials-next');
let testimonialsCurrentIndex = 0;
const testimonialsItems = testimonialsCarousel?.querySelectorAll('.testimonial-category');
const testimonialsTotalItems = testimonialsItems?.length || 0;

function updateTestimonialsCarousel() {
  if (!testimonialsCarousel || !testimonialsItems) return;
  
  // Calculer le nombre d'éléments visibles selon la taille d'écran
  let itemsPerView = 1;
  if (window.innerWidth >= 1200) {
    itemsPerView = 3;
  } else if (window.innerWidth >= 900) {
    itemsPerView = 2;
  }
  
  const maxIndex = Math.max(0, testimonialsTotalItems - itemsPerView);
  const itemWidth = 100 / itemsPerView;
  const translateX = -testimonialsCurrentIndex * itemWidth;
  testimonialsCarousel.style.transform = `translateX(${translateX}%)`;
  
  // Désactiver les boutons si nécessaire
  testimonialsPrev.style.opacity = testimonialsCurrentIndex === 0 ? '0.5' : '1';
  testimonialsNext.style.opacity = testimonialsCurrentIndex >= maxIndex ? '0.5' : '1';
}

testimonialsPrev?.addEventListener('click', () => {
  if (testimonialsCurrentIndex > 0) {
    testimonialsCurrentIndex--;
    updateTestimonialsCarousel();
  }
});

testimonialsNext?.addEventListener('click', () => {
  // Calculer le nombre d'éléments visibles selon la taille d'écran
  let itemsPerView = 1;
  if (window.innerWidth >= 1200) {
    itemsPerView = 3;
  } else if (window.innerWidth >= 900) {
    itemsPerView = 2;
  }
  
  const maxIndex = Math.max(0, testimonialsTotalItems - itemsPerView);
  if (testimonialsCurrentIndex < maxIndex) {
    testimonialsCurrentIndex++;
    updateTestimonialsCarousel();
  }
});

// Initialiser les carrousels
window.addEventListener('resize', () => {
  updatePartnersCarousel();
  updateTestimonialsCarousel();
});

// Initialisation
updatePartnersCarousel();
updateTestimonialsCarousel();


