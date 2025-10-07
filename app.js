// ReadQuest - simple reading comprehension prototype
// Place this file next to index.html and style.css, then open index.html

// Sample story + question data
const STORIES = [
  {
    id: 's1',
    title: 'The Missing Mangoes',
    level: 'Beginner',
    text:
`Rina loves her mango tree. Every morning she checks the branches for ripe fruit. One day she counted ten mangoes, but by evening only five were left. She asked her brother, but he had not touched them. Rina set a small camera and discovered the mangoes were being taken at night by the neighbor's curious cat.`,
    questions: [
      {
        q: 'How many mangoes did Rina count in the morning?',
        choices: ['5', '10', '8', '12'],
        answer: 1
      },
      {
        q: 'Who was taking the mangoes at night?',
        choices: ['Rina\'s brother', 'The neighbor', 'A cat', 'Rina'],
        answer: 2
      },
      {
        q: 'What did Rina use to find out what happened?',
        choices: ['A trap', 'A camera', 'A net', 'A flashlight'],
        answer: 1
      }
    ]
  },
  {
    id: 's2',
    title: 'A Rainy Day Lesson',
    level: 'Intermediate',
    text:
`Mr. Santos teaches science at the local high school. One rainy day, the school roof leaked and the students had to move their chairs into the hallway. Instead of complaining, they collected the water in jars for a science experiment about water purity. They learned how to test for salt, dirt, and germs.`,
    questions: [
      {
        q: 'What subject does Mr. Santos teach?',
        choices: ['Math', 'Science', 'History', 'English'],
        answer: 1
      },
      {
        q: 'Where did students move their chairs?',
        choices: ['Gym', 'Cafeteria', 'Hallway', 'Library'],
        answer: 2
      },
      {
        q: 'What did they test the water for?',
        choices: ['Sugar', 'Salt, dirt, and germs', 'Acidity only', 'Color'],
        answer: 1
      }
    ]
  },
  {
    id: 's3',
    title: 'The Last Train',
    level: 'Advanced',
    text:
`At midnight the last train ran through the city. Elena stood on the platform thinking of the letter she had just received. The letter asked her to choose between staying with family or taking a job far away. While the train passed, she realized that growth often requires risk and decided to accept the job.`,
    questions: [
      {
        q: 'When did Elena stand on the platform?',
        choices: ['Morning', 'Noon', 'Evening', 'Midnight'],
        answer: 3
      },
      {
        q: 'What choice did the letter ask her to make?',
        choices: [
          'Which school to attend',
          'Whether to stay with family or take a job away',
          'Which train to board',
          'Which city to visit'
        ],
        answer: 1
      },
      {
        q: 'What conclusion did Elena reach?',
        choices: [
          'She will refuse change',
          'She will accept the job and take a risk',
          'She will never travel',
          'She will burn the letter'
        ],
        answer: 1
      }
    ]
  }
];

// ---------- App state ----------
let player = { name: 'Guest' };
let currentStory = null;

// ---------- DOM references ----------
const startBtn = document.getElementById('startBtn');
const playerNameInput = document.getElementById('playerName');

const screens = {
  select: document.getElementById('select-screen'),
  reading: document.getElementById('reading-screen'),
  question: document.getElementById('question-screen'),
  result: document.getElementById('result-screen'),
  leaderboard: document.getElementById('leaderboard-screen')
};

const storyListEl = document.getElementById('story-list');
const storyTitleEl = document.getElementById('story-title');
const storyTextEl = document.getElementById('story-text');
const toQuestionsBtn = document.getElementById('to-questions-btn');
const backToListBtn = document.getElementById('back-to-list');

const questionsContainer = document.getElementById('questions-container');
const submitAnswersBtn = document.getElementById('submit-answers');
const cancelQuestionsBtn = document.getElementById('cancel-questions');

const resultSummary = document.getElementById('result-summary');
const detailedFeedback = document.getElementById('detailed-feedback');
const playAgainBtn = document.getElementById('play-again');
const viewLeaderboardBtn = document.getElementById('view-leaderboard');

