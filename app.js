'use strict';

const accessCode = 'marcelo123';
const sessionKey = 'multiplix-imohills-access-v2';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const entry = document.querySelector('#entry');
const app = document.querySelector('#app');
const code = document.querySelector('#code');
const entryError = document.querySelector('#entry-error');
const reveal = document.querySelector('#reveal');
const submit = document.querySelector('#submit');
document.documentElement.classList.add('js');

function sessionGranted() {
  try { return sessionStorage.getItem(sessionKey) === 'yes'; } catch { return false; }
}
function setSession(granted) {
  try {
    if (granted) sessionStorage.setItem(sessionKey, 'yes');
    else sessionStorage.removeItem(sessionKey);
  } catch { /* abre mesmo sem storage */ }
}

/* ---------- Login ---------- */
function countUp(el, to, duration = 700) {
  if (reduceMotion) { el.textContent = to; return; }
  const from = Number(el.dataset.from || 0);
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
document.querySelectorAll('[data-count]').forEach((el, i) => {
  el.textContent = '0';
  setTimeout(() => countUp(el, Number(el.dataset.count), 600), 500 + i * 160);
});

function unlock(fromForm) {
  entry.hidden = true;
  entry.classList.remove('leaving');
  app.hidden = false;
  document.body.classList.add('app-on');
  const section = document.getElementById(location.hash.slice(1));
  if (section?.classList.contains('chapter')) section.scrollIntoView();
  if (fromForm) document.querySelector('#hero-title').focus({ preventScroll: true });
  requestAnimationFrame(() => app.classList.add('ready'));
  updateReadingPosition();
}

document.querySelector('#access-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (code.value.trim().toLowerCase() !== accessCode) {
    entryError.textContent = 'Código incorreto. Confira a mensagem do Gabriel e tente de novo.';
    code.setAttribute('aria-invalid', 'true');
    document.querySelector('.input-row').classList.remove('shake');
    void document.querySelector('.input-row').offsetWidth;
    document.querySelector('.input-row').classList.add('shake');
    code.focus();
    return;
  }
  entryError.textContent = '';
  code.removeAttribute('aria-invalid');
  code.value = '';
  setSession(true);
  submit.classList.add('loading');
  submit.disabled = true;
  submit.querySelector('.btn-label').textContent = 'Escaneando';
  const finish = () => {
    submit.classList.remove('loading');
    submit.disabled = false;
    submit.querySelector('.btn-label').textContent = 'Abrir meu Raio-X';
    unlock(true);
  };
  if (reduceMotion) { finish(); return; }
  setTimeout(() => entry.classList.add('leaving'), 450);
  setTimeout(finish, 1150);
});

code.addEventListener('input', () => { code.removeAttribute('aria-invalid'); entryError.textContent = ''; });
reveal.addEventListener('click', () => {
  const visible = code.type === 'password';
  code.type = visible ? 'text' : 'password';
  reveal.textContent = visible ? 'Ocultar' : 'Mostrar';
  reveal.setAttribute('aria-pressed', String(visible));
});
document.querySelector('#exit').addEventListener('click', () => {
  setSession(false);
  app.hidden = true;
  app.classList.remove('ready');
  entry.hidden = false;
  if (code.type === 'text') reveal.click();
  history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
  code.focus();
});

/* ---------- Tabs genéricas ---------- */
function makeTabs(tabs, onChange) {
  const select = (tab, focus) => {
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !active;
      panel.classList.toggle('on', false);
    });
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('on')));
    if (focus) tab.focus();
    onChange?.(tabs.indexOf(tab));
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (event) => {
      const map = { ArrowLeft: index - 1, ArrowUp: index - 1, ArrowRight: index + 1, ArrowDown: index + 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in map)) return;
      event.preventDefault();
      select(tabs[(map[event.key] + tabs.length) % tabs.length], true);
    });
  });
  select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0], false);
  return select;
}

/* Gargalos */
const gapTabs = [...document.querySelectorAll('.gtabs [role=tab]')];
const nextGap = document.querySelector('#next-gap');
let gapIndex = 0;
const selectGap = makeTabs(gapTabs, (i) => {
  gapIndex = i;
  nextGap.innerHTML = (i === gapTabs.length - 1 ? 'Ver os 3 níveis' : 'Próximo gargalo') + ' <svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg>';
});
nextGap.addEventListener('click', () => {
  if (gapIndex === gapTabs.length - 1) { document.querySelector('#niveis').scrollIntoView(); return; }
  selectGap(gapTabs[gapIndex + 1], false);
  document.querySelector('.gtabs').scrollIntoView({ block: 'start' });
});

