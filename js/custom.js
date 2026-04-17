/* ============================================================
   英語脳育成塾 LP - Custom JavaScript
   Bootstrap Studio 8.0.1 / Bootstrap 5 Compatible
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // --------------------------------------------------
  // 1. Navbar Scroll Effect
  // --------------------------------------------------
  const navbar = document.getElementById('mainNav');
  
  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll(); // Initial check


  // --------------------------------------------------
  // 2. Smooth Scroll for Anchor Links
  // --------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '#YOUR_GOOGLE_FORM_URL') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      // Close mobile menu if open
      const navCollapse = document.getElementById('navbarContent');
      if (navCollapse && navCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
      }

      const navHeight = navbar.offsetHeight || 80;
      const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });


  // --------------------------------------------------
  // 3. Scroll Fade-In Animation (Intersection Observer)
  // --------------------------------------------------
  const fadeElements = document.querySelectorAll('.fade-in-section, .stagger-children');

  if ('IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1
    });

    fadeElements.forEach(function (el) {
      fadeObserver.observe(el);
    });
  } else {
    // Fallback for older browsers
    fadeElements.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }


  // --------------------------------------------------
  // 4. Active Nav Link Highlight on Scroll
  // --------------------------------------------------
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar .nav-link[href^="#"]');

  function highlightNavLink() {
    const scrollPos = window.scrollY + 120;

    sections.forEach(function (section) {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNavLink, { passive: true });


  // --------------------------------------------------
  // 5. CTA Button Click Tracking (Console Log)
  //    Replace with your analytics tracking as needed.
  // --------------------------------------------------
  const ctaButtons = document.querySelectorAll('[id$="-cta-btn"]');
  ctaButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const btnId = this.id;
      console.log('[CTA Click]', btnId, new Date().toISOString());
      // TODO: Replace with Google Analytics, GTM, or your preferred tracking
      // gtag('event', 'cta_click', { button_id: btnId });
    });
  });


  // --------------------------------------------------
  // 6. Form → Google Form Redirect
  //    The consultation form on this LP is a visual
  //    representation. The actual CTA button should
  //    redirect to the Google Form URL.
  // --------------------------------------------------
  const consultationCTA = document.getElementById('consultation-cta-btn');
  if (consultationCTA) {
    consultationCTA.addEventListener('click', function (e) {
      const url = this.getAttribute('href');
      // If the URL hasn't been replaced yet, prevent navigation
      if (url === '#YOUR_GOOGLE_FORM_URL') {
        e.preventDefault();
        alert('Google Form のURLを設定してください。\nindex.html 内の #YOUR_GOOGLE_FORM_URL を実際のURLに置き換えてください。');
      }
    });
  }

});
