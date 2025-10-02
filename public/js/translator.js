(function () {
  // guards to avoid repeated initialization
  if (window._gtSafeInit) return;
  window._gtSafeInit = true;

  // set googtrans cookie before loading script
  function setGoogTransCookie() {
    try {
      const cookieName = 'googtrans';
      const cookieValue = '/en/bg';
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${cookieName}=${cookieValue};expires=${expires};path=/`;
    } catch (e) {
      console.error('setGoogTransCookie error', e);
    }
  }

  // safe loader with single-load guards
  function loadGoogleTranslateOnce() {
    if (window._gtLoading || window._gtLoaded) return;
    window._gtLoading = true;

    window.googleTranslateElementInit = function () {
      try {
        if (window._gtInitCalled) return;
        window._gtInitCalled = true;

        new google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'bg',
          autoDisplay: false
        }, 'google_translate_element');

        let attempts = 0;
        const maxAttempts = 20;
        const poll = setInterval(() => {
          attempts++;
          try {
            const sel = document.querySelector('select.goog-te-combo');
            if (sel) {
              sel.value = 'bg';
              let ev;
              try { ev = new Event('change', { bubbles: true }); }
              catch (e) { ev = document.createEvent('HTMLEvents'); ev.initEvent('change', true, false); }
              sel.dispatchEvent(ev);
              clearInterval(poll);
            } else if (attempts >= maxAttempts) {
              clearInterval(poll);
            }
          } catch (e) { }
        }, 250);
      } catch (err) {
        console.error('googleTranslateElementInit error', err);
      } finally {
        window._gtLoaded = true;
        window._gtLoading = false;
      }
    };

    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.onload = () => {
      window._gtLoaded = true;
      window._gtLoading = false;
    };
    s.onerror = (e) => {
      console.error('Failed to load Google Translate script', e);
      window._gtLoading = false;
    };
    document.head.appendChild(s);
  }

  const btn = document.getElementById('translateBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      setGoogTransCookie();
      loadGoogleTranslateOnce();
    }, { passive: true });
  }
})();
