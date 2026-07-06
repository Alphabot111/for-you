// public/js/main.js
// Drives the whole "For You ❤️" single-page experience: page navigation,
// the question flows, the twist typewriter, the confession, and all the
// small UX touches (theme, music, toasts, loading screen).

(function () {
  // ------------------------------------------------------------------
  // Question definitions
  // ------------------------------------------------------------------
  const ABOUT_HER_QUESTIONS = [
    { id: 'name', label: "What's your name?", placeholder: 'Your name' },
    { id: 'favColor', label: "What's your favorite color?", placeholder: 'e.g. Blue' },
    { id: 'favFood', label: "What's your favorite food?", placeholder: 'e.g. Sushi' },
    { id: 'dreamVacation', label: "What's your dream vacation?", placeholder: 'e.g. Paris' },
    { id: 'favSong', label: "What's your favorite song?", placeholder: 'Song title' },
    { id: 'biggestDream', label: "What's your biggest dream?", placeholder: 'Tell me...' },
    { id: 'makesSmile', label: 'What makes you smile?', placeholder: 'Tell me...' },
    { id: 'loveLanguage', label: "What's your love language?", placeholder: 'e.g. Words of affirmation' },
    { id: 'favMovie', label: "What's your favorite movie?", placeholder: 'Movie title' },
    { id: 'lookFor', label: 'What do you look for in someone?', placeholder: 'Tell me...' },
  ];

  const ABOUT_ME_QUESTIONS = [
    { id: 'firstImpression', label: "What's your first impression of me?", placeholder: 'Be honest!' },
    { id: 'enjoyTalking', label: 'Do you enjoy talking to me?', placeholder: 'Tell me...' },
    { id: 'oneThingLike', label: "What's one thing you like about me?", placeholder: 'Tell me...' },
    { id: 'oneDayTogether', label: 'If we spent one day together, what would we do?', placeholder: 'Tell me...' },
    { id: 'wantToKnow', label: "What's one thing you'd like to know about me?", placeholder: 'Ask away' },
    { id: 'thinkFunny', label: 'Do you think I\'m funny?', placeholder: 'Tell me...' },
    { id: 'favMemory', label: "What's your favorite memory of us?", placeholder: 'Tell me...' },
  ];

  const FLOWS = {
    'about-her': { questions: ABOUT_HER_QUESTIONS, endpoint: '/api/answers/about-her', next: 'about-me' },
    'about-me': { questions: ABOUT_ME_QUESTIONS, endpoint: '/api/answers/about-me', next: 'twist' },
  };

  const flowAnswers = {}; // { 'about-her': {..}, 'about-me': {..} }
  const flowIndex = {}; // current step index per flow

  // ------------------------------------------------------------------
  // Page navigation
  // ------------------------------------------------------------------
  function goToPage(pageName) {
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    const target = document.querySelector(`.page[data-page="${pageName}"]`);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageName === 'twist') runTwistSequence();
    if (pageName === 'confession') runConfessionSequence();
    if (pageName === 'chat') startChatIfNeeded();
  }

  document.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => goToPage(btn.dataset.next));
  });

  // ------------------------------------------------------------------
  // Question flow rendering
  // ------------------------------------------------------------------
  function renderFlow(flowName) {
    const flow = FLOWS[flowName];
    const form = document.querySelector(`form[data-flow="${flowName}"]`);
    if (!form || form.childElementCount) return; // already rendered

    flowAnswers[flowName] = flowAnswers[flowName] || {};
    flowIndex[flowName] = 0;

    flow.questions.forEach((q, i) => {
      const step = document.createElement('div');
      step.className = 'question-step';
      step.dataset.step = i;
      if (i === 0) step.classList.add('active');

      const label = document.createElement('label');
      label.className = 'question-label';
      label.textContent = q.label;
      label.setAttribute('for', `${flowName}-${q.id}`);

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'question-input';
      input.id = `${flowName}-${q.id}`;
      input.name = q.id;
      input.placeholder = q.placeholder || '';
      input.maxLength = 500;
      input.autocomplete = 'off';

      const nav = document.createElement('div');
      nav.className = 'question-nav';

      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'btn btn-ghost';
      backBtn.textContent = '← Back';
      backBtn.style.visibility = i === 0 ? 'hidden' : 'visible';
      backBtn.addEventListener('click', () => stepTo(flowName, i - 1));

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'btn btn-primary';
      nextBtn.textContent = i === flow.questions.length - 1 ? 'Finish' : 'Next →';
      nextBtn.addEventListener('click', () => handleNext(flowName, i, input));

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleNext(flowName, i, input);
        }
      });

      nav.appendChild(backBtn);
      nav.appendChild(nextBtn);

      step.appendChild(label);
      step.appendChild(input);
      step.appendChild(nav);
      form.appendChild(step);
    });

    updateProgress(flowName);
  }

  function handleNext(flowName, i, input) {
    const value = input.value.trim();
    if (!value) {
      shakeInput(input);
      showToast('Please fill this in before continuing 💭');
      return;
    }
    const flow = FLOWS[flowName];
    flowAnswers[flowName][flow.questions[i].id] = value;

    if (i === flow.questions.length - 1) {
      submitFlow(flowName);
    } else {
      stepTo(flowName, i + 1);
    }
  }

  function shakeInput(input) {
    input.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 260 }
    );
  }

  function stepTo(flowName, newIndex) {
    const form = document.querySelector(`form[data-flow="${flowName}"]`);
    form.querySelectorAll('.question-step').forEach((step) => {
      step.classList.toggle('active', Number(step.dataset.step) === newIndex);
    });
    flowIndex[flowName] = newIndex;
    updateProgress(flowName);

    const activeInput = form.querySelector(`.question-step[data-step="${newIndex}"] input`);
    if (activeInput) setTimeout(() => activeInput.focus(), 250);
  }

  function updateProgress(flowName) {
    const flow = FLOWS[flowName];
    const total = flow.questions.length;
    const current = flowIndex[flowName] + 1;
    const pct = Math.round((current / total) * 100);

    document.querySelectorAll(`[data-progress-for="${flowName}"]`).forEach((el) => {
      el.style.width = `${pct}%`;
    });
    document.querySelectorAll(`[data-progress-label="${flowName}"]`).forEach((el) => {
      el.textContent = `${current} / ${total}`;
    });
  }

  async function submitFlow(flowName) {
    const flow = FLOWS[flowName];
    try {
      await fetch(flow.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: flowAnswers[flowName] }),
      });
    } catch (err) {
      console.error('Could not save answers', err);
      showToast("Hmm, couldn't save that — continuing anyway 💌");
    }
    goToPage(flow.next);
  }

  // ------------------------------------------------------------------
  // Page 4 — The twist (typewriter)
  // ------------------------------------------------------------------
  const TWIST_LINES = [
    "There's something...",
    "I've been wanting...",
    'to tell you...',
  ];
  const TWIST_LINE_TWO = "I couldn't keep it inside anymore...";

  let twistPlayed = false;

  function runTwistSequence() {
    if (twistPlayed) return;
    twistPlayed = true;

    const el = document.getElementById('twist-text');
    const continueBtn = document.getElementById('twist-continue');
    el.textContent = '';
    continueBtn.classList.add('hidden');

    typeLines(el, TWIST_LINES, 0, () => {
      setTimeout(() => {
        el.textContent = '';
        typeLines(el, [TWIST_LINE_TWO], 0, () => {
          continueBtn.classList.remove('hidden');
        });
      }, 900);
    });

    continueBtn.onclick = () => goToPage('confession');
  }

  function typeLines(el, lines, lineIdx, onDone) {
    if (lineIdx >= lines.length) {
      onDone();
      return;
    }
    const line = lines[lineIdx];
    let charIdx = 0;
    if (lineIdx > 0) el.textContent += '\n';

    const interval = setInterval(() => {
      el.textContent += line[charIdx];
      charIdx += 1;
      if (charIdx >= line.length) {
        clearInterval(interval);
        setTimeout(() => typeLines(el, lines, lineIdx + 1, onDone), 500);
      }
    }, 55);
  }

  // ------------------------------------------------------------------
  // Page 5 — Confession
  // ------------------------------------------------------------------
  let confessionBuilt = false;

  async function runConfessionSequence() {
    if (confessionBuilt) return;
    confessionBuilt = true;

    let data = {};
    try {
      const res = await fetch('/api/answers/me');
      const json = await res.json();
      data = json.data || {};
    } catch (err) {
      console.error('Could not load answers', err);
    }

    const her = data.aboutHer || flowAnswers['about-her'] || {};
    const me = data.aboutMe || flowAnswers['about-me'] || {};
    const name = her.name || 'you';

    const lines = buildConfessionLines(name, her, me);
    const container = document.getElementById('confession-text');
    container.innerHTML = '';

    lines.forEach((line, i) => {
      const p = document.createElement('p');
      p.textContent = line;
      p.style.animationDelay = `${i * 0.35}s`;
      container.appendChild(p);
    });

    const totalDelay = lines.length * 350 + 400;
    setTimeout(() => {
      document.getElementById('confession-actions').classList.remove('hidden');
    }, totalDelay);
  }

  function buildConfessionLines(name, her, me) {
    const lines = [];
    lines.push(`Hi ${name} ❤️`);

    if (her.favColor) {
      lines.push(`You told me your favorite color is ${her.favColor}.`);
      lines.push(`Maybe one day we'll watch the sunset while you're wearing it.`);
    }
    if (her.dreamVacation) {
      lines.push(`You said your dream vacation is ${her.dreamVacation}.`);
      lines.push(`I'd love to experience that with you someday.`);
    }
    if (me.favMemory) {
      lines.push(`You told me your favorite memory of us is ${me.favMemory} —`);
      lines.push(`that meant more to me than you know.`);
    }

    lines.push('Every time we talk,');
    lines.push('my day gets better.');
    lines.push('You make me smile without even trying.');
    lines.push('So...');
    lines.push('Will you give me a chance');
    lines.push('to be more than a friend?');

    return lines;
  }

  document.querySelectorAll('[data-decision]').forEach((btn) => {
    btn.addEventListener('click', () => handleDecision(btn.dataset.decision));
  });

  async function handleDecision(decision) {
    try {
      await fetch('/api/answers/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
    } catch (err) {
      console.error('Could not save decision', err);
    }

    if (decision === 'need-time') {
      document.getElementById('confession-actions').classList.add('hidden');
      document.getElementById('need-time-response').classList.remove('hidden');
      return;
    }

    if (decision === 'yes') {
      if (window.fireConfetti) window.fireConfetti(180);
      showToast("She said yes! 🎉");
    } else {
      showToast("Let's talk 😊");
    }

    setTimeout(() => goToPage('chat'), decision === 'yes' ? 1400 : 600);
  }

  // ------------------------------------------------------------------
  // Page 6 — Chat bootstrap
  // ------------------------------------------------------------------
  let chatStarted = false;
  function startChatIfNeeded() {
    if (chatStarted) return;
    chatStarted = true;
    const params = new URLSearchParams(window.location.search);
    const role = params.get('as') === 'me' ? 'me' : 'her';
    window.ChatModule.initChat(role);
  }

  // ------------------------------------------------------------------
  // Theme toggle (dark / light)
  // ------------------------------------------------------------------
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('for-you-theme');
  if (savedTheme) {
    document.body.dataset.theme = savedTheme;
    themeToggle.textContent = savedTheme === 'light' ? '☀️' : '🌙';
  }
  themeToggle.addEventListener('click', () => {
    const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = next;
    localStorage.setItem('for-you-theme', next);
    themeToggle.textContent = next === 'light' ? '☀️' : '🌙';
  });

  // ------------------------------------------------------------------
  // Background music mute toggle
  // ------------------------------------------------------------------
  const musicToggle = document.getElementById('music-toggle');
  const music = document.getElementById('bg-music');
  let musicStarted = false;

  musicToggle.addEventListener('click', () => {
    if (!musicStarted) {
      music.volume = 0.35;
      music.play().catch(() => {
        showToast('Add a track at /public/sounds/background-music.mp3 to enable music 🎵');
      });
      musicStarted = true;
      musicToggle.textContent = '🔊';
      return;
    }
    music.muted = !music.muted;
    musicToggle.textContent = music.muted ? '🔈' : '🔊';
  });

  // ------------------------------------------------------------------
  // Toast notifications
  // ------------------------------------------------------------------
  window.showToast = function showToast(text) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = text;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  };

  // ------------------------------------------------------------------
  // Loading screen + initial flow rendering
  // ------------------------------------------------------------------
  window.addEventListener('DOMContentLoaded', () => {
    renderFlow('about-her');
    renderFlow('about-me');

    // If ?as=me is present, jump straight to chat (used by the creator).
    const params = new URLSearchParams(window.location.search);
    if (params.get('as') === 'me') {
      document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
      document.querySelector('.page-chat').classList.add('active');
      startChatIfNeeded();
    }
  });

  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('hidden');
    }, 700);
  });
})();
