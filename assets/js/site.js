// Custom site scripts: dynamic header offset + section-visibility nav activation + email obfuscation handler
(function () {
  function debounce(fn, ms){
    var t; return function(){ clearTimeout(t); t = setTimeout(fn, ms); };
  }

  // Compute header offset and keep CSS var in sync
  function initOrUpdateHeaderOffset(){
    var navbar = document.querySelector('.navbar.fixed-top');
    var rawOffset = navbar ? navbar.offsetHeight : 0;
    var offset = rawOffset ? rawOffset + 1 : 0; // +1 so sections activate promptly

    var offsetPx = offset + 'px';
    document.body.style.paddingTop = offsetPx; // push page content below navbar
    document.documentElement.style.setProperty('--header-offset', offsetPx);

    return offset;
  }

  // Toggle active class on nav links; matches href="#id"
  function setActiveNav(id){
    var nav = document.querySelector('#navbarNav');
    if (!nav) return;
    nav.querySelectorAll('.nav-link').forEach(function(a){
      var href = a.getAttribute('href') || '';
      // normalize href like "#home"
      if (href === ('#' + id)) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }

  // Determine which section is most visible (in pixels) within viewport
  function refreshActiveSection(){
    var main = document.querySelector('#main-content') || document.body;
    var sections = Array.from(main.querySelectorAll('[id]'));
    if (!sections.length) return;

    var navbar = document.querySelector('.navbar.fixed-top');
    var headerOffset = navbar ? navbar.offsetHeight : 0;

    var best = { id: null, visible: 0 };
    sections.forEach(function(sec){
      var rect = sec.getBoundingClientRect();
      // visible top is at least headerOffset (px from top)
      var top = Math.max(rect.top, headerOffset);
      var bottom = Math.min(rect.bottom, window.innerHeight);
      var visible = Math.max(0, bottom - top);
      if (visible > best.visible) {
        best = { id: sec.id, visible: visible };
      }
    });

    // If nothing visible (very top or bottom), fall back: if scroll is at very top -> home
    if (!best.id) {
      if (window.scrollY === 0) {
        setActiveNav('home');
      }
      return;
    }

    // If the best visible section is the same as currently active, no-op
    setActiveNav(best.id);
  }

  // Attach click handlers to nav links so clicks immediately activate and smooth-scroll
  function initNavClicks(){
    var nav = document.querySelector('#navbarNav');
    if (!nav) return;
    var links = Array.from(nav.querySelectorAll('.nav-link[href^="#"]'));
    links.forEach(function(link){
      link.addEventListener('click', function(e){
        // Respect modifier/middle clicks
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
          return;
        }
        e.preventDefault();
        var href = link.getAttribute('href');
        var id = href && href.charAt(0) === '#' ? href.slice(1) : null;
        if (!id) return;

        var target = (id === 'home') ? document.documentElement : document.getElementById(id);
        var navbar = document.querySelector('.navbar.fixed-top');
        var offset = navbar ? navbar.offsetHeight : 0;

        var targetTop = 0;
        if (target === document.documentElement) {
          targetTop = 0;
        } else if (target) {
          // element.offsetTop is relative to document
          targetTop = target.offsetTop - offset;
        }

        try {
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
        } catch (err) {
          window.scrollTo(0, targetTop);
        }

        // immediately mark as active so UI reflects intent
        setActiveNav(id);

        // re-evaluate after a short delay to let the scroll settle
        setTimeout(refreshActiveSection, 300);
      });
    });
  }

  // Email obfuscation: convert mailto:contactattomminushansenpunktcom to real address on click
  function initEmailDeobfuscation(){
    var anchors = document.querySelectorAll('a[href^="mailto:contactat"], a[data-email-obfuscated="true"]');
    anchors.forEach(function(a){
      a.addEventListener('click', function(){
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

  // Init on load
  window.addEventListener('load', function(){
    initEmailDeobfuscation();
    initNavClicks();

    // compute header offset and set CSS var
    initOrUpdateHeaderOffset();

    // initial activation and wiring
    refreshActiveSection();

    // refresh on scroll and resize
    window.addEventListener('scroll', debounce(refreshActiveSection, 80));
    window.addEventListener('resize', debounce(function(){
      initOrUpdateHeaderOffset();
      refreshActiveSection();
    }, 150));
  });

})();
