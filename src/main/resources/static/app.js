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
  if (window.location.pathname === '/login' || window.location.pathname === '/login.html') {
    // Setup for login page
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
      window.location.href = '/login.html';
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
      window.location.href = '/login';
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
    // First try API
    let user;
    try {
      const res = await fetch(`${API_BASE}/usuarios`);
      const data = await res.json();
      const usuarios = data.content || data;

      if (Array.isArray(usuarios)) {
        user = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
      }
    } catch (apiError) {
      // API failed, use fake user for testing
    }

    // If user not found, check stored credentials and create user in database
    if (!user) {
      // Check if we have stored credentials from signup
      const stored = localStorage.getItem(`user_${email}`);
      if (!stored || JSON.parse(stored).senha !== senha) {
        alert('Stored credentials failed. Use the cadastro first.');
        return;
      }

      // Create user in database using the stored signup data
      const storedData = JSON.parse(stored);
      try {
        const createRes = await fetch(`${API_BASE}/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: email.split('@')[0], // Use email prefix as name, or could be enhanced to store full name
            email: email,
            rendaMensal: null // Could be enhanced to store this too
          })
        });
        if (createRes.ok) {
          user = await createRes.json();
        } else {
          alert('Erro ao criar usuário na base de dados');
          return;
        }
      } catch (createError) {
        alert('Erro ao conectar com o servidor para criar usuário');
        return;
      }
    } else {
      // If user found from API, still check stored credentials
      const stored = localStorage.getItem(`user_${email}`);
      if (!stored || JSON.parse(stored).senha !== senha) {
        alert('Credenciais incorretas');
        return;
      }
    }

    // Set session and redirect to app
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
  window.location.href = '/login.html';
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
    <button onclick="navigate('plano-usuario')">
      <i class="ri-file-chart-line"></i>
      Meu Plano
    </button>
  `;
}

function navigate(route) {
  page.innerHTML = '';
  pageTitle.textContent = ({home:'Dashboard','minhas-dividas':'Minhas Dívidas','plano-usuario':'Meu Plano'}[route] || 'Dashboard');
  if (route === 'home') return renderUserDashboard();
  if (route === 'minhas-dividas') return renderMinhasDividas();
  if (route === 'plano-usuario') return renderMeuPlano();
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

// Render the user's plan
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
      <h3>Gerar Meu Plano de Quitação</h3>
      <p>Insira quanto você pode pagar mensalmente e escolha a estratégia para simular seu plano:</p>
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
        ${existingDetails ? `<div id="saved-table"></div>` : ''}
      </div>` : ''}

      <div id="plano-resultado" style="display: none;">
        <h4>Resultado do Plano</h4>
        <div id="plano-charts" style="display: flex; flex-wrap: wrap; gap: 20px;"></div>
        <div id="plano-table"></div>
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
  if (existingDetails && existingPlan) {
    renderPlanoTable({ ...existingPlan }, existingDetails);
  }

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
                renderPlanoTableContent(json, detalhes, newSavedTable);
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
              renderPlanoTable(json, detalhes);
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

  // Fetch original debt amounts from API (before any payments)
  let originalDebts = [];
  if (currentUser && currentUser.id) {
    try {
      const res = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}`);
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
  // Sort debts based on strategy
  if (estrategia === 'AVALANCHE') {
    debts.sort((a, b) => b.taxa - a.taxa); // Higher interest first
  } else { // SNOWBALL
    debts.sort((a, b) => a.saldo - b.saldo); // Lower balance first
  }

  let debtOrderHtml = `<h5 style="margin-top: 15px; margin-bottom: 10px;">Ordem de prioridade das dívidas</h5><ol>`;
  debts.forEach((debt, index) => {
    const jurosMensais = (parseFloat(debt.saldo) * parseFloat(debt.taxa) / 100 / 12).toFixed(0);
    let motivo = '';

    if (estrategia === 'AVALANCHE') {
      if (index === 0) {
        motivo = `taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano, gera cerca de R$ ${jurosMensais} por mês. É a dívida que mais cresce e causa o maior impacto no total de juros.`;
      } else if (index === 1) {
        motivo = `taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano, gera cerca de R$ ${jurosMensais} por mês. Apesar do saldo ${debts[0].saldo > debt.saldo ? 'menor' : 'maior'}, o custo mensal de juros é menor que o da primeira dívida, então fica em segundo.`;
      } else {
        motivo = `taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano, juros mensais na faixa de R$ ${jurosMensais}. Não cresce tão rápido quanto as anteriores, então só entra na fila depois que eles forem eliminados.`;
      }
    } else { // SNOWBALL
      if (index === 0) {
        motivo = `saldo menor (R$ ${parseFloat(debt.saldo).toFixed(2)}), taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano. Estratégia Snowball prioriza quitar primeiro as dívidas menores para criar motivação com vitórias rápidas.`;
      } else if (index === 1) {
        motivo = `saldo médio (R$ ${parseFloat(debt.saldo).toFixed(2)}), taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano. Menor que as anteriores, mas depois de quitar a primeira.`;
      } else {
        motivo = `saldo maior (R$ ${parseFloat(debt.saldo).toFixed(2)}), taxa de ${parseFloat(debt.taxa).toFixed(1)}% ao ano. Mesmo com saldo grande, fica por último para manter o foco nas dívidas menores primeiro.`;
      }
    }

    debtOrderHtml += `<li><strong>${debt.descricao}</strong>. Saldo R$ ${parseFloat(debt.saldo).toFixed(2)}. <strong>Motivo:</strong> ${motivo}</li>`;
  });
  debtOrderHtml += `</ol>`;

  let instructions = `<div class="payment-instructions" style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; border-left: 4px solid #007bff;">
    <h4 style="color: #007bff; margin-bottom: 10px;">Como pagar a dívida da maneira mais eficiente:</h4>
    <p><strong>Estratégia utilizada:</strong> ${estrategiaNome}</p>
    <p>Esta estratégia recomenda que você siga esta ordem de prioridade:</p>
    ${debtOrderHtml}
    <p><strong>Como executar o plano:</strong></p>
    <ul>
      <li>Use o valor mensal disponível (R$ ${parseFloat(plano.valorDisponivelMensal).toFixed(2)}) para pagamentos</li>
      <li>Após quitar uma dívida, direcione o valor adicional para as próximas da lista</li>
      <li>O gráfico abaixo mostra a projeção de quitação ao longo dos meses</li>
    </ul>
    ${plano.duracaoEstimadaMeses ? `<p><strong>Duração estimada:</strong> ${plano.duracaoEstimadaMeses} meses</p>` : ''}
    ${plano.totalPagoEstimado ? `<p><strong>Total pago estimado:</strong> R$ ${parseFloat(plano.totalPagoEstimado).toFixed(2)}</p>` : ''}
    ${plano.custoTotalJuros ? `<p><strong>Total de juros pagos:</strong> R$ ${parseFloat(plano.custoTotalJuros).toFixed(2)}</p>` : ''}
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
  const labels = debts[0] ? debts[0].balances.map((_, idx) => `Mês ${idx}`) : []; // Start from 0

  let colorIndex = 0;
  debts.forEach(debt => {
    const chartDiv = document.createElement('div');
    chartDiv.style.flex = '1 1 45%';
    chartDiv.style.minWidth = '400px';

    const title = document.createElement('h5');
    title.textContent = debt.descricao || debt.id;
    chartDiv.appendChild(title);

    const canvas = document.createElement('canvas');
    canvas.width = '400';
    canvas.height = '200';
    chartDiv.appendChild(canvas);

    chartsContainer.appendChild(chartDiv);

    // Prepend initial balance to data
    const initial = initialBalances[debt.id] || 0;
    const data = [initial].concat(debt.balances || []);

    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: debt.descricao || debt.id,
          data: data,
          borderColor: getChartColor(colorIndex),
          backgroundColor: getChartColor(colorIndex).replace('rgb', 'rgba').replace(')', ', 0.1)'),
          tension: 0.4,
          fill: false,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Meses'
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Saldo Remanescente (R$)'
            },
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Saldo: R$ ' + context.parsed.y.toLocaleString();
              }
            }
          },
          legend: {
            display: false
          }
        }
      }
    });
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

    chartsContainer.appendChild(chartDiv);

    // Create individual chart
    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: debt.descricao,
          data: debt.balances,
          borderColor: getChartColor(colorIndex),
          backgroundColor: getChartColor(colorIndex).replace('rgb', 'rgba').replace(')', ', 0.1)'),
          tension: 0.4,
          fill: false,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Meses'
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Saldo Remanescente (R$)'
            },
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Saldo: R$ ' + context.parsed.y.toLocaleString();
              }
            }
          },
          legend: {
            display: false // No legend needed since each chart is for one debt
          }
        }
      }
    });

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
        'R$ ' + saldoInicial.toFixed(2),
        'R$ ' + juros.toFixed(2),
        'R$ ' + parcela.toFixed(2),
        'R$ ' + pagamentoExtra.toFixed(2),
        'R$ ' + pagamentoTotal.toFixed(2),
        'R$ ' + saldoFinal.toFixed(2)
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

    // Create individual chart
    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: debt.descricao,
          data: debt.balances,
          borderColor: getChartColor(colorIndex),
          backgroundColor: getChartColor(colorIndex).replace('rgb', 'rgba').replace(')', ', 0.1)'),
          tension: 0.4,
          fill: false,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Meses'
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Saldo Remanescente (R$)'
            },
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Saldo: R$ ' + context.parsed.y.toLocaleString();
              }
            }
          },
          legend: {
            display: false // No legend needed since each chart is for one debt
          }
        }
      }
    });

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
