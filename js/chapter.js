// =========================================
//   ENGLISH LEAP — chapter.js
// =========================================

'use strict';

// --- State ---
let playlists = {};
let chapter = null;
let currentQuizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let activeSpeaker = null;
let activeUtterance = null;

// --- DOM refs ---
const toastContainer = document.getElementById('toastContainer');
const darkToggle = document.getElementById('darkToggle');
const chapterTitle = document.getElementById('chapterTitle');
const chapterIcon = document.getElementById('chapterIcon');
const chapterDesc = document.getElementById('chapterDesc');
const chapterLevelBadge = document.getElementById('chapterLevelBadge');
const navChapterTitle = document.getElementById('navChapterTitle');

// =========================================
//   INIT
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  await loadChapter();
  setupTabs();
  setupDarkMode();
});

// =========================================
//   LOAD CHAPTER
// =========================================
async function loadChapter() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id') || localStorage.getItem('selectedChapterId'));

  try {
    // Load chapters
    const res = await fetch('./data/chapters.json');
    if (!res.ok) throw new Error('Failed to load data');
    const chapters = await res.json();
    chapter = chapters.find(c => c.id === id);

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

    if (!chapter) {
      showError('Chapter not found. Please go back and select a chapter.');
      return;
    }

    renderChapterHero();
    renderSummary();
    renderVideos();
    renderConversation();
    renderQuiz();
    renderFlashcards();
    if (chapter.choresVsErrands) renderChoresVsErrands();
    if (chapter.directions) renderDirections();

  } catch (err) {
    showError('Could not load chapter content.');
    console.error(err);
  }
}

function showError(msg) {
  document.querySelector('.chapter-content').innerHTML = `
    <div class="empty-state" style="padding:80px 24px;text-align:center;">
      <div class="empty-icon">⚠️</div>
      <h3>${msg}</h3>
      <a href="index.html" class="btn btn-primary" style="display:inline-flex;margin-top:20px;">← Back to Home</a>
    </div>`;
}

// =========================================
//   RENDER: HERO
// =========================================
function renderChapterHero() {
  document.title = `${chapter.title} — English Leap`;
  if (chapterTitle) chapterTitle.textContent = chapter.title;
  if (chapterIcon) chapterIcon.textContent = chapter.icon;
  if (chapterDesc) chapterDesc.textContent = chapter.description;
  if (chapterLevelBadge) chapterLevelBadge.textContent = chapter.level;
  if (navChapterTitle) navChapterTitle.textContent = chapter.title;
}

// =========================================
//   RENDER: SUMMARY / VOCABULARY
// =========================================
function renderSummary() {
  const el = document.getElementById('summaryPanel');
  if (!el) return;

  const vocabTags = chapter.summary.vocabulary.map(word => `
    <span class="vocab-tag">
      <button class="tts-btn-tag" onclick="speakText('${escapeHtml(word)}')" title="Pronounce">🔊</button>
      ${escapeHtml(word)}
    </span>
  `).join('');

  el.innerHTML = `
    <div class="vocab-card">
      <h3>📝 Key Vocabulary <span class="section-count">${chapter.summary.vocabulary.length} words</span></h3>
      <div class="vocab-tags">${vocabTags}</div>
    </div>
    ${chapter.summary.grammar ? `
      <div class="vocab-card">
        <h3>📐 Grammar Focus</h3>
        <div class="grammar-box">${chapter.summary.grammar}</div>
      </div>
    ` : ''}
    <div class="vocab-card">
      <h3>💡 Study Tip</h3>
      <div class="grammar-box">
        Try using these words in your own sentences! Click <strong>🔊</strong> on any word to hear it pronounced. 
        Then head to the <strong>Quiz</strong> tab to test yourself.
      </div>
    </div>
  `;
}

