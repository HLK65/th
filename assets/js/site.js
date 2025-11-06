'use strict';

// Custom site scripts: dynamic header offset + section-visibility nav activation + email obfuscation handler
(function () {
    function debounce(fn, ms) {
        let t;
        return function () {
            clearTimeout(t);
            t = setTimeout(fn, ms);
        };
    }

    // Compute header offset and keep CSS var in sync
    function initOrUpdateHeaderOffset() {
        const navbar = document.querySelector('.navbar.fixed-top');
        const rawOffset = navbar ? navbar.offsetHeight : 0;
        const offset = rawOffset ? rawOffset + 1 : 0; // +1 so sections activate promptly

        const offsetPx = offset + 'px';
        document.body.style.paddingTop = offsetPx; // push page content below navbar
        document.documentElement.style.setProperty('--header-offset', offsetPx);

        return offset;
    }

    // Toggle active class on nav links; matches href="#id"
    function setActiveNav(id) {
        const nav = document.querySelector('#navbarNav');
        if (!nav) return;
        nav.querySelectorAll('.nav-link').forEach(function (a) {
            const href = a.getAttribute('href') || '';
            // normalize href like "#home"
            if (href === ('#' + id)) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }

    // Determine which section is most visible (in pixels) within viewport
    function refreshActiveSection() {
        const main = document.querySelector('#main-content') || document.body;
        const sections = Array.from(main.querySelectorAll('[id]'));
        if (!sections.length) return;

        const navbar = document.querySelector('.navbar.fixed-top');
        const headerOffset = navbar ? navbar.offsetHeight : 0;

        let best = {id: null, visible: 0};
        sections.forEach(function (sec) {
            const rect = sec.getBoundingClientRect();
            // visible top is at least headerOffset (px from top)
            const top = Math.max(rect.top, headerOffset);
            const bottom = Math.min(rect.bottom, window.innerHeight);
            const visible = Math.max(0, bottom - top);
            if (visible > best.visible) {
                best = {id: sec.id, visible: visible};
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
    function initNavClicks() {
        const nav = document.querySelector('#navbarNav');
        if (!nav) return;
        const links = Array.from(nav.querySelectorAll('.nav-link[href^="#"]'));
        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                // Respect modifier/middle clicks
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                    return;
                }
                e.preventDefault();
                const href = link.getAttribute('href');
                const id = href && href.charAt(0) === '#' ? href.slice(1) : null;
                if (!id) return;

                const target = (id === 'home') ? document.documentElement : document.getElementById(id);
                const navbar = document.querySelector('.navbar.fixed-top');
                const offset = navbar ? navbar.offsetHeight : 0;

                let targetTop = 0;
                if (target === document.documentElement) {
                    targetTop = 0;
                } else if (target) {
                    // element.offsetTop is relative to document
                    targetTop = target.offsetTop - offset;
                }

                try {
                    window.scrollTo({top: targetTop, behavior: 'smooth'});
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


    // Init on load
    window.addEventListener('load', function () {
        initNavClicks();

        // compute header offset and set CSS var
        initOrUpdateHeaderOffset();

        // initial activation and wiring
        refreshActiveSection();

        // refresh on scroll and resize
        window.addEventListener('scroll', debounce(refreshActiveSection, 80));
        window.addEventListener('resize', debounce(function () {
            initOrUpdateHeaderOffset();
            refreshActiveSection();
        }, 150));
    });


    // Email obfuscation handler
    document.addEventListener('DOMContentLoaded', function ()
    {
        const listener = new Listener();

        listener.decode = function ()
        {
            const email = document.getElementById('text-interaction').firstChild;

            email.nodeValue = email.nodeValue
                .replace('contact me', 'contact')
                .replace('via', '@')
                .replaceAll(' ', '')
                .replace('mail', 'tom-hansen.com');
            document.getElementById('text-interaction').href = 'mailto:' + email.nodeValue;
        }

        listener.on();
    });


    // Listener

    function Listener ()
    {
    }

    Listener.prototype.decode = null;

    Listener.prototype.on = function ()
    {
        this.listener = this.__onInteraction.bind(this);

        document.addEventListener('mouseenter', this.listener, true);
        document.addEventListener('focus', this.listener, true);
    }

    Listener.prototype.off = function ()
    {
        document.removeEventListener('mouseenter', this.listener, true);
        document.removeEventListener('focus', this.listener, true);

        delete this.listener;
    }

    Listener.prototype.__onInteraction = function ()
    {
        this.off();
        this.decode();
    }

})();
