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
  
  // Validation améliorée
  updateFieldRequirements();
  if (!form.checkValidity()) {
    note.textContent = 'Merci de compléter les champs requis.';
    note.style.color = '#dc3545';
    return;
  }
  
  // Validation des formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
  
  if (channel.value === 'email' && emailInput.value && !emailRegex.test(emailInput.value)) {
    note.textContent = 'Format d\'email invalide.';
    note.style.color = '#dc3545';
    return;
  }
  
  if (channel.value === 'whatsapp' && phoneInput.value && !phoneRegex.test(phoneInput.value)) {
    note.textContent = 'Format de téléphone invalide.';
    note.style.color = '#dc3545';
    return;
  }
  
  updatePreview();
  const subject = buildSubject();
  const body = buildBody();

  // Copie dans le presse-papiers avec gestion d'erreur
  try {
    await navigator.clipboard.writeText(preview.value);
    console.log('✅ Contenu copié dans le presse-papiers');
  } catch (clipboardError) {
    console.warn('⚠️ Impossible de copier automatiquement:', clipboardError.message);
  }

  // Ouverture des applications avec gestion d'erreur
  try {
    if (channel.value === 'email') {
      const mailto = `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      note.textContent = 'Ouverture de votre client mail…';
      note.style.color = '#28a745';
    } else {
      const wa = `https://wa.me/${COMPANY_WHATSAPP}?text=${encodeURIComponent(preview.value)}`;
      const opened = window.open(wa, '_blank', 'noopener,noreferrer');
      if (opened) {
        note.textContent = 'Ouverture de WhatsApp…';
        note.style.color = '#28a745';
      } else {
        note.textContent = 'Impossible d\'ouvrir WhatsApp. Veuillez autoriser les pop-ups.';
        note.style.color = '#dc3545';
      }
    }
  } catch (openError) {
    note.textContent = 'Erreur lors de l\'ouverture de l\'application.';
    note.style.color = '#dc3545';
    console.error('Erreur ouverture:', openError);
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


// Gestion du message de succès après commande
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier si une commande a été complétée
  if (sessionStorage.getItem('orderCompleted') === 'true') {
    // Supprimer le flag
    sessionStorage.removeItem('orderCompleted');
    
    // Afficher un message de succès
    showSuccessMessage();
    
    // Faire défiler vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

function showSuccessMessage() {
  // Créer le message de succès
  const successDiv = document.createElement('div');
  successDiv.className = 'success-notification';
  successDiv.innerHTML = `
    <div class="success-content">
      <div class="success-icon">✅</div>
      <div class="success-text">
        <h3>Commande Finalisée avec Succès !</h3>
        <p>Votre demande a été traitée et notre équipe a été notifiée.</p>
        <p>Vous recevrez votre facture par email dans les plus brefs délais.</p>
      </div>
      <button class="success-close" onclick="closeSuccessMessage()">×</button>
    </div>
  `;
  
  // Ajouter les styles
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(40, 167, 69, 0.3);
    max-width: 400px;
    animation: slideInRight 0.5s ease-out;
    backdrop-filter: blur(10px);
  `;
  
  // Ajouter au DOM
  document.body.appendChild(successDiv);
  
  // Fermer automatiquement après 8 secondes
  setTimeout(() => {
    closeSuccessMessage();
  }, 8000);
}

function closeSuccessMessage() {
  const notification = document.querySelector('.success-notification');
  if (notification) {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .success-content {
    display: flex;
    align-items: flex-start;
    gap: 15px;
  }
  
  .success-icon {
    font-size: 24px;
    flex-shrink: 0;
  }
  
  .success-text h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .success-text p {
    margin: 0 0 5px 0;
    font-size: 14px;
    opacity: 0.9;
  }
  
  .success-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
    flex-shrink: 0;
  }
  
  .success-close:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  @media (max-width: 768px) {
    .success-notification {
      top: 10px !important;
      right: 10px !important;
      left: 10px !important;
      max-width: none !important;
    }
  }
`;
document.head.appendChild(style);

// Système de témoignages dynamiques par catégorie
const TESTIMONIALS_DATA = {
  'cv_creation': {
    title: '✍️ Création de CV sur mesure',
    testimonials: [
      {
        quote: '« Mon CV est désormais plus professionnel et facile à cerner. »',
        author: '— Nolane TCHANGAI ⭐⭐⭐⭐⭐'
      },
      {
        quote: '« Dynamisme, disponibilité et rapidité professionnelle : tout était réuni. »',
        author: '— Ella Joselyne ANANI ⭐⭐⭐⭐⭐'
      }
    ]
  },
  'personal_branding': {
    title: '🧑‍💼 Personal Branding & LinkedIn',
    testimonials: [
      {
        quote: '« Mon profil LinkedIn est devenu plus attractif, je reçois plus de demandes de connexion et même des recommandations de compétences. »',
        author: '— Afivi Ruth N\'TCHOU ⭐⭐⭐⭐⭐'
      },
      {
        quote: '« J\'ai beaucoup apprécié les détails précis, clairs et innovants. »',
        author: '— MOUSTAPHA Mohamed Sahid 😍'
      }
    ]
  },
  'coaching_emploi': {
    title: '🎓 Formation Coaching Emploi',
    testimonials: [
      {
        quote: '« Expérience extrêmement satisfaisante : coaching interactif, enrichissant et adapté. Les simulations d\'entretien m\'ont donné confiance pour affronter le marché de l\'emploi. Je recommande vivement. »',
        author: '— METOHO-EKE Darlingston Gilles ⭐⭐⭐⭐⭐'
      },
      {
        quote: '« Être coachée la veille d\'un entretien m\'a permis d\'arriver prête et de réussir brillamment mon interview. »',
        author: '— Arielle Carla Anglina LEMBO ⭐⭐⭐⭐⭐'
      }
    ]
  },
  'formation_ia': {
    title: '🤖 Formation IA',
    testimonials: [
      {
        quote: '« Formation très enrichissante sur l\'IA. J\'ai appris à utiliser des outils que je ne connaissais pas. »',
        author: '— Client Formation IA ⭐⭐⭐⭐⭐'
      }
    ]
  },
  'optimisation_business': {
    title: '📈 Optimisation Business',
    testimonials: [
      {
        quote: '« Nos processus ont été considérablement améliorés grâce à leurs recommandations. »',
        author: '— Entreprise Cliente ⭐⭐⭐⭐⭐'
      }
    ]
  }
};

class DynamicTestimonials {
  constructor() {
    this.categories = Object.keys(TESTIMONIALS_DATA);
    this.currentCategoryIndex = 0;
    this.currentTestimonialIndex = 0;
    this.isPlaying = true;
    this.interval = null;
    this.progressInterval = null;
    this.totalTestimonials = this.calculateTotalTestimonials();
    this.globalTestimonialIndex = 0;
    
    this.init();
  }
  
  calculateTotalTestimonials() {
    return Object.values(TESTIMONIALS_DATA).reduce((total, category) => {
      return total + category.testimonials.length;
    }, 0);
  }
  
  init() {
    this.updateTotalCounter();
    this.displayCurrentTestimonial();
    this.startAutoPlay();
    this.bindEvents();
  }
  
  bindEvents() {
    const prevBtn = document.getElementById('testimonials-prev');
    const nextBtn = document.getElementById('testimonials-next');
    const pauseBtn = document.getElementById('testimonials-pause');
    
    prevBtn?.addEventListener('click', () => this.previousTestimonial());
    nextBtn?.addEventListener('click', () => this.nextTestimonial());
    pauseBtn?.addEventListener('click', () => this.togglePlayPause());
  }
  
  getCurrentCategory() {
    const categoryKey = this.categories[this.currentCategoryIndex];
    return TESTIMONIALS_DATA[categoryKey];
  }
  
  getCurrentTestimonial() {
    const category = this.getCurrentCategory();
    return category.testimonials[this.currentTestimonialIndex];
  }
  
  displayCurrentTestimonial() {
    const category = this.getCurrentCategory();
    const testimonial = this.getCurrentTestimonial();
    
    // Mettre à jour la catégorie
    const categoryTitle = document.getElementById('current-category-title');
    if (categoryTitle) {
      categoryTitle.textContent = category.title;
    }
    
    // Mettre à jour le témoignage avec animation
    const quote = document.getElementById('testimonial-quote');
    const author = document.getElementById('testimonial-author');
    const testimonialEl = document.getElementById('current-testimonial');
    
    if (quote && author && testimonialEl) {
      // Animation de sortie
      testimonialEl.style.opacity = '0';
      testimonialEl.style.transform = 'translateX(-30px)';
      
      setTimeout(() => {
        quote.textContent = testimonial.quote;
        author.textContent = testimonial.author;
        
        // Animation d'entrée
        testimonialEl.style.opacity = '1';
        testimonialEl.style.transform = 'translateX(0)';
      }, 300);
    }
    
    // Mettre à jour le compteur
    this.updateCounter();
  }
  
  updateCounter() {
    const currentIndex = document.getElementById('current-testimonial-index');
    if (currentIndex) {
      currentIndex.textContent = this.globalTestimonialIndex + 1;
    }
  }
  
  updateTotalCounter() {
    const totalEl = document.getElementById('total-testimonials');
    if (totalEl) {
      totalEl.textContent = this.totalTestimonials;
    }
  }
  
  nextTestimonial() {
    const category = this.getCurrentCategory();
    
    // Passer au témoignage suivant dans la catégorie
    if (this.currentTestimonialIndex < category.testimonials.length - 1) {
      this.currentTestimonialIndex++;
    } else {
      // Passer à la catégorie suivante
      this.currentTestimonialIndex = 0;
      this.currentCategoryIndex = (this.currentCategoryIndex + 1) % this.categories.length;
    }
    
    this.globalTestimonialIndex = (this.globalTestimonialIndex + 1) % this.totalTestimonials;
    this.displayCurrentTestimonial();
    this.resetProgress();
  }
  
  previousTestimonial() {
    const category = this.getCurrentCategory();
    
    // Passer au témoignage précédent dans la catégorie
    if (this.currentTestimonialIndex > 0) {
      this.currentTestimonialIndex--;
    } else {
      // Passer à la catégorie précédente
      this.currentCategoryIndex = this.currentCategoryIndex === 0 ? 
        this.categories.length - 1 : this.currentCategoryIndex - 1;
      
      const prevCategory = this.getCurrentCategory();
      this.currentTestimonialIndex = prevCategory.testimonials.length - 1;
    }
    
    this.globalTestimonialIndex = this.globalTestimonialIndex === 0 ? 
      this.totalTestimonials - 1 : this.globalTestimonialIndex - 1;
    
    this.displayCurrentTestimonial();
    this.resetProgress();
  }
  
  startAutoPlay() {
    if (this.interval) clearInterval(this.interval);
    if (this.progressInterval) clearInterval(this.progressInterval);
    
    if (!this.isPlaying) return;
    
    // Démarrer la barre de progression
    this.startProgress();
    
    // Auto-play toutes les 5 secondes
    this.interval = setInterval(() => {
      if (this.isPlaying) {
        this.nextTestimonial();
      }
    }, 5000);
  }
  
  startProgress() {
    const progressFill = document.getElementById('progress-fill');
    if (!progressFill) return;
    
    progressFill.style.width = '0%';
    progressFill.style.transition = 'width 5s linear';
    
    // Animer la barre de progression
    setTimeout(() => {
      progressFill.style.width = '100%';
    }, 50);
  }
  
  resetProgress() {
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
      progressFill.style.transition = 'none';
      progressFill.style.width = '0%';
      
      setTimeout(() => {
        progressFill.style.transition = 'width 5s linear';
        if (this.isPlaying) {
          progressFill.style.width = '100%';
        }
      }, 50);
    }
  }
  
  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    const pauseBtn = document.getElementById('testimonials-pause');
    
    if (pauseBtn) {
      pauseBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
      pauseBtn.setAttribute('aria-label', this.isPlaying ? 'Pause' : 'Lecture');
    }
    
    if (this.isPlaying) {
      this.startAutoPlay();
    } else {
      if (this.interval) clearInterval(this.interval);
      if (this.progressInterval) clearInterval(this.progressInterval);
      
      // Arrêter la barre de progression
      const progressFill = document.getElementById('progress-fill');
      if (progressFill) {
        const currentWidth = progressFill.offsetWidth;
        const containerWidth = progressFill.parentElement.offsetWidth;
        const percentage = (currentWidth / containerWidth) * 100;
        progressFill.style.transition = 'none';
        progressFill.style.width = percentage + '%';
      }
    }
  }
  
  destroy() {
    if (this.interval) clearInterval(this.interval);
    if (this.progressInterval) clearInterval(this.progressInterval);
  }
}

// Initialiser le système de témoignages dynamiques
let dynamicTestimonials = null;

document.addEventListener('DOMContentLoaded', function() {
  // Attendre que la section témoignages soit visible
  const testimonialsSection = document.getElementById('testimonials');
  if (testimonialsSection) {
    // Initialiser avec un délai pour s'assurer que tous les éléments sont chargés
    setTimeout(() => {
      dynamicTestimonials = new DynamicTestimonials();
      console.log('✅ Système de témoignages dynamiques initialisé');
    }, 1000);
  }
});

// Nettoyer lors du déchargement de la page
window.addEventListener('beforeunload', () => {
  if (dynamicTestimonials) {
    dynamicTestimonials.destroy();
  }
});