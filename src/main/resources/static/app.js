const API_BASE = 'http://localhost:8080/api';

let currentUser = null;
let currentMode = null; // 'dev' ou 'user'

let authScreen, mainScreen, pageTitle, page, navMenu, userInfo, logoutBtn;

function initializeElements() {
  authScreen = document.getElementById('auth-screen');
  mainScreen = document.getElementById('main-screen');
  pageTitle = document.getElementById('page-title');
  page = document.getElementById('page');
  navMenu = document.getElementById('nav-menu');
  userInfo = document.getElementById('user-info');
  logoutBtn = document.getElementById('logout-btn');
  
  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }
}

function logout() {
  currentUser = null;
  currentMode = null;
  authScreen.style.display = 'flex';
  mainScreen.style.display = 'none';
  showLoginScreen();
}

function showLoginScreen() {
  authScreen.style.display = 'flex';
  authScreen.innerHTML = `
    <div class="auth-form">
      <h2>Login</h2>
      <p style="text-align:center; margin-bottom:20px;">
        <button id="btn-dev" class="btn" style="width:100%;">Modo Dev (Admin)</button>
      </p>
      <p style="text-align:center; color:#999; margin:10px 0;">OU</p>
      <p style="margin-top:15px;">
        <input id="login-email" type="email" placeholder="Email">
        <input id="login-senha" type="password" placeholder="Senha" style="margin-top:8px;">
        <button id="btn-login" class="btn" style="width:100%; margin-top:12px;">Login</button>
      </p>
      <p style="text-align:center; margin-top:20px; font-size:13px; color:#666;">
        Novo usuário? <a id="btn-signup-link" href="javascript:void(0)" style="color:var(--accent); cursor:pointer; text-decoration:none;">Criar conta</a>
      </p>
    </div>
  `;
  document.getElementById('btn-dev').onclick = loginDev;
  document.getElementById('btn-login').onclick = loginUser;
  document.getElementById('btn-signup-link').onclick = showSignupScreen;
}

function showSignupScreen() {
  authScreen.innerHTML = `
    <div class="auth-form">
      <h2>Criar Conta - Passo 1</h2>
      <p style="font-size:13px; color:#666; margin-bottom:15px; text-align:center;">Escolha seu email e senha</p>
      <div style="margin-bottom:12px;">
        <input id="signup-email" type="email" placeholder="Email">
        <input id="signup-senha" type="password" placeholder="Senha" style="margin-top:8px;">
        <input id="signup-senha-confirm" type="password" placeholder="Confirmar senha" style="margin-top:8px;">
      </div>
      <button id="btn-next-step" class="btn" style="width:100%; margin-bottom:8px;">Próximo</button>
      <button id="btn-back-login" class="btn secondary" style="width:100%;">Voltar</button>
    </div>
  `;
  document.getElementById('btn-next-step').onclick = validateCredentials;
  document.getElementById('btn-back-login').onclick = showLoginScreen;
}

function validateCredentials() {
  const email = document.getElementById('signup-email').value.trim();
  const senha = document.getElementById('signup-senha').value;
  const senhaConfirm = document.getElementById('signup-senha-confirm').value;
  
  if (!email) return alert('Informe um email válido');
  if (!senha) return alert('Informe uma senha');
  if (senha.length < 6) return alert('Senha deve ter no mínimo 6 caracteres');
  if (senha !== senhaConfirm) return alert('As senhas não coincidem');
  
  showSignupStep2(email, senha);
}

function showSignupStep2(email, senha) {
  authScreen.innerHTML = `
    <div class="auth-form">
      <h2>Criar Conta - Passo 2</h2>
      <p style="font-size:13px; color:#666; margin-bottom:15px; text-align:center;">Dados pessoais</p>
      <div style="margin-bottom:12px;">
        <input id="signup-nome" type="text" placeholder="Nome completo">
        <input id="signup-renda" type="number" placeholder="Renda Mensal (ex: 2500.00)" step="0.01" style="margin-top:8px;">
      </div>
      <button id="btn-create" class="btn" style="width:100%; margin-bottom:8px;">Criar Conta</button>
      <button id="btn-back-step1" class="btn secondary" style="width:100%;">Voltar</button>
    </div>
  `;
  
  document.getElementById('btn-create').onclick = () => createAccount(email, senha);
  document.getElementById('btn-back-step1').onclick = showSignupScreen;
}

