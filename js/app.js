const participantesOriginais = ["DARILO", "FABRICIO", "GLEUCIANE", "NILDETE", "JHON", "LUAN", "ALEANDRA", "DANIEL", "ROGERIO", "JOAO PEDRO", "PAULO", "CARLA", "NAZARENO"];
let participantesTemporarios = [];
let selecionados = new Set(participantesOriginais);
let listaSorteada = null;
let dataSorteio = null;
let sorteando = false;

// Histórico de sorteios (carrega do localStorage)
let historicoSorteios = [];
try {
  const salvo = localStorage.getItem('historicoSorteiosSobef');
  if (salvo) {
    historicoSorteios = JSON.parse(salvo);
  }
} catch (e) {
  historicoSorteios = [];
}

// Participantes temporários (estagiários, etc.)
try {
  const temporariosSalvos = localStorage.getItem('participantesTemporariosSobef');
  if (temporariosSalvos) {
    participantesTemporarios = JSON.parse(temporariosSalvos);
    participantesTemporarios.forEach(function(nome) {
      selecionados.add(nome);
    });
  }
} catch (e) {
  participantesTemporarios = [];
}

const EMOJIS_POSICAO = ["🥇", "🥈", "🥉"];

function getParticipantes() {
  return participantesOriginais.concat(participantesTemporarios);
}

function salvarTemporarios() {
  try {
    localStorage.setItem('participantesTemporariosSobef', JSON.stringify(participantesTemporarios));
  } catch (e) {}
}

function adicionarParticipante() {
  const input = document.getElementById('novoNome');
  const nome = input.value.trim().toUpperCase();

  if (!nome) {
    mostrarNotificacao('⚠️ Digite o nome do participante!', 'warning');
    return;
  }

  if (getParticipantes().includes(nome)) {
    mostrarNotificacao('⚠️ Este nome já está na lista!', 'warning');
    return;
  }

  participantesTemporarios.push(nome);
  selecionados.add(nome);
  salvarTemporarios();

  input.value = '';
  input.focus();
  mostrarParticipantes();
  mostrarNotificacao('✅ ' + nome + ' adicionado à fila!', 'success');
}

function removerParticipanteTemporario(nome) {
  participantesTemporarios = participantesTemporarios.filter(function(n) {
    return n !== nome;
  });
  selecionados.delete(nome);
  salvarTemporarios();
  mostrarParticipantes();
  mostrarNotificacao('🗑️ ' + nome + ' removido da lista.', 'warning');
}

function atualizarDataHora() {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  document.getElementById('currentDateTime').textContent = `${data} às ${hora}`;
}

function mostrarParticipantes() {
  const lista = document.getElementById('participantsList');
  const participantes = getParticipantes();

  document.getElementById('totalGeral').textContent = participantes.length;
  atualizarContador();

  lista.innerHTML = participantes.map(function(nome) {
    const marcado = selecionados.has(nome);
    const temporario = participantesTemporarios.includes(nome);
    const botaoRemover = temporario
      ? `<button type="button" onclick="removerParticipanteTemporario('${nome.replace(/'/g, "\\'")}')"
           style="margin-left:8px;border:none;background:#c62828;color:#fff;border-radius:6px;
           width:24px;height:24px;cursor:pointer;font-size:13px;line-height:1;">✕</button>`
      : '';

    return `<label class="participant${marcado ? '' : ' disabled'}" data-nome="${nome}">
      <input type="checkbox" ${marcado ? 'checked' : ''} onchange="toggleParticipante('${nome.replace(/'/g, "\\'")}')">
      <span>${nome}${temporario ? ' <small style="opacity:.65;">(temporário)</small>' : ''}</span>
      ${botaoRemover}
    </label>`;
  }).join('');
}

function atualizarContador() {
  document.getElementById('totalPart').textContent = selecionados.size;
}

function toggleParticipante(nome) {
  if (selecionados.has(nome)) { selecionados.delete(nome); } else { selecionados.add(nome); }
  atualizarContador();
  const el = document.querySelector(`.participant[data-nome="${nome}"]`);
  if (el) el.classList.toggle('disabled', !selecionados.has(nome));
}

function selecionarTodos() { selecionados = new Set(getParticipantes()); mostrarParticipantes(); }
function selecionarNenhum() { selecionados = new Set(); mostrarParticipantes(); }

function embaralhar(array) {
  const novo = array.slice();
  for (let i = novo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = novo[i]; novo[i] = novo[j]; novo[j] = tmp;
  }
  return novo;
}