const leaderboardList = document.getElementById('leaderboard-list');
const lbBackBtn = document.getElementById('lb-back');
const clearLeaderboardBtn = document.getElementById('clear-leaderboard');

// ---------- Initialization ----------
function init(){
  startBtn.addEventListener('click', onStart);
  playerNameInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') onStart();
  });
  toQuestionsBtn.addEventListener('click', showQuestions);
  backToListBtn.addEventListener('click', showSelect);
  submitAnswersBtn.addEventListener('click', submitAnswers);
  cancelQuestionsBtn.addEventListener('click', showSelect);
  playAgainBtn.addEventListener('click', showSelect);
  viewLeaderboardBtn.addEventListener('click', showLeaderboard);
  lbBackBtn.addEventListener('click', () => showScreen('select'));
  clearLeaderboardBtn.addEventListener('click', clearLeaderboard);

  renderStoryList();
  showScreen('select');
  loadPlayerFromStorage();
}

// ---------- UI helpers ----------
function showScreen(name){
  Object.keys(screens).forEach(k => {
    screens[k].classList.toggle('hidden', k !== name);
  });
}

function renderStoryList(){
  storyListEl.innerHTML = '';
  for(const s of STORIES){
    const card = document.createElement('div');
    card.className = 'story-card';
    card.innerHTML = `
      <h3>${escapeHtml(s.title)}</h3>
      <p>${escapeHtml(truncate(s.text, 120))}</p>
      <div class="story-meta">Level: ${escapeHtml(s.level)} • Questions: ${s.questions.length}</div>
      <div class="controls">
        <button data-id="${s.id}" class="open-story">Read</button>
      </div>
    `;
    storyListEl.appendChild(card);
  }

  // attach click handlers
  storyListEl.querySelectorAll('.open-story').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      startStory(id);
    });
  });
}

function startStory(storyId){
  const s = STORIES.find(x => x.id === storyId);
  if(!s) return alert('Story not found.');
  currentStory = JSON.parse(JSON.stringify(s)); // clone to be safe
  storyTitleEl.textContent = currentStory.title;
  storyTextEl.textContent = currentStory.text;
  showScreen('reading');
}

// ---------- navigation ----------
function showQuestions(){
  if(!currentStory) return;
  renderQuestions(currentStory.questions);
  showScreen('question');
}

function renderQuestions(questions){
  questionsContainer.innerHTML = '';
  questions.forEach((q, idx) => {
    const qdiv = document.createElement('div');
    qdiv.className = 'question';
    qdiv.innerHTML = `<div class="q-text"><strong>Q${idx+1}.</strong> ${escapeHtml(q.q)}</div>`;
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'choices';
    q.choices.forEach((c, ci) => {
      const id = `q${idx}_c${ci}`;
      const label = document.createElement('label');
      label.className = 'choice-label';
      label.innerHTML = `
        <input type="radio" name="q${idx}" id="${id}" value="${ci}">
        <span>${escapeHtml(c)}</span>
      `;
      choicesDiv.appendChild(label);
    });
    qdiv.appendChild(choicesDiv);
    questionsContainer.appendChild(qdiv);
  });
}

// ---------- submission & scoring ----------
function submitAnswers(){
  const questions = currentStory.questions;
  const answers = [];
  let unanswered = false;
  for(let i=0;i<questions.length;i++){
    const sel = document.querySelector(`input[name="q${i}"]:checked`);
    if(!sel){
      unanswered = true;
      answers.push(null);
    } else {
      answers.push(parseInt(sel.value,10));
    }
  }

  if(unanswered && !confirm('Some questions are unanswered. Submit anyway?')) return;

  const result = calculateScore(questions, answers);
  saveResult(player.name, currentStory.id, result.score, questions.length);
  showResult(result);
}