// =========================================
//   RENDER: VIDEOS
// =========================================
function renderVideos() {
  const el = document.getElementById('videosPanel');
  if (!el) return;

  if (!chapter.videos || !chapter.videos.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📺</div>
        <h3>No videos yet</h3>
        <p>Videos will be added soon.</p>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="videos-grid">
      ${chapter.videos.map(v => {
    const embedUrl = convertToEmbed(v.url);

    return `
        <div class="video-card">
          <div class="video-wrapper">
            <iframe 
              src="${embedUrl}?rel=0&modestbranding=1"
              title="${escapeHtml(v.title || 'Video')}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              loading="lazy">
            </iframe>
          </div>
          <div class="video-info">
            <div class="video-title">${escapeHtml(v.title || 'Video')}</div>
          </div>
        </div>
        `;
  }).join('')}
    </div>

    <div class="vocab-card" style="margin-top:20px;">
      <h3>💡 While Watching</h3>
      <div class="grammar-box">
        Pay attention to how native speakers use the vocabulary from this chapter. 
        Try to pause and repeat phrases aloud to improve your pronunciation.
      </div>
    </div>
  `;
}
function convertToEmbed(url) {
  try {
    // youtu.be
    if (url.includes("youtu.be")) {
      const id = url.split("/").pop().split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }

    // watch?v=
    if (url.includes("watch?v=")) {
      const id = new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${id}`;
    }

    // already embed
    if (url.includes("/embed/")) {
      return url;
    }

    return url;
  } catch (e) {
    console.error("Invalid video URL:", url);
    return "";
  }
}

// =========================================
//   RENDER: CONVERSATION / CHAT
// =========================================
function renderConversation() {
  const el = document.getElementById('conversationPanel');
  if (!el) return;

  const messages = chapter.conversation.map((msg, i) => `
    <div class="chat-message speaker-${msg.speaker.toLowerCase()}" style="animation-delay:${i * 60}ms">
      <div class="chat-avatar">${msg.speaker}</div>
      <div class="bubble-wrap">
        <div class="chat-label">Person ${msg.speaker}</div>
        <div class="chat-bubble">${escapeHtml(msg.text)}</div>
        <div class="bubble-actions">
          <button class="tts-btn" onclick="speakMessage('${escapeHtml(msg.text)}', this)" title="Listen">🔊</button>
        </div>
      </div>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="flex justify-between items-center mb-4 gap-2" style="flex-wrap:wrap;">
      <div>
        <p style="font-size:0.875rem;color:var(--gray-400);">
          ${chapter.conversation.length} exchanges • Click 🔊 to hear any line
        </p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost" onclick="readFullConversation()" style="font-size:0.82rem;padding:8px 14px;">
          ▶️ Read All
        </button>
        <button class="btn btn-ghost" onclick="stopSpeech()" style="font-size:0.82rem;padding:8px 14px;">
          ⏹ Stop
        </button>
      </div>
    </div>
    <div class="chat-container" id="chatContainer">
      ${messages}
    </div>
  `;
}

// =========================================
//   RENDER: QUIZ
// =========================================
function renderQuiz() {
  const el = document.getElementById('quizPanel');
  if (!el) return;

  if (!chapter.quiz || !chapter.quiz.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🧠</div><h3>Quiz coming soon!</h3></div>`;
    return;
  }

  currentQuizIndex = 0;
  quizScore = 0;
  renderQuizQuestion(el);
}

function renderQuizQuestion(container) {
  const el = container || document.getElementById('quizPanel');
  const q = chapter.quiz[currentQuizIndex];
  const total = chapter.quiz.length;
  const progress = ((currentQuizIndex) / total) * 100;
  const letters = ['A', 'B', 'C', 'D'];

  el.innerHTML = `
    <div class="quiz-progress-bar">
      <div class="quiz-progress-fill" style="width:${progress}%"></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:0.82rem;color:var(--gray-400);font-weight:600;">
      <span>Question ${currentQuizIndex + 1} of ${total}</span>
      <span>Score: ${quizScore} / ${total}</span>
    </div>
    <div class="quiz-card">
      <div class="quiz-num">Question ${currentQuizIndex + 1}</div>
      <div class="quiz-question">${escapeHtml(q.question)}</div>
      <div class="quiz-options" id="quizOptions">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" onclick="answerQuiz(${i})" data-index="${i}">
            <span class="opt-letter">${letters[i]}</span>
            <span>${escapeHtml(opt)}</span>
          </button>
        `).join('')}
      </div>
    </div>
    <div id="quizFeedback" style="margin-top:16px;"></div>
  `;
}

function answerQuiz(selectedIndex) {
  if (quizAnswered) return;
  quizAnswered = true;

  const q = chapter.quiz[currentQuizIndex];
  const options = document.querySelectorAll('.quiz-option');
  const feedback = document.getElementById('quizFeedback');
  const isCorrect = selectedIndex === q.answer;

  if (isCorrect) quizScore++;

  options.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) btn.classList.add('correct');
    else if (i === selectedIndex && !isCorrect) btn.classList.add('wrong');
  });

  feedback.innerHTML = `
    <div style="padding:14px 18px;border-radius:var(--radius);background:${isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'};
    border:1.5px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'};
    color:${isCorrect ? 'var(--success)' : 'var(--danger)'};
    font-size:0.9rem;font-weight:600;display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <span>${isCorrect ? '✅ Correct! Great job!' : '❌ Not quite. The correct answer is highlighted.'}</span>
      <button class="btn btn-primary" onclick="nextQuestion()" style="font-size:0.82rem;padding:8px 16px;">
        ${currentQuizIndex < chapter.quiz.length - 1 ? 'Next →' : 'See Results'}
      </button>
    </div>
  `;
}

