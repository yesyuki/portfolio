(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'portfolio-theme';
  var SYSTEM_KEY = 'portfolio-theme-system';
  var themeColor = document.querySelector('meta[name="theme-color"]');
  var systemTheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrowScreen = window.matchMedia ? window.matchMedia('(max-width: 720px)') : null;

  function currentSystemTheme() {
    return systemTheme && systemTheme.matches ? 'light' : 'dark';
  }

  function getStoredTheme() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);

      if (value !== 'light' && value !== 'dark') {
        return null;
      }

      var savedSystem = localStorage.getItem(SYSTEM_KEY);

      if (savedSystem === 'light' || savedSystem === 'dark') {
        if (savedSystem !== currentSystemTheme()) {
          // The browser preference changed since the manual choice was saved.
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(SYSTEM_KEY);
          return null;
        }
      } else {
        // Older saved choice without a baseline: adopt the current preference.
        try {
          localStorage.setItem(SYSTEM_KEY, currentSystemTheme());
        } catch (error) {
          // The saved theme still applies for this page view.
        }
      }

      return value;
    } catch (error) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
      localStorage.setItem(SYSTEM_KEY, currentSystemTheme());
    } catch (error) {
      // Persistence is optional; the toggle still works for this page view.
    }
  }

  function clearStoredTheme() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SYSTEM_KEY);
    } catch (error) {
      // Nothing to clear if storage is blocked.
    }
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);

    if (themeColor) {
      themeColor.setAttribute('content', theme === 'light' ? '#f6f8fa' : '#0b0f14');
    }

    var toggle = document.getElementById('theme-toggle');

    if (toggle) {
      var next = theme === 'light' ? 'dark' : 'light';
      toggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    }
  }

  // Resolve the theme before the body is parsed, so there is no wrong-theme
  // flash. A saved manual choice wins until the browser preference changes.
  var savedTheme = getStoredTheme();
  var initialTheme = savedTheme || currentSystemTheme();
  applyTheme(initialTheme);
  root.classList.add('js');

  // The browser preference always wins when it changes; drop the manual choice.
  if (systemTheme) {
    var handleSystemThemeChange = function (event) {
      clearStoredTheme();
      applyTheme(event.matches ? 'light' : 'dark');
    };

    if (typeof systemTheme.addEventListener === 'function') {
      systemTheme.addEventListener('change', handleSystemThemeChange);
    } else if (typeof systemTheme.addListener === 'function') {
      systemTheme.addListener(handleSystemThemeChange);
    }
  }

  // Keep other open tabs (and restored pages) in sync with the saved choice.
  function syncThemeFromStorage() {
    applyTheme(getStoredTheme() || currentSystemTheme());
  }

  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY || event.key === SYSTEM_KEY || event.key === null) {
      syncThemeFromStorage();
    }
  });

  window.addEventListener('pageshow', syncThemeFromStorage);

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      syncThemeFromStorage();
    }
  });

  // DOM-dependent setup runs after the markup is available.
  function init() {
    var toggle = document.getElementById('theme-toggle');
    var current = root.getAttribute('data-theme');
    applyTheme(current === 'light' || current === 'dark' ? current : currentSystemTheme());

    if (toggle) {
      toggle.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
        storeTheme(next);
      });
    }

    // Keep the footer year current.
    var year = document.getElementById('year');
    if (year) {
      year.textContent = String(new Date().getFullYear());
    }

    // Contact details are placeholders until the owner fills them in.
    var placeholderLinks = document.querySelectorAll('a[data-placeholder]');
    for (var i = 0; i < placeholderLinks.length; i += 1) {
      placeholderLinks[i].addEventListener('click', function (event) {
        event.preventDefault();
      });
    }

    // Fade content in on scroll, with fallbacks for no observer or reduced motion.
    var reveals = document.querySelectorAll('.reveal');

    function showAll() {
      for (var j = 0; j < reveals.length; j += 1) {
        reveals[j].classList.add('is-visible');
      }
    }

    if (!('IntersectionObserver' in window) || reduceMotion.matches || (narrowScreen && narrowScreen.matches)) {
      showAll();
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      for (var k = 0; k < reveals.length; k += 1) {
        observer.observe(reveals[k]);
      }
    }

    // If the motion preference changes, reveal everything and keep it visible.
    if (typeof reduceMotion.addEventListener === 'function') {
      reduceMotion.addEventListener('change', function (event) {
        if (event.matches) {
          showAll();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