function setBotoesDesabilitados(estado) {
  document.getElementById('btnGerar').disabled = estado;
  document.getElementById('btnCopiar').disabled = estado;
  document.getElementById('btnLimpar').disabled = estado;
  document.getElementById('btnHistorico').disabled = estado;
}

function gerarLista() {
  if (sorteando) return;
  const participantesAtivos = getParticipantes().filter(function(n) { return selecionados.has(n); });
  if (participantesAtivos.length === 0) {
    mostrarNotificacao('⚠️ Selecione ao menos 1 participante!', 'warning');
    return;
  }
  sorteando = true;
  setBotoesDesabilitados(true);

  const resultBox = document.getElementById('resultBox');
  resultBox.innerHTML = `
    <div class="shuffle-overlay">
      <div class="dice">🎲</div>
      <div class="shuffle-label">🔀 Sorteando a fila da comida...</div>
      <div class="shuffle-name" id="shuffleName">...</div>
    </div>`;

  const shuffleNameEl = document.getElementById('shuffleName');
  let ciclos = 0;
  const totalCiclos = 18;
  const intervalo = setInterval(function() {
    const aleatorio = participantesAtivos[Math.floor(Math.random() * participantesAtivos.length)];
    shuffleNameEl.textContent = `🍴 ${aleatorio}`;
    ciclos++;
    if (ciclos >= totalCiclos) {
      clearInterval(intervalo);
      finalizarSorteio(participantesAtivos);
    }
  }, 90);
}

function finalizarSorteio(participantesAtivos) {
  listaSorteada = embaralhar(participantesAtivos);
  dataSorteio = new Date();

  const registro = {
    data: dataSorteio.toISOString(),
    lista: listaSorteada.slice(),
    selecionadosNaEpoca: Array.from(selecionados)
  };
  historicoSorteios.unshift(registro);
  try {
    localStorage.setItem('historicoSorteiosSobef', JSON.stringify(historicoSorteios));
  } catch (e) {}

  let html = `<div class="result-header">🏆 Ordem Sorteada da Fila 🏆</div>`;
  html += `<div class="result-subheader">✨ Que comece o rango! Confira abaixo quem esquenta primeiro 👇</div>`;
  html += `<ol class="queue-list">`;
  listaSorteada.forEach(function(nome, indice) {
    const posicao = indice + 1;
    const classe = posicao === 1 ? 'first' : '';
    const delay = (indice * 0.08).toFixed(2);
    const emoji = EMOJIS_POSICAO[indice] || '🍽️';
    const rotulo = posicao === 1 ? `${emoji} 1º` : `${emoji} ${posicao}º`;
    html += `<li class="queue-item ${classe}" style="animation-delay:${delay}s">
      <div class="queue-position">${rotulo}</div>
      <div class="queue-name">${nome}</div>
    </li>`;
  });
  html += `</ol>`;

  document.getElementById('resultBox').innerHTML = html;
  atualizarDataHora();
  dispararConfete();
  setBotoesDesabilitados(false);
  sorteando = false;
  mostrarNotificacao('🎉 Sorteio concluído! Bom apetite! 🍽️', 'success');
}

function dispararConfete() {
  const cores = ['#e65100', '#ff9800', '#ef6c00', '#ffcc80', '#bf360c'];
  for (let i = 0; i < 60; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti';
    conf.style.left = Math.random() * 100 + 'vw';
    conf.style.background = cores[Math.floor(Math.random() * cores.length)];
    conf.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    conf.style.width = conf.style.height = (6 + Math.random() * 6) + 'px';
    document.body.appendChild(conf);
    setTimeout(function() { conf.remove(); }, 3600);
  }
}

function formatarDataHora(data) {
  const d = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const h = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return { data: d, hora: h };
}

function copiarLista() {
  if (!listaSorteada || !dataSorteio) {
    mostrarNotificacao('⚠️ Primeiro gere a lista!', 'warning');
    return;
  }
  const f = formatarDataHora(dataSorteio);
  let texto = `🍽️ SOBEF - SORTEIO DA FILA DO ESQUENTAMENTO 🍽️\n`;
  texto += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  texto += `🏆 Ordem Sorteada da Fila 🏆\n\n`;
  listaSorteada.forEach(function(nome, indice) {
    const emoji = EMOJIS_POSICAO[indice] || '🍽️';
    texto += `${emoji} ${indice + 1}º - ${nome}\n`;
  });
  texto += `\n📅 Data: ${f.data}\n`;
  texto += `⏰ Horário: ${f.hora}\n`;
  texto += `━━━━━━━━━━━━━━━━━━━━━━\n`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto)
      .then(function() { mostrarNotificacao('✅ Lista copiada com sucesso!', 'success'); })
      .catch(function() { copiarFallback(texto); });
  } else {
    copiarFallback(texto);
  }
}