async function createAccount(email, senha) {
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
    
    // Armazenar credenciais no localStorage
    localStorage.setItem(`user_${email}`, JSON.stringify({ email, senha }));
    
    alert('Conta criada com sucesso! Faça login com seu email.');
    showLoginScreen();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

function loginDev() {
  currentMode = 'dev';
  currentUser = { id: 'admin', nome: 'Administrador (Dev)', email: 'dev@local' };
  showMainScreen();
}

async function loginUser() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  
  if (!email) return alert('Informe um email válido');
  if (!senha) return alert('Informe sua senha');
  
  try {
    const res = await fetch(`${API_BASE}/usuarios`);
    const usuarios = await res.json();
    const user = usuarios.find(u => u.email === email);
    if (!user) return alert('Usuário não encontrado');
    
    // Validar senha armazenada no localStorage
    const storedCreds = localStorage.getItem(`user_${email}`);
    if (!storedCreds) return alert('Credenciais não encontradas. Crie uma conta.');
    
    const creds = JSON.parse(storedCreds);
    if (creds.senha !== senha) return alert('Email ou senha incorretos');
    
    currentMode = 'user';
    currentUser = user;
    showMainScreen();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

function showMainScreen() {
  authScreen.style.display = 'none';
  mainScreen.style.display = 'flex';
  
  userInfo.innerHTML = `<strong>${currentUser.nome}</strong><br><small>${currentUser.email}</small>`;
  
  if (currentMode === 'dev') {
    buildDevMenu();
  } else {
    buildUserMenu();
  }
  
  navigate('home');
}

function buildDevMenu() {
  navMenu.innerHTML = `
    <button data-route="home">Menu</button>
    <button data-route="usuarios">Usuários</button>
    <button data-route="credores">Credores</button>
    <button data-route="dividas">Dívidas</button>
    <button data-route="pagamentos">Pagamentos</button>
    <button data-route="plano">Gerar Plano</button>
  `;
  navMenu.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => navigate(btn.dataset.route);
  });
}

function buildUserMenu() {
  navMenu.innerHTML = `
    <button data-route="home">Dashboard</button>
    <button data-route="minhas-dividas">Minhas Dívidas</button>
    <button data-route="plano-usuario">Meu Plano</button>
  `;
  navMenu.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => navigate(btn.dataset.route);
  });
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
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="notice">Bem-vindo ao modo Dev (Admin) do Microplan. Use o menu à esquerda para gerenciar todos os dados.</div>
    <div class="small">Modo: DESENVOLVIMENTO - Acesso total a todos os recursos.</div>
  `;
  page.appendChild(el);
}

async function renderUserDashboard() {
  page.innerHTML = '<div class="notice">Carregando...</div>';
  try {
    const divRes = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}`);
    const dividas = await divRes.json();
    
    const pagRes = await fetch(`${API_BASE}/pagamentos`);
    const pagamentos = Array.isArray(pagRes) ? pagRes : [];
    
    page.innerHTML = '';
    
    const div1 = document.createElement('div');
    div1.className = 'dashboard-section';
    div1.innerHTML = `
      <h3>Informações Pessoais</h3>
      <p><strong>Nome:</strong> ${currentUser.nome}</p>
      <p><strong>Email:</strong> ${currentUser.email}</p>
      <p><strong>Renda Mensal:</strong> R$ ${currentUser.rendaMensal || 'N/A'}</p>
    `;
    page.appendChild(div1);
    
    const div2 = document.createElement('div');
    div2.className = 'dashboard-section';
    div2.innerHTML = `<h3>Resumo Dívidas</h3>`;
    const arr = Array.isArray(dividas) ? dividas : [];
    const totalSaldo = arr.reduce((s, d) => s + parseFloat(d.saldoAtual || 0), 0);
    div2.innerHTML += `<p><strong>Total de Dívidas:</strong> ${arr.length}</p>`;
    div2.innerHTML += `<p><strong>Saldo Total:</strong> R$ ${totalSaldo.toFixed(2)}</p>`;
    if (arr.length > 0) {
      div2.appendChild(createTable(['Credor', 'Descrição', 'Saldo', 'Juros%'], arr.map(d => [d.credorNome, d.descricao, d.saldoAtual, d.taxaJurosAnual])));
    }
    page.appendChild(div2);
  } catch (e) {
    page.innerHTML = `<div class="notice">Erro: ${e.message}</div>`;
  }
}

