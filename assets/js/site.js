// Custom site scripts: dynamic header offset + Bootstrap ScrollSpy init and email obfuscation handler
(function () {
  function initOrUpdateScrollSpy() {
    var navbar = document.querySelector('.navbar.fixed-top');
    var rawOffset = navbar ? navbar.offsetHeight : 0;
    var offset = rawOffset ? rawOffset + 1 : 0; // +1 so sections activate promptly

    // 1) Make sure content is not hidden under the fixed navbar
    var offsetPx = offset + 'px';
    document.body.style.paddingTop = offsetPx; // push page content below navbar
    // Keep CSS var in sync so anchor jumps land correctly
    document.documentElement.style.setProperty('--header-offset', offsetPx);

    // 2) Configure ScrollSpy using IntersectionObserver rootMargin when available
    // Only attempt if a nav target exists; otherwise (e.g., on impressum.html) just apply padding and skip
    var hasTarget = !!document.querySelector('#navbarNav');
    if (!hasTarget || typeof bootstrap === 'undefined' || !bootstrap.ScrollSpy) {
      return; // nothing else to do on pages without the main nav/ScrollSpy
    }

    var useRootMargin = 'IntersectionObserver' in window;
    var config = { target: '#navbarNav' };
    if (useRootMargin) {
      // Shift the top threshold down by the navbar height, improve up-scroll activation
      config.rootMargin = '-' + offset + 'px 0px -40%';
    } else {
      // Fallback to offset mode
      config.offset = offset;
      document.body.setAttribute('data-bs-offset', String(offset));
    }

    // 3) Re-init ScrollSpy with new config
    var existing = bootstrap.ScrollSpy.getInstance(document.body);
    if (existing) { existing.dispose(); }
    new bootstrap.ScrollSpy(document.body, config);
  }

  function debounce(fn, ms){
    var t; return function(){ clearTimeout(t); t = setTimeout(fn, ms); };
  }

  // Make the "Home" nav link scroll to the absolute top of the page
  function initHomeTopScroll(){
    var homeLink = document.querySelector('nav .nav-link[href="#home"]');
    if (!homeLink) return;

    homeLink.addEventListener('click', function(e){
      // Respect modifier/middle clicks so users can open in new tab, etc.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      // Only handle same-page navigation
      if (location.pathname.replace(/\/+/g,'/') !== homeLink.pathname.replace(/\/+/g,'/') || location.hostname !== homeLink.hostname) {
        return;
      }
      e.preventDefault();

      // Smooth scroll to the very top
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (_) {
        // Fallback for older browsers
        window.scrollTo(0, 0);
      }

      // Proactively mark Home as active so the UI reflects intent immediately
      var nav = document.querySelector('#navbarNav');
      if (nav) {
        nav.querySelectorAll('.nav-link.active').forEach(function(a){ a.classList.remove('active'); });
        homeLink.classList.add('active');
      }

      // Ask ScrollSpy to recalc; it will settle on correct state as we reach the top
      if (typeof bootstrap !== 'undefined' && bootstrap.ScrollSpy) {
        var spy = bootstrap.ScrollSpy.getInstance(document.body);
        if (spy && typeof spy.refresh === 'function') {
          spy.refresh();
        }
      }
      // We deliberately do not change the URL hash to avoid an extra jump.
    });
  }

  // Email obfuscation: convert mailto:contactattomminushansenpunktcom to real address on click
  function initEmailDeobfuscation(){
    var anchors = document.querySelectorAll('a[href^="mailto:contactat"], a[data-email-obfuscated="true"]');
    anchors.forEach(function(a){
      a.addEventListener('click', function(ev){
        try {
          // Replace the pieces once per click just before navigation
          var newHref = a.getAttribute('href')
            .replace(/at/, '&#64;')
            .replace(/minus/, '&#45;')
            .replace(/punkt/, '&#46;');
          a.setAttribute('href', newHref);
        } catch (e) {
          // Ignore any errors; allow default navigation
        }
      }, { once: true });
    });
  }

  window.addEventListener('load', function(){
    initOrUpdateScrollSpy();
    initEmailDeobfuscation();
    initHomeTopScroll();
  });
  window.addEventListener('resize', debounce(initOrUpdateScrollSpy, 150));
})();
