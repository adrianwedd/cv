(function() {
  if (typeof gtag !== 'function') return;

  var campaignFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var attributionKey = 'adrianwedd_attribution';

  function clean(value, max) {
    return String(value || '').replace(/[^a-zA-Z0-9._~ -]/g, '').trim().slice(0, max || 100);
  }

  function attribution() {
    var stored = {};
    try {
      stored = JSON.parse(sessionStorage.getItem(attributionKey) || '{}');
      var params = new URLSearchParams(location.search);
      var incoming = {};
      campaignFields.forEach(function(field) {
        var value = clean(params.get(field));
        if (value) incoming[field] = value;
      });
      if (Object.keys(incoming).length) {
        stored = incoming;
        sessionStorage.setItem(attributionKey, JSON.stringify(stored));
      }
    } catch (e) {
      // Analytics remains optional when storage is unavailable.
    }
    return stored;
  }

  function trafficType() {
    try {
      var marker = clean(new URLSearchParams(location.search).get('aw_traffic'), 30);
      return ['internal', 'ci', 'preview', 'monitor'].indexOf(marker) >= 0 ? marker : 'unclassified';
    } catch (e) {
      return 'unclassified';
    }
  }

  function safeDestination(raw) {
    try {
      var url = new URL(raw, location.origin);
      return { domain: url.hostname.toLowerCase(), path: url.pathname.slice(0, 200) };
    } catch (e) {
      return { domain: 'unknown', path: '' };
    }
  }

  function decorateMainSiteLinks() {
    var campaign = attribution();
    var marker = trafficType();
    document.querySelectorAll('a[href^="https://adrianwedd.com/"]').forEach(function(link) {
      try {
        var url = new URL(link.href);
        campaignFields.forEach(function(field) {
          if (campaign[field]) url.searchParams.set(field, campaign[field]);
        });
        if (marker !== 'unclassified') url.searchParams.set('aw_traffic', marker);
        link.href = url.toString();
      } catch (e) {
        // Keep the original destination when decoration is unavailable.
      }
    });
  }

  function track(name, parameters) {
    try {
      gtag('event', name, Object.assign({}, attribution(), {
        traffic_type: trafficType(),
        page_path: '/',
      }, parameters || {}));
    } catch (e) {
      // A measurement failure must never interfere with the CV.
    }
  }

  decorateMainSiteLinks();

  // Section visibility is ordinary engagement, not conversion.
  var sections = ['about', 'experience', 'projects', 'activity', 'skills', 'achievements', 'education', 'interests'];
  var seen = {};
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !seen[entry.target.id]) {
        seen[entry.target.id] = true;
        track('section_view', { section: entry.target.id });
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(function(id) {
    var element = document.getElementById(id);
    if (element) observer.observe(element);
  });

  document.body.addEventListener('click', function(event) {
    var link = event.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var destination = safeDestination(link.href);

    if (href.indexOf('mailto:') === 0) {
      track('contact_intent', { contact_method: 'email', source_content_type: 'cv' });
    } else if (href.indexOf('tel:') === 0) {
      track('contact_intent', { contact_method: 'phone', source_content_type: 'cv' });
    } else if (destination.domain === 'adrianwedd.com' && ['/services/', '/contact/'].indexOf(destination.path) >= 0) {
      track('cv_next_step', { destination_path: destination.path });
    } else if (/\.pdf$/i.test(destination.path) || link.hasAttribute('download')) {
      track('cv_download', { file_path: destination.path });
    } else if (destination.domain !== location.hostname && href.indexOf('http') === 0) {
      track('outbound_click', { link_domain: destination.domain, link_path: destination.path });
    }
  });

  var depths = [25, 50, 75, 100];
  var fired = {};
  window.addEventListener('scroll', function() {
    var height = document.body.scrollHeight - window.innerHeight;
    if (height <= 0) return;
    var pct = Math.round((window.scrollY / height) * 100);
    depths.forEach(function(depth) {
      if (pct >= depth && !fired[depth]) {
        fired[depth] = true;
        track('scroll_depth', { depth: depth, content_type: 'cv' });
      }
    });
  }, { passive: true });

  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      setTimeout(function() {
        var theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        track('theme_switch', { theme: theme });
      }, 0);
    });
  }
})();