/* Níveis, pilares e feedback */
makeTabs([...document.querySelectorAll('.pyramid [role=tab]')]);
makeTabs([...document.querySelectorAll('.columns [role=tab]')]);
makeTabs([...document.querySelectorAll('.triad-nodes [role=tab]')]);

/* ---------- Equipe: 11 → 20 ---------- */
const seats = document.querySelector('#seats');
for (let i = 0; i < 20; i++) {
  const li = document.createElement('li');
  li.className = i < 11 ? 'seat filled' : 'seat open';
  li.style.setProperty('--i', i);
  li.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-user"/></svg>';
  seats.append(li);
}
const teamNum = document.querySelector('#team-num');
const teamLabel = document.querySelector('#team-label');
const teamNote = document.querySelector('#team-note');
document.querySelectorAll('[data-team]').forEach((button) => button.addEventListener('click', () => {
  const goal = button.dataset.team === 'goal';
  document.querySelectorAll('[data-team]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
  seats.classList.toggle('goal', goal);
  teamNum.dataset.from = teamNum.textContent;
  countUp(teamNum, goal ? 20 : 11, 600);
  teamLabel.textContent = goal ? 'corretores na meta' : 'corretores hoje';
  teamNote.innerHTML = goal
    ? '<b>+9 pessoas.</b> Cada uma precisa passar pelo recrutamento, pela rampa até a primeira venda e pelo acompanhamento da liderança.'
    : 'As 9 cadeiras vazias são pessoas que precisam ser <b>atraídas</b>, <b>desenvolvidas</b> e <b>mantidas</b>.';
}));

/* ---------- Funil escassez × abundância ---------- */
const dots = document.querySelector('#dots');
for (let i = 0; i < 100; i++) {
  const d = document.createElement('i');
  d.style.setProperty('--i', i);
  dots.append(d);
}
const funnelCap = document.querySelector('#funnel-cap');
function setFunnel(mode) {
  dots.dataset.mode = mode;
  [...dots.children].forEach((d, i) => {
    d.className = '';
    if (mode === 'scarce') { if (i < 5) d.className = i === 0 ? 'pick' : 'in'; }
    else d.className = (i === 37 || i === 81) ? 'best' : 'in';
  });
  funnelCap.innerHTML = mode === 'scarce'
    ? '<b>Poucos candidatos:</b> você contrata quem apareceu.'
    : '<b>Muitos candidatos:</b> a cada 100, cerca de 2 têm o perfil empreendedor. Você escolhe os melhores.';
}
document.querySelectorAll('[data-funnel]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-funnel]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
  setFunnel(button.dataset.funnel);
}));
setFunnel('scarce');

/* ---------- Caminho do líder ---------- */
const paths = {
  promote: [['bad', 'Perde um ótimo vendedor'], ['bad', 'Ganha um gerente que não foi preparado'], ['bad', 'A gestão continua voltando para você']],
  develop: [['good', 'O melhor vendedor segue vendendo enquanto se prepara'], ['good', 'Quem lidera sobe por níveis, com metas claras'], ['good', 'A gestão ganha uma camada abaixo de você']]
};
const pathList = document.querySelector('#path');
document.querySelectorAll('[data-path]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-path]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
  pathList.innerHTML = paths[button.dataset.path].map(([kind, text]) => '<li class="' + kind + '"><span>' + (kind === 'good' ? '+' : '−') + '</span>' + text + '</li>').join('');
}));

/* ---------- Revelar ao rolar ---------- */
const revealTargets = document.querySelectorAll('.reveal,.assets,.team-card,.agenda,.temple,.funnel,.leader');
if ('IntersectionObserver' in window && !reduceMotion) {
  document.documentElement.classList.add('anim');
  const observer = new IntersectionObserver((entries) => {
    for (const item of entries) {
      if (!item.isIntersecting) continue;
      item.target.classList.add('in');
      observer.unobserve(item.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('in'));
}

/* ---------- Progresso e navegação ---------- */
const chapters = [...document.querySelectorAll('.chapter')];
const navLinks = [...document.querySelectorAll('.desktop-nav a,.dock a')];
const line = document.querySelector('.progress span');
let framePending = false;
function updateReadingPosition() {
  framePending = false;
  if (app.hidden) return;
  const maximum = document.documentElement.scrollHeight - window.innerHeight;
  line.style.transform = 'scaleX(' + (maximum > 0 ? Math.min(1, Math.max(0, window.scrollY / maximum)) : 1) + ')';
  const current = [...chapters].reverse().find((chapter) => chapter.getBoundingClientRect().top <= 180) || chapters[0];
  for (const link of navLinks) {
    if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
function requestReadingUpdate() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(updateReadingPosition);
}
window.addEventListener('scroll', requestReadingUpdate, { passive: true });
window.addEventListener('resize', requestReadingUpdate);
if (sessionGranted()) unlock(false);
