// =========================================
//   ENGLISH LEAP — exam.js
// =========================================

'use strict';

// --- State ---
let examData = null;
let scriptsVisible = false;

// --- DOM Refs ---
const examGrid = document.getElementById('examGrid');
const examSection = document.getElementById('examSection');
const darkToggle = document.getElementById('darkToggle');
const toastContainer = document.getElementById('toastContainer');
const examScore = document.getElementById('examScore');
const scoreValue = document.getElementById('scoreValue');
const scoreTotal = document.getElementById('scoreTotal');

// =========================================
//   INIT
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  await renderExam();
  setupEventListeners();
});

// =========================================
//   RENDER EXAM
// =========================================
async function renderExam() {
  if (!examGrid || !examSection) return;

  try {
    // Show loading skeleton
    examGrid.innerHTML = Array(5).fill(0).map(() =>
      `<div class="skeleton skeleton-card"></div>`
    ).join('');

    const res = await fetch('./data/exam.json');
    if (!res.ok) {
      examGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">⚠️</div>
          <h3>Could not load exam</h3>
          <p>Please check your connection and try again.</p>
        </div>`;
      return;
    }
    examData = await res.json();

    if (!examData.exam || !examData.exam.sections || examData.exam.sections.length === 0) {
      examGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">📝</div>
          <h3>No exam questions found</h3>
          <p>Check back later for new exam questions.</p>
        </div>`;
      return;
    }

    renderExamSections();
  } catch (err) {
    examGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load exam</h3>
        <p>Please check your connection and try again.</p>
      </div>`;
    showToast('⚠️ Error loading exam', 'error');
    console.error(err);
  }
}

function renderExamSections() {
  let html = '';

  // Render fill-in-the-blank sections
  if (examData.exam.sections && examData.exam.sections.length > 0) {
    html += `<div class="exam-section-title">🎧 Listening Passages - Fill in the Blank</div>`;
    html += examData.exam.sections.map((section, index) => {
      const passageWithBlanks = section.passage.replace(/______/g, () => {
        const blankCount = section.passage.match(/______/g).length;
        return `<input type="text" class="exam-blank" data-section="${section.id}" data-blank="${blankCount}" placeholder="______" />`;
      });

      return `
        <div class="exam-card" data-section-id="${section.id}">
          <div class="exam-card-header">
            <span class="exam-number">${index + 1}</span>
            <h3 class="exam-title">${escapeHtml(section.title)}</h3>
          </div>
          <div class="exam-passage">
            ${passageWithBlanks}
          </div>
          <div class="exam-script" id="script-${section.id}" style="display:none;">
            <div class="script-header">
              <span>📜 Script</span>
              <button class="tts-btn" onclick="speakScript(${section.id})" title="Listen">🔊</button>
            </div>
            <p class="script-text">${escapeHtml(section.script)}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render multiple choice sections
  if (examData.exam.multipleChoice && examData.exam.multipleChoice.length > 0) {
    html += `<div class="exam-section-title">✅ Multiple Choice Questions</div>`;
    html += examData.exam.multipleChoice.map((question, index) => {
      return `
        <div class="exam-card mcq-card" data-question-id="${question.id}">
          <div class="exam-card-header">
            <span class="exam-number">${index + 1}</span>
            <h3 class="exam-title">${escapeHtml(question.question)}</h3>
          </div>
          <div class="mcq-options">
            ${question.options.map((option, optIndex) => `
              <label class="mcq-option">
                <input type="radio" name="question-${question.id}" value="${String.fromCharCode(65 + optIndex)}" data-question="${question.id}" />
                <span class="option-label">${String.fromCharCode(65 + optIndex)})</span>
                <span class="option-text">${escapeHtml(option)}</span>
              </label>
            `).join('')}
          </div>
          <div class="mcq-feedback" id="feedback-${question.id}" style="display:none;"></div>
        </div>
      `;
    }).join('');
  }

  examGrid.innerHTML = html;

  // Add click listeners for MCQ immediate feedback
  if (examData.exam.multipleChoice) {
    examData.exam.multipleChoice.forEach(question => {
      const radioInputs = document.querySelectorAll(`input[name="question-${question.id}"]`);
      radioInputs.forEach(input => {
        input.addEventListener('change', () => {
          checkMCQAnswer(question.id, input.value);
        });
      });
    });
  }

  // Update total score
  let totalBlanks = 0;
  if (examData.exam.sections) {
    examData.exam.sections.forEach(section => {
      totalBlanks += section.answers.length;
    });
  }
  let totalMCQ = examData.exam.multipleChoice ? examData.exam.multipleChoice.length : 0;
  scoreTotal.textContent = totalBlanks + totalMCQ;
}

function checkMCQAnswer(questionId, selectedValue) {
  const question = examData.exam.multipleChoice.find(q => q.id === questionId);
  if (!question) return;

  const feedbackElement = document.getElementById(`feedback-${questionId}`);
  const allOptions = document.querySelectorAll(`input[name="question-${questionId}"]`);
  
  // Clear previous styling
  allOptions.forEach(input => {
    input.parentElement.classList.remove('correct', 'incorrect', 'correct-answer');
  });

  const selectedOption = document.querySelector(`input[name="question-${questionId}"][value="${selectedValue}"]`);

  if (selectedValue === question.answer) {
    // Correct answer
    selectedOption.parentElement.classList.add('correct');
    if (feedbackElement) {
      feedbackElement.innerHTML = '<span class="feedback-correct">Correct! Well done!</span>';
      feedbackElement.style.display = 'block';
    }
    showToast('✅ Correct!', 'success');
  } else {
    // Incorrect answer
    selectedOption.parentElement.classList.add('incorrect');
    
    // Show correct answer
    const correctOption = document.querySelector(`input[name="question-${questionId}"][value="${question.answer}"]`);
    if (correctOption) {
      correctOption.parentElement.classList.add('correct-answer');
    }
    
    if (feedbackElement) {
      feedbackElement.innerHTML = `<span class="feedback-incorrect">Incorrect! Correct answer: ${question.answer}</span>`;
      feedbackElement.style.display = 'block';
    }
    showToast('❌ Incorrect!', 'error');
  }
}

