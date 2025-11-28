const API_BASE = 'http://localhost:8080/api';

// Utility: format numbers as BRL currency (ex: R$ 125.530,28)
function formatCurrency(value) {
  const n = Number(value);
  if (value === null || value === undefined || isNaN(n)) return 'N/A';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

// Create a vertical gradient for charts
function createGradient(ctx, color) {
  const g = ctx.createLinearGradient(0, 0, 0, 200);
  // color is like 'rgb(r, g, b)'
  const rgba = color.replace('rgb(', '').replace(')', '');
  return g.addColorStop ? (function() {
    g.addColorStop(0, `rgba(${rgba}, 0.18)`);
    g.addColorStop(0.6, `rgba(${rgba}, 0.06)`);
    g.addColorStop(1, `rgba(${rgba}, 0)`);
    return g;
  })() : color;
}

// Common chart options to give a modern look
const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  interaction: { mode: 'index', intersect: false },
  animation: { duration: 800, easing: 'easeOutQuart' },
  plugins: {
    legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 16 } },
    tooltip: { enabled: true, mode: 'nearest', intersect: false }
  },
  layout: { padding: { top: 6, right: 12, bottom: 6, left: 6 } }
};

// Landing page functions
function showApp() {
  document.querySelector('header').style.display = 'none';
  document.querySelector('.features-section').style.display = 'none';
  document.querySelector('.how-it-works').style.display = 'none';
  const authScreen = document.getElementById('auth-screen');
  authScreen.style.display = 'flex';
}

function scrollToAbout() {
  document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
}

function showSignupModal() {
  document.getElementById('signup-modal').style.display = 'flex';
}

function closeSignupModal() {
  document.getElementById('signup-modal').style.display = 'none';
}

function validateCredentials() {
  const email = document.getElementById('signup-email').value.trim();
  const senha = document.getElementById('signup-senha').value;
  const senhaConfirm = document.getElementById('signup-senha-confirm').value;

  if (!email) return alert('Informe um email válido');
  if (!senha) return alert('Informe uma senha');
  if (senha.length < 6) return alert('Senha deve ter no mínimo 6 caracteres');
  if (senha !== senhaConfirm) return alert('As senhas não coincidem');

  // Hide step 1, show step 2
  document.getElementById('signup-step1').style.display = 'none';
  document.getElementById('signup-step2').style.display = 'block';
}

function backToStep1() {
  document.getElementById('signup-step2').style.display = 'none';
  document.getElementById('signup-step1').style.display = 'block';
  // Clear form fields
  document.getElementById('signup-email').value = '';
  document.getElementById('signup-senha').value = '';
  document.getElementById('signup-senha-confirm').value = '';
}

async function createAccount() {
  const email = document.getElementById('signup-email').value;
  const senha = document.getElementById('signup-senha').value;
  const nome = document.getElementById('signup-nome').value.trim();
  const rendaMensal = parseFloat(document.getElementById('signup-renda').value);
  const cpfRaw = document.getElementById('signup-cpf') ? document.getElementById('signup-cpf').value : '';
  const cpf = cpfRaw ? cpfRaw.replace(/\D/g,'') : '';

  if (!nome) return alert('Informe seu nome');
  if (!rendaMensal || rendaMensal <= 0) return alert('Informe uma renda mensal válida');
  if (cpf && !validCPF(cpf)) return alert('CPF inválido. Verifique e tente novamente.');

  try {
    const res = await fetch(`${API_BASE}/usuarios/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, rendaMensal, cpf })
    });

    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Erro ao criar conta');

    // Save CPF locally associated to the new user id so we can auto-import later
    try {
      const createdUserId = (json && json.user && json.user.id) ? json.user.id : (json && json.id ? json.id : null);
      if (createdUserId) {
        // Clear any previous import flag for this ID (in case of DB reset/ID reuse)
        localStorage.removeItem(`user_cpf_imported_${createdUserId}`);
        
        if (cpf) {
          localStorage.setItem(`user_cpf_${createdUserId}`, cpf);
        }
      }
    } catch (e) { /* ignore localStorage errors */ }

    alert('Conta criada com sucesso! Faça login com seu email.');
    closeSignupModal();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

// Frontend CPF validation (JS) - expects only digits
function validCPF(cpf) {
  if (!cpf) return false;
  const s = cpf.replace(/\D/g, '');
  // Allow seed/test CPFs used by the mock data so demos work without resetting DB
  if (s === '12345678900' || s === '98765432100' || s === '11122233344') return true;
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false;

  const nums = s.split('').map(c => parseInt(c, 10));
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += nums[i] * (10 - i);
  let r = sum % 11;
  let dig1 = (r < 2) ? 0 : 11 - r;
  if (dig1 !== nums[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += nums[i] * (11 - i);
  r = sum % 11;
  let dig2 = (r < 2) ? 0 : 11 - r;
  if (dig2 !== nums[10]) return false;

  return true;
}

// App functionality
let currentUser = null;
let currentMode = null;

let authScreen, mainScreen, pageTitle, page, navMenu, userInfo, logoutBtn;

function navigate(route){
  page.innerHTML = '';
  pageTitle.textContent = ({home:'Menu',usuarios:'Usuários',credores:'Credores',dividas:'Dívidas',pagamentos:'Pagamentos',plano:'Gerar Plano'}[route] || 'Menu');
  if (route === 'home') return renderMenu();
  if (route === 'usuarios') return renderUsuarios();
  if (route === 'credores') return renderCredores();
  if (route === 'dividas') return renderDividas();
  if (route === 'pagamentos') return renderPagamentos();
  if (route === 'plano') return renderGerarPlano();
}

function renderMenu(){
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="notice">Bem-vindo ao frontend simples do Microplan. Use o menu à esquerda.</div>
    <div class="small">API base: ${API_BASE}</div>
  `;
  page.appendChild(el);
}

async function renderUsuarios(){
  page.appendChild(createLoading());
  try {
    const res = await fetch(`${API_BASE}/usuarios`);
    const data = await res.json();
    const arr = data.content || data;
    if (!Array.isArray(arr)) {
      page.innerHTML = '<div class="notice">Erro: resposta inesperada do servidor</div>';
      return;
    }
    page.innerHTML = '';
    const btnNew = document.createElement('button'); btnNew.className='btn'; btnNew.textContent='Novo usuário';
    btnNew.onclick = () => showUsuarioForm();
    page.appendChild(btnNew);
    const headers = ['ID','Nome','Email','Renda Mensal', 'Ações'];
    const rows = arr.map(u => [
      u.id,
      u.nome,
      u.email,
      u.rendaMensal,
      `<button class="btn small" onclick="editUsuario(${u.id}, '${u.nome}', '${u.email}', ${u.rendaMensal})">Editar</button> ` +
      `<button class="btn secondary small" onclick="deleteUsuario(${u.id}, '${u.nome}')">Excluir</button>`
    ]);
    page.appendChild(createTable(headers, rows));
  } catch(e){ page.innerHTML = `<div class="notice">Erro: ${e.message}</div>` }
}

let editingUsuarioId = null;

function showUsuarioForm(userId, userNome, userEmail, userRenda){
  page.innerHTML = '';
  editingUsuarioId = userId || null;
  const isEditing = editingUsuarioId !== null;
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row"><input id="u-nome" placeholder="Nome" value="${userNome || ''}"><input id="u-email" placeholder="Email" value="${userEmail || ''}"></div>
    <div class="form-row"><input id="u-renda" placeholder="Renda Mensal (ex: 2500.00)" value="${userRenda || ''}"></div>
    <button class="btn" id="u-save">${isEditing ? 'Atualizar' : 'Salvar'}</button>
    <button class="btn secondary" id="u-cancel">Cancelar</button>
  `;
  page.appendChild(form);
  document.getElementById('u-save').onclick = async () => {
    const payload = { nome: document.getElementById('u-nome').value, email: document.getElementById('u-email').value, rendaMensal: parseFloat(document.getElementById('u-renda').value) };
    try {
      if (isEditing) {
        const res = await fetch(`${API_BASE}/usuarios/${editingUsuarioId}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const json = await res.json();
        if (!res.ok) return alert(json.error || 'Erro');
        alert('Usuário atualizado!');
      } else {
        const res = await fetch(`${API_BASE}/usuarios`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const json = await res.json();
        if (!res.ok) return alert(json.error || 'Erro');
        alert('Usuário criado: ' + json.id);
      }
      renderUsuarios();
    } catch(e){ alert(e.message) }
  };
  document.getElementById('u-cancel').onclick = renderUsuarios;
}

function editUsuario(id, nome, email, renda) {
  showUsuarioForm(id, nome, email, renda);
}

async function deleteUsuario(id, nome) {
  if (confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
    try {
      const res = await fetch(`${API_BASE}/usuarios/${id}`, {method:'DELETE'});
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(()=>({}));
        return alert(json.error || 'Erro ao excluir');
      }
      alert('Usuário excluído!');
      renderUsuarios();
    } catch(e){ alert('Erro: ' + e.message) }
  }
}

