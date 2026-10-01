import {
  ABOUT, EXPERT, FINAL, QUESTIONS, QUESTION_PROMPT, START, TARIFF_URL, finalHeading,
} from './content.js';

const IMG = 'assets/img/';
const METRIKA_ID = null; // номер счетчика Яндекс Метрики, когда появится

const THEME = { start: '#d0b0fa', about: '#793cf6', quiz: '#4aa4f8', final: '#4aa4f8' };

const app = document.getElementById('app');
// ?s= — режим проверки верстки: сразу нужный экран и без анимаций
if (new URLSearchParams(location.search).has('s')) document.documentElement.classList.add('no-motion');

const state = { screen: 'start', q: 0, picked: null, picks: [] };

/* ---------- текст ---------- */

const SHORT_WORDS = 'а|б|в|во|вы|да|до|за|и|из|к|ко|мы|на|не|ни|но|о|об|от|по|с|со|у|я|он|без|для|при|про';
const SHORT_RE = new RegExp(`(^|[\\s(«„—])(${SHORT_WORDS})\\s+`, 'giu');

const NBSP = String.fromCharCode(160);

// Неразрывные пробелы: предлоги и союзы не висят в конце строки, тире не уходит в начало
function typo(text) {
  return text
    .replace(SHORT_RE, `$1$2${NBSP}`)
    .replace(SHORT_RE, `$1$2${NBSP}`)
    .replace(/ (ли|же|бы)(?=[\s,.!?:;»]|$)/gu, `${NBSP}$1`)
    .replace(/ —/g, `${NBSP}—`)
    .replace(/(так|то|все|тем) (же|есть)(?=[\s,.!?]|$)/giu, `$1${NBSP}$2`)
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`)
    .replace(/(\d) (?=[а-яё%])/giu, `$1${NBSP}`);
}

function esc(text) {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

// Названия опций и продуктов не разрываем переносом
const NOWRAP_RE = /(«Всегда\sна\sсвязи»|«Безопасный\sинтернет»|«Мой\sМТС»|«Защитник»|МТС\sJunior|SOS-кнопк[а-я]*)/g;

function rich(text) {
  return typo(esc(text))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(NOWRAP_RE, (m) => `<span class="nw">${m.replaceAll(NBSP, ' ')}</span>`);
}

/* ---------- аналитика ---------- */

function track(goal, params = {}) {
  try {
    if (METRIKA_ID && typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', goal, params);
    (window.dataLayer = window.dataLayer || []).push({ event: `mts_quiz_${goal}`, ...params });
  } catch { /* аналитика не должна ломать тест */ }
}

/* ---------- куски разметки ---------- */

// Собственные размеры картинок, чтобы место под них резервировалось до загрузки
const MASCOT_SIZE = {
  'blue-joy': [480, 370], 'fire-cool-open': [422, 480], 'fire-cool-side': [459, 480],
  'fire-cool-smile': [423, 480], 'fire-surprised': [424, 480], 'green-content': [471, 480],
  'green-excited': [470, 480], 'green-joy': [473, 480], 'green-mischief': [465, 480],
  'green-nervous': [467, 480], 'squiggle-happy': [468, 480], 'squiggle-joy': [470, 480],
  'squiggle-sly': [470, 480], 'yellow-delight': [480, 442], 'yellow-fluffy': [480, 455],
  'yellow-laugh': [480, 437], 'yellow-o': [454, 480],
};
const ICON_SIZE = { geo: [240, 195], phone: [240, 218], shield: [233, 240], sos: [240, 196] };

function mascot(name, cls, { flip = false, eager = false } = {}) {
  const [w, h] = MASCOT_SIZE[name];
  return `<img class="deco ${cls}${flip ? ' is-flipped' : ''}" src="${IMG}mascots/${name}.webp" width="${w}" height="${h}" alt="" aria-hidden="true"${eager ? '' : ' loading="lazy"'} decoding="async">`;
}

function header() {
  return `
    <header class="bar">
      <p class="bar__title">Мам, я&nbsp;сам решу</p>
      <img class="bar__logo" src="${IMG}logo-mts-nen.svg" width="257" height="80" alt="МТС × НЭН">
    </header>`;
}

function isMajority(qIndex, aIndex) {
  const answers = QUESTIONS[qIndex].answers;
  const top = Math.max(...answers.map((a) => a.percent));
  return answers[aIndex].percent === top;
}

function score() {
  return state.picks.reduce((sum, pick, i) => sum + (isMajority(i, pick) ? 1 : 0), 0);
}

/* ---------- экраны ---------- */

function startScreen() {
  const title = typo(esc(START.title)).replace(/\s(\S+)$/, '<br>$1');
  return `
    <div class="screen start">
      <div class="start__copy">
        <img class="start__logo" src="${IMG}logo-mts-nen.svg" width="257" height="80" alt="МТС × НЭН">
        <div class="start__text">
          <h1 class="start__title" tabindex="-1">${title}</h1>
          <p class="start__subtitle">${rich(START.subtitle)}</p>
          <p class="start__body">${rich(START.body)}</p>
          <button class="btn btn--red btn--start" type="button" data-action="about">${START.button}</button>
        </div>
      </div>
      <picture class="start__art">
        <source media="(min-width: 1024px) and (orientation: landscape), (min-width: 1280px)" srcset="${IMG}start-art-desktop.webp" width="1736" height="1868">
        <img src="${IMG}start-art-mobile.webp" width="1170" height="1593" alt="" fetchpriority="high">
      </picture>
    </div>`;
}

function aboutScreen() {
  return `
    <div class="screen about">
      ${header()}
      <div class="about__stage">
        <div class="about__card">
          ${mascot('green-excited', 'about__green', { eager: true })}
          ${mascot('fire-surprised', 'about__fire', { eager: true })}
          ${mascot('yellow-laugh', 'about__yellow', { flip: true, eager: true })}
          <h1 class="about__title" tabindex="-1">${rich(ABOUT.title)}</h1>
          ${ABOUT.paragraphs.map((p) => `<p>${rich(p)}</p>`).join('')}
          <img class="about__photo" src="${EXPERT.photo}" width="360" height="360" alt="Маргарита Табунова">
          ${mascot('blue-joy', 'about__blue', { eager: true })}
        </div>
      </div>
      <p class="about__note">${rich(ABOUT.note)}</p>
      <div class="actions actions--center">
        <button class="btn btn--red btn--about" type="button" data-action="question">${ABOUT.button}</button>
      </div>
    </div>`;
}

function questionArt(q) {
  const base = `${IMG}q/${q.image}`;
  return `
    <figure class="quiz__art">
      <img src="${base}-1040.webp" srcset="${base}-640.webp 640w, ${base}-1040.webp 1040w"
        sizes="(min-width: 1024px) and (orientation: landscape) 45vw, (min-width: 1280px) 45vw, (min-width: 640px) 440px, calc(100vw - 20px)"
        width="1040" height="1040" alt="" fetchpriority="high">
    </figure>`;
}

function optionsList(q) {
  return `
    <ol class="options">
      ${q.answers.map((a, i) => `
        <li>
          <button class="option" type="button" data-action="pick" data-index="${i}">
            <span class="chip" aria-hidden="true"></span>
            <span class="option__label">${rich(a.label)}</span>
          </button>
        </li>`).join('')}
    </ol>`;
}

function resultsList(q, picked) {
  return `
    <ol class="results">
      ${q.answers.map((a, i) => `
        <li class="result${i === picked ? ' result--picked' : ''}" style="--p: ${a.percent}%">
          <span class="result__bar" aria-hidden="true"></span>
          <span class="chip" aria-hidden="true"></span>
          <span class="result__label">${rich(a.label)}${i === picked ? '<span class="visually-hidden"> — ваш вариант</span>' : ''}</span>
          <span class="result__pct">${a.percent}%</span>
        </li>`).join('')}
    </ol>`;
}

function comment(answer) {
  return `
    <article class="comment" aria-label="Комментарий психолога">
      <p>${rich(answer.why)}</p>
      <p><strong>Что делать взрослому?</strong> ${rich(answer.todo)}</p>
      <footer class="comment__author">
        <img src="${EXPERT.photo}" width="360" height="360" alt="">
        <p><strong>${rich(EXPERT.name)}</strong><br>${rich(EXPERT.role)}</p>
      </footer>
    </article>`;
}

function promo(q) {
  if (!q.promo) return '';
  const text = rich(q.promo.replace(/^МТС Junior:/, '**МТС Junior:**'));
  const [w, h] = ICON_SIZE[q.feature];
  return `
    <aside class="promo" style="--icon-ratio: ${(h / w).toFixed(3)}">
      <img class="promo__icon" src="${IMG}icons/${q.feature}.webp" width="${w}" height="${h}" alt="" aria-hidden="true">
      <p>${text}</p>
    </aside>`;
}

function quizScreen() {
  const q = QUESTIONS[state.q];
  const answered = state.picked !== null;
  const last = state.q === QUESTIONS.length - 1;
  const m = q.mascot;
  return `
    <div class="screen quiz${answered ? ' quiz--answered' : ''}${q.promo ? '' : ' quiz--no-promo'}${q.situation.length > 150 ? ' quiz--long' : ''}">
      ${header()}
      <div class="quiz__grid">
        <div class="quiz__main">
          <div class="quiz__heading">
            <p class="visually-hidden">Вопрос ${state.q + 1} из ${QUESTIONS.length}</p>
            <h1 class="quiz__question" tabindex="-1">${rich(q.situation)} <span class="quiz__prompt">${typo(QUESTION_PROMPT)}</span></h1>
          </div>
          ${answered ? resultsList(q, state.picked) : optionsList(q)}
        </div>
        <div class="quiz__side">
          ${answered ? comment(q.answers[state.picked]) + promo(q) : questionArt(q)}
        </div>
      </div>
      ${answered ? `
        <div class="actions actions--center quiz__next">
          ${mascot(m.name, 'quiz__mascot quiz__mascot--next', { flip: m.flip, eager: true })}
          <button class="btn btn--white btn--next" type="button" data-action="next">${last ? 'Посмотреть результат' : 'Дальше'}</button>
        </div>` : ''}
    </div>`;
}

function finalScreen() {
  const n = score();
  return `
    <div class="screen final">
      ${header()}
      <div class="final__grid">
        <div class="final__score">
          ${mascot('squiggle-joy', 'final__mascot', { eager: true })}
          <p class="final__num" aria-hidden="true">${n}/10</p>
          <h1 class="final__heading" tabindex="-1">${rich(finalHeading(n))}</h1>
        </div>
        <div class="final__story">
          ${FINAL.paragraphs.map((p) => `<p>${rich(p)}</p>`).join('')}
        </div>
        <aside class="final__offer">
          <p class="final__lead">${rich(FINAL.lead)}</p>
          <div class="final__row">
            <p class="final__body">${rich(FINAL.body)}</p>
            <p class="final__slogan">${rich(FINAL.slogan).replace(/,\s/, ',<br>')}</p>
            ${mascot('fire-cool-smile', 'final__fire', { flip: true, eager: true })}
          </div>
          <p class="final__sticker"><strong>${rich(FINAL.sticker[0])}</strong> <span>${rich(FINAL.sticker[1])}</span></p>
        </aside>
        <div class="final__actions">
          <a class="btn btn--red btn--tariff" href="${TARIFF_URL}" target="_blank" rel="noopener" data-action="tariff">${FINAL.tariffButton}</a>
          <button class="btn btn--light btn--restart" type="button" data-action="restart">${FINAL.restartButton}</button>
        </div>
      </div>
    </div>`;
}

/* ---------- отрисовка ---------- */

function themeFor(screen) {
  return screen === 'question' ? 'quiz' : screen;
}

function render({ focus = true } = {}) {
  const theme = themeFor(state.screen);
  document.body.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', THEME[theme]);

  const html = {
    start: startScreen,
    about: aboutScreen,
    question: quizScreen,
    final: finalScreen,
  }[state.screen]();

  app.innerHTML = html;
  window.scrollTo(0, 0);

  preloadNext();
  if (focus) app.querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
}

function preload(src) {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
}

function preloadNext() {
  if (state.screen === 'start') {
    ['green-excited', 'fire-surprised', 'yellow-laugh', 'blue-joy'].forEach((n) => preload(`${IMG}mascots/${n}.webp`));
    preload(EXPERT.photo);
  }
  if (state.screen === 'about') preload(`${IMG}q/${QUESTIONS[0].image}-1040.webp`);
  if (state.screen === 'question') {
    const q = QUESTIONS[state.q];
    if (state.picked === null) {
      preload(`${IMG}mascots/${q.mascot.name}.webp`);
      if (q.feature) preload(`${IMG}icons/${q.feature}.webp`);
    } else if (QUESTIONS[state.q + 1]) {
      preload(`${IMG}q/${QUESTIONS[state.q + 1].image}-1040.webp`);
    }
  }
}

/* ---------- действия ---------- */

const actions = {
  about() {
    track('start');
    state.screen = 'about';
    render();
  },
  question() {
    track('about_next');
    Object.assign(state, { screen: 'question', q: 0, picked: null, picks: [] });
    render();
  },
  pick(el) {
    if (state.picked !== null) return;
    const index = Number(el.dataset.index);
    state.picked = index;
    state.picks[state.q] = index;
    track('answer', { question: state.q + 1, answer: index + 1, majority: isMajority(state.q, index) });
    render();
  },
  next() {
    if (state.q < QUESTIONS.length - 1) {
      state.q += 1;
      state.picked = null;
    } else {
      state.screen = 'final';
      track('finish', { score: score() });
    }
    render();
  },
  tariff() {
    track('tariff_click', { score: score() });
  },
  restart() {
    track('restart');
    Object.assign(state, { screen: 'start', q: 0, picked: null, picks: [] });
    render();
  },
};

app.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el || !app.contains(el)) return;
  actions[el.dataset.action]?.(el);
});

/* ---------- ?s= для проверки верстки: about, q3, q3a2, final7 ---------- */

function applyDebugState() {
  const s = new URLSearchParams(location.search).get('s');
  if (!s) return;
  let m;
  if (s === 'about') state.screen = 'about';
  else if ((m = s.match(/^q(\d+)(?:a(\d+))?$/))) {
    const q = Math.min(Math.max(Number(m[1]) - 1, 0), QUESTIONS.length - 1);
    Object.assign(state, { screen: 'question', q, picked: m[2] ? Number(m[2]) - 1 : null });
  } else if ((m = s.match(/^final(\d+)$/))) {
    const n = Math.min(Number(m[1]), 10);
    state.screen = 'final';
    state.picks = QUESTIONS.map((q, i) => {
      const top = Math.max(...q.answers.map((a) => a.percent));
      const idx = q.answers.findIndex((a) => (i < n ? a.percent === top : a.percent !== top));
      return idx;
    });
  }
}

applyDebugState();
render({ focus: false });
