// =========================================
//   ENGLISH LEAP — playlists.js
// =========================================

'use strict';

// --- State ---
let playlistsData = [];

// --- DOM Refs ---
const playlistsGrid = document.getElementById('playlistsGrid');
const playlistsSection = document.getElementById('playlistsSection');
const darkToggle = document.getElementById('darkToggle');
const toastContainer = document.getElementById('toastContainer');

// =========================================
//   INIT
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  await renderPlaylists();
  setupEventListeners();
});

// =========================================
//   RENDER PLAYLISTS
// =========================================
async function renderPlaylists() {
  if (!playlistsGrid || !playlistsSection) return;

  try {
    // Show loading skeleton
    playlistsGrid.innerHTML = Array(8).fill(0).map(() =>
      `<div class="skeleton skeleton-card"></div>`
    ).join('');

    const res = await fetch('./data/playlists.json');
    if (!res.ok) {
      playlistsGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">⚠️</div>
          <h3>Could not load playlists</h3>
          <p>Please check your connection and try again.</p>
        </div>`;
      return;
    }
    playlistsData = await res.json();

    if (!playlistsData.playlists || playlistsData.playlists.length === 0) {
      playlistsGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🎵</div>
          <h3>No playlists found</h3>
          <p>Check back later for new recommended playlists.</p>
        </div>`;
      return;
    }

    playlistsGrid.innerHTML = playlistsData.playlists.map((playlist, i) => {
      const embedUrl = convertPlaylistToEmbed(playlist.url);
      return `
      <div class="playlist-card-wrapper" style="animation-delay:${i * 50}ms">
        <a href="${playlist.url}" target="_blank" rel="noopener noreferrer" class="playlist-card">
          <div class="playlist-card-icon">🎵</div>
          <div class="playlist-card-content">
            <div class="playlist-card-title">${escapeHtml(playlist.title)}</div>
            <div class="playlist-card-level">${escapeHtml(playlist.category)}</div>
            <div class="playlist-card-meta">📹 ${playlist.videoCount} videos</div>
          </div>
          <div class="playlist-card-arrow">→</div>
        </a>
        <div class="playlist-preview">
          <iframe
            src="${embedUrl}"
            title="${escapeHtml(playlist.title)}"
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
    }).join('');

    // Stagger card entrance
    requestAnimationFrame(() => {
      document.querySelectorAll('.playlist-card-wrapper').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 60);
      });
    });

    // Setup hover listeners for preview
    setupPlaylistPreview();
  } catch (err) {
    playlistsGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load playlists</h3>
        <p>Please check your connection and try again.</p>
      </div>`;
    showToast('⚠️ Error loading playlists', 'error');
    console.error(err);
  }
}

function convertPlaylistToEmbed(url) {
  try {
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
  // Dark mode toggle
  if (darkToggle) {
    darkToggle.addEventListener('click', toggleTheme);
  }
}

// expose globally
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