function nextQuestion() {
  quizAnswered = false;
  currentQuizIndex++;

  if (currentQuizIndex >= chapter.quiz.length) {
    showQuizResult();
  } else {
    renderQuizQuestion();
  }
}

function showQuizResult() {
  const el = document.getElementById('quizPanel');
  const total = chapter.quiz.length;
  const pct = Math.round((quizScore / total) * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📚';
  const msg = pct === 100 ? 'Perfect score! Outstanding!' :
    pct >= 70 ? 'Great work! Keep it up!' :
      pct >= 40 ? 'Good effort! Review and try again.' :
        'Keep studying — you\'ll get there!';

  el.innerHTML = `
    <div class="quiz-progress-bar">
      <div class="quiz-progress-fill" style="width:100%"></div>
    </div>
    <div class="quiz-result">
      <div class="result-emoji">${emoji}</div>
      <div class="result-score">${pct}%</div>
      <div class="result-label">${quizScore} out of ${total} correct</div>
      <p style="color:var(--gray-500);margin-bottom:28px;font-size:0.95rem;">${msg}</p>
      <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="renderQuiz()">🔄 Try Again</button>
        <button class="btn btn-ghost" onclick="switchTab('summary')">📝 Review Vocabulary</button>
      </div>
    </div>
  `;
}

// =========================================
//   RENDER: FLASHCARDS
// =========================================
function renderFlashcards() {
  const el = document.getElementById('flashcardsPanel');
  if (!el) return;

  const vocab = chapter.summary.vocabulary;
  let currentCard = 0;

  function render() {
    const word = vocab[currentCard];
    el.innerHTML = `
      <div style="text-align:center;margin-bottom:16px;">
        <p style="font-size:0.875rem;color:var(--gray-400);font-weight:500;">
          Card ${currentCard + 1} of ${vocab.length} • Click to flip
        </p>
      </div>
      <div class="flashcard" id="currentCard" onclick="this.classList.toggle('flipped')" title="Click to flip">
        <div class="flashcard-inner">
          <div class="flashcard-front">
            <div style="text-align:center;">
              <div style="font-size:2rem;margin-bottom:12px;">🔤</div>
              <div>${escapeHtml(word)}</div>
              <div style="font-size:0.75rem;color:var(--gray-400);margin-top:8px;">Click to see usage</div>
            </div>
          </div>
          <div class="flashcard-back">
            <div style="text-align:center;">
              <div style="font-size:1.5rem;margin-bottom:12px;">🔊</div>
              <div style="font-size:0.85rem;opacity:0.85;">"${escapeHtml(word)}"</div>
              <div style="font-size:0.75rem;margin-top:10px;opacity:0.7;">Chapter: ${chapter.title}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-3 mt-4" style="justify-content:center;">
        <button class="btn btn-ghost" onclick="prevCard()" ${currentCard === 0 ? 'disabled' : ''} style="font-size:0.85rem;">← Prev</button>
        <button class="btn btn-primary" onclick="speakText('${escapeHtml(word)}')" style="font-size:0.85rem;">🔊 Pronounce</button>
        <button class="btn btn-ghost" onclick="nextCard()" ${currentCard === vocab.length - 1 ? 'disabled' : ''} style="font-size:0.85rem;">Next →</button>
      </div>
      <div style="margin-top:20px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
        ${vocab.map((_, i) => `
          <div onclick="goToCard(${i})" style="width:8px;height:8px;border-radius:50%;
          background:${i === currentCard ? 'var(--primary)' : 'var(--gray-300)'};
          cursor:pointer;transition:var(--transition);"></div>
        `).join('')}
      </div>
    `;

    window.prevCard = () => { if (currentCard > 0) { currentCard--; render(); } };
    window.nextCard = () => { if (currentCard < vocab.length - 1) { currentCard++; render(); } };
    window.goToCard = (i) => { currentCard = i; render(); };
  }

  render();
}

// =========================================
//   TABS
// =========================================
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === tabId + 'Panel');
  });
  // Sidebar sync
  document.querySelectorAll('.sidebar-nav-item').forEach(s => {
    s.classList.toggle('active', s.dataset.tab === tabId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.switchTab = switchTab;

// =========================================
//   TEXT-TO-SPEECH
// =========================================
function speakText(text) {
  if (!('speechSynthesis' in window)) {
    showToast('🔇 TTS not supported in your browser');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function speakMessage(text, btn) {
  if (!('speechSynthesis' in window)) {
    showToast('🔇 TTS not supported in your browser');
    return;
  }

  // If already speaking this button, stop
  if (activeSpeaker === btn) {
    stopSpeech();
    return;
  }

  stopSpeech();

  activeSpeaker = btn;
  btn.classList.add('speaking');
  btn.textContent = '⏸';

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.92;
  activeUtterance = utterance;

  utterance.onend = () => {
    btn.classList.remove('speaking');
    btn.textContent = '🔊';
    activeSpeaker = null;
  };

  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  window.speechSynthesis.cancel();
  if (activeSpeaker) {
    activeSpeaker.classList.remove('speaking');
    activeSpeaker.textContent = '🔊';
    activeSpeaker = null;
  }
}

function readFullConversation() {
  if (!('speechSynthesis' in window)) {
    showToast('🔇 TTS not supported');
    return;
  }
  stopSpeech();
  const msgs = chapter.conversation;
  let i = 0;

  function speakNext() {
    if (i >= msgs.length) return;
    const msg = msgs[i];
    const utterance = new SpeechSynthesisUtterance(msg.text);
    utterance.lang = 'en-US';
    utterance.rate = 0.88;
    utterance.onend = () => { i++; setTimeout(speakNext, 400); };

    // Highlight active bubble
    const bubbles = document.querySelectorAll('.chat-bubble');
    bubbles.forEach((b, bi) => b.style.opacity = bi === i ? '1' : '0.5');

    window.speechSynthesis.speak(utterance);
  }

  speakNext();
  showToast('🔊 Reading conversation...');
}

window.speakText = speakText;
window.speakMessage = speakMessage;
window.stopSpeech = stopSpeech;
window.readFullConversation = readFullConversation;
window.answerQuiz = answerQuiz;
window.nextQuestion = nextQuestion;
window.renderQuiz = renderQuiz;

// =========================================
//   DARK MODE
// =========================================
function loadTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  if (darkToggle) darkToggle.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function setupDarkMode() {
  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      darkToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }
}

// =========================================
//   SIDEBAR NAV
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.tab);
    });
  });
});