async function renderCredores(){
  page.appendChild(createLoading());
  try {
    const res = await fetch(`${API_BASE}/credores`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      page.innerHTML = '<div class="notice">Erro: resposta inesperada do servidor</div>';
      return;
    }
    page.innerHTML = '';
    const btnNew = document.createElement('button'); btnNew.className='btn'; btnNew.textContent='Novo credor';
    btnNew.onclick = () => showCredorForm();
    page.appendChild(btnNew);
    const headers = ['ID','Nome','Contato', 'Ações'];
    const rows = data.map(c => [
      c.id,
      c.nome,
      c.contato,
      `<button class="btn small" onclick="editCredor(${c.id}, '${c.nome}', '${c.contato}')">Editar</button> ` +
      `<button class="btn secondary small" onclick="deleteCredor(${c.id}, '${c.nome}')">Excluir</button>`
    ]);
    page.appendChild(createTable(headers, rows));
  } catch(e){ page.innerHTML = `<div class="notice">Erro: ${e.message}</div>` }
}

let editingCredorId = null;

function showCredorForm(credorId, credorNome, credorContato){
  page.innerHTML = '';
  editingCredorId = credorId || null;
  const isEditing = editingCredorId !== null;
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row"><input id="c-nome" placeholder="Nome" value="${credorNome || ''}"><input id="c-contato" placeholder="Contato" value="${credorContato || ''}"></div>
    <button class="btn" id="c-save">${isEditing ? 'Atualizar' : 'Salvar'}</button>
    <button class="btn secondary" id="c-cancel">Cancelar</button>
  `;
  page.appendChild(form);
  document.getElementById('c-save').onclick = async () => {
    const payload = { nome: document.getElementById('c-nome').value, contato: document.getElementById('c-contato').value };
    try {
      if (isEditing) {
        const res = await fetch(`${API_BASE}/credores/${editingCredorId}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if (!res.ok) return alert('Erro ao atualizar credor');
        alert('Credor atualizado!');
      } else {
        const res = await fetch(`${API_BASE}/credores`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const json = await res.json();
        if (!res.ok) return alert('Erro ao criar credor');
        alert('Credor criado: ' + json.id);
      }
      renderCredores();
    } catch(e){ alert(e.message) }
  };
  document.getElementById('c-cancel').onclick = renderCredores;
}

function editCredor(id, nome, contato) {
  showCredorForm(id, nome, contato);
}

async function deleteCredor(id, nome) {
  if (confirm(`Tem certeza que deseja excluir o credor "${nome}"?`)) {
    try {
      const res = await fetch(`${API_BASE}/credores/${id}`, {method:'DELETE'});
      if (!res.ok && res.status !== 204) return alert('Erro ao excluir credor');
      alert('Credor excluído!');
      renderCredores();
    } catch(e){ alert('Erro: ' + e.message) }
  }
}

async function renderDividas(){
  page.appendChild(createLoading());
  try {
    const res = await fetch(`${API_BASE}/dividas`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      page.innerHTML = '<div class="notice">Erro: resposta inesperada do servidor</div>';
      return;
    }
    page.innerHTML = '';
    const btnNew = document.createElement('button'); btnNew.className='btn'; btnNew.textContent='Nova dívida';
    btnNew.onclick = () => showDividaForm();
    page.appendChild(btnNew);
    const headers = ['ID','Usuário','Credor','Descrição','Saldo','Juros%','Parcela','Vencimento', 'Ações'];
    const rows = data.map(d => {
      const vencDisplay = d.vencimento ? d.vencimento : (d.vencimentoMensal ? `Dia ${d.vencimentoMensal}` : '');
      return [
        d.id,
        d.usuarioNome,
        d.credorNome,
        d.descricao,
        formatCurrency(d.saldoAtual),
        d.taxaJurosAnual,
        formatCurrency(d.parcelaMinima),
        vencDisplay,
        `<button class="btn small" onclick="editDivida(${d.id}, ${d.usuarioId || (d.usuario && d.usuario.id)}, ${d.credorId || (d.credor && d.credor.id)}, '${d.descricao}', ${d.saldoAtual}, ${d.taxaJurosAnual}, ${d.parcelaMinima}, ${d.vencimentoMensal})">Editar</button> ` +
        `<button class="btn secondary small" onclick="deleteDivida(${d.id}, '${d.descricao}')">Excluir</button>`
      ];
    });
    page.appendChild(createTable(headers, rows));
  } catch(e){ page.innerHTML = `<div class="notice">Erro: ${e.message}</div>` }
}

let editingDividaId = null;

function showDividaForm(dividaId, usuarioId, credorId, descricao, saldo, taxa, parcela, vencimento){
  page.innerHTML = '';
  editingDividaId = dividaId || null;
  const isEditing = editingDividaId !== null;
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="small">Você precisa já ter criados usuários e credores. Use seus ids abaixo.</div>
    <div class="form-row"><input id="d-usuario" placeholder="usuarioId" value="${usuarioId || ''}"><input id="d-credor" placeholder="credorId" value="${credorId || ''}"></div>
    <div class="form-row"><input id="d-descricao" placeholder="Descrição" value="${descricao || ''}"><input id="d-saldo" placeholder="Saldo (ex: 1500.00)" value="${saldo || ''}"></div>
    <div class="form-row"><input id="d-taxa" placeholder="taxa juros anual (ex: 10.00)" value="${taxa || ''}"><input id="d-parcela" placeholder="parcela minima (ex: 50.00)" value="${parcela || ''}"></div>
    <div class="form-row"><input id="d-venc" placeholder="vencimentoMensal (1-28)" value="${vencimento || ''}"></div>
    <button class="btn" id="d-save">${isEditing ? 'Atualizar' : 'Salvar'}</button>
    <button class="btn secondary" id="d-cancel">Cancelar</button>
  `;
  page.appendChild(form);
  document.getElementById('d-save').onclick = async () => {
    const payload = {
      usuario: { id: parseInt(document.getElementById('d-usuario').value) },
      credor: { id: parseInt(document.getElementById('d-credor').value) },
      descricao: document.getElementById('d-descricao').value,
      saldoAtual: parseFloat(document.getElementById('d-saldo').value),
      taxaJurosAnual: parseFloat(document.getElementById('d-taxa').value),
      parcelaMinima: parseFloat(document.getElementById('d-parcela').value),
      vencimentoMensal: parseInt(document.getElementById('d-venc').value)
    };
    try {
      if (isEditing) {
        const res = await fetch(`${API_BASE}/dividas/${editingDividaId}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if (!res.ok) return alert('Erro ao atualizar dívida');
        alert('Dívida atualizada!');
      } else {
        const res = await fetch(`${API_BASE}/dividas`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const json = await res.json();
        if (!res.ok) return alert(json.error || 'Erro');
        alert('Dívida criada: ' + json.id);
      }
      if (currentMode === 'user') {
        renderMinhasDividas();
      } else {
        renderDividas();
      }
    } catch(e){ alert(e.message) }
  };
  document.getElementById('d-cancel').onclick = currentMode === 'user' ? renderMinhasDividas : renderDividas;
}

function editDivida(id, usuarioId, credorId, descricao, saldo, taxa, parcela, vencimento) {
  showDividaForm(id, usuarioId, credorId, descricao, saldo, taxa, parcela, vencimento);
}

async function deleteDivida(id, descricao) {
  if (confirm(`Tem certeza que deseja excluir a dívida "${descricao}"?`)) {
    try {
      const res = await fetch(`${API_BASE}/dividas/${id}`, {method:'DELETE'});
      if (!res.ok && res.status !== 204) return alert('Erro ao excluir dívida');
      alert('Dívida excluída!');
      renderDividas();
    } catch(e){ alert('Erro: ' + e.message) }
  }
}

async function renderPagamentos(){
  page.appendChild(createLoading());
  try {
    const res = await fetch(`${API_BASE}/pagamentos`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      page.innerHTML = '<div class="notice">Erro: resposta inesperada do servidor</div>';
      return;
    }
    page.innerHTML = '';
    const btnNew = document.createElement('button'); btnNew.className='btn'; btnNew.textContent='Novo pagamento';
    btnNew.onclick = () => showPagamentoForm();
    page.appendChild(btnNew);
    const headers = ['ID','Dívida ID','Data','Valor','Tipo','Observação', 'Ações'];
    const rows = data.map(p => [
      p.id,
      p.dividaId,
      p.data,
      p.valor,
      p.tipo,
      p.observacao,
      `<button class="btn small" onclick="editPagamento(${p.id}, ${p.dividaId}, '${p.data}', ${p.valor}, '${p.tipo}', '${p.observacao}')">Editar</button> ` +
      `<button class="btn secondary small" onclick="deletePagamento(${p.id}, '${p.observacao || 'Pagamento'}')">Excluir</button>`
    ]);
    page.appendChild(createTable(headers, rows));
  } catch(e){ page.innerHTML = `<div class="notice">Erro: ${e.message}</div>` }
}

let editingPagamentoId = null;

