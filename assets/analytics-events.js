(function() {
  if (typeof gtag !== 'function') return;

  // Section visibility
  var sections = ['about', 'experience', 'projects', 'activity', 'skills', 'achievements'];
  var seen = {};
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting && !seen[e.target.id]) {
        seen[e.target.id] = true;
        gtag('event', 'section_view', { section: e.target.id });
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  // Outbound link clicks
  document.querySelectorAll('a[href^="http"], a[href^="mailto"]').forEach(function(a) {
    a.addEventListener('click', function() {
      gtag('event', 'outbound_click', { url: a.href, label: a.textContent.trim() });
    });
  });

  // Scroll depth
  var depths = [25, 50, 75, 100];
  var fired = {};
  window.addEventListener('scroll', function() {
    var pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    depths.forEach(function(d) {
      if (pct >= d && !fired[d]) {
        fired[d] = true;
        gtag('event', 'scroll_depth', { depth: d });
      }
    });
  }, { passive: true });

  // Theme toggle
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      // Read after the native handler flips the class
      setTimeout(function() {
        var theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        gtag('event', 'theme_toggle', { theme: theme });
      }, 0);
    });
  }
})();
