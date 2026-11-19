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
  unlock(true);
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
  app.querySelectorAll("video").forEach((video) => video.pause());
  app.hidden = true;
  entry.hidden = false;
  if (code.type === 'text') reveal.click();
  history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
  code.focus();
});

const flows = {
  carteira: {
    title: 'Recuperação de oportunidades',
    stages: [
      ['Identificar', 'Oportunidade sem próxima ação', 'Na demonstração, procure um registro que tenha ficado sem ação futura. Confira se a Imohills encontra casos semelhantes na carteira que escolher.', 'Quantos registros podem ser retomados e quando foi o último contato?'],
      ['Atribuir', 'Responsável e prazo', 'Combine quem entra em contato, em qual prazo e o que precisa ficar registrado depois da tentativa.', 'Quem acompanha os retornos feitos e os que continuam pendentes?'],
      ['Revisar', 'Retorno e visita', 'Na revisão, confira quais conversas voltaram a andar e quais geraram uma visita ou uma nova ação.', 'Quantas retomadas viraram avanço e em que etapa?']
    ]
  },
  novos: {
    title: 'Evolução dos novos corretores',
    stages: [
      ['Captar', 'Primeira captação', 'Registre a entrada e o primeiro avanço com um proprietário. Use a atividade para localizar quem precisa de apoio.', 'Quanto tempo se passa até a primeira captação?'],
      ['Visitar', 'Primeira visita', 'Confira se as conversas geraram visitas. A etapa indica onde pode fazer sentido revisar a abordagem ou a preparação.', 'Onde a atividade é registrada e quem revisa?'],
      ['Fechar', 'Primeira venda', 'Compare o tempo até a primeira venda com a atividade registrada antes dela. O corretor citado levou cerca de 11 meses.', 'Qual é o tempo típico até a primeira venda por turma de entrada?']
    ]
  }
};
const selectedStage = { carteira: 0, novos: 0 };
const tabs = [...document.querySelectorAll('[data-path]')];

function renderFlow(path) {
  const panel = document.querySelector('#painel-' + path);
  const flow = flows[path];
  panel.innerHTML = '<ol class="rail" aria-label="Etapas de ' + flow.title + '">' +
    flow.stages.map(([label], index) => '<li><button type="button" data-index="' + index + '" aria-pressed="false"><span aria-hidden="true">0' + (index + 1) + '</span>' + label + '</button></li>').join('') +
    '</ol><div class="step-detail" aria-live="polite"><div><p class="eyebrow">Na prática</p><h4></h4><p class="step-description"></p></div><div class="step-question"><p class="eyebrow">O que conferir</p><p class="step-check"></p></div></div>';
  const buttons = [...panel.querySelectorAll('[data-index]')];

  function show(index) {
    selectedStage[path] = index;
    const [, title, description, question] = flow.stages[index];
    buttons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
    panel.querySelector('h4').textContent = title;
    panel.querySelector('.step-description').textContent = description;
    panel.querySelector('.step-check').textContent = question;
  }

  for (const button of buttons) button.addEventListener('click', () => show(Number(button.dataset.index)));
  show(selectedStage[path]);
}

function selectPath(tab, focus) {
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
  }
  if (focus) tab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectPath(tab, false));
  tab.addEventListener('keydown', (event) => {
    const targets = { ArrowLeft: (index + tabs.length - 1) % tabs.length, ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (!Object.hasOwn(targets, event.key)) return;
    event.preventDefault();
    selectPath(tabs[targets[event.key]], true);
  });
});
Object.keys(flows).forEach(renderFlow);

const feedback = document.querySelector('#copied');
const fallback = document.querySelector('#copy-fallback');
document.querySelector('#copy').addEventListener('click', async () => {
  const selected = document.querySelector('input[name="focus"]:checked').value;
  const message = 'Gabriel, para a conversa com o Milton eu prefiro começar pela carteira de ' + selected + ' da Imohills.';
  try {
    await navigator.clipboard.writeText(message);
    fallback.hidden = true;
    feedback.textContent = 'Mensagem copiada. Agora é só colar no WhatsApp.';
  } catch {
    fallback.value = message;
    fallback.hidden = false;
    fallback.select();
    feedback.textContent = 'Selecione e copie a mensagem abaixo.';
  }
});
document.querySelectorAll('input[name="focus"]').forEach((input) => input.addEventListener('change', () => {
  feedback.textContent = '';
  fallback.hidden = true;
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