function calculateScore(questions, answers){
  let score = 0;
  const feedback = [];
  for(let i=0;i<questions.length;i++){
    const correct = questions[i].answer;
    const given = answers[i];
    const ok = (given !== null && given === correct);
    if(ok) score++;
    feedback.push({
      q: questions[i].q,
      correctIndex: correct,
      correctText: questions[i].choices[correct],
      givenIndex: given,
      givenText: given === null ? null : questions[i].choices[given],
      ok
    });
  }
  const percent = Math.round((score / questions.length) * 100);
  return {score, total: questions.length, percent, feedback};
}

// ---------- results UI ----------
function showResult(result){
  resultSummary.innerHTML = `
    <p><strong>${escapeHtml(player.name)}</strong>, you scored <strong>${result.score}/${result.total}</strong> (${result.percent}%)</p>
  `;

  // badges / coins (simple)
  const stars = Math.max(1, Math.ceil(result.percent / 33)); // 1-3 stars
  resultSummary.innerHTML += `<p>Stars: ${'⭐'.repeat(stars)} • Coins earned: <strong>${result.score * 3}</strong></p>`;

  // feedback per question
  detailedFeedback.innerHTML = '<h4>Feedback</h4>';
  result.feedback.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <div><strong>Q${i+1}.</strong> ${escapeHtml(f.q)}</div>
      <div>Your answer: ${f.givenText === null ? '<em>Not answered</em>' : escapeHtml(f.givenText)}</div>
      <div>Correct answer: <span class="${f.ok ? 'result-correct' : 'result-wrong'}">${escapeHtml(f.correctText)}</span></div>
    `;
    detailedFeedback.appendChild(div);
  });

  showScreen('result');
}

// ---------- local storage (leaderboard & player) ----------
const STORAGE_KEY_LEADER = 'readquest_leaderboard_v1';
const STORAGE_KEY_PLAYER = 'readquest_player_v1';

function saveResult(name, storyId, score, total){
  const raw = localStorage.getItem(STORAGE_KEY_LEADER);
  const list = raw ? JSON.parse(raw) : [];
  const entry = {
    name: name || 'Guest',
    storyId,
    score,
    total,
    date: new Date().toISOString()
  };
  list.push(entry);
  // keep top 20 by score desc then recent
  list.sort((a,b) => (b.score - a.score) || (new Date(b.date) - new Date(a.date)));
  localStorage.setItem(STORAGE_KEY_LEADER, JSON.stringify(list.slice(0,50)));
}

function showLeaderboard(){
  const raw = localStorage.getItem(STORAGE_KEY_LEADER);
  const list = raw ? JSON.parse(raw) : [];
  leaderboardList.innerHTML = '';
  if(list.length === 0){
    leaderboardList.innerHTML = '<li>No entries yet</li>';
  } else {
    list.forEach(e => {
      const s = STORIES.find(x=>x.id===e.storyId);
      const title = s ? s.title : e.storyId;
      const li = document.createElement('li');
      li.textContent = `${e.name} — ${e.score}/${e.total} — ${title} — ${new Date(e.date).toLocaleString()}`;
      leaderboardList.appendChild(li);
    });
  }
  showScreen('leaderboard');
}

function clearLeaderboard(){
  if(!confirm('Clear the local leaderboard? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY_LEADER);
  showLeaderboard();
}

function loadPlayerFromStorage(){
  const raw = localStorage.getItem(STORAGE_KEY_PLAYER);
  if(raw){
    try{
      const p = JSON.parse(raw);
      player = p;
      playerNameInput.value = player.name || '';
    }catch(e){}
  }
}

function savePlayerToStorage(){
  localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(player));
}

// ---------- start handler ----------
function onStart(){
  const name = (playerNameInput.value || 'Guest').trim();
  player.name = name || 'Guest';
  savePlayerToStorage();
  renderStoryList();
  showScreen('select');
}

// ---------- utility ----------
function escapeHtml(s){
  return (s+'').replace(/[&<>"']/g, function(m){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
}

function truncate(s, n){
  if(s.length<=n) return s;
  return s.slice(0,n-1)+'…';
}

// ---------- start app ----------
init();