// =========================================
//   TOAST
// =========================================
function showToast(msg) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

window.showToast = showToast;

// =========================================
//   RENDER: CHORES VS ERRANDS
// =========================================
function renderChoresVsErrands() {
  const el = document.getElementById('choresVsErrandsPanel');
  const sidebarBtn = document.getElementById('choresVsErrandsSidebar');
  const tabBtn = document.getElementById('choresVsErrandsTab');

  if (!el || !chapter.choresVsErrands) return;

  // Show the sidebar and tab buttons
  if (sidebarBtn) sidebarBtn.style.display = '';
  if (tabBtn) tabBtn.style.display = '';

  const data = chapter.choresVsErrands;

  // Render chores by room
  const choresHtml = Object.entries(data.chores).map(([key, room]) => `
    <div class="chore-room-card">
      <div class="chore-room-header">
        <span class="chore-room-icon">${room.icon}</span>
        <h4>${escapeHtml(room.title)}</h4>
      </div>
      <ul class="chore-tasks-list">
        ${room.tasks.map(task => `
          <li class="chore-task">
            <span class="chore-bullet">•</span>
            ${escapeHtml(task)}
            <button class="tts-btn-mini" onclick="speakText('${escapeHtml(task)}')" title="Pronounce">🔊</button>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');

  // Render errands
  const errandsHtml = data.errands.items.map(item => `
    <li class="errand-item">
      <span class="errand-bullet">•</span>
      ${escapeHtml(item)}
      <button class="tts-btn-mini" onclick="speakText('${escapeHtml(item)}')" title="Pronounce">🔊</button>
    </li>
  `).join('');

  // Render places
  const placesHtml = data.places.items.map(item => `
    <li class="place-item">
      <span class="place-bullet">•</span>
      ${escapeHtml(item)}
      <button class="tts-btn-mini" onclick="speakText('${escapeHtml(item)}')" title="Pronounce">🔊</button>
    </li>
  `).join('');

  el.innerHTML = `
    <div class="chores-errands-section">
      <div class="section-header">
        <h2>${data.title}</h2>
        <p class="section-subtitle">${data.subtitle}</p>
      </div>

      <div class="chores-grid">
        <h3>🏠 Chores by Room</h3>
        ${choresHtml}
      </div>

      <div class="errands-section">
        <h3>🔹 Common Errands</h3>
        <ul class="errands-list">
          ${errandsHtml}
        </ul>
      </div>

      <div class="places-section">
        <h3>🔹 Places Related to Errands</h3>
        <ul class="places-list">
          ${placesHtml}
        </ul>
      </div>
    </div>
  `;
}

// =========================================
//   RENDER: DIRECTIONS
// =========================================
function renderDirections() {
  const el = document.getElementById('directionsPanel');
  const sidebarBtn = document.getElementById('directionsSidebar');
  const tabBtn = document.getElementById('directionsTab');

  if (!el || !chapter.directions) return;

  // Show the sidebar and tab buttons
  if (sidebarBtn) sidebarBtn.style.display = '';
  if (tabBtn) tabBtn.style.display = '';

  const data = chapter.directions;

  // Render asking for directions
  const askingHtml = data.askingForDirections.map(item => `
    <li class="direction-item">
      <span class="direction-bullet">•</span>
      ${escapeHtml(item)}
      <button class="tts-btn-mini" onclick="speakText('${escapeHtml(item)}')" title="Pronounce">🔊</button>
    </li>
  `).join('');

  // Render giving directions
  const givingHtml = data.givingDirections.map(item => `
    <li class="direction-item">
      <span class="direction-bullet">•</span>
      ${escapeHtml(item)}
      <button class="tts-btn-mini" onclick="speakText('${escapeHtml(item)}')" title="Pronounce">🔊</button>
    </li>
  `).join('');

  // Render key vocabulary
  const vocabHtml = data.keyVocabulary.map(item => `
    <li class="vocab-item">
      <span class="vocab-bullet">•</span>
      ${escapeHtml(item)}
      <button class="tts-btn-mini" onclick="speakText('${escapeHtml(item)}')" title="Pronounce">🔊</button>
    </li>
  `).join('');

  // Render conversation example
  const conversationHtml = data.conversationExample.map(item => `
    <div class="direction-conversation-line">
      <span class="speaker-label">${escapeHtml(item.speaker)}:</span>
      <span class="speaker-text">${escapeHtml(item.text)}</span>
      <button class="tts-btn-mini" onclick="speakText('${escapeHtml(item.text)}')" title="Pronounce">🔊</button>
    </div>
  `).join('');

  // Render tips
  const tipsHtml = data.tips.map(tip => `
    <li class="tip-item">
      <span class="tip-icon">💡</span>
      ${escapeHtml(tip)}
    </li>
  `).join('');

  el.innerHTML = `
    <div class="directions-section">
      <div class="section-header">
        <h2>${data.title}</h2>
        <p class="section-subtitle">${data.subtitle}</p>
      </div>

      <div class="directions-grid">
        <div class="direction-card">
          <h3>🗣️ Asking for Directions</h3>
          <ul class="directions-list">
            ${askingHtml}
          </ul>
        </div>

        <div class="direction-card">
          <h3>🧭 Giving Directions</h3>
          <ul class="directions-list">
            ${givingHtml}
          </ul>
        </div>

        <div class="direction-card">
          <h3>📚 Key Vocabulary</h3>
          <ul class="directions-list">
            ${vocabHtml}
          </ul>
        </div>

        <div class="direction-card conversation-card">
          <h3>💬 Conversation Example</h3>
          <div class="direction-conversation">
            ${conversationHtml}
          </div>
        </div>

        <div class="direction-card tips-card">
          <h3>✨ Tips</h3>
          <ul class="tips-list">
            ${tipsHtml}
          </ul>
        </div>
      </div>
    </div>
  `;
}

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
