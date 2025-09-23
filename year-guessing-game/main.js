/*
    A simple "Guess the Year" game using Kulturpool API.
*/

const API_URL = 'https://api.kulturpool.at/search/?q=*&per_page=1&max_facet_values=0&sort_by=_rand():asc&use_cache=false&filter_by=dateMin:%3C1767225600';
/*
API_URL to get one random object, achieved with the following parameters:
- q=*: search for all objects
- per_page=1: get only one object
- max_facet_values=0: no facet values needed (shorter response)
- sort_by=_rand():asc: random order
- use_cache=false: do not use cache to get different object each time
- filter_by=dateMin:<1767225600: filter for objects with dateMin less than or equal to 1767225600 (01.01.2026) to guarantee that the object has a dateMin value
*/

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const objectEl = document.getElementById('object');
const titleEl = document.getElementById('title');
const imageContainer = document.getElementById('image-container');
const guessForm = document.getElementById('guess-form');
const guessInput = document.getElementById('guess');
const triesEl = document.getElementById('tries');
const guessTable = document.getElementById('guess-table');
const guessTableBody = guessTable.querySelector('tbody');
const feedbackEl = document.getElementById('feedback');
const playAgainBtn = document.getElementById('play-again');

let object = null;
let tries = 0;
let maxTries = 6;
let finished = false;
let guessHistory = [];

function getYearFromUnix(unix) {
  if (!unix) return null;
  return new Date(unix * 1000).getUTCFullYear();
}

function arrowClass(range) {
  if (range > 100) return 'arrow dark-red';
  if (range > 10) return 'arrow light-red';
  if (range > 5) return 'arrow orange';
  return 'arrow green';
}
function resultLabel(range) {
  if (range <= 5) return 'within 5 years';
  if (range <= 10) return 'within 10 years';
  if (range <= 100) return 'within 100 years';
  return 'over 100 years';
}

function resetGame() {
  loadingEl.style.display = '';
  errorEl.style.display = 'none';
  objectEl.style.display = 'none';
  feedbackEl.textContent = '';
  guessTable.style.display = 'none';
  playAgainBtn.style.display = 'none';
  guessHistory = [];
  tries = 0;
  finished = false;
  fetchObject();
}

async function fetchObject() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data && data.hits && data.hits.length > 0) {
      object = data.hits[0].document;
      showObject();
    } else {
      showError('No object found.');
    }
  } catch (e) {
    showError('Failed to fetch object.');
  }
}

function showObject() {
  loadingEl.style.display = 'none';
  errorEl.style.display = 'none';
  objectEl.style.display = '';
  titleEl.textContent = (object.title && object.title[0]) || 'Untitled';
  imageContainer.innerHTML = '';
  if (object.isShownBy) {
    const img = document.createElement('img');
    img.src = object.isShownBy;
    img.alt = 'Object image';
    img.className = 'main-image';
    imageContainer.appendChild(img);
  } else {
    imageContainer.innerHTML = '<em>No image available.</em>';
  }
  guessForm.style.display = '';
  guessInput.value = '';
  triesEl.textContent = `Tries left: ${maxTries - tries}`;
  guessTableBody.innerHTML = '';
  guessTable.style.display = 'none';
  feedbackEl.textContent = '';
  playAgainBtn.style.display = 'none';
  finished = false;
}

function showError(msg) {
  loadingEl.style.display = 'none';
  errorEl.style.display = '';
  errorEl.textContent = msg;
  objectEl.style.display = 'none';
}

guessForm.addEventListener('submit', function(e) {
  e.preventDefault();
  if (finished) return;
  const answerYear = getYearFromUnix(object.dateMin);
  const guessYear = parseInt(guessInput.value, 10);
  if (isNaN(guessYear)) {
    feedbackEl.textContent = 'Please enter a valid year.';
    return;
  }
  const diff = guessYear - answerYear;
  const range = Math.abs(diff);
  let msg = '';
  if (range <= 5) {
    msg = 'Very close! (within 5 years)';
  } else if (range <= 10) {
    msg = 'Close! (within 10 years)';
  } else if (range <= 100) {
    msg = 'Somewhat close (within 100 years)';
  } else {
    msg = 'Far off (more than 100 years)';
  }
  msg += diff === 0 ? ' 🎉 Correct!' : (diff > 0 ? ' (Too high)' : ' (Too low)');
  guessHistory.push({
    try: tries + 1,
    guess: guessYear,
    diff,
    range,
    correct: diff === 0
  });
  updateGuessTable();
  tries++;
  triesEl.textContent = `Tries left: ${maxTries - tries}`;
  feedbackEl.textContent = '';
  if (diff === 0 || tries >= maxTries) {
    finished = true;
    guessForm.style.display = 'none';
    playAgainBtn.style.display = '';
    if (diff !== 0) {
      feedbackEl.textContent = `Game over! The correct year was ${answerYear}.`;
    } else {
      feedbackEl.textContent = 'Congratulations! You guessed the correct year!';
    }
  } else {
    guessInput.value = '';
  }
});

function updateGuessTable() {
  guessTableBody.innerHTML = '';
  guessHistory.forEach(g => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${g.try}</td>
      <td>${g.guess}</td>
      <td>
        ${g.correct ? '<span class="arrow green">✔️ Correct</span>' : `
          <span class="${arrowClass(g.range)}">
            ${g.diff < 0 ? '▲' : '▼'}
          </span>
          <span class="result-label">${resultLabel(g.range)}</span>
        `}
      </td>
    `;
    guessTableBody.appendChild(tr);
  });
  if (guessHistory.length > 0) {
    guessTable.style.display = '';
  }
}

playAgainBtn.addEventListener('click', resetGame);

resetGame();