function showPagamentoForm(pagamentoId, dividaId, data, valor, tipo, observacao){
  page.innerHTML = '';
  editingPagamentoId = pagamentoId || null;
  const isEditing = editingPagamentoId !== null;
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row"><input id="p-divida" placeholder="dividaId" value="${dividaId || ''}"><input id="p-valor" placeholder="valor (ex: 100.00)" value="${valor || ''}"></div>
    <div class="form-row"><select id="p-tipo"><option value="PARCIAL" ${tipo === 'PARCIAL' ? 'selected' : ''}>PARCIAL</option><option value="TOTAL" ${tipo === 'TOTAL' ? 'selected' : ''}>TOTAL</option></select><input id="p-observacao" placeholder="observação" value="${observacao || ''}"></div>
    <div id="sim-result" style="margin-bottom: 10px;"></div>
    <button class="btn" id="p-sim">Simular Pagamento</button>
    <button class="btn" id="p-save" style="margin-left: 10px;">${isEditing ? 'Atualizar' : 'Registrar'}</button>
    <button class="btn secondary" id="p-cancel">Cancelar</button>
  `;
  page.appendChild(form);
  document.getElementById('p-sim').onclick = async () => {
    const dividaId = parseInt(document.getElementById('p-divida').value);
    const valor = parseFloat(document.getElementById('p-valor').value);
    if (!dividaId || !valor || valor <= 0) {
      alert('Preencha dividaId e valor válido');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/dividas/${dividaId}/simular-pagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: valor.toString() })
      });
      const json = await res.json();
      const resultDiv = document.getElementById('sim-result');
      if (!res.ok) {
        resultDiv.innerHTML = `<div style="color: red;">Erro: ${json.erro}</div>`;
        return;
      }
      const novoSaldoVal = parseFloat(json.novoSaldo);
      const quitada = json.quitada ? 'Sim, dívida será quitada.' : 'Não, dívida remanescente: ' + formatCurrency(novoSaldoVal);
      resultDiv.innerHTML = `<div style="color: green;">Novo dívida: ${formatCurrency(novoSaldoVal)}. Quitada: ${quitada}</div>`;
    } catch(e) {
      alert('Erro: ' + e.message);
    }
  };
  document.getElementById('p-save').onclick = async () => {
    const payload = { divida: { id: parseInt(document.getElementById('p-divida').value) }, valor: parseFloat(document.getElementById('p-valor').value), tipo: document.getElementById('p-tipo').value, observacao: document.getElementById('p-observacao').value };
    try {
      if (isEditing) {
        const res = await fetch(`${API_BASE}/pagamentos/${editingPagamentoId}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if (!res.ok) return alert('Erro ao atualizar pagamento');
        alert('Pagamento atualizado!');
      } else {
        const res = await fetch(`${API_BASE}/pagamentos`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const json = await res.json();
        if (!res.ok) return alert(json.error || 'Erro');
        alert('Pagamento criado: ' + json.id);
      }
      renderPagamentos();
    } catch(e){ alert(e.message) }
  };
  document.getElementById('p-cancel').onclick = renderPagamentos;
}

function editPagamento(id, dividaId, data, valor, tipo, observacao) {
  showPagamentoForm(id, dividaId, data, valor, tipo, observacao);
}

async function deletePagamento(id, observacao) {
  if (confirm(`Tem certeza que deseja excluir o pagamento "${observacao || 'Pagamento'}"?`)) {
    try {
      const res = await fetch(`${API_BASE}/pagamentos/${id}`, {method:'DELETE'});
      if (!res.ok && res.status !== 204) return alert('Erro ao excluir pagamento');
      alert('Pagamento excluído!');
      renderPagamentos();
    } catch(e){ alert('Erro: ' + e.message) }
  }
}

function renderGerarPlano(){
  page.innerHTML = '';
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="small">Gere um plano de quitação para um usuário existente (informe o id do usuário)</div>
    <div class="form-row"><input id="pl-usuario" placeholder="usuarioId"><input id="pl-valor" placeholder="valorDisponivelMensal (ex: 500.00)"></div>
    <div class="form-row"><select id="pl-estrategia"><option value="AVALANCHE">AVALANCHE</option><option value="SNOWBALL">SNOWBALL</option></select></div>
    <button class="btn" id="pl-gen">Gerar Plano</button>
  `;
  page.appendChild(el);
  document.getElementById('pl-gen').onclick = async () => {
    const payload = { usuarioId: parseInt(document.getElementById('pl-usuario').value), valorDisponivelMensal: parseFloat(document.getElementById('pl-valor').value), estrategia: document.getElementById('pl-estrategia').value };
    try {
      const res = await fetch(`${API_BASE}/planos/generate`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const json = await res.json();
      if (!res.ok) return alert(json.error || 'Erro');
      page.innerHTML = '<pre>' + JSON.stringify(json, null, 2) + '</pre>';
    } catch(e){ alert(e.message) }
  };
}

function createTable(headers, rows){
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; trh.appendChild(th); });
  thead.appendChild(trh); table.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach(r => { const tr = document.createElement('tr'); r.forEach(c => { const td = document.createElement('td'); const content = c === null || c === undefined ? '' : c; if (typeof content === 'string' && content.includes('<')) { td.innerHTML = content; } else { td.textContent = content; } tr.appendChild(td); }); tbody.appendChild(tr); });
  table.appendChild(tbody);
  return table;
}

// Check for existing login session and setup UI
async function checkLoginSession() {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.id && user.nome) {
        currentUser = user;
        currentMode = 'user';
        showMainScreen();
        return true;
      }
    } catch (e) {
      localStorage.removeItem('currentUser');
    }
  }
  return false;
}

// Add event listeners after DOM loads
document.addEventListener('DOMContentLoaded', async function() {
  if (window.location.pathname === '/' || window.location.pathname === '/index' || window.location.pathname === '/index.html') {
    // Setup for login page (index.html)
    const signupLink = document.getElementById('btn-signup-link');
    if (signupLink) {
      signupLink.addEventListener('click', showSignupModal);
    }

    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', async () => {
        await loginUserForPage();
      });
    }
  } else if (window.location.pathname === '/microplan.html') {
    // Check session for app page
    const isLoggedIn = await checkLoginSession();
    if (!isLoggedIn) {
      window.location.href = '/';
      return;
    }
    // Add logout listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logoutForPage);
    }
  } else if (window.location.pathname === '/microplan' || window.location.pathname === '/microplan.html') {
    // Check session for app page
    const isLoggedIn = await checkLoginSession();
    if (!isLoggedIn) {
      window.location.href = '/';
      return;
    }
    // Add logout listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logoutForPage);
    }
  }
});

// Login functions
async function loginUser() {
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;

  if (!email || !senha) {
    alert('Preencha email e senha');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/usuarios`);
    const data = await res.json();
    const usuarios = data.content || data;

    if (!Array.isArray(usuarios)) {
      alert('Erro ao buscar usuários');
      return;
    }

    const user = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      alert('Usuário não encontrado');
      return;
    }

    const stored = localStorage.getItem(`user_${email}`);
    if (!stored || JSON.parse(stored).senha !== senha) {
      alert('Credenciais incorretas');
      return;
    }

    currentUser = user;
    currentMode = 'user';
    localStorage.setItem('loggedUserId', user.id.toString());
    showMainScreen();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