async function renderMinhasDividas() {
  page.innerHTML = '<div class="notice">Carregando...</div>';
  try {
    const res = await fetch(`${API_BASE}/dividas/usuario/${currentUser.id}`);
    const dividas = await res.json();
    
    page.innerHTML = '';
    
    // Botão para adicionar nova dívida
    const btnAdd = document.createElement('button');
    btnAdd.className = 'btn';
    btnAdd.textContent = 'Adicionar Dívida';
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

function showAddDividaForm() {
  page.innerHTML = '';
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row"><input id="d-credor" placeholder="Nome do Credor (ex: Banco, Cartão)"></div>
    <div class="form-row"><input id="d-descricao" placeholder="Descrição da dívida"></div>
    <div class="form-row">
      <input id="d-saldo" placeholder="Saldo atual (ex: 1500.00)" type="number" step="0.01" style="flex:1; min-width:150px;">
      <input id="d-taxa" placeholder="Taxa juros anual % (ex: 10.00)" type="number" step="0.01" style="flex:1; min-width:150px;">
    </div>
    <div class="form-row">
      <input id="d-parcela" placeholder="Parcela mínima (ex: 50.00)" type="number" step="0.01" style="flex:1; min-width:150px;">
      <input id="d-venc" placeholder="Vencimento mensal (1-28)" type="number" min="1" max="28" style="flex:1; min-width:150px;">
    </div>
    <button class="btn" id="d-save" style="margin-right:8px;">Salvar Dívida</button>
    <button class="btn secondary" id="d-cancel">Cancelar</button>
  `;
  page.appendChild(form);
  
  document.getElementById('d-save').onclick = async () => {
    const credorNome = document.getElementById('d-credor').value.trim();
    const descricao = document.getElementById('d-descricao').value.trim();
    const saldoAtual = parseFloat(document.getElementById('d-saldo').value);
    const taxaJurosAnual = parseFloat(document.getElementById('d-taxa').value);
    const parcelaMinima = parseFloat(document.getElementById('d-parcela').value);
    const vencimentoMensal = parseInt(document.getElementById('d-venc').value);
    
    if (!credorNome) return alert('Informe o nome do credor');
    if (!descricao) return alert('Informe a descrição');
    if (!saldoAtual || saldoAtual <= 0) return alert('Informe um saldo válido');
    if (!taxaJurosAnual || taxaJurosAnual < 0) return alert('Informe uma taxa de juros válida');
    if (!parcelaMinima || parcelaMinima <= 0) return alert('Informe uma parcela mínima válida');
    if (!vencimentoMensal || vencimentoMensal < 1 || vencimentoMensal > 28) return alert('Informe um vencimento válido (1-28)');
    
    try {
      // Primeiro precisa criar o credor se não existir
      let credorRes = await fetch(`${API_BASE}/credores`);
      let credores = await credorRes.json();
      let credor = credores.find(c => c.nome.toLowerCase() === credorNome.toLowerCase());
      
      if (!credor) {
        // Criar novo credor
        const newCredorRes = await fetch(`${API_BASE}/credores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: credorNome, contato: '' })
        });
        const newCred = await newCredorRes.json();
        credor = newCred;
      }
      
      // Agora criar a dívida
      const dividaPayload = {
        usuario: { id: currentUser.id },
        credor: { id: credor.id },
        descricao,
        saldoAtual,
        taxaJurosAnual,
        parcelaMinima,
        vencimentoMensal
      };
      
      const dividaRes = await fetch(`${API_BASE}/dividas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dividaPayload)
      });
      
      const json = await dividaRes.json();
      if (!dividaRes.ok) return alert(json.error || 'Erro ao criar dívida');
      
      alert('Dívida adicionada com sucesso!');
      renderMinhasDividas();
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  };
  
  document.getElementById('d-cancel').onclick = renderMinhasDividas;
}

async function renderMeuPlano() {
  page.innerHTML = '<div class="notice">Carregando...</div>';
  try {
    const res = await fetch(`${API_BASE}/planos/usuario/${currentUser.id}`);
    const planos = await res.json();
    
    page.innerHTML = '';
    const arr = Array.isArray(planos) ? planos : [];
    if (arr.length === 0) {
      page.innerHTML = '<div class="notice">Nenhum plano gerado ainda. Gere um novo plano.</div>';
      const form = document.createElement('div');
      form.innerHTML = `
        <div class="form-row"><input id="pl-valor" placeholder="valorDisponivelMensal (ex: 500.00)"></div>
        <div class="form-row"><select id="pl-estrategia"><option value="AVALANCHE">AVALANCHE</option><option value="SNOWBALL">SNOWBALL</option></select></div>
        <button class="btn" id="pl-gen">Gerar Plano</button>
      `;
      page.appendChild(form);
      document.getElementById('pl-gen').onclick = async () => {
        const payload = { usuarioId: currentUser.id, valorDisponivelMensal: parseFloat(document.getElementById('pl-valor').value), estrategia: document.getElementById('pl-estrategia').value };
        try {
          const res = await fetch(`${API_BASE}/planos/generate`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
          const json = await res.json();
          if (!res.ok) return alert(json.error || 'Erro');
          alert('Plano gerado!');
          renderMeuPlano();
        } catch(e){ alert(e.message) }
      };
    } else {
      arr.forEach((p, idx) => {
        const sec = document.createElement('div');
        sec.className = 'dashboard-section';
        sec.innerHTML = `
          <h3>Plano ${idx + 1}</h3>
          <p><strong>Estratégia:</strong> ${p.estrategia}</p>
          <p><strong>Duração:</strong> ${p.duracaoEstimadaMeses} meses</p>
          <p><strong>Total Estimado:</strong> R$ ${p.totalPagoEstimado}</p>
          <p><strong>Custo Juros:</strong> R$ ${p.custoTotalJuros}</p>
          <details><summary>Ver Cronograma</summary><pre style="font-size:11px; overflow-x:auto;">${p.detalhes || 'N/A'}</pre></details>
        `;
        page.appendChild(sec);
      });
    }
  } catch (e) {
    page.innerHTML = `<div class="notice">Erro: ${e.message}</div>`;
  }
}

// ========== MODO DEV (CRUD Completo) ==========

async function renderUsuarios(){
  page.appendChild(createLoading());
  try {
    const res = await fetch(`${API_BASE}/usuarios`);
    const data = await res.json();
    page.innerHTML = '';
    const btnNew = document.createElement('button'); btnNew.className='btn'; btnNew.textContent='Novo usuário';
    btnNew.onclick = () => showUsuarioForm();
    page.appendChild(btnNew);
    page.appendChild(createTable(['ID','Nome','Email','Renda Mensal'], data.map(u => [u.id,u.nome,u.email,u.rendaMensal])));
  } catch(e){ page.innerHTML = `<div class="notice">Erro: ${e.message}</div>` }
}

function showUsuarioForm(){
  page.innerHTML = '';
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row"><input id="u-nome" placeholder="Nome"><input id="u-email" placeholder="Email"></div>
    <div class="form-row"><input id="u-renda" placeholder="Renda Mensal (ex: 2500.00)"></div>
    <button class="btn" id="u-save">Salvar</button>
    <button class="btn secondary" id="u-cancel">Cancelar</button>
  `;
  page.appendChild(form);
  document.getElementById('u-save').onclick = async () => {
    const payload = { nome: document.getElementById('u-nome').value, email: document.getElementById('u-email').value, rendaMensal: parseFloat(document.getElementById('u-renda').value) };
    try {
      const res = await fetch(`${API_BASE}/usuarios`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const json = await res.json();
      if (!res.ok) return alert(json.error || 'Erro');
      alert('Usuário criado: ' + json.id);
      renderUsuarios();
    } catch(e){ alert(e.message) }
  };
  document.getElementById('u-cancel').onclick = renderUsuarios;
}

async function renderCredores(){
  page.appendChild(createLoading());
  try {
    const res = await fetch(`${API_BASE}/credores`);
    const data = await res.json();
    page.innerHTML = '';
    const btnNew = document.createElement('button'); btnNew.className='btn'; btnNew.textContent='Novo credor';
    btnNew.onclick = () => showCredorForm();
    page.appendChild(btnNew);
    page.appendChild(createTable(['ID','Nome','Contato'], data.map(c => [c.id,c.nome,c.contato])));
  } catch(e){ page.innerHTML = `<div class="notice">Erro: ${e.message}</div>` }
}

function showCredorForm(){
  page.innerHTML = '';
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row"><input id="c-nome" placeholder="Nome"><input id="c-contato" placeholder="Contato"></div>
    <button class="btn" id="c-save">Salvar</button>
    <button class="btn secondary" id="c-cancel">Cancelar</button>
  `;
  page.appendChild(form);
  document.getElementById('c-save').onclick = async () => {
    const payload = { nome: document.getElementById('c-nome').value, contato: document.getElementById('c-contato').value };
    try {
      const res = await fetch(`${API_BASE}/credores`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const json = await res.json();
      if (!res.ok) return alert('Erro');
      alert('Credor criado: ' + json.id);
      renderCredores();
    } catch(e){ alert(e.message) }
  };
  document.getElementById('c-cancel').onclick = renderCredores;
}

async function renderDividas(){
  page.appendChild(createLoading());
  try {
    const res = await fetch(`${API_BASE}/dividas`);
    const data = await res.json();
    page.innerHTML = '';
    const btnNew = document.createElement('button'); btnNew.className='btn'; btnNew.textContent='Nova dívida';
    btnNew.onclick = () => showDividaForm();
    page.appendChild(btnNew);
    page.appendChild(createTable(['ID','Usuário','Credor','Descrição','Saldo','Juros%','Parcela','Vencimento'], data.map(d => [d.id,d.usuarioNome,d.credorNome,d.descricao,d.saldoAtual,d.taxaJurosAnual,d.parcelaMinima,d.vencimentoMensal])));
  } catch(e){ page.innerHTML = `<div class="notice">Erro: ${e.message}</div>` }
}

function showDividaForm(){
  page.innerHTML = '';
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="small">Você precisa já ter ` +
    `usuarios e credores criados. Use seus ids abaixo.</div>
    <div class="form-row"><input id="d-usuario" placeholder="usuarioId"><input id="d-credor" placeholder="credorId"></div>
    <div class="form-row"><input id="d-descricao" placeholder="Descrição"><input id="d-saldo" placeholder="Saldo (ex: 1500.00)"></div>
    <div class="form-row"><input id="d-taxa" placeholder="taxa juros anual (ex: 10.00)"><input id="d-parcela" placeholder="parcela minima (ex: 50.00)"></div>
    <div class="form-row"><input id="d-venc" placeholder="vencimentoMensal (1-28)"></div>
    <button class="btn" id="d-save">Salvar</button>
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
      const res = await fetch(`${API_BASE}/dividas`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const json = await res.json();
      if (!res.ok) return alert(json.error || 'Erro');
      alert('Dívida criada: ' + json.id);
      renderDividas();
    } catch(e){ alert(e.message) }
  };
  document.getElementById('d-cancel').onclick = renderDividas;
}

async function renderPagamentos(){
  page.appendChild(createLoading());
  try {
    const res = await fetch(`${API_BASE}/pagamentos`);
    const data = await res.json();
    page.innerHTML = '';
    const btnNew = document.createElement('button'); btnNew.className='btn'; btnNew.textContent='Novo pagamento';
    btnNew.onclick = () => showPagamentoForm();
    page.appendChild(btnNew);
    const arr = Array.isArray(data) ? data : [];
    page.appendChild(createTable(['ID','Dívida ID','Data','Valor','Tipo','Observação'], arr.map(p => [p.id,p.dividaId,p.data,p.valor,p.tipo,p.observacao])));
  } catch(e){ page.innerHTML = `<div class="notice">Erro: ${e.message}</div>` }
}

function showPagamentoForm(){
  page.innerHTML = '';
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row"><input id="p-divida" placeholder="dividaId"><input id="p-valor" placeholder="valor (ex: 100.00)"></div>
    <div class="form-row"><select id="p-tipo"><option>PARCIAL</option><option>TOTAL</option></select><input id="p-observacao" placeholder="observação"></div>
    <button class="btn" id="p-save">Registrar</button>
    <button class="btn secondary" id="p-cancel">Cancelar</button>
  `;
  page.appendChild(form);
  document.getElementById('p-save').onclick = async () => {
    const payload = { divida: { id: parseInt(document.getElementById('p-divida').value) }, valor: parseFloat(document.getElementById('p-valor').value), tipo: document.getElementById('p-tipo').value, observacao: document.getElementById('p-observacao').value };
    try {
      const res = await fetch(`${API_BASE}/pagamentos`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const json = await res.json();
      if (!res.ok) return alert(json.error || 'Erro');
      alert('Pagamento criado: ' + json.id);
      renderPagamentos();
    } catch(e){ alert(e.message) }
  };
  document.getElementById('p-cancel').onclick = renderPagamentos;
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
  rows.forEach(r => { const tr = document.createElement('tr'); r.forEach(c => { const td = document.createElement('td'); td.textContent = c === null || c === undefined ? '' : c; tr.appendChild(td); }); tbody.appendChild(tr); });
  table.appendChild(tbody);
  return table;
}

function createLoading(){ const d = document.createElement('div'); d.className='notice'; d.textContent='Carregando...'; return d }

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  showLoginScreen();
});
