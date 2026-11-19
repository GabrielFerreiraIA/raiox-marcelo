'use strict';

const accessCode = 'marcelo123';
const sessionKey = 'multiplix-imohills-access-v2';
const entry = document.querySelector('#entry');
const app = document.querySelector('#app');
const code = document.querySelector('#code');
const entryError = document.querySelector('#entry-error');
const reveal = document.querySelector('#reveal');

function sessionGranted() {
  try { return sessionStorage.getItem(sessionKey) === 'yes'; } catch { return false; }
}

function setSession(granted) {
  try {
    if (granted) sessionStorage.setItem(sessionKey, 'yes');
    else sessionStorage.removeItem(sessionKey);
  } catch {
    // The presentation still opens when browser storage is blocked.
  }
}

function unlock(fromForm) {
  entry.hidden = true;
  app.hidden = false;
  const section = document.getElementById(location.hash.slice(1));
  if (section?.classList.contains('chapter')) section.scrollIntoView();
  if (fromForm) document.querySelector('#hero-title').focus({ preventScroll: true });
  updateReadingPosition();
}

document.querySelector('#access-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (code.value.trim().toLowerCase() !== accessCode.toLowerCase()) {
    entryError.textContent = 'Código incorreto. Confira a mensagem do Gabriel e tente de novo.';
    code.setAttribute('aria-invalid', 'true');
    code.focus();
    return;
  }
  entryError.textContent = '';
  code.removeAttribute('aria-invalid');
  code.value = '';
  setSession(true);
  const submit = document.querySelector('#submit');
  submit.classList.add('loading');
  submit.disabled = true;
  setTimeout(() => { submit.classList.remove('loading'); submit.disabled = false; unlock(true); }, 420);
});

code.addEventListener('input', () => {
  code.removeAttribute('aria-invalid');
  entryError.textContent = '';
});

reveal.addEventListener('click', () => {
  const visible = code.type === 'password';
  code.type = visible ? 'text' : 'password';
  reveal.textContent = visible ? 'Ocultar' : 'Mostrar';
  reveal.setAttribute('aria-pressed', String(visible));
});

document.querySelector('#exit').addEventListener('click', () => {
  setSession(false);
    app.hidden = true;
  entry.hidden = false;
  if (code.type === 'text') reveal.click();
  history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
  code.focus();
});

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const levelRows = [...document.querySelectorAll('.level-row')];
filterButtons.forEach((button) => button.addEventListener('click', () => {
  const value = button.dataset.filter;
  filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  levelRows.forEach((row) => row.classList.toggle('dim', value !== 'all' && row.dataset.front !== value));
}));

const chapters = [...document.querySelectorAll('.chapter')];
const navLinks = [...document.querySelectorAll('.desktop-nav a,.dock a')];
const line = document.querySelector('.progress span');
let framePending = false;
function updateReadingPosition() {
  framePending = false;
  if (app.hidden) return;
  const maximum = document.documentElement.scrollHeight - window.innerHeight;
  line.style.transform = 'scaleX(' + (maximum > 0 ? Math.min(1, Math.max(0, window.scrollY / maximum)) : 1) + ')';
  const current = [...chapters].reverse().find((chapter) => chapter.getBoundingClientRect().top <= 175) || chapters[0];
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

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js');
  const revealItems = document.querySelectorAll('.gap,.level,.p4,.duo-card,.extra li,.agenda li');
  const observer = new IntersectionObserver((entries) => {
    for (const item of entries) {
      if (item.isIntersecting) { item.target.classList.add('in'); observer.unobserve(item.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach((item, index) => {
    item.classList.add('reveal');
    item.style.transitionDelay = (index % 4) * 40 + 'ms';
    observer.observe(item);
  });
}
