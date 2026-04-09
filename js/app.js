// =========================================
//   ENGLISH LEAP — app.js (Home Page)
// =========================================

'use strict';

// --- State ---
let playlists = {};
let allChapters = [];
let currentFilter = 'all';
let searchQuery = '';
let ttsUtterance = null;
let isSpeaking = false;

// --- DOM Refs ---
const chaptersGrid = document.getElementById('chaptersGrid');
const navSearch = document.getElementById('navSearch');
const darkToggle = document.getElementById('darkToggle');
const chapterCount = document.getElementById('chapterCount');
const toastContainer = document.getElementById('toastContainer');

// =========================================
//   INIT
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  await fetchChapters();
  setupEventListeners();
  animateHeroStats();
});

// =========================================
//   FETCH DATA
// =========================================
async function fetchChapters() {
  try {
    showSkeletons();
    // Simulate slight loading delay for UX
    await new Promise(r => setTimeout(r, 300));
    
    // Load chapters
    const res = await fetch('./data/chapters.json');
    if (!res.ok) throw new Error('Failed to load chapters');
    allChapters = await res.json();
    
    // Load playlists config
    try {
      const configRes = await fetch('./data/config.json');
      if (configRes.ok) {
        const config = await configRes.json();
        playlists = config.playlists || {};
      }
    } catch (configErr) {
      // Config file is optional, continue without it
      console.warn('Could not load config.json', configErr);
    }
    
    renderChapters(allChapters);
    renderPlaylistLinks();
    updateCount(allChapters.length);
  } catch (err) {
    chaptersGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load chapters</h3>
        <p>Please check your connection and try again.</p>
      </div>`;
    showToast('⚠️ Error loading data', 'error');
    console.error(err);
  }
}

// =========================================
//   RENDER CHAPTERS
// =========================================
function renderChapters(chapters) {
  if (!chapters.length) {
    chaptersGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No chapters found</h3>
        <p>Try a different search or filter.</p>
      </div>`;
    updateCount(0);
    return;
  }

  chaptersGrid.innerHTML = chapters.map((ch, i) => `
    <div class="chapter-card" 
         style="animation-delay:${i * 60}ms" 
         onclick="openChapter(${ch.id})"
         role="article"
         tabindex="0"
         aria-label="Chapter: ${ch.title}"
         onkeydown="if(event.key==='Enter') openChapter(${ch.id})">
      <div class="card-icon">${ch.icon}</div>
      <div class="card-header">
        <div>
          <div class="card-level">${ch.level}</div>
        </div>
      </div>
      <div class="card-title">${ch.title}</div>
      <div class="card-desc">${ch.description}</div>
      <div class="card-meta">
        <div class="card-meta-item">
          <span>📝</span>
          <span>${ch.summary.vocabulary.length} words</span>
        </div>
        <div class="card-meta-item">
          <span>📺</span>
          <span>${ch.videos.length} videos</span>
        </div>
        <div class="card-meta-item">
          <span>💬</span>
          <span>${ch.conversation.length} lines</span>
        </div>
      </div>
      <button class="btn-open" onclick="event.stopPropagation(); openChapter(${ch.id})">
        Open Chapter <span class="arrow">→</span>
      </button>
    </div>
  `).join('');

  // Stagger card entrance
  requestAnimationFrame(() => {
    document.querySelectorAll('.chapter-card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 70);
    });
  });
}

function showSkeletons() {
  chaptersGrid.innerHTML = Array(6).fill(0).map(() =>
    `<div class="skeleton skeleton-card"></div>`
  ).join('');
}

function updateCount(n) {
  if (chapterCount) chapterCount.textContent = n;
}

