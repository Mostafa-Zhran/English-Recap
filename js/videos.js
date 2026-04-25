// =========================================
//   ENGLISH LEAP — videos.js
// =========================================

'use strict';

// --- State ---
let videosData = [];

// --- DOM Refs ---
const videosGrid = document.getElementById('videosGrid');
const videosSection = document.getElementById('videosSection');
const darkToggle = document.getElementById('darkToggle');
const toastContainer = document.getElementById('toastContainer');

// =========================================
//   INIT
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  await renderVideos();
  setupEventListeners();
});

// =========================================
//   RENDER VIDEOS
// =========================================
async function renderVideos() {
  if (!videosGrid || !videosSection) return;

  try {
    // Show loading skeleton
    videosGrid.innerHTML = Array(8).fill(0).map(() =>
      `<div class="skeleton skeleton-card"></div>`
    ).join('');

    const res = await fetch('./data/videos.json');
    if (!res.ok) {
      videosGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">⚠️</div>
          <h3>Could not load videos</h3>
          <p>Please check your connection and try again.</p>
        </div>`;
      return;
    }
    videosData = await res.json();

    if (!videosData.videos || videosData.videos.length === 0) {
      videosGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">📺</div>
          <h3>No videos found</h3>
          <p>Check back later for new recommended videos.</p>
        </div>`;
      return;
    }

    videosGrid.innerHTML = videosData.videos.map((video, i) => {
      const embedUrl = convertToEmbed(video.url);
      return `
      <div class="video-card" style="animation-delay:${i * 50}ms">
        <div class="video-thumbnail">
          <iframe
            src="${embedUrl}"
            title="${escapeHtml(video.title)}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            loading="lazy">
          </iframe>
        </div>
        <div class="video-content">
          <div class="video-category">${escapeHtml(video.category)}</div>
          <div class="video-title">${escapeHtml(video.title)}</div>
          <div class="video-description">${escapeHtml(video.description)}</div>
          <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="video-link-btn">
            Watch on YouTube <span class="arrow">→</span>
          </a>
        </div>
      </div>
    `;
    }).join('');

    // Stagger card entrance
    requestAnimationFrame(() => {
      document.querySelectorAll('.video-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 60);
      });
    });
  } catch (err) {
    videosGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load videos</h3>
        <p>Please check your connection and try again.</p>
      </div>`;
    showToast('⚠️ Error loading videos', 'error');
    console.error(err);
  }
}

function convertToEmbed(url) {
  try {
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('watch?v=')) {
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  } catch (e) {
    console.error('Invalid video URL:', url);
    return '';
  }
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