function copiarFallback(texto) {
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    mostrarNotificacao('✅ Lista copiada com sucesso!', 'success');
  } catch (e) {
    mostrarNotificacao('❌ Erro ao copiar', 'error');
  }
  document.body.removeChild(ta);
}

function limpar() {
  listaSorteada = null;
  dataSorteio = null;
  document.getElementById('resultBox').innerHTML = `<div class="empty-state">🍲 Selecione os participantes e clique em "Gerar Lista" para sortear a ordem da fila</div>`;
  atualizarDataHora();
}

function mostrarNotificacao(mensagem, tipo) {
  const n = document.getElementById('notification');
  n.textContent = mensagem;
  if (tipo === 'warning') { n.style.background = '#f9a825'; n.style.color = '#222'; }
  else if (tipo === 'error') { n.style.background = '#c62828'; n.style.color = '#fff'; }
  else { n.style.background = '#e65100'; n.style.color = '#fff'; }
  n.classList.add('show');
  setTimeout(function() { n.classList.remove('show'); }, 3000);
}

function abrirHistorico() {
  const modal = document.getElementById('modalHistorico');
  const body = document.getElementById('historicoBody');
  modal.classList.add('open');

  if (historicoSorteios.length === 0) {
    body.innerHTML = `<div class="history-empty">Nenhum sorteio realizado ainda.</div>`;
    return;
  }

  let html = '';
  historicoSorteios.forEach(function(reg, idx) {
    const dataObj = new Date(reg.data);
    const f = formatarDataHora(dataObj);
    html += `<div class="history-item">`;
    html += `<div class="history-header">`;
    html += `<div class="history-date">📅 ${f.data} às ${f.hora}</div>`;
    html += `<div class="history-count">${reg.lista.length} participante(s)</div>`;
    html += `</div>`;
    html += `<ol class="history-list">`;
    reg.lista.forEach(function(nome, i) {
      const emoji = EMOJIS_POSICAO[i] || '🍽️';
      html += `<li>${emoji} ${i + 1}º - ${nome}</li>`;
    });
    html += `</ol>`;
    html += `<div class="history-actions">`;
    html += `<button class="btn-view" onclick="visualizarSorteio(${idx})">👁️ Visualizar</button>`;
    html += `<button class="btn-delete" onclick="deletarSorteio(${idx})">🗑️ Excluir</button>`;
    html += `</div>`;
    html += `</div>`;
  });

  body.innerHTML = html;
}

function fecharHistorico() {
  document.getElementById('modalHistorico').classList.remove('open');
}

function visualizarSorteio(indice) {
  const reg = historicoSorteios[indice];
  if (!reg) return;

  listaSorteada = reg.lista.slice();
  dataSorteio = new Date(reg.data);

  let html = `<div class="result-header">🏆 Ordem Sorteada da Fila 🏆</div>`;
  html += `<div class="result-subheader">✨ Sorteio realizado em ${dataSorteio.toLocaleString('pt-BR')}</div>`;
  html += `<ol class="queue-list">`;
  listaSorteada.forEach(function(nome, indice) {
    const posicao = indice + 1;
    const classe = posicao === 1 ? 'first' : '';
    const delay = (indice * 0.08).toFixed(2);
    const emoji = EMOJIS_POSICAO[indice] || '🍽️';
    const rotulo = posicao === 1 ? `${emoji} 1º` : `${emoji} ${posicao}º`;
    html += `<li class="queue-item ${classe}" style="animation-delay:${delay}s">
      <div class="queue-position">${rotulo}</div>
      <div class="queue-name">${nome}</div>
    </li>`;
  });
  html += `</ol>`;

  document.getElementById('resultBox').innerHTML = html;
  fecharHistorico();
  mostrarNotificacao('👀 Sorteio antigo carregado!', 'success');
}

function deletarSorteio(indice) {
  if (!confirm('Tem certeza que deseja excluir este sorteio do histórico?')) return;
  historicoSorteios.splice(indice, 1);
  try {
    localStorage.setItem('historicoSorteiosSobef', JSON.stringify(historicoSorteios));
  } catch (e) {}
  abrirHistorico();
}

atualizarDataHora();
mostrarParticipantes();
setInterval(atualizarDataHora, 1000);