// =========================================
//   RENDER PLAYLIST LINKS
// =========================================
function renderPlaylistLinks() {
  const playlistGrid = document.getElementById('playlistGrid');
  const playlistSection = document.getElementById('playlistSection');
  if (!playlistGrid || !playlistSection) return;

  // Clear existing content
  playlistGrid.innerHTML = '';

  const levels = ['B1', 'B2'];
  let hasPlaylists = false;

  levels.forEach(level => {
    const levelPlaylists = playlists[level];
    if (!levelPlaylists || !Array.isArray(levelPlaylists) || levelPlaylists.length === 0) return;

    hasPlaylists = true;

    // Create level column
    const levelColumn = document.createElement('div');
    levelColumn.className = 'playlist-level-column';
    levelColumn.innerHTML = `
      <div class="playlist-level-title">${level} Level</div>
      <div class="playlist-level-list">
        ${levelPlaylists.map((playlist, index) => {
          if (!playlist.url || playlist.url.includes('YOUR_')) return '';
          const embedUrl = convertPlaylistToEmbed(playlist.url);
          return `
            <div class="playlist-card-wrapper" data-level="${level}" data-index="${index}">
              <a href="${playlist.url}" target="_blank" rel="noopener noreferrer" class="playlist-card">
                <div class="playlist-card-icon">📺</div>
                <div class="playlist-card-content">
                  <div class="playlist-card-title">${escapeHtml(playlist.title || level)}</div>
                  <div class="playlist-card-level">${level}</div>
                </div>
                <div class="playlist-card-arrow">→</div>
              </a>
              <div class="playlist-preview">
                <iframe
                  src="${embedUrl}"
                  title="${escapeHtml(playlist.title || level)}"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  loading="lazy">
                </iframe>
                <div class="playlist-preview-overlay">
                  <button class="btn-playlist-preview" onclick="event.stopPropagation(); window.open('${playlist.url}', '_blank')">
                    ▶ Watch Full Playlist
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    playlistGrid.appendChild(levelColumn);
  });

  // Hide section if no playlists configured
  if (!hasPlaylists) {
    playlistSection.style.display = 'none';
  } else {
    playlistSection.style.display = 'block';
  }

  // Setup hover listeners for preview
  setupPlaylistPreview();
}

function convertPlaylistToEmbed(url) {
  try {
    // Extract playlist ID from URL
    if (url.includes('list=')) {
      const playlistId = new URL(url).searchParams.get('list');
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    }
    return url;
  } catch (e) {
    console.error('Invalid playlist URL:', url);
    return '';
  }
}

function setupPlaylistPreview() {
  const wrappers = document.querySelectorAll('.playlist-card-wrapper');
  wrappers.forEach(wrapper => {
    const card = wrapper.querySelector('.playlist-card');
    const preview = wrapper.querySelector('.playlist-preview');

    if (card && preview) {
      // Show preview on hover
      card.addEventListener('mouseenter', () => {
        preview.classList.add('active');
      });

      // Hide preview when leaving the wrapper
      wrapper.addEventListener('mouseleave', () => {
        preview.classList.remove('active');
      });
    }
  });
}

// =========================================
//   OPEN CHAPTER
// =========================================
function openChapter(id) {
  localStorage.setItem('selectedChapterId', id);
  window.location.href = `chapter.html?id=${id}`;
}

// =========================================
//   SEARCH & FILTER
// =========================================
function filterAndSearch() {
  let results = allChapters;

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    results = results.filter(ch =>
      ch.title.toLowerCase().includes(q) ||
      ch.description.toLowerCase().includes(q) ||
      ch.summary.vocabulary.some(v => v.toLowerCase().includes(q))
    );
  }

  // Level filter
  if (currentFilter !== 'all') {
    results = results.filter(ch => ch.level.toLowerCase() === currentFilter.toLowerCase());
  }

  renderChapters(results);
  updateCount(results.length);
}

// =========================================
//   DARK MODE
// =========================================
function loadTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  if (darkToggle) darkToggle.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  if (darkToggle) darkToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  showToast(next === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on');
}

// =========================================
//   HERO STATS ANIMATION
// =========================================
function animateHeroStats() {
  const stats = document.querySelectorAll('.stat-num[data-target]');
  stats.forEach(el => {
    const target = parseInt(el.getAttribute('data-target'));
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + (el.dataset.suffix || '');
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

// =========================================
//   TOAST
// =========================================
function showToast(msg, type = 'info') {
  const icons = { info: 'ℹ️', error: '❌', success: '✅' };
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${msg}`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

// =========================================
//   EVENT LISTENERS
// =========================================
function setupEventListeners() {
  // Search
  if (navSearch) {
    navSearch.addEventListener('input', e => {
      searchQuery = e.target.value;
      filterAndSearch();
    });
  }

  // Dark mode toggle
  if (darkToggle) {
    darkToggle.addEventListener('click', toggleTheme);
  }

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      filterAndSearch();
    });
  });
}

// expose globally
window.openChapter = openChapter;
window.toggleTheme = toggleTheme;
window.showToast = showToast;

// =========================================
//   HELPERS
// =========================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
