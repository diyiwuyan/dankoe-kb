/**
 * Dan Koe Knowledge Base — App JS
 * Search functionality + UI enhancements
 */

(function() {
  'use strict';

  // ============================================================
  // Search
  // ============================================================

  let searchIndex = null;

  async function loadSearchIndex() {
    try {
      // 根据当前页面深度确定路径
      const depth = window.location.pathname.split('/').filter(Boolean).length;
      const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
      const res = await fetch(prefix + 'assets/search-index.json');
      searchIndex = await res.json();
    } catch (e) {
      console.warn('Search index not loaded:', e);
    }
  }

  function searchArticles(query) {
    if (!searchIndex || !query.trim()) return [];
    const q = query.toLowerCase();
    const results = [];
    
    for (const item of searchIndex) {
      let score = 0;
      if (item.title.toLowerCase().includes(q)) score += 10;
      if (item.excerpt.toLowerCase().includes(q)) score += 3;
      if (item.category.toLowerCase().includes(q)) score += 2;
      if (item.concepts.some(c => c.toLowerCase().includes(q))) score += 5;
      
      if (score > 0) {
        results.push({ ...item, score });
      }
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, 8);
  }

  function renderSearchResults(results, dropdown) {
    if (!results.length) {
      dropdown.innerHTML = '<div class="search-result-item"><div class="sr-title" style="color:#666">No results found</div></div>';
      dropdown.classList.add('active');
      return;
    }
    
    dropdown.innerHTML = results.map(r => {
      // 计算相对路径
      const depth = window.location.pathname.split('/').filter(Boolean).length;
      const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
      return `
        <a href="${prefix}${r.url}" class="search-result-item">
          <div class="sr-cat">${r.category_icon} ${r.category}</div>
          <div class="sr-title">${r.title}</div>
        </a>
      `;
    }).join('');
    
    dropdown.classList.add('active');
  }

  function initSearch() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('search-results');
    
    if (!input || !dropdown) return;
    
    loadSearchIndex();
    
    let debounceTimer;
    
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const q = input.value.trim();
      
      if (!q) {
        dropdown.classList.remove('active');
        return;
      }
      
      debounceTimer = setTimeout(() => {
        const results = searchArticles(q);
        renderSearchResults(results, dropdown);
      }, 200);
    });
    
    input.addEventListener('focus', () => {
      if (input.value.trim() && searchIndex) {
        const results = searchArticles(input.value.trim());
        renderSearchResults(results, dropdown);
      }
    });
    
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
    
    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      const items = dropdown.querySelectorAll('.search-result-item');
      const active = dropdown.querySelector('.search-result-item.focused');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!active) {
          items[0]?.classList.add('focused');
        } else {
          const next = active.nextElementSibling;
          active.classList.remove('focused');
          (next || items[0])?.classList.add('focused');
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (active) {
          const prev = active.previousElementSibling;
          active.classList.remove('focused');
          (prev || items[items.length - 1])?.classList.add('focused');
        }
      } else if (e.key === 'Enter') {
        const focused = dropdown.querySelector('.search-result-item.focused');
        if (focused) focused.click();
      } else if (e.key === 'Escape') {
        dropdown.classList.remove('active');
        input.blur();
      }
    });
  }

  // ============================================================
  // Reading Progress Bar
  // ============================================================

  function initReadingProgress() {
    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;
    
    const bar = document.createElement('div');
    bar.style.cssText = `
      position: fixed;
      top: 60px;
      left: 0;
      height: 2px;
      background: #7c6af7;
      width: 0%;
      z-index: 99;
      transition: width 0.1s linear;
    `;
    document.body.appendChild(bar);
    
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(100, progress) + '%';
    });
  }

  // ============================================================
  // Smooth anchor links
  // ============================================================

  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ============================================================
  // Lang Tab Switch (中文 / English)
  // ============================================================

  function initLangTabs() {
    const tabs = document.querySelectorAll('.lang-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        // 切换 tab 激活状态
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // 切换内容面板
        document.querySelectorAll('.tab-panel').forEach(panel => {
          panel.style.display = panel.dataset.panel === target ? '' : 'none';
        });

        // 同步侧边栏金句标签颜色（可选视觉反馈）
        const isZh = target === 'zh';
        document.querySelectorAll('.key-quote').forEach(q => {
          q.style.borderLeftColor = isZh ? '' : '#4a4a6a';
          q.style.opacity = isZh ? '' : '0.7';
        });
      });
    });
  }

  // ============================================================
  // Init
  // ============================================================

  document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initReadingProgress();
    initAnchors();
    initLangTabs();
  });

})();
