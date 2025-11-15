const API_BASE = 'http://localhost:8080/api';

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

  if (!nome) return alert('Informe seu nome');
  if (!rendaMensal || rendaMensal <= 0) return alert('Informe uma renda mensal válida');

  try {
    const res = await fetch(`${API_BASE}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, rendaMensal })
    });

    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Erro ao criar conta');

    // Store credentials locally
    localStorage.setItem(`user_${email}`, JSON.stringify({ email, senha }));

    alert('Conta criada com sucesso! Faça login com seu email.');
    closeSignupModal();
    document.getElementById('auth-screen').style.display = 'flex';
  } catch (e) {
    alert('Erro: ' + e.message);
  }
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
    const rows = data.map(d => [
      d.id,
      d.usuarioNome,
      d.credorNome,
      d.descricao,
      d.saldoAtual,
      d.taxaJurosAnual,
      d.parcelaMinima,
      d.vencimentoMensal,
      `<button class="btn small" onclick="editDivida(${d.id}, ${d.usuarioId || (d.usuario && d.usuario.id)}, ${d.credorId || (d.credor && d.credor.id)}, '${d.descricao}', ${d.saldoAtual}, ${d.taxaJurosAnual}, ${d.parcelaMinima}, ${d.vencimentoMensal})">Editar</button> ` +
      `<button class="btn secondary small" onclick="deleteDivida(${d.id}, '${d.descricao}')">Excluir</button>`
    ]);
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
    <div class="small">Você precisa já ter ` +
    `usuarios e credores criados. Use seus ids abaixo.</div>
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
      renderDividas();
    } catch(e){ alert(e.message) }
  };
  document.getElementById('d-cancel').onclick = renderDividas;
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
    <button class="btn" id="p-save">${isEditing ? 'Atualizar' : 'Registrar'}</button>
    <button class="btn secondary" id="p-cancel">Cancelar</button>
  `;
  page.appendChild(form);
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

// Add event listeners after DOM loads
document.addEventListener('DOMContentLoaded', function() {
  // Landing page event listeners
  const signupLink = document.getElementById('btn-signup-link');
  if (signupLink) {
    signupLink.addEventListener('click', showSignupModal);
  }

  // App functionality event listeners
  const btnDev = document.getElementById('btn-dev');
  const btnLogin = document.getElementById('btn-login');
  const logoutBtn = document.getElementById('logout-btn');

  if (btnDev) btnDev.addEventListener('click', () => {
    currentMode = 'dev';
    currentUser = { id: 'admin', nome: 'Administrador (Dev)', email: 'dev@local' };
    showMainScreen();
  });

  if (btnLogin) btnLogin.addEventListener('click', async () => {
    await loginUser();
  });

  if (logoutBtn) logoutBtn.addEventListener('click', logout);
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
    showMainScreen();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

function logout() {
  currentUser = null;
  currentMode = null;
  document.getElementById('main-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
}

function showMainScreen() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-screen').style.display = 'block';

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

  if (currentMode === 'dev') {
    setupDevMenu();
  } else {
    setupUserMenu();
  }

  navigate('home');
}

function setupDevMenu() {
  navMenu.innerHTML = `
    <button onclick="navigate('home')">Menu</button>
    <button onclick="navigate('usuarios')">Usuários</button>
    <button onclick="navigate('credores')">Credores</button>
    <button onclick="navigate('dividas')">Dívidas</button>
    <button onclick="navigate('pagamentos')">Pagamentos</button>
    <button onclick="navigate('plano')">Gerar Plano</button>
  `;
}

function setupUserMenu() {
  navMenu.innerHTML = `
    <button onclick="navigate('home')">Dashboard</button>
    <button onclick="navigate('minhas-dividas')">Minhas Dívidas</button>
    <button onclick="navigate('plano-usuario')">Meu Plano</button>
  `;
}

function navigate(route) {
  page.innerHTML = '';

  if (currentMode === 'dev') {
    pageTitle.textContent = ({home:'Menu Dev',usuarios:'Usuários',credores:'Credores',dividas:'Dívidas',pagamentos:'Pagamentos',plano:'Gerar Plano'}[route] || 'Menu');
    if (route === 'home') return renderDevHome();
    if (route === 'usuarios') return renderUsuarios();
    if (route === 'credores') return renderCredores();
    if (route === 'dividas') return renderDividas();
    if (route === 'pagamentos') return renderPagamentos();
    if (route === 'plano') return renderGerarPlano();
  } else {
    pageTitle.textContent = ({home:'Dashboard','minhas-dividas':'Minhas Dívidas','plano-usuario':'Meu Plano'}[route] || 'Dashboard');
    if (route === 'home') return renderUserDashboard();
    if (route === 'minhas-dividas') return renderMinhasDividas();
    if (route === 'plano-usuario') return renderMeuPlano();
  }
}

function renderDevHome() {
  page.innerHTML = `
    <div class="notice">Bem-vindo ao modo Dev (Admin) do Microplan. Use o menu à esquerda para gerenciar todos os dados.</div>
    <div class="small">Modo: DESENVOLVIMENTO - Acesso total a todos os recursos.</div>
  `;
}

function renderUserDashboard() {
  page.innerHTML = '<div class="notice">Carregando...</div>';
  loadUserDashboard();
}

async function loadUserDashboard() {
  try {
    const divRes = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}`);
    const dividas = await divRes.json();

    const arr = Array.isArray(dividas) ? dividas : [];
    const totalSaldo = arr.reduce((s, d) => s + (parseFloat(d.saldoAtual) || 0), 0);

    const userCard = `
      <div class="dashboard-section">
        <h3>Informações Pessoais</h3>
        <p><strong>Nome:</strong> ${currentUser.nome}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Renda Mensal:</strong> R$ ${currentUser.rendaMensal || 'N/A'}</p>
      </div>
    `;

    const debtsCard = `
      <div class="dashboard-section">
        <h3>Resumo Dívidas</h3>
        <p><strong>Total de Dívidas:</strong> ${arr.length}</p>
        <p><strong>Saldo Total:</strong> R$ ${totalSaldo.toFixed(2)}</p>
        ${arr.length > 0 ? createTable(['Credor', 'Descrição', 'Saldo', 'Juros%'], arr.map(d => [d.credorNome, d.descricao, d.saldoAtual, d.taxaJurosAnual])).outerHTML : ''}
      </div>
    `;

    page.innerHTML = userCard + debtsCard;
  } catch (e) {
    page.innerHTML = `<div class="notice">Erro: ${e.message}</div>`;
  }
}

function createLoading() {
  const d = document.createElement('div');
  d.className='notice';
  d.textContent='Carregando...';
  return d;
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
    const res = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}`);
    const dividas = await res.json();

    page.innerHTML = '';

    const btnAdd = document.createElement('button');
    btnAdd.className='btn btn-primary';
    btnAdd.textContent='Adicionar Dívida';
    btnAdd.style.marginBottom = '15px';
    btnAdd.onclick = showAddDividaForm;
    page.appendChild(btnAdd);

    const arr = Array.isArray(dividas) ? dividas : [];
    if (arr.length === 0) {
      page.appendChild(document.createElement('div')).innerHTML = '<div class="notice">Nenhuma dívida registrada. Clique em "Adicionar Dívida" para começar.</div>';
    } else {
      page.appendChild(createTable(['Credor', 'Descrição', 'Saldo', 'Juros%', 'Parcela', 'Vencimento'],
        arr.map(d => [d.credorNome, d.descricao, d.saldoAtual, d.taxaJurosAnual, d.parcelaMinima, d.vencimentoMensal])));
    }
  } catch (e) {
    page.innerHTML = `<div class="notice">Erro: ${e.message}</div>`;
  }
}

// This is a placeholder - the actual renderMeuPlano is in the static app.js
function renderMeuPlano() {
  page.innerHTML = '<div class="notice">Funcionalidade de plano disponível no aplicativo principal.</div>';
}