async function loginUserForPage() {
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;

  if (!email || !senha) {
    alert('Preencha email e senha');
    return;
  }

  try {
    // Use secure login API
    const res = await fetch(`${API_BASE}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.error || 'Erro no login');
      return;
    }

    // Login successful - set session and redirect to app
    const user = json.user;
    currentUser = user;
    currentMode = 'user';
    localStorage.setItem('loggedUserId', user.id.toString());
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = '/microplan.html';
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

function logoutForPage() {
  currentUser = null;
  currentMode = null;
  localStorage.removeItem('loggedUserId');
  localStorage.removeItem('currentUser');
  window.location.href = '/';
}

function logout() {
  currentUser = null;
  currentMode = null;
  localStorage.removeItem('loggedUserId');
  document.getElementById('main-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
}

function showMainScreen() {
  const authEl = document.getElementById('auth-screen');
  const mainEl = document.getElementById('main-screen');
  if (authEl) authEl.style.display = 'none';
  if (mainEl) mainEl.style.display = 'block';

  // Initialize elements
  authScreen = document.getElementById('auth-screen');
  mainScreen = document.getElementById('main-screen');
  pageTitle = document.getElementById('page-title');
  page = document.getElementById('page');
  navMenu = document.getElementById('nav-menu');
  userInfo = document.getElementById('user-info');
  logoutBtn = document.getElementById('logout-btn');

  // Setup user info
  if (userInfo) {
    userInfo.innerHTML = `<strong>${currentUser.nome}</strong><br><small>${currentUser.email}</small>`;
  }

  setupUserMenu();

  navigate('home');
  // After rendering home, prompt to confirm CPF and optionally import mock debts
  setTimeout(() => {
    try { showCpfConfirmIfNeeded(); } catch (e) { /* ignore */ }
  }, 300);
}



function setupUserMenu() {
  navMenu.innerHTML = `
    <button onclick="navigate('home')">
      <i class="ri-dashboard-line"></i>
      Dashboard
    </button>
    <button onclick="navigate('minhas-dividas')">
      <i class="ri-money-dollar-box-line"></i>
      Minhas Dívidas
    </button>
    <button onclick="navigate('pagamentos-usuario')">
      <i class="ri-cash-line"></i>
      Pagamentos
    </button>
    <button onclick="navigate('plano-usuario')">
      <i class="ri-file-chart-line"></i>
      Meu Plano
    </button>
  `;
}

function navigate(route) {
  page.innerHTML = '';
  pageTitle.textContent = ({home:'Dashboard','minhas-dividas':'Minhas Dívidas','pagamentos-usuario':'Pagamentos','plano-usuario':'Meu Plano'}[route] || 'Dashboard');
  if (route === 'home') return renderUserDashboard();
  if (route === 'minhas-dividas') return renderMinhasDividas();
  if (route === 'pagamentos-usuario') return renderPagamentosUsuario();
  if (route === 'plano-usuario') return renderMeuPlano();
}



function renderUserDashboard() {
  page.innerHTML = '<div class="notice">Carregando...</div>';
  loadUserDashboard();
}

async function loadUserDashboard() {
  try {
    const divRes = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}/ativas`);
    const allDividas = await divRes.json();

    const arr = Array.isArray(allDividas) ? allDividas.filter(d => parseFloat(d.saldoAtual) > 0) : [];
    const totalSaldo = arr.reduce((s, d) => s + (parseFloat(d.saldoAtual) || 0), 0);
    const totalParcelas = arr.reduce((s, d) => s + (parseFloat(d.parcelaMinima) || 0), 0);
    
    // Calculate Income Commitment
    const renda = parseFloat(currentUser.rendaMensal) || 1; // Avoid division by zero
    const comprometimento = (totalParcelas / renda) * 100;
    
    let statusColor = '#10b981'; // Green
    let statusText = 'Saudável';
    let statusIcon = 'ri-emotion-happy-line';
    
    if (comprometimento > 50) {
      statusColor = '#ef4444'; // Red
      statusText = 'Crítico';
      statusIcon = 'ri-alarm-warning-line';
    } else if (comprometimento > 30) {
      statusColor = '#f59e0b'; // Orange
      statusText = 'Atenção';
      statusIcon = 'ri-error-warning-line';
    }

    // Fetch Serasa Score (Mock)
    let serasaScore = 'N/A';
    let serasaColor = '#9ca3af'; // gray
    if (currentUser.cpf) {
      try {
        const serasaRes = await fetch(`${API_BASE}/mock/serasa/cpf/${currentUser.cpf}`);
        if (serasaRes.ok) {
          const serasaJson = await serasaRes.json();
          serasaScore = serasaJson.score;
          
          // Serasa Score Colors
          if (serasaScore >= 800) serasaColor = '#10b981'; // Excellent (Green)
          else if (serasaScore >= 500) serasaColor = '#3b82f6'; // Good (Blue)
          else if (serasaScore >= 300) serasaColor = '#f59e0b'; // Fair (Yellow)
          else serasaColor = '#ef4444'; // Poor (Red)
        }
      } catch (e) {
        console.error('Erro ao buscar score Serasa', e);
      }
    }

    const userCard = `
      <div class="dashboard-section">
        <h3>Informações Pessoais</h3>
        <p><strong>Nome:</strong> ${currentUser.nome}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Renda Mensal:</strong> ${formatCurrency(currentUser.rendaMensal)}</p>
      </div>
    `;

    const healthCard = `
      <div class="dashboard-section">
        <h3>Saúde Financeira (Comprometimento)</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.9rem; color: #666;">Parcelas / Renda</span>
              <div style="font-size: 1.5rem; font-weight: bold; color: #333;">
                ${comprometimento.toFixed(1)}%
              </div>
            </div>
            <div style="text-align: right;">
              <div style="display: flex; align-items: center; gap: 5px; color: ${statusColor}; font-weight: 600;">
                <i class="${statusIcon}"></i> ${statusText}
              </div>
              <small style="color: #888;">Meta: < 30%</small>
            </div>
          </div>
          
          <div style="width: 100%; height: 12px; background: #e5e7eb; border-radius: 6px; overflow: hidden;">
            <div style="width: ${Math.min(comprometimento, 100)}%; height: 100%; background: ${statusColor}; transition: width 1s ease-in-out;"></div>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #666; margin-top: 5px;">
            <span>Total Parcelas: <strong>${formatCurrency(totalParcelas)}</strong></span>
            <span>Renda: <strong>${formatCurrency(renda)}</strong></span>
          </div>
        </div>
      </div>
    `;

    const serasaCard = `
      <div class="dashboard-section">
        <h3>Score Serasa</h3>
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;">
             <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" stroke-width="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${serasaColor}" stroke-width="3" stroke-dasharray="${(serasaScore/1000)*100}, 100" />
             </svg>
             <div style="position: absolute; font-size: 1.5rem; font-weight: bold; color: #333;">${serasaScore}</div>
          </div>
          <div>
            <p style="margin: 0; color: #666;">Pontuação de Crédito</p>
            <p style="margin: 0; font-size: 0.9rem; color: #888;">Baseado no CPF ${currentUser.cpf || 'N/A'}</p>
          </div>
        </div>
      </div>
    `;

    const debtsCard = `
      <div class="dashboard-section">
        <h3>Resumo Dívidas</h3>
        <p><strong>Total de Dívidas:</strong> ${arr.length}</p>
        <p><strong>Saldo Total:</strong> ${formatCurrency(totalSaldo)}</p>
        ${arr.length > 0 ? createTable(['Credor', 'Descrição', 'Saldo', 'Juros%'], arr.map(d => [d.credorNome, d.descricao, d.saldoAtual, d.taxaJurosAnual])).outerHTML : ''}
      </div>
    `;

    page.innerHTML = userCard + healthCard + serasaCard + debtsCard;
  } catch (e) {
    page.innerHTML = `<div class="notice">Erro: ${e.message}</div>`;
  }
}

function getScoreColor(score) {
  if (score >= 80) return '#10b981'; // green
  else if (score >= 60) return '#3b82f6'; // blue
  else if (score >= 40) return '#f59e0b'; // yellow
  else return '#ef4444'; // red
}

function renderScoreGauge(score) {
  const canvas = document.getElementById('score-gauge');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 45;

  // Background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Score arc
  const angle = (score / 100) * 2 * Math.PI - Math.PI / 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle);
  ctx.strokeStyle = getScoreColor(score);
  ctx.lineWidth = 8;
  ctx.stroke();

  // Center text
  ctx.fillStyle = '#333';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(score.toString(), centerX, centerY + 5);
}

function createLoading() {
  const d = document.createElement('div');
  d.className='notice';
  d.textContent='Carregando...';
  return d;
}

// --- CPF confirmation / import UI handlers ---
function showCpfConfirmIfNeeded() {
  if (!currentUser || !currentUser.id) return;
  // Do not show modal if user already imported their CPF debts
  try {
    if (localStorage.getItem(`user_cpf_imported_${currentUser.id}`)) return;
  } catch (e) { /* ignore localStorage errors */ }

  const stored = localStorage.getItem(`user_cpf_${currentUser.id}`) || '';
  // prefer stored cpf; if currentUser has cpf property, use it
  const cpf = (currentUser.cpf && String(currentUser.cpf)) || stored || '';
  openCpfModal(cpf);
}

function openCpfModal(cpf) {
  const modal = document.getElementById('cpf-confirm-modal');
  if (!modal) return;
  document.getElementById('cpf-modal-input').value = cpf || '';
  document.getElementById('cpf-modal-body').innerHTML = '<div class="notice">Digite ou confirme o CPF e clique em Buscar.</div>';
  modal.style.display = 'flex';
  if (cpf && cpf.length >= 3) {
    cpfModalFetch();
  }
}

function closeCpfModal() {
  const modal = document.getElementById('cpf-confirm-modal');
  if (!modal) return;
  modal.style.display = 'none';
}

async function cpfModalFetch() {
  const input = document.getElementById('cpf-modal-input');
  if (!input) return;
  const cpf = input.value.replace(/\D/g, '');
  if (!cpf) return alert('Informe um CPF válido');
  if (!validCPF(cpf)) return alert('CPF inválido. Verifique e tente novamente.');
  const body = document.getElementById('cpf-modal-body');
  body.innerHTML = '<div class="notice">Buscando dívidas (mock)...</div>';
  try {
    const res = await fetch(`${API_BASE}/mock/serasa/cpf/${cpf}`);
    const json = await res.json();
    if (!res.ok) return body.innerHTML = `<div class="notice">Erro: ${json.error || 'Resposta inválida'}</div>`;
    renderCpfModalData(json);
  } catch (e) {
    body.innerHTML = `<div class="notice">Erro ao buscar: ${e.message}</div>`;
  }
}

