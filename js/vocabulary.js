// =========================================
//   ENGLISH LEAP — vocabulary.js
// =========================================

'use strict';

// --- State ---
let vocabularyData = [];

// --- DOM Refs ---
const vocabularyGrid = document.getElementById('vocabularyGrid');
const vocabularySection = document.getElementById('vocabularySection');
const darkToggle = document.getElementById('darkToggle');
const toastContainer = document.getElementById('toastContainer');

// =========================================
//   INIT
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  await renderVocabulary();
  setupEventListeners();
});

// =========================================
//   RENDER VOCABULARY
// =========================================
async function renderVocabulary() {
  if (!vocabularyGrid || !vocabularySection) return;

  try {
    // Show loading skeleton
    vocabularyGrid.innerHTML = Array(8).fill(0).map(() =>
      `<div class="skeleton skeleton-card"></div>`
    ).join('');

    const res = await fetch('./data/vocabulary.json');
    if (!res.ok) {
      vocabularyGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">⚠️</div>
          <h3>Could not load vocabulary</h3>
          <p>Please check your connection and try again.</p>
        </div>`;
      return;
    }
    vocabularyData = await res.json();

    if (!vocabularyData.vocabulary || vocabularyData.vocabulary.length === 0) {
      vocabularyGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">📖</div>
          <h3>No vocabulary words found</h3>
          <p>Check back later for new words to learn.</p>
        </div>`;
      return;
    }

    vocabularyGrid.innerHTML = vocabularyData.vocabulary.map((item, i) => `
      <div class="vocab-card" style="animation-delay:${i * 50}ms">
        <div class="vocab-word">${escapeHtml(item.word)}</div>
        <div class="vocab-definition">${escapeHtml(item.definition)}</div>
        ${item.example ? `<div class="vocab-example">"${escapeHtml(item.example)}"</div>` : ''}
        <button class="vocab-tts-btn" onclick="speakVocabulary('${escapeHtml(item.word)}')" title="Pronounce">🔊</button>
      </div>
    `).join('');

    // Stagger card entrance
    requestAnimationFrame(() => {
      document.querySelectorAll('.vocab-card').forEach((card, i) => {
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
    vocabularyGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load vocabulary</h3>
        <p>Please check your connection and try again.</p>
      </div>`;
    showToast('⚠️ Error loading vocabulary', 'error');
    console.error(err);
  }
}

function speakVocabulary(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
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
window.speakVocabulary = speakVocabulary;

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
