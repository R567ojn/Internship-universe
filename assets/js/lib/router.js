/* ============================================================
   ROUTER · Client-side page transitions without full reload
   Intercepts navigation clicks and swaps content via fetch.
   ============================================================ */

const Router = (() => {
  let currentPath = window.location.pathname;
  let transitioning = false;
  const cache = new Map();
  const MAX_CACHE = 10;

  // Extract #view content and inline scripts from HTML string
  function extractContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const view = doc.getElementById('view');
    const scripts = [...doc.querySelectorAll('script:not([src])')].map(s => s.textContent);
    const nav = doc.body.dataset.nav || '';
    const title = doc.title || 'InternHub';
    
    return {
      content: view ? view.innerHTML : '',
      scripts,
      nav,
      title,
      body: doc.body
    };
  }

  // Fetch page content with caching
  async function fetchPage(url) {
    if (cache.has(url)) return cache.get(url);
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}`);
    
    const html = await response.text();
    const extracted = extractContent(html);
    
    // Simple LRU cache
    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(url, extracted);
    
    return extracted;
  }

  // Navigate to a new page
  async function navigate(url, pushState = true) {
    if (transitioning) return;
    
    const fullUrl = new URL(url, window.location.origin);
    const newPath = fullUrl.pathname;
    
    // Same page
    if (newPath === currentPath && !fullUrl.search) return;
    
    transitioning = true;
    const slot = document.getElementById('view-slot');
    const appContent = slot?.closest('.app-content');
    
    if (!slot) {
      // Fallback to full reload if shell not ready
      window.location.href = url;
      return;
    }

    try {
      // Add loading state with progress bar
      slot.classList.add('is-transitioning');
      if (appContent) appContent.classList.add('is-loading');
      
      // Fetch new content
      const page = await fetchPage(newPath);
      
      // Update history
      if (pushState) {
        history.pushState({ path: newPath }, '', url);
      }
      
      // Update document title
      document.title = page.title;
      
      // Update active nav
      document.body.dataset.nav = page.nav;
      if (typeof Shell !== 'undefined' && Shell.markNav) {
        Shell.markNav(page.nav);
      }
      
      // Swap content with fade (150ms fade out)
      await new Promise(resolve => {
        slot.style.opacity = '0';
        setTimeout(resolve, 150);
      });
      
      slot.innerHTML = page.content;
      
      // Execute inline scripts
      page.scripts.forEach(code => {
        try {
          // Execute script in global scope using indirect eval
          if (code.trim()) {
            (0, eval)(code);  // Indirect eval executes in global scope
          }
        } catch (err) {
          console.error('Script execution failed:', err);
        }
      });
      
      // Trigger shell updates
      if (typeof Shell !== 'undefined') {
        if (Shell.syncSavedBadge) Shell.syncSavedBadge();
        if (Shell.syncPendingBadge) Shell.syncPendingBadge();
      }
      
      // Re-initialize reveals and scroll to top
      if (typeof UI !== 'undefined' && UI.initReveals) {
        UI.initReveals(slot);
      }
      
      // Fade in new content
      slot.style.opacity = '1';
      slot.classList.remove('is-transitioning');
      if (appContent) appContent.classList.remove('is-loading');
      
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      currentPath = newPath;
      
      // Dispatch custom event for analytics/tracking
      document.dispatchEvent(new CustomEvent('router:navigated', { 
        detail: { path: newPath, url } 
      }));
      
    } catch (err) {
      console.error('Navigation failed:', err);
      // Fallback to full reload
      window.location.href = url;
    } finally {
      transitioning = false;
      if (appContent) appContent.classList.remove('is-loading');
    }
  }

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.path) {
      navigate(e.state.path, false);
    }
  });

  // Intercept clicks on internal links
  function shouldIntercept(el) {
    // Must be an <a> tag
    if (el.tagName !== 'A') return false;
    
    // Must have href
    const href = el.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;
    
    // Must be internal
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return false;
      
      // Must be a student or admin page (not landing/auth pages)
      const path = url.pathname;
      if (!path.includes('/student_pages/') && !path.includes('/admin_pages/')) return false;
      
      // Exclude suggest.html from client-side navigation (needs external scripts)
      if (path.includes('/suggest.html')) return false;
      
      return true;
    } catch {
      return false;
    }
  }

  function init() {
    // Store initial state
    history.replaceState({ path: currentPath }, '', window.location.href);
    
    // Intercept all clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link || !shouldIntercept(link)) return;
      
      // Check for modifier keys (ctrl/cmd+click for new tab)
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      
      e.preventDefault();
      const href = link.getAttribute('href');
      navigate(href);
    });
    
    console.log('[Router] Client-side navigation enabled');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { navigate, init };
})();