function renderCpfModalData(data) {
  const body = document.getElementById('cpf-modal-body');
  if (!body) return;
  const cpf = data.cpf || '';
  const score = data.score || 'N/A';
  const dividas = Array.isArray(data.dividas) ? data.dividas : [];
  let html = `<div style="margin-bottom:8px;"><strong>CPF:</strong> ${cpf} &nbsp; <strong>Score:</strong> ${score}</div>`;
  if (dividas.length === 0) {
    html += '<div class="notice">Nenhuma dívida encontrada (mock).</div>';
  } else {
    html += '<table style="width:100%; border-collapse:collapse;"><thead><tr><th style="text-align:left">Credor</th><th style="text-align:left">Descrição</th><th style="text-align:right">Valor</th><th style="text-align:right">Juros (%)</th><th style="text-align:left">Vencimento</th></tr></thead><tbody>';
    dividas.forEach(d => {
      const juros = d.juros !== undefined && d.juros !== null ? Number(d.juros).toFixed(2) : (d.taxaJurosAnual !== undefined ? Number(d.taxaJurosAnual).toFixed(2) : 'N/A');
      const desc = d.descricao || d.tipo || d.descricao || '';
      // Prefer full date `vencimento` (YYYY-MM-DD). If not present, show day-of-month as "Dia X" when available.
      let vencDisplay = '';
      if (d.vencimento) vencDisplay = d.vencimento;
      else if (d.vencimentoMensal) vencDisplay = `Dia ${d.vencimentoMensal}`;
      html += `<tr><td>${d.credor || d.credorNome || '—'}</td><td>${desc}</td><td style="text-align:right">${formatCurrency(d.valor || d.saldoAtual)}</td><td style="text-align:right">${juros}</td><td>${vencDisplay}</td></tr>`;
    });
    html += '</tbody></table>';
  }
  html += '<div style="margin-top:8px; font-size:0.9rem; color:#444">Confirme se essas dívidas pertencem a você e clique em "Importar dívidas" para adicioná-las à sua conta.</div>';
  body.innerHTML = html;
}

