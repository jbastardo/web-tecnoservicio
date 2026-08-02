/* ==========================================================================
   TUTECNOSERVICIO.COM - INTERACTIVE SCRIPT
   Author: Juan Carlos | Tech Consulting & System Integration
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close menu when clicking link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  // 2. Navbar Scroll Glassmorphism Effect
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 3. Counter Animation for Stats
  const statNumbers = document.querySelectorAll('.stat-number');
  let animated = false;

  const animateStats = () => {
    statNumbers.forEach(stat => {
      const target = +stat.getAttribute('data-target');
      const duration = 1500;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          stat.textContent = target + (stat.getAttribute('data-suffix') || '');
          clearInterval(timer);
        } else {
          stat.textContent = Math.floor(current) + (stat.getAttribute('data-suffix') || '');
        }
      }, stepTime);
    });
  };

  // Trigger counters on scroll into view
  const statsSection = document.getElementById('hero-stats');
  if (statsSection) {
    window.addEventListener('scroll', () => {
      const rect = statsSection.getBoundingClientRect();
      if (rect.top <= window.innerHeight && !animated) {
        animated = true;
        animateStats();
      }
    });
  }

  // 4. Contact Form Handler (Direct WhatsApp / Email dispatch)
  const contactForm = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('form-name').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const service = document.getElementById('form-service').value;
      const message = document.getElementById('form-message').value.trim();

      if (!name || !email || !message) {
        showFeedback('Por favor completa todos los campos requeridos.', 'error');
        return;
      }

      // Format WhatsApp Message
      const waText = `¡Hola Juan Carlos! Mi nombre es ${name} (${email}). Estoy interesado en: ${service}. Detalle: ${message}`;
      const waUrl = `https://wa.me/584120000000?text=${encodeURIComponent(waText)}`; // Placeholder WA link, customizable

      // Open WhatsApp in new tab
      window.open(waUrl, '_blank');

      showFeedback('¡Gracias! Te estamos redirigiendo a WhatsApp para iniciar conversación inmediata...', 'success');
      contactForm.reset();
    });
  }

  function showFeedback(msg, type) {
    if (!formFeedback) return;
    formFeedback.textContent = msg;
    formFeedback.style.display = 'block';
    formFeedback.style.padding = '0.75rem';
    formFeedback.style.borderRadius = '8px';
    formFeedback.style.marginTop = '1rem';
    formFeedback.style.fontSize = '0.9rem';

    if (type === 'success') {
      formFeedback.style.background = 'rgba(16, 185, 129, 0.15)';
      formFeedback.style.color = '#10b981';
      formFeedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    } else {
      formFeedback.style.background = 'rgba(239, 68, 68, 0.15)';
      formFeedback.style.color = '#ef4444';
      formFeedback.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    }
  }
});