function checkAllAnswers() {
  let correctCount = 0;
  let totalQuestions = 0;

  // Check fill-in-the-blank sections
  if (examData.exam.sections) {
    examData.exam.sections.forEach(section => {
      const blanks = document.querySelectorAll(`input[data-section="${section.id}"]`);
      blanks.forEach((blank, index) => {
        totalQuestions++;
        const userAnswer = blank.value.trim().toLowerCase();
        const correctAnswer = section.answers[index].toLowerCase();

        if (userAnswer === correctAnswer) {
          correctCount++;
          blank.classList.add('correct');
          blank.classList.remove('incorrect');
        } else {
          blank.classList.add('incorrect');
          blank.classList.remove('correct');
        }
      });
    });
  }

  // Check multiple choice questions
  if (examData.exam.multipleChoice) {
    examData.exam.multipleChoice.forEach(question => {
      totalQuestions++;
      const selectedOption = document.querySelector(`input[name="question-${question.id}"]:checked`);
      const feedbackElement = document.getElementById(`feedback-${question.id}`);
      
      // Clear previous correct-answer highlights
      document.querySelectorAll(`input[name="question-${question.id}"]`).forEach(input => {
        input.parentElement.classList.remove('correct-answer');
      });
      
      if (selectedOption) {
        const userAnswer = selectedOption.value;
        if (userAnswer === question.answer) {
          correctCount++;
          selectedOption.parentElement.classList.add('correct');
          selectedOption.parentElement.classList.remove('incorrect');
          if (feedbackElement) {
            feedbackElement.innerHTML = '<span class="feedback-correct">✅ Correct! Well done!</span>';
            feedbackElement.style.display = 'block';
          }
        } else {
          selectedOption.parentElement.classList.add('incorrect');
          selectedOption.parentElement.classList.remove('correct');
          
          // Highlight the correct answer
          const correctOption = document.querySelector(`input[name="question-${question.id}"][value="${question.answer}"]`);
          if (correctOption) {
            correctOption.parentElement.classList.add('correct-answer');
          }
          
          if (feedbackElement) {
            feedbackElement.innerHTML = `<span class="feedback-incorrect">❌ Incorrect! Your answer: ${userAnswer} | Correct answer: ${question.answer}</span>`;
            feedbackElement.style.display = 'block';
          }
        }
      } else {
        // No answer selected - show the correct answer
        const correctOption = document.querySelector(`input[name="question-${question.id}"][value="${question.answer}"]`);
        if (correctOption) {
          correctOption.parentElement.classList.add('correct-answer');
        }
        
        if (feedbackElement) {
          feedbackElement.innerHTML = `<span class="feedback-incorrect">⚠️ No answer selected! Correct answer: ${question.answer}</span>`;
          feedbackElement.style.display = 'block';
        }
      }
    });
  }

  scoreValue.textContent = correctCount;
  examScore.style.display = 'flex';

  const percentage = Math.round((correctCount / totalQuestions) * 100);
  if (percentage === 100) {
    showToast('🎉 Perfect! All answers correct!', 'success');
  } else if (percentage >= 80) {
    showToast(`✅ Great job! ${percentage}% correct`, 'success');
  } else if (percentage >= 60) {
    showToast(`👍 Good effort! ${percentage}% correct`, 'info');
  } else {
    showToast(`💪 Keep practicing! ${percentage}% correct`, 'info');
  }
}

function toggleScripts() {
  scriptsVisible = !scriptsVisible;
  const scriptsBtn = document.getElementById('showScriptsBtn');
  
  examData.exam.sections.forEach(section => {
    const scriptElement = document.getElementById(`script-${section.id}`);
    if (scriptElement) {
      scriptElement.style.display = scriptsVisible ? 'block' : 'none';
    }
  });

  scriptsBtn.textContent = scriptsVisible ? 'Hide Scripts' : 'Show Scripts';
}

function resetExam() {
  // Reset fill-in-the-blank questions
  const blanks = document.querySelectorAll('.exam-blank');
  blanks.forEach(blank => {
    blank.value = '';
    blank.classList.remove('correct', 'incorrect');
  });

  // Reset multiple choice questions
  const mcqInputs = document.querySelectorAll('input[type="radio"]');
  mcqInputs.forEach(input => {
    input.checked = false;
    input.parentElement.classList.remove('correct', 'incorrect');
  });

  // Hide feedback
  const feedbackElements = document.querySelectorAll('.mcq-feedback');
  feedbackElements.forEach(el => {
    el.style.display = 'none';
  });

  examScore.style.display = 'none';
  scriptsVisible = false;
  document.getElementById('showScriptsBtn').textContent = 'Show Scripts';
  
  examData.exam.sections.forEach(section => {
    const scriptElement = document.getElementById(`script-${section.id}`);
    if (scriptElement) {
      scriptElement.style.display = 'none';
    }
  });

  showToast('🔄 Exam reset', 'info');
}

function speakScript(sectionId) {
  const section = examData.exam.sections.find(s => s.id === sectionId);
  if (section && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(section.script);
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
window.checkAllAnswers = checkAllAnswers;
window.checkMCQAnswer = checkMCQAnswer;
window.toggleScripts = toggleScripts;
window.resetExam = resetExam;
window.speakScript = speakScript;

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