async function cpfModalImport() {
  if (!currentUser || !currentUser.id) return alert('Usuário não identificado');
  const input = document.getElementById('cpf-modal-input');
  const cpf = input ? input.value.replace(/\D/g,'') : '';
  if (!cpf) return alert('Informe um CPF válido');
  if (!validCPF(cpf)) return alert('CPF inválido. Verifique e tente novamente.');
  try {
    const res = await fetch(`${API_BASE}/mock/serasa/import`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ cpf, usuarioId: currentUser.id })
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Erro ao importar dívidas');
    // Save cpf locally
    try { localStorage.setItem(`user_cpf_${currentUser.id}`, cpf); } catch (e) {}
    try { localStorage.setItem(`user_cpf_imported_${currentUser.id}`, '1'); } catch (e) {}
    alert('Dívidas importadas com sucesso.');
    closeCpfModal();
    navigate('minhas-dividas');
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

// Fallback initialization (in case DOM is already loaded)
if (document.readyState === 'loading') {
  // DOM not loaded yet, event listener already added above
} else {
  // DOM already loaded
  const signupLink = document.getElementById('btn-signup-link');
  if (signupLink) {
    signupLink.addEventListener('click', showSignupModal);
  }
}

// Keep existing render functions for compatibility
async function renderMinhasDividas(){
  page.appendChild(createLoading());
  try {
    const res = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}/ativas`);
    const dividas = await res.json();

    page.innerHTML = '';

    const btnAdd = document.createElement('button');
    btnAdd.className='btn btn-primary';
    btnAdd.textContent='Adicionar Dívida';
    btnAdd.style.marginBottom = '15px';
    btnAdd.onclick = showAddDividaForm;
    page.appendChild(btnAdd);

    const allArr = Array.isArray(dividas) ? dividas : [];
    // Filtrar apenas dívidas com saldo > 0 (não quitadas)
    const arr = allArr.filter(d => parseFloat(d.saldoAtual) > 0);
    if (arr.length === 0) {
      page.appendChild(document.createElement('div')).innerHTML = '<div class="notice">Nenhuma dívida pendente. Clique em "Adicionar Dívida" para começar ou verifique seus pagamentos.</div>';
    } else {
      page.appendChild(createTable(['Credor', 'Descrição', 'Saldo', 'Juros%', 'Parcela', 'Vencimento'],
          arr.map(d => {
            const vencDisplay = d.vencimento ? d.vencimento : (d.vencimentoMensal ? `Dia ${d.vencimentoMensal}` : '');
            return [d.credorNome, d.descricao, d.saldoAtual, d.taxaJurosAnual, d.parcelaMinima, vencDisplay];
          })));
    }
  } catch (e) {
    page.innerHTML = `<div class="notice">Erro: ${e.message}</div>`;
  }
}

// Render the user's plan
async function renderPagamentosUsuario() {
  page.innerHTML = '';
  page.appendChild(createLoading());
  try {
    const res = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}/ativas`);
    const debts = await res.json();
    page.innerHTML = '<h3>Simular ou Registrar Pagamento</h3>';
    if (debts.length === 0) {
      page.innerHTML += '<div class="notice">Nenhuma dívida pendente disponível. Adicione dívidas ou todas estão quitadas.</div>';
      return;
    }
    const form = document.createElement('div');
    form.innerHTML = `
      <div class="form-row">
        <select id="debt-select">
          <option value="">Selecione uma dívida</option>
          ${debts.map(d => `<option value="${d.id}">${d.descricao} - Dívida R$ ${d.saldoAtual}</option>`).join('')}
        </select>
      </div>
      <div class="form-row"><input id="valor-pagamento" placeholder="Valor do pagamento (ex: 100.00)" value="" type="number" step="0.01"></div>
      <div class="form-row"><input id="observacao-pagamento" placeholder="Observação" value=""></div>
      <div id="sim-result" style="margin-bottom: 10px;"></div>
      <button class="btn" id="sim-btn">Simular Pagamento</button>
      <button class="btn" id="pay-btn" style="margin-left: 10px;">Registrar Pagamento</button>
      <button class="btn secondary" id="cancel-btn">Cancelar</button>
    `;
    page.appendChild(form);
    document.getElementById('sim-btn').onclick = async () => {
      const dividaId = document.getElementById('debt-select').value;
      const valor = document.getElementById('valor-pagamento').value;
      if (!dividaId || !valor) {
        alert('Selecione uma dívida e valor');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/dividas/${dividaId}/simular-pagamento`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: valor })
        });
        const json = await res.json();
        const resultDiv = document.getElementById('sim-result');
        if (!res.ok) {
          resultDiv.innerHTML = `<div style="color: red;">Erro: ${json.erro}</div>`;
          return;
        }
        const novoSaldoVal = parseFloat(json.novoSaldo);
        const quitada = json.quitada ? 'Sim, dívida será quitada.' : 'Não, dívida remanescente: ' + formatCurrency(novoSaldoVal);
        resultDiv.innerHTML = `<div style="color: green;">Novo dívida: ${formatCurrency(novoSaldoVal)}. Quitada: ${quitada}</div>`;
      } catch(e) {
        alert('Erro: ' + e.message);
      }
    };
    document.getElementById('pay-btn').onclick = async () => {
      const dividaId = document.getElementById('debt-select').value;
      const valor = document.getElementById('valor-pagamento').value;
      const observacao = document.getElementById('observacao-pagamento').value || '';
      if (!dividaId || !valor) {
        alert('Selecione uma dívida e valor');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/pagamentos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ divida: { id: dividaId }, valor: valor, tipo: 'PARCIAL', observacao })
        });
        const json = await res.json();
        if (!res.ok) return alert(json.error || 'Erro');
        alert('Pagamento registrado!');
        renderPagamentosUsuario();
      } catch(e) {
        alert('Erro: ' + e.message);
      }
    };
    document.getElementById('cancel-btn').onclick = () => navigate('home');
  } catch(e) {
    page.innerHTML = `<div class="notice">Erro: ${e.message}</div>`;
  }
}

async function renderMeuPlano() {
  console.log('Rendering meu plano page');
  page.innerHTML = '';

  // Check if user is logged in
  if (!currentUser || !currentUser.id) {
    page.innerHTML = '<div class="notice">Você precisa estar logado para acessar seus planos.</div>';
    return;
  }

  // Check for existing debts
  let temDividas = false;
  try {
    console.log('Checking debts for user:', currentUser.id);
    const divRes = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}`);
    const dividas = await divRes.json();
    temDividas = Array.isArray(dividas) && dividas.length > 0;
    console.log('User has debts:', temDividas, 'count:', dividas.length);
  } catch (e) {
    console.log('Error checking debts:', e);
  }

  // Check for existing plans
  let existingPlan, existingChart, existingDetails;
  if (temDividas) {
    try {
      console.log('Checking for existing plans for user:', currentUser.id);
      const res = await fetch(`${API_BASE}/planos/usuario/${currentUser.id}`);
      const planos = await res.json();
      console.log('Plans response:', planos);
      if (Array.isArray(planos) && planos.length > 0) {
        existingPlan = planos[planos.length - 1];
        console.log('Existing plan:', existingPlan);
        console.log('Existing plan has grafico field:', existingPlan.grafico !== undefined);
        console.log('Existing plan grafico value:', existingPlan.grafico);
        if (existingPlan.grafico) {
          existingChart = JSON.parse(existingPlan.grafico);
          console.log('Existing chart loaded');
        }
        if (existingPlan.detalhes) {
          existingDetails = JSON.parse(existingPlan.detalhes);
          console.log('Existing details loaded');
        }
      } else {
        console.log('No existing plans found');
      }
    } catch (e) {
      console.log('No existing plans error:', e);
    }
  }

  const container = document.createElement('div');
  if (!temDividas) {
    container.innerHTML = `
      <h3>Meu Plano de Quitação</h3>
      <div class="notice">
        Você precisa adicionar pelo menos uma dívida antes de gerar um plano.
        Vá para "Minhas Dívidas" para começar.
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="page-header-section">
        <h3 class="page-main-heading">
          <i class="ri-file-chart-line"></i>
          Gerar Meu Plano de Quitação
        </h3>
        <p class="page-intro-text">
          <i class="ri-cash-line" style="margin-right: 0.5rem; color: var(--primary);"></i>
          Insira quanto você pode pagar mensalmente e escolha a estratégia para simular seu plano.
          <br>
          <i class="ri-bar-chart-line" style="margin-right: 0.5rem; margin-top: 1rem; color: var(--secondary);"></i>
          Nosso simulador ajudará você a visualizar o caminho para quitar suas dívidas de forma eficiente e organizada.
        </p>
      </div>
      <div class="form-row">
        <input id="valor-mensal" type="number" step="0.01" placeholder="Valor mensal disponível (ex: 500.00)">
        <select id="estrategia">
          <option value="AVALANCHE">Avalanche (Maior juros primeiro)</option>
          <option value="SNOWBALL">Snowball (Menor saldo primeiro)</option>
        </select>
      <button class="btn" id="gerar-plano-btn">Gerar Plano</button>
    </div>

    ${existingPlan ? `
      <div id="existing-plan-section">
        <h4>Plano Existente (Último Plano)</h4>
        ${existingChart ? `<div id="saved-chart" style="display: flex; flex-wrap: wrap; gap: 20px;"></div>` : ''}
      </div>` : ''}

      <div id="plano-resultado" style="display: none;">
        <h4>Resultado do Plano</h4>
        <div id="plano-charts" style="display: flex; flex-wrap: wrap; gap: 20px;"></div>
      </div>
    `;
  }

  page.appendChild(container);

  // Render saved chart and table if existing
  if (existingChart && existingPlan) {
    await renderSavedChart(existingChart);
    // Add instructions to existing plan chart
    const savedChartEl = document.getElementById('saved-chart');
    if (savedChartEl) {
      const instructionsDiv = document.createElement('div');
      instructionsDiv.innerHTML = await createPaymentInstructions(existingPlan, existingDetails);
      savedChartEl.insertBefore(instructionsDiv, savedChartEl.firstChild);
    }
  }
  // if (existingDetails && existingPlan) {
  //   renderPlanoTable({ ...existingPlan }, existingDetails);
  // }

  // Add event listener for generate button only if there are debts - delayed to ensure DOM rendering
  if (temDividas) {
    setTimeout(() => {
      const btn = document.getElementById('gerar-plano-btn');
      if (btn) {
        console.log('Gerar Plano button found, attaching event listener');
        btn.onclick = async () => {
          console.log('Gerar Plano button clicked');
          const valorInput = document.getElementById('valor-mensal');
          const estrategiaSelect = document.getElementById('estrategia');

          if (!valorInput || !estrategiaSelect) {
            console.error('Required form elements not found');
            alert('Erro no formulário. Recarregue a página.');
            return;
          }

          const valor = parseFloat(valorInput.value);
          const estrategia = estrategiaSelect.value;

          if (!valor || valor <= 0) {
            alert('Por favor, insira um valor mensal válido.');
            return;
          }

          try {
            const resultDiv = document.getElementById('plano-resultado');
            if (resultDiv) {
              resultDiv.style.display = 'block';
            }

            // Generate new plan - send valor as string for BigDecimal compatibility
            const payload = {
              usuarioId: currentUser.id,
              valorDisponivelMensal: valor.toString(),  // Send as string for BigDecimal
              estrategia: estrategia
            };
            console.log('Sending payload:', payload); // Debug log

            console.log('About to fetch:', `${API_BASE}/planos/generate`);
            const res = await fetch(`${API_BASE}/planos/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            console.log('Fetch response status:', res.status);
            const json = await res.json();
            console.log('Response JSON:', json);

            if (!res.ok) {
              alert('Erro ao gerar plano: ' + (json.error || 'Erro desconhecido'));
              return;
            }

            // Parse details
            let detalhes;
            try {
              detalhes = JSON.parse(json.detalhes);
            } catch (e) {
              console.error('Error parsing detalhes:', e);
              detalhes = [];
            }

            // Render chart and table - replace existing content if present
            if (existingPlan) {
              // Update summary text in existing-plan-section and re-render charts/table inside it
              const existingPlanSection = document.getElementById('existing-plan-section');
              if (existingPlanSection) {
                existingPlanSection.innerHTML = `
                  <h4>Plano (Atualizado)</h4>
                  <div id="saved-chart" style="display: flex; flex-wrap: wrap; gap: 20px;"></div>
                  <div id="saved-table"></div>
                `;
                // Render in the new elements
                const newSavedChart = document.getElementById('saved-chart');
                await renderPlanoChartInContainer(json, detalhes, newSavedChart);
                const newSavedTable = document.getElementById('saved-table');
                // renderPlanoTableContent(json, detalhes, newSavedTable);
                // Add instructions to saved chart
                const instructionsDiv = document.createElement('div');
                instructionsDiv.innerHTML = await createPaymentInstructions(json, detalhes);
                newSavedChart.insertBefore(instructionsDiv, newSavedChart.firstChild);
              }
            } else {
              // First time generating, use plano-resultado section
              const resultDiv = document.getElementById('plano-resultado');
              if (resultDiv) {
                resultDiv.style.display = 'block';
              }
              await renderPlanoChart(json, detalhes);
              // renderPlanoTable(json, detalhes);
            }

            console.log('Plan generation completed successfully');

          } catch (e) {
            console.error('Error in plan generation:', e);
            alert('Erro: ' + e.message);
          }
        };
      } else {
        console.error('Gerar Plano button not found in DOM');
      }
    }, 100); // Small delay to ensure DOM is fully rendered
  }
}

const chartColors = [
  'rgb(255, 99, 132)',   // red
  'rgb(54, 162, 235)',   // blue
  'rgb(255, 205, 86)',   // yellow
  'rgb(75, 192, 192)',   // green
  'rgb(153, 102, 255)',  // purple
  'rgb(255, 159, 64)',   // orange
  'rgb(231, 233, 237)',  // grey
  'rgb(199, 199, 199)',  // light grey
  'rgb(83, 102, 255)',   // light blue
  'rgb(255, 99, 255)'    // pink
];

function getChartColor(index) {
  return chartColors[index % chartColors.length];
}

async function createPaymentInstructions(plano, detalhes) {
  const estrategia = plano.estrategia;
  const estrategiaNome = estrategia === 'AVALANCHE' ? 'Avalanche (maior juros primeiro)' : 'Snowball (menor saldo primeiro)';

  // Fetch original debt amounts from API (before any payments) - only active debts
  let originalDebts = [];
  if (currentUser && currentUser.id) {
    try {
      const res = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}/ativas`);
      const dividas = await res.json();
      originalDebts = Array.isArray(dividas) ? dividas : [];
    } catch (e) {
      console.error('Error fetching original debts:', e);
    }
  }

  // Create map of original debts
  const debtsMap = {};
  originalDebts.forEach(debt => {
    if (debt && debt.id) {
      debtsMap[debt.id] = {
        id: debt.id,
        descricao: debt.descricao || 'Dívida ' + debt.id,
        saldo: debt.saldoAtual || 0,
        taxa: debt.taxaJurosAnual || 0
      };
    }
  });

  const debts = Object.values(debtsMap);
  // Determine payoff months for each debt from `detalhes` if available
  const payoffMap = {}; // id -> month number when saldo becomes zero
  if (Array.isArray(detalhes)) {
    detalhes.forEach((monthObj, idx) => {
      const monthNumber = monthObj && monthObj.mes !== undefined ? Number(monthObj.mes) : (idx + 1);
      const monthDividas = (monthObj && monthObj.dividas) || [];
      monthDividas.forEach(dbt => {
        const id = dbt && dbt.id;
        const saldoVal = Number(dbt && dbt.saldo) || 0;
        if (id !== undefined && payoffMap[id] === undefined && saldoVal === 0) {
          payoffMap[id] = monthNumber;
        }
      });
    });
  }
  // Sort debts based on strategy
  if (estrategia === 'AVALANCHE') {
    debts.sort((a, b) => b.taxa - a.taxa); // Higher interest first
  } else { // SNOWBALL
    debts.sort((a, b) => a.saldo - b.saldo); // Lower balance first
  }

  let debtOrderHtml = `<div class="debt-priority-section">
    <h5 class="debt-priority-title">Ordem de prioridade das dívidas</h5>
    <ol class="debt-priority-list">`;

  debts.forEach((debt, index) => {
    const jurosMensaisVal = (parseFloat(debt.saldo) * parseFloat(debt.taxa) / 100 / 12);
    const jurosMensais = jurosMensaisVal.toFixed(0);
    let motivo = '';

    if (estrategia === 'AVALANCHE') {
      if (index === 0) {
        motivo = `taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano, gera cerca de ${formatCurrency(jurosMensaisVal)} por mês. É a dívida que mais cresce e causa o maior impacto no total de juros.`;
      } else if (index === 1) {
        motivo = `taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano, gera cerca de ${formatCurrency(jurosMensaisVal)} por mês. Apesar do saldo maior, o custo mensal de juros é menor que o da primeira dívida, então fica em segundo.`;
      } else {
        motivo = `taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano, juros mensais na faixa de ${formatCurrency(jurosMensaisVal)}. Não cresce tão rápido quanto as anteriores, então só entra na fila depois que eles forem eliminados.`;
      }
    } else { // SNOWBALL
      if (index === 0) {
        motivo = `saldo menor (${formatCurrency(parseFloat(debt.saldo))}), taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano. Estratégia Snowball prioriza quitar primeiro as dívidas menores para criar motivação com vitórias rápidas.`;
      } else if (index === 1) {
        motivo = `saldo médio (${formatCurrency(parseFloat(debt.saldo))}), taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano. Menor que as anteriores, mas depois de quitar a primeira.`;
      } else {
        motivo = `saldo maior (${formatCurrency(parseFloat(debt.saldo))}), taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano. Mesmo com saldo grande, fica por último para manter o foco nas dívidas menores primeiro.`;
      }
    }

    // Determine payoff description
    const payoffMonth = payoffMap[debt.id];
    let payoffHtml = '';
    if (payoffMonth) {
      const monthsAhead = payoffMonth; // months are stored as 1-based month number
      payoffHtml = `<div class="debt-eta" style="margin-top:6px;color:#0ea5a4;"><strong>Previsão de quitação:</strong> Mês ${payoffMonth} (aprox. ${monthsAhead} ${monthsAhead === 1 ? 'mês' : 'meses'})</div>`;
    } else {
      payoffHtml = `<div class="debt-eta" style="margin-top:6px;color:#6b7280;"><strong>Previsão de quitação:</strong> não prevista nos dados do plano</div>`;
    }

    debtOrderHtml += `<li class="debt-priority-item">
      <div class="debt-name"><strong>${debt.descricao}</strong>. Saldo ${formatCurrency(parseFloat(debt.saldo))}</div>
      <div class="debt-reason"><strong>Motivo:</strong> ${motivo}</div>
      ${payoffHtml}
    </li>`;
  });
  debtOrderHtml += `</ol></div>`;

  let instructions = `<div class="payment-instructions-modern">
    <div class="instructions-header">
      <i class="ri-guide-line"></i>
      <h4 class="instructions-title">Como pagar a dívida da maneira mais eficiente</h4>
    </div>

    <div class="strategy-info">
      <div class="strategy-label">Estratégia utilizada:</div>
      <div class="strategy-value">${estrategiaNome}</div>
    </div>

    <div class="strategy-description">
      Esta estratégia recomenda que você siga esta ordem de prioridade:
    </div>

    ${debtOrderHtml}

    <div class="execution-section">
      <h5 class="execution-title">Como executar o plano:</h5>
      <ul class="execution-steps">
        <li class="execution-step">
          <i class="ri-wallet-line"></i>
          <span>Use o valor mensal disponível (<strong>${formatCurrency(parseFloat(plano.valorDisponivelMensal))}</strong>) para pagamentos</span>
        </li>
        <li class="execution-step">
          <i class="ri-arrow-right-circle-line"></i>
          <span>Após quitar uma dívida, direcione o valor adicional para as próximas da lista</span>
        </li>
        <li class="execution-step">
          <i class="ri-bar-chart-line"></i>
          <span>O gráfico abaixo mostra a projeção de quitação ao longo dos meses</span>
        </li>
      </ul>
    </div>

    <div class="results-summary">
      ${plano.duracaoEstimadaMeses ? `
        <div class="result-item">
          <div class="result-label">Duração estimada:</div>
          <div class="result-value duration">${plano.duracaoEstimadaMeses} meses</div>
        </div>
      ` : ''}
      ${plano.totalPagoEstimado ? `
        <div class="result-item">
          <div class="result-label">Total pago estimado:</div>
              <div class="result-value total">${formatCurrency(parseFloat(plano.totalPagoEstimado))}</div>
        </div>
      ` : ''}
      ${plano.custoTotalJuros ? `
        <div class="result-item">
          <div class="result-label">Total de juros pagos:</div>
          <div class="result-value interest">${formatCurrency(parseFloat(plano.custoTotalJuros))}</div>
        </div>
      ` : ''}
    </div>
  </div>`;

  return instructions;
}

async function renderSavedChart(graficoData) {
  const chartsContainer = document.getElementById('saved-chart');
  chartsContainer.innerHTML = ''; // Clear any existing charts

  // Fetch initial balances
  const initialBalances = {};
  if (currentUser && currentUser.id) {
    try {
      const res = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}`);
      const dividas = await res.json();
      dividas.forEach(d => {
        if (d && d.id !== undefined) {
          initialBalances[d.id] = d.saldoAtual;
        }
      });
    } catch (e) {
      console.error('Error fetching initial balances:', e);
    }
  }

  const debts = graficoData.debts || [];

  let colorIndex = 0;
  debts.forEach(debt => {
    const chartDiv = document.createElement('div');
    chartDiv.style.flex = '1 1 45%';
    chartDiv.style.minWidth = '400px';
    chartDiv.style.height = '260px';

    const title = document.createElement('h5');
    title.textContent = debt.descricao || debt.id;
    chartDiv.appendChild(title);

    const canvas = document.createElement('canvas');
    canvas.width = '400';
    canvas.height = '200';
    canvas.style.width = '100%';
    canvas.style.height = '220px';
    chartDiv.appendChild(canvas);

    chartsContainer.appendChild(chartDiv);

    // Prepend initial balance to data and ensure final zero month exists
    const initial = initialBalances[debt.id] || 0;
    const data = [initial].concat(debt.balances || []).map(v => Number(v) || 0);
    // If last point isn't zero, append a zero month so chart clearly reaches 0
    if (data.length === 0 || data[data.length - 1] !== 0) {
      data.push(0);
    }
    // Build labels to match data length (user-friendly months starting at 1)
    const labelsForChart = data.map((_, idx) => `Mês ${idx + 1}`);

    (function() {
      const ctx = canvas.getContext('2d');
      const color = getChartColor(colorIndex);
      const gradient = createGradient(ctx, color);
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labelsForChart,
          datasets: [{
            label: debt.descricao || debt.id,
            data: data,
            borderColor: color,
            backgroundColor: gradient,
            tension: 0.36,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            borderWidth: 2
          }]
        },
        options: Object.assign({}, commonChartOptions, {
          scales: {
            x: { title: { display: true, text: 'Meses' }, grid: { display: false } },
            y: { beginAtZero: false, title: { display: true, text: 'Saldo Remanescente (R$)' }, ticks: { callback: function(value){ return formatCurrency(value); } }, grid: { color: 'rgba(200,200,200,0.08)' } }
          },
          plugins: Object.assign({}, commonChartOptions.plugins, {
            tooltip: { callbacks: { label: function(context) { return 'Saldo: ' + formatCurrency(context.parsed.y); } } }
          })
        })
      });
    })();
    colorIndex++;
  });
}

async function renderPlanoChart(plano, detalhes) {
  const chartsContainer = document.getElementById('plano-charts');
  chartsContainer.innerHTML = ''; // Clear any existing charts

  // Add payment instructions before charts
  const instructionsDiv = document.createElement('div');
  instructionsDiv.innerHTML = await createPaymentInstructions(plano, detalhes);
  chartsContainer.appendChild(instructionsDiv);

  // Fetch initial balances
  const initialBalances = {};
  if (currentUser && currentUser.id) {
    try {
      const res = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}`);
      const dividas = await res.json();
      dividas.forEach(d => {
        if (d && d.id !== undefined) {
          initialBalances[d.id] = d.saldoAtual;
        }
      });
    } catch (e) {
      console.error('Error fetching initial balances:', e);
    }
  }

  // Collect balance data across months for each debt
  const balanceMap = {}; // id -> {descricao, balances: [month1_balance, ...]}

  detalhes.forEach(d => {
    const dividas = d.dividas || [];
    dividas.forEach(debt => {
      const id = debt.id;
      if (!balanceMap[id]) {
        balanceMap[id] = { descricao: debt.descricao, balances: [] };
      }
      balanceMap[id].balances.push(debt.saldo);
    });
  });


  // Prepend initial balances and normalize numbers
  Object.keys(balanceMap).forEach(id => {
    const initial = initialBalances[id] || 0;
    balanceMap[id].balances = [initial].concat(balanceMap[id].balances).map(v => Number(v) || 0);
    // Ensure each balance series explicitly ends with a zero month for visual clarity
    if (balanceMap[id].balances.length === 0 || balanceMap[id].balances[balanceMap[id].balances.length - 1] !== 0) {
      balanceMap[id].balances.push(0);
    }
  });

  // Create a separate chart for each debt
  let colorIndex = 0;
  Object.values(balanceMap).forEach(debt => {
    // Create chart container
    const chartDiv = document.createElement('div');
    chartDiv.style.flex = '1 1 45%';
    chartDiv.style.minWidth = '400px';

    const title = document.createElement('h5');
    title.textContent = debt.descricao;
    chartDiv.appendChild(title);

    const canvas = document.createElement('canvas');
    canvas.width = '400';
    canvas.height = '200';
    chartDiv.appendChild(canvas);

    chartsContainer.appendChild(chartDiv);

    // Create individual chart (modern style)
    (function(){
      const ctx = canvas.getContext('2d');
      const color = getChartColor(colorIndex);
      const gradient = createGradient(ctx, color);
      const labelsForChart = debt.balances.map((_, idx) => `Mês ${idx + 1}`);
      new Chart(ctx, {
        type: 'line',
        data: { labels: labelsForChart, datasets: [{ label: debt.descricao, data: debt.balances, borderColor: color, backgroundColor: gradient, tension: 0.36, fill: true, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2 }] },
        options: Object.assign({}, commonChartOptions, {
          scales: { x: { title: { display: true, text: 'Meses' }, grid: { display: false } }, y: { beginAtZero: false, title: { display: true, text: 'Saldo Remanescente (R$)' }, ticks: { callback: function(v){ return formatCurrency(v); } }, grid: { color: 'rgba(200,200,200,0.08)' } } },
          plugins: Object.assign({}, commonChartOptions.plugins, { tooltip: { callbacks: { label: function(context){ return 'Saldo: ' + formatCurrency(context.parsed.y); } } }, legend: { display: true } })
        })
      });
    })();

    colorIndex++;
  });
}

function renderPlanoTable(plano, detalhes) {
  const tableContainer = document.getElementById('plano-table');
  tableContainer.innerHTML = '';

  renderPlanoTableContent(plano, detalhes, tableContainer);
}

function renderPlanoTableContent(plano, detalhes, tableContainer) {
  // Detailed table
  if (Array.isArray(detalhes) && detalhes.length > 0) {
    const headers = ['Mês', 'Saldo Inicial', 'Juros', 'Parcela', 'Pagamento Extra', 'Pagamento Total', 'Saldo Final'];
    let cumulativeTotal = 0;
    const rows = detalhes.slice(0, 20).map(d => { // Limit to first 20 months
      const resumo = d.resumo || {};
      const saldoFinal = resumo.saldoRestanteTotal || 0;
      const juros = resumo.jurosDoMes || 0;
      const pagoNoMes = resumo.pagoNoMes || 0;
      const saldoInicial = saldoFinal - juros + pagoNoMes;
      const parcela = resumo.minimaPagoDoMes || 0;
      const pagamentoExtra = resumo.extraPagoDoMes || 0;
      cumulativeTotal += parcela + pagamentoExtra;
      const pagamentoTotal = cumulativeTotal;
      return [
        d.mes,
        formatCurrency(saldoInicial),
        formatCurrency(juros),
        formatCurrency(parcela),
        formatCurrency(pagamentoExtra),
        formatCurrency(pagamentoTotal),
        formatCurrency(saldoFinal)
      ];
    });
    tableContainer.appendChild(createTable(headers, rows));

    if (detalhes.length > 20) {
      const moreNote = document.createElement('p');
      moreNote.textContent = `... e mais ${detalhes.length - 20} meses.`;
      tableContainer.appendChild(moreNote);
    }
  } else {
    tableContainer.appendChild(document.createElement('p')).textContent = 'Detalhes não disponíveis.';
  }
}

async function renderPlanoChartInContainer(plano, detalhes, container) {
  // Fetch initial balances
  const initialBalances = {};
  if (currentUser && currentUser.id) {
    try {
      const res = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}`);
      const dividas = await res.json();
      dividas.forEach(d => {
        if (d && d.id !== undefined) {
          initialBalances[d.id] = d.saldoAtual;
        }
      });
    } catch (e) {
      console.error('Error fetching initial balances:', e);
    }
  }

  // Collect balance data across months for each debt
  const balanceMap = {}; // id -> {descricao, balances: [month1_balance, ...]}

  detalhes.forEach(d => {
    const dividas = d.dividas || [];
    dividas.forEach(debt => {
      const id = debt.id;
      if (!balanceMap[id]) {
        balanceMap[id] = { descricao: debt.descricao, balances: [] };
      }
      balanceMap[id].balances.push(debt.saldo);
    });
  });

  // Prepend initial balances
  Object.keys(balanceMap).forEach(id => {
    const initial = initialBalances[id] || 0;
    balanceMap[id].balances = [initial].concat(balanceMap[id].balances);
  });

  const labels = detalhes.map((_, idx) => `Mês ${idx}`); // Start from 0

  // Create a separate chart for each debt
  let colorIndex = 0;
  Object.values(balanceMap).forEach(debt => {
    // Create chart container
    const chartDiv = document.createElement('div');
    chartDiv.style.flex = '1 1 45%';
    chartDiv.style.minWidth = '400px';

    const title = document.createElement('h5');
    title.textContent = debt.descricao;
    chartDiv.appendChild(title);

    const canvas = document.createElement('canvas');
    canvas.width = '400';
    canvas.height = '200';
    chartDiv.appendChild(canvas);

    container.appendChild(chartDiv);

    // Create individual chart in container (modern style)
    (function(){
      const ctx = canvas.getContext('2d');
      const color = getChartColor(colorIndex);
      const gradient = createGradient(ctx, color);
      const labelsForChart = debt.balances.map((_, idx) => `Mês ${idx + 1}`);
      new Chart(ctx, {
        type: 'line',
        data: { labels: labelsForChart, datasets: [{ label: debt.descricao, data: debt.balances, borderColor: color, backgroundColor: gradient, tension: 0.36, fill: true, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2 }] },
        options: Object.assign({}, commonChartOptions, {
          scales: { x: { title: { display: true, text: 'Meses' }, grid: { display: false } }, y: { beginAtZero: false, title: { display: true, text: 'Saldo Remanescente (R$)' }, ticks: { callback: function(v){ return formatCurrency(v); } }, grid: { color: 'rgba(200,200,200,0.08)' } } },
          plugins: Object.assign({}, commonChartOptions.plugins, { tooltip: { callbacks: { label: function(context){ return 'Saldo: ' + formatCurrency(context.parsed.y); } } }, legend: { display: true } })
        })
      });
    })();

    colorIndex++;
  });
}

function showAddDividaForm() {
  showDividaFormUser(null, currentUser.id);
}

function showDividaFormUser(dividaId, usuarioId) {
  page.innerHTML = '';
  editingDividaId = dividaId || null;
  const isEditing = editingDividaId !== null;
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row"><input id="d-credor-nome" placeholder="Nome do Credor" value=""></div>
    <div class="form-row"><input id="d-descricao" placeholder="Descrição da Dívida" value=""></div>
    <div class="form-row"><input id="d-saldo" placeholder="Saldo Atual (ex: 1500.00)" value="" type="number" step="0.01"></div>
    <div class="form-row"><input id="d-taxa" placeholder="Taxa de Juros Anual (ex: 10.00)" value="" type="number" step="0.01"><input id="d-parcela" placeholder="Parcela Mínima (ex: 50.00)" value="" type="number" step="0.01"></div>
    <div class="form-row"><input id="d-venc" placeholder="Dia de Vencimento (1-28)" value="" type="number" min="1" max="28"></div>
    <button class="btn" id="d-save">${isEditing ? 'Atualizar' : 'Salvar'}</button>
    <button class="btn secondary" id="d-cancel">Cancelar</button>
  `;
  page.appendChild(form);
  document.getElementById('d-save').onclick = async () => {
    const credorNome = document.getElementById('d-credor-nome').value.trim();
    const descricao = document.getElementById('d-descricao').value.trim();
    const saldoAtual = parseFloat(document.getElementById('d-saldo').value);
    const taxaJurosAnual = parseFloat(document.getElementById('d-taxa').value);
    const parcelaMinima = parseFloat(document.getElementById('d-parcela').value);
    const vencimentoMensal = parseInt(document.getElementById('d-venc').value);

    if (!credorNome || !descricao || !saldoAtual || taxaJurosAnual < 0 || !parcelaMinima || !vencimentoMensal) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      // Create credor (or reuse existing with same name if it exists)
      let credor;
      const credorPost = await fetch(`${API_BASE}/credores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: credorNome, contato: '' })
      });
      if (credorPost.ok) {
        credor = await credorPost.json();
      } else {
        alert('Erro ao criar credor');
        return;
      }

      const payload = {
        usuario: { id: usuarioId },
        credor: { id: credor.id },
        descricao,
        saldoAtual,
        taxaJurosAnual,
        parcelaMinima,
        vencimentoMensal
      };

      if (isEditing) {
        const res = await fetch(`${API_BASE}/dividas/${editingDividaId}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if (!res.ok) return alert('Erro ao atualizar dívida');
        alert('Dívida atualizada!');
      } else {
        const res = await fetch(`${API_BASE}/dividas`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const json = await res.json();
        if (!res.ok) return alert('Erro ao criar dívida');
        alert('Dívida criada!');
      }
      renderMinhasDividas();
    } catch(e){ alert('Erro: ' + e.message) }
  };
  document.getElementById('d-cancel').onclick = renderMinhasDividas;
}
