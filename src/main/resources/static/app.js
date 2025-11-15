const API_BASE = 'http://localhost:8080/api';

// Landing page functions
function showApp() {
  document.querySelector('header').style.display = 'none';
  document.querySelector('.features-section').style.display = 'none';
  document.querySelector('.how-it-works').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
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
    const raw = await res.json();

    // A API retorna um Page<UsuarioResponse> com propriedade 'content'.
    // Aceitamos também arrays diretos por compatibilidade.
    let usuarios = [];
    if (Array.isArray(raw)) {
      usuarios = raw;
    } else if (raw && Array.isArray(raw.content)) {
      usuarios = raw.content;
    } else if (raw && raw._embedded) {
      // fallback common HAL shape: _embedded.usuarios
      const keys = Object.keys(raw._embedded);
      if (keys.length > 0 && Array.isArray(raw._embedded[keys[0]])) {
        usuarios = raw._embedded[keys[0]];
      }
    }

    const user = usuarios.find(u => String(u.email).toLowerCase() === String(email).toLowerCase());
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
  // Ensure any modal is closed before navigating
  closeSignupModal();

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
    console.log('DEBUG: Buscando planos para usuario:', currentUser);
    const res = await fetch(`${API_BASE}/planos/usuario/${currentUser.id}`);
    const planos = await res.json();
    console.log('DEBUG: Status da resposta:', res.status);
    console.log('DEBUG: Planos recebidos:', planos);
    
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
          <h3>Plano ${idx + 1} (ID ${p.id})</h3>
          <p><strong>Estratégia:</strong> ${p.estrategia}</p>
          <p><strong>Valor disponível:</strong> R$ ${p.valorDisponivelMensal}</p>
          <p><strong>Duração:</strong> ${p.duracaoEstimadaMeses} meses</p>
          <p><strong>Total Estimado:</strong> R$ ${p.totalPagoEstimado}</p>
          <p><strong>Custo Juros:</strong> R$ ${p.custoTotalJuros}</p>
          <details>
            <summary>Ver Cronograma</summary>
            <div style="margin-top:10px;">
              <div class="form-row" style="gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:6px;">
                <button class="btn" id="btn-compare-${p.id}">Comparar estratégias</button>
                <label style="display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-av-saldo-${p.id}" checked> Avalanche (Saldo)</label>
                <label style="display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-sn-saldo-${p.id}" ${p.estrategia==='SNOWBALL'?'checked':''}> Snowball (Saldo)</label>
                <label style="display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-av-juros-${p.id}"> Avalanche (Juros)</label>
                <label style="display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-sn-juros-${p.id}"> Snowball (Juros)</label>
              </div>
              <canvas id="chart_${p.id}" width="700" height="300" style="max-width:100%; border:1px solid #eee; background:#fff;"></canvas>
            </div>
          </details>
          <div class="form-row" style="margin-top:8px;">
            <select id="estrategia_${p.id}"><option value="AVALANCHE" ${p.estrategia==='AVALANCHE'?'selected':''}>AVALANCHE</option><option value="SNOWBALL" ${p.estrategia==='SNOWBALL'?'selected':''}>SNOWBALL</option></select>
            <input id="valor_${p.id}" type="number" step="0.01" placeholder="valorDisponivelMensal" value="${p.valorDisponivelMensal || ''}" style="margin-left:8px;">
          </div>
          <div style="margin-top:8px;">
            <button class="btn" id="btn-update-${p.id}">Atualizar e Recalcular</button>
            <button class="btn secondary" id="btn-delete-${p.id}" style="margin-left:8px;">Deletar</button>
          </div>
        `;
        page.appendChild(sec);
        // Desenhar gráfico quando o details for aberto
        const detailsEl = sec.querySelector('details');
        const setupChart = async () => {
          const canvas = document.getElementById(`chart_${p.id}`);
          if (!canvas) return;
          try {
            // Série base (plano atual)
            // Simplified parsing for p.detalhes - it should be a JSON string array
            let baseDataRaw = p.detalhes;
            let baseData = [];
            try {
              if (typeof baseDataRaw === 'string') {
                baseData = JSON.parse(baseDataRaw);
              } else if (Array.isArray(baseDataRaw)) {
                baseData = baseDataRaw;
              }
              // Ensure it's an array
              if (!Array.isArray(baseData)) {
                baseData = [];
              }
            } catch (err) {
              console.warn('Erro ao parsear p.detalhes para plano id', p.id, err, 'raw:', baseDataRaw);
              baseData = [];
            }

            // If no cronograma, expose raw payload for debugging under the chart
            const canvasContainer = canvas ? canvas.parentElement : null;
            if (canvasContainer) {
              let dbg = canvasContainer.querySelector('.chart-debug');
              if (!dbg) {
                dbg = document.createElement('pre'); dbg.className = 'chart-debug'; dbg.style.display = 'none'; dbg.style.fontSize='11px'; dbg.style.maxHeight='240px'; dbg.style.overflow='auto'; dbg.style.background='#fff'; dbg.style.border='1px solid #eee'; dbg.style.padding='8px'; dbg.style.marginTop='8px'; canvasContainer.appendChild(dbg);
              }
              if (!baseData || baseData.length === 0) {
                dbg.style.display = 'block';
                try {
                  let rawText = (typeof baseDataRaw === 'string') ? baseDataRaw : JSON.stringify(baseDataRaw, null, 2);
                  dbg.textContent = 'TYPE: ' + (baseDataRaw === null ? 'null' : typeof baseDataRaw) + '\n\nRAW detalhes:\n' + rawText + '\n\nPARSED result:\n' + JSON.stringify(baseData, null, 2);
                } catch(_) { dbg.textContent = String(baseDataRaw); }

                // Additional debug: fetch server copy of the plan to inspect response shape
                try {
                  const resp = await fetch(`${API_BASE}/planos/${p.id}`);
                  let txt = await resp.text();
                  dbg.textContent += '\n\n===== API /planos/' + p.id + ' (raw response text) =====\n' + txt;
                  try {
                    const parsedResp = JSON.parse(txt);
                    dbg.textContent += '\n\nPARSED API RESPONSE:\n' + JSON.stringify(parsedResp, null, 2);
                  } catch(pe) {
                    dbg.textContent += '\n\n(API response not JSON or double-encoded)';
                  }
                } catch(fe) {
                  dbg.textContent += '\n\nError fetching plan from API: ' + fe.message;
                }
                console.warn('Chart parse failed for plano id', p.id, 'type:', typeof baseDataRaw, 'raw:', baseDataRaw, 'parsed:', baseData);
              }
              // Always show debug info when no data
              if (!baseData || baseData.length === 0) {
                dbg.style.display = 'block';
              }
            }

            // Normalize numeric fields defensively
            const baseSaldo = baseData.map(m => ({ x: Number(m.mes) || 0, y: Number(m.resumo && m.resumo.saldoRestanteTotal) || 0 }));
            let jurosAcAv = [];
            let jurosAcSn = [];
            // juros acumulados do base
            const baseJuros = baseData.map(m => Number(m.resumo && m.resumo.jurosDoMes) || 0);
            let acc = 0; const baseJurosAc = baseJuros.map(j => (acc += j));

            if (baseData.length === 0) {
              // nothing to draw
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0,0,canvas.width,canvas.height);
              ctx.fillStyle = '#555'; ctx.font = '14px sans-serif'; ctx.fillText('Sem cronograma para exibir.', 20, 30);
              return;
            }

          // Logica simplificada: mostrar apenas o gráfico básico primeiro
          const baseSaldoPoints = baseData.map(m => ({ x: Number(m.mes) || 0, y: Number(m.resumo && m.resumo.saldoRestanteTotal) || 0 }));
          const jurosMesPoints = baseData.map(m => ({ x: Number(m.mes) || 0, y: Number(m.resumo && m.resumo.jurosDoMes) || 0 }));

          let accumulatedInterest = 0;
          const jurosAcumuladoPoints = baseData.map(m => ({
            x: Number(m.mes) || 0,
            y: (accumulatedInterest += Number(m.resumo && m.resumo.jurosDoMes) || 0)
          }));

          const series = [];

          // Mostrar série de saldos por padrão
          if (baseSaldoPoints.length > 0) {
            series.push({
              name: 'Saldo Restante',
              color: '#2b7cff',
              dashed: false,
              points: baseSaldoPoints
            });
          }

          // Simplificar lógica - apenas mostrar básico e permitir toggle
          const redraw = () => {
            const enabledSeries = [];

            if (document.getElementById(`chk-av-saldo-${p.id}`).checked && baseSaldoPoints.length > 0) {
              enabledSeries.push({
                name: 'Saldo Restante',
                color: '#2b7cff',
                dashed: false,
                points: baseSaldoPoints
              });
            }

            if (document.getElementById(`chk-av-juros-${p.id}`).checked && jurosAcumuladoPoints.length > 0) {
              enabledSeries.push({
                name: 'Juros Acumulados',
                color: '#ff8c2b',
                dashed: true,
                points: jurosAcumuladoPoints
              });
            }

            drawMultiSeriesChart(canvas, enabledSeries, { title: 'Evolução do Plano' });
          };

          // Vincular toggles simples
          ['chk-av-saldo-', 'chk-av-juros-'].forEach(prefix => {
            const el = document.getElementById(prefix + p.id);
            el && el.addEventListener('change', redraw);
          });

          // Botão comparar simplificado - gera apenas quando clicado
          document.getElementById(`btn-compare-${p.id}`).onclick = async () => {
            try {
              alert('Funcionalidade de comparação temporariamente desabilitada');
              // Futuramente: implementar comparação sem quebrar o básico
            } catch (e) {
              alert('Erro na comparação: ' + e.message);
            }
          };

          // Inicialização: mostrar saldos por padrão
          document.getElementById(`chk-av-saldo-${p.id}`).checked = true;
          document.getElementById(`chk-av-juros-${p.id}`).checked = false;
          redraw();
          } catch(e) {
            const canvas = document.getElementById(`chart_${p.id}`);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#555';
            ctx.fillText('Sem dados de cronograma para exibir.', 10, 20);
          }
        };
        detailsEl.addEventListener('toggle', () => { if (detailsEl.open) setupChart(); });
        if (detailsEl.open) setupChart();

        document.getElementById(`btn-update-${p.id}`).onclick = async () => {
          const estrategia = document.getElementById(`estrategia_${p.id}`).value;
          const valor = parseFloat(document.getElementById(`valor_${p.id}`).value);
          if (!valor || valor <= 0) return alert('Informe um valorDisponivelMensal válido');
          try {
            const res = await fetch(`${API_BASE}/planos/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estrategia, valorDisponivelMensal: valor }) });
            const json = await res.json();
            if (!res.ok) return alert(json.error || 'Erro ao atualizar');
            alert('Plano atualizado!');
            renderMeuPlano();
          } catch (e) { alert('Erro: ' + e.message); }
        };
        document.getElementById(`btn-delete-${p.id}`).onclick = async () => {
          if (!confirm('Tem certeza que deseja deletar este plano?')) return;
          try {
            const res = await fetch(`${API_BASE}/planos/${p.id}`, { method: 'DELETE' });
            if (!res.ok && res.status !== 204) {
              const json = await res.json().catch(()=>({}));
              return alert(json.error || 'Erro ao deletar');
            }
            alert('Plano deletado');
            renderMeuPlano();
          } catch (e) { alert('Erro: ' + e.message); }
        };
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
  page.innerHTML = `
    <div class="dashboard-section">
      <h3>Gerar Plano de Quitação</h3>
      <div class="small">Gere um plano de quitação para um usuário existente (informe o id do usuário)</div>
      <div class="form-row"><input id="pl-usuario" placeholder="usuarioId"><input id="pl-valor" type="number" step="0.01" placeholder="valorDisponivelMensal (ex: 500.00)"></div>
      <div class="form-row"><select id="pl-estrategia"><option value="AVALANCHE">AVALANCHE</option><option value="SNOWBALL">SNOWBALL</option></select></div>
      <button class="btn" id="pl-gen">Gerar Plano</button>
    </div>
  `;

  // Carregar e exibir planos existentes
  loadAndDisplayPlanosDev();

  document.getElementById('pl-gen').onclick = async () => {
    const payload = {
      usuarioId: parseInt(document.getElementById('pl-usuario').value),
      valorDisponivelMensal: parseFloat(document.getElementById('pl-valor').value),
      estrategia: document.getElementById('pl-estrategia').value
    };
    if (!payload.usuarioId || !payload.valorDisponivelMensal || payload.valorDisponivelMensal <= 0) {
      return alert('Preencha todos os campos com valores válidos');
    }
    try {
      const res = await fetch(`${API_BASE}/planos/generate`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const json = await res.json();
      if (!res.ok) return alert(json.error || 'Erro');
      alert('Plano gerado com sucesso! ID: ' + json.id);
      loadAndDisplayPlanosDev(); // Recarregar lista
    } catch(e){ alert(e.message) }
  };
}

async function loadAndDisplayPlanosDev(){
  try {
    // Carregar todos os planos
    const res = await fetch(`${API_BASE}/planos`);
    const planos = await res.json();
    const arr = Array.isArray(planos) ? planos : [];

    if (arr.length === 0) return; // Não há planos para mostrar

    // Criar seção para listar planos existentes
    const planosSection = document.createElement('div');
    planosSection.className = 'dashboard-section';
    planosSection.innerHTML = '<h3>Planos Existentes</h3>';
    page.appendChild(planosSection);

    arr.forEach((p, idx) => {
      const sec = document.createElement('div');
      sec.className = 'dashboard-section';
      sec.innerHTML = `
        <h4>Plano ${idx + 1} (ID ${p.id}) - Usuário ${p.usuario ? p.usuario.id : 'N/A'}</h4>
        <p><strong>Estratégia:</strong> ${p.estrategia}</p>
        <p><strong>Valor disponível:</strong> R$ ${p.valorDisponivelMensal}</p>
        <p><strong>Duração:</strong> ${p.duracaoEstimadaMeses} meses</p>
        <p><strong>Total Estimado:</strong> R$ ${p.totalPagoEstimado}</p>
        <p><strong>Custo Juros:</strong> R$ ${p.custoTotalJuros}</p>
        <details>
          <summary>Ver Cronograma</summary>
          <div style="margin-top:10px;">
            <div class="form-row" style="gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:6px;">
              <button class="btn" id="btn-compare-${p.id}">Comparar estratégias</button>
              <label style="display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-av-saldo-${p.id}" checked> Avalanche (Saldo)</label>
              <label style="display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-sn-saldo-${p.id}" ${p.estrategia==='SNOWBALL'?'checked':''}> Snowball (Saldo)</label>
              <label style="display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-av-juros-${p.id}"> Avalanche (Juros)</label>
              <label style="display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-sn-juros-${p.id}"> Snowball (Juros)</label>
            </div>
            <canvas id="chart_${p.id}" width="700" height="300" style="max-width:100%; border:1px solid #eee; background:#fff;"></canvas>
          </div>
        </details>
        <div class="form-row" style="margin-top:8px;">
          <select id="estrategia_${p.id}"><option value="AVALANCHE" ${p.estrategia==='AVALANCHE'?'selected':''}>AVALANCHE</option><option value="SNOWBALL" ${p.estrategia==='SNOWBALL'?'selected':''}>SNOWBALL</option></select>
          <input id="valor_${p.id}" type="number" step="0.01" placeholder="valorDisponivelMensal" value="${p.valorDisponivelMensal || ''}" style="margin-left:8px;">
        </div>
        <div style="margin-top:8px;">
          <button class="btn" id="btn-update-${p.id}">Atualizar e Recalcular</button>
          <button class="btn secondary" id="btn-delete-${p.id}" style="margin-left:8px;">Deletar</button>
        </div>
      `;
      planosSection.appendChild(sec);

      // Adicionar a funcionalidade do gráfico (reutilizar código existente)
      const detailsEl = sec.querySelector('details');
      const setupChart = async () => {
        const canvas = document.getElementById(`chart_${p.id}`);
        if (!canvas) return;
        try {
          let baseDataRaw = p.detalhes;
          let baseData = [];
          try {
            if (typeof baseDataRaw === 'string') {
              baseData = JSON.parse(baseDataRaw);
            } else if (Array.isArray(baseDataRaw)) {
              baseData = baseDataRaw;
            }
            if (!Array.isArray(baseData)) baseData = [];
          } catch (err) {
            console.warn('Erro ao parsear p.detalhes para plano id', p.id, err);
            baseData = [];
          }

          const canvasContainer = canvas ? canvas.parentElement : null;
          if (canvasContainer && (!baseData || baseData.length === 0)) {
            let dbg = canvasContainer.querySelector('.chart-debug');
            if (!dbg) {
              dbg = document.createElement('pre');
              dbg.className = 'chart-debug';
              dbg.style.display = 'block';
              dbg.style.fontSize='11px';
              dbg.style.maxHeight='240px';
              dbg.style.overflow='auto';
              dbg.style.background='#fff';
              dbg.style.border='1px solid #eee';
              dbg.style.padding='8px';
              dbg.style.marginTop='8px';
              canvasContainer.appendChild(dbg);
            }
            try {
              let rawText = (typeof baseDataRaw === 'string') ? baseDataRaw : JSON.stringify(baseDataRaw, null, 2);
              dbg.textContent = 'TYPE: ' + (baseDataRaw === null ? 'null' : typeof baseDataRaw) + '\n\nRAW detalhes:\n' + rawText +
                '\n\nPARSED result:\n' + JSON.stringify(baseData, null, 2);
            } catch(_) {
              dbg.textContent = String(baseDataRaw);
            }
          }

          const baseSaldo = baseData.map(m => ({ x: Number(m.mes) || 0, y: Number(m.resumo && m.resumo.saldoRestanteTotal) || 0 }));
          let jurosAcAv = [], jurosAcSn = [];
          const baseJuros = baseData.map(m => Number(m.resumo && m.resumo.jurosDoMes) || 0);
          let acc = 0;
          const baseJurosAc = baseJuros.map(j => (acc += j));

          if (baseData.length === 0) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#555';
            ctx.fillText('Sem cronograma para exibir.', 20, 30);
            return;
          }

          const avSaldo = p.estrategia === 'AVALANCHE' ? baseSaldo : [];
          const snSaldo = p.estrategia === 'SNOWBALL' ? baseSaldo : [];
          if (p.estrategia === 'AVALANCHE') jurosAcAv = baseJurosAc.map((y,i)=>({x: baseData[i].mes, y}));
          if (p.estrategia === 'SNOWBALL') jurosAcSn = baseJurosAc.map((y,i)=>({x: baseData[i].mes, y}));

          const series = [];
          const colors = { avSaldo:'#2b7cff', snSaldo:'#ff8c2b', avJuros:'#8bb6ff', snJuros:'#ffc38b' };
          const pushIf = (enabled, s) => { if (enabled) series.push(s); };
          const redraw = () => {
            const enabledSeries = [];
            pushIf(document.getElementById(`chk-av-saldo-${p.id}`).checked && avSaldo.length>0, { name:'Avalanche (Saldo)', color:colors.avSaldo, dashed:false, points:avSaldo });
            pushIf(document.getElementById(`chk-sn-saldo-${p.id}`).checked && snSaldo.length>0, { name:'Snowball (Saldo)', color:colors.snSaldo, dashed:false, points:snSaldo });
            pushIf(document.getElementById(`chk-av-juros-${p.id}`).checked && jurosAcAv.length>0, { name:'Avalanche (Juros)', color:colors.avJuros, dashed:true, points:jurosAcAv });
            pushIf(document.getElementById(`chk-sn-juros-${p.id}`).checked && jurosAcSn.length>0, { name:'Snowball (Juros)', color:colors.snJuros, dashed:true, points:jurosAcSn });
            drawMultiSeriesChart(canvas, enabledSeries, { title: 'Evolução do Saldo e Juros' });
          };

          ['chk-av-saldo-','chk-sn-saldo-','chk-av-juros-','chk-sn-juros-'].forEach(prefix => {
            const el = document.getElementById(prefix + p.id);
            el && el.addEventListener('change', redraw);
          });

          document.getElementById(`btn-compare-${p.id}`).onclick = async () => {
            const other = p.estrategia === 'AVALANCHE' ? 'SNOWBALL' : 'AVALANCHE';
            const payload = { usuarioId: p.usuario ? p.usuario.id : currentUser.id, valorDisponivelMensal: p.valorDisponivelMensal, estrategia: other };
            let tempId = null;
            try {
              const res = await fetch(`${API_BASE}/planos/generate`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
              const json = await res.json();
              if (!res.ok) return alert(json.error || 'Erro ao gerar simulação');
              tempId = json.id;
              const detalhes = Array.isArray(json.detalhes) ? json.detalhes : JSON.parse(json.detalhes || '[]');
              const saldo = detalhes.map(m => ({ x: m.mes, y: (m.resumo && m.resumo.saldoRestanteTotal) ? m.resumo.saldoRestanteTotal : 0 }));
              const jurosMes = detalhes.map(m => (m.resumo && m.resumo.jurosDoMes) ? m.resumo.jurosDoMes : 0);
              let acc2 = 0;
              const jurosAc = jurosMes.map(j => (acc2 += j));
              if (other === 'AVALANCHE') {
                if (avSaldo.length === 0) avSaldo.push(...saldo);
                if (jurosAcAv.length === 0) jurosAcAv.push(...jurosAc.map((y,i)=>({x: detalhes[i].mes, y})));
                document.getElementById(`chk-av-saldo-${p.id}`).checked = true;
              } else {
                if (snSaldo.length === 0) snSaldo.push(...saldo);
                if (jurosAcSn.length === 0) jurosAcSn.push(...jurosAc.map((y,i)=>({x: detalhes[i].mes, y})));
                document.getElementById(`chk-sn-saldo-${p.id}`).checked = true;
              }
              redraw();
            } catch (e) {
              alert('Erro: ' + e.message);
            } finally {
              if (tempId) {
                try { await fetch(`${API_BASE}/planos/${tempId}`, { method:'DELETE' }); } catch(_){}
              }
            }
          };

          if (p.estrategia === 'AVALANCHE') {
            document.getElementById(`chk-av-saldo-${p.id}`).checked = true;
            document.getElementById(`chk-sn-saldo-${p.id}`).checked = false;
          } else {
            document.getElementById(`chk-av-saldo-${p.id}`).checked = false;
            document.getElementById(`chk-sn-saldo-${p.id}`).checked = true;
          }
          document.getElementById(`chk-av-juros-${p.id}`).checked = false;
          document.getElementById(`chk-sn-juros-${p.id}`).checked = false;
          redraw();
        } catch(e) {
          const canvas = document.getElementById(`chart_${p.id}`);
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#555';
            ctx.fillText('Sem dados de cronograma para exibir.', 10, 20);
          }
        }
      };
      detailsEl.addEventListener('toggle', () => { if (detailsEl.open) setupChart(); });
      if (detailsEl.open) setupChart();

      document.getElementById(`btn-update-${p.id}`).onclick = async () => {
        const estrategia = document.getElementById(`estrategia_${p.id}`).value;
        const valor = parseFloat(document.getElementById(`valor_${p.id}`).value);
        if (!valor || valor <= 0) return alert('Informe um valorDisponivelMensal válido');
        try {
          const res = await fetch(`${API_BASE}/planos/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estrategia, valorDisponivelMensal: valor }) });
          const json = await res.json();
          if (!res.ok) return alert(json.error || 'Erro ao atualizar');
          alert('Plano atualizado!');
          loadAndDisplayPlanosDev();
        } catch (e) { alert('Erro: ' + e.message); }
      };

      document.getElementById(`btn-delete-${p.id}`).onclick = async () => {
        if (!confirm('Tem certeza que deseja deletar este plano?')) return;
        try {
          const res = await fetch(`${API_BASE}/planos/${p.id}`, { method: 'DELETE' });
          if (!res.ok && res.status !== 204) {
            const json = await res.json().catch(()=>({}));
            return alert(json.error || 'Erro ao deletar');
          }
          alert('Plano deletado');
          loadAndDisplayPlanosDev();
        } catch (e) { alert('Erro: ' + e.message); }
      };
    });
  } catch (e) {
    console.error('Erro ao carregar planos:', e);
  }
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

function drawDebtChart(canvas, points, opts={}){
  // simple wrapper that uses drawMultiSeriesChart for single-series
  const s = (points||[]).map(p => ({ x: Number(p.x)||0, y: Number(p.y)||0 }));
  const series = [{ name: opts.name || 'Série', color: opts.color || '#2b7cff', dashed:false, points: s }];
  drawMultiSeriesChart(canvas, series, opts);
}

function drawMultiSeriesChart(canvas, series, opts={}){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const m = { top: 40, right: 20, bottom: 60, left: 70 };
  const plotW = W - m.left - m.right;
  const plotH = H - m.top - m.bottom;
  if (!series || series.length === 0) {
    ctx.fillStyle='#666';
    ctx.font='bold 16px Inter, sans-serif';
    ctx.fillText('Sem dados para exibir', m.left + plotW/2 - 80, m.top + plotH/2);
    return;
  }

  // compute domains
  let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
  series.forEach(s => (s.points||[]).forEach(p => { if(p){ minX=Math.min(minX,p.x); maxX=Math.max(maxX,p.x); minY=Math.min(minY,p.y); maxY=Math.max(maxY,p.y); }}));
  if (!isFinite(minX) || !isFinite(maxX)) {
    ctx.fillStyle='#666';
    ctx.font='bold 16px Inter, sans-serif';
    ctx.fillText('Dados inválidos', m.left + plotW/2 - 60, m.top + plotH/2);
    return;
  }

  // ensure integer X domain (months)
  minX = Math.floor(minX); maxX = Math.ceil(maxX);
  const padY = (maxY - minY) * 0.15 || Math.max(100, Math.abs(maxY)*0.1);
  const y0 = Math.max(0, minY - padY);
  const y1 = maxY + padY;
  const xToPx = x => m.left + (plotW * (x - minX) / ((maxX - minX) || 1));
  const yToPx = y => m.top + plotH - (plotH * (y - y0) / ((y1 - y0) || 1));

  // helper to render base (axes, grid, series)
  function renderBase(){
    ctx.clearRect(0,0,W,H);

    // background with subtle gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(m.left, m.top, plotW, plotH);

    // grid vertical - subtle
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
    const xticks = Math.min(10, Math.max(4, maxX - minX));
    for (let i=1;i<xticks;i++){ const x = minX + (i*(maxX-minX)/xticks); const px=xToPx(x); ctx.beginPath(); ctx.moveTo(px, m.top); ctx.lineTo(px, m.top+plotH); ctx.stroke(); }

    // grid horizontal - subtle
    const yticks = 6;
    for (let i=1;i<yticks;i++){ const y = y0 + i*(y1-y0)/yticks; const py = yToPx(y); ctx.beginPath(); ctx.moveTo(m.left,py); ctx.lineTo(m.left+plotW,py); ctx.stroke(); }

    // axes with better styling
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(m.left, m.top+plotH); ctx.lineTo(m.left+plotW, m.top+plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m.left, m.top); ctx.lineTo(m.left, m.top+plotH); ctx.stroke();

    // ticks labels with better typography
    ctx.fillStyle='#475569'; ctx.font='bold 12px Inter, sans-serif';
    for (let i=0;i<=xticks;i++){ const x = minX + Math.round(i*(maxX-minX)/(xticks||1)); const px = xToPx(x); ctx.fillText(String(x), px-6, m.top+plotH+22); }
    for (let i=0;i<=yticks;i++){ const y = y0 + (i*(y1-y0)/yticks); const py = yToPx(y); ctx.fillText('R$ '+Number(y).toFixed(0), 8, py+4); }

    // draw series with smooth curves and better styling
    series.forEach(s => {
      const pts = (s.points||[]).map(p => ({ x: Number(p.x)||0, y: Number(p.y)||0 }));

      if (pts.length > 0) {
        // create smooth curved line
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = s.color || '#3B82F6';
        ctx.setLineDash(s.dashed ? [8,4] : []);

        // smooth curve using quadratic curves
        ctx.moveTo(xToPx(pts[0].x), yToPx(pts[0].y));

        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (xToPx(pts[i].x) + xToPx(pts[i + 1].x)) / 2;
          const yc = (yToPx(pts[i].y) + yToPx(pts[i + 1].y)) / 2;
          ctx.quadraticCurveTo(xToPx(pts[i].x), yToPx(pts[i].y), xc, yc);
        }

        if (pts.length > 1) {
          ctx.quadraticCurveTo(xToPx(pts[pts.length - 2].x), yToPx(pts[pts.length - 2].y),
                            xToPx(pts[pts.length - 1].x), yToPx(pts[pts.length - 1].y));
        }

        ctx.stroke(); ctx.setLineDash([]);

        // points with shadow effect
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = s.color || '#3B82F6';
        pts.forEach((p,i) => {
          const px = xToPx(p.x), py = yToPx(p.y);
          // white inner circle for better contrast
          ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI*2); ctx.fillStyle = 'white'; ctx.fill();
          ctx.fillStyle = s.color || '#3B82F6'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2); ctx.fill();
        });
        ctx.shadowBlur = 0;
      }
    });

    // title with better styling
    if (opts.title){
      ctx.fillStyle='#0F172A'; ctx.font='bold 16px Inter, sans-serif';
      ctx.fillText(opts.title, m.left, 24);
    }

    // better legend (centered at bottom)
    if (series.length > 0) {
      const legendY = m.top + plotH + 45;
      let totalWidth = 0;
      series.forEach(s => {
        totalWidth += 24 + ctx.measureText(s.name||'').width;
      });

      let lx = m.left + (plotW - totalWidth) / 2;
      series.forEach(s => {
        // background circle for swatch
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 3;
        ctx.beginPath(); ctx.arc(lx + 8, legendY-6, 8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // colored swatch
        ctx.fillStyle = s.color || '#3B82F6';
        ctx.beginPath(); ctx.arc(lx + 8, legendY-6, 6, 0, Math.PI*2); ctx.fill();

        // text
        ctx.fillStyle = '#334155'; ctx.font='500 12px Inter, sans-serif';
        ctx.fillText(' ' + (s.name||''), lx + 20, legendY);

        lx += 28 + ctx.measureText(s.name||'').width;
      });
    }
  }

  // initial render
  renderBase();

  // enhanced mouse interactions
  canvas.onmousemove = (ev) => {
    renderBase();
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left; const my = ev.clientY - rect.top;
    const pxToX = px => minX + ((px - m.left) * (maxX - minX) / (plotW || 1));
    const hoverXf = pxToX(mx);
    const ix = Math.round(hoverXf);
    // collect nearest points for ix
    const hoverPoints = [];
    series.forEach(s => {
      let best = Infinity, bestPt = null;
      (s.points||[]).forEach(pt => { const d = Math.abs(pt.x - ix); if (d < best) { best = d; bestPt = pt; } });
      if (bestPt) hoverPoints.push({ name: s.name, color: s.color, pt: bestPt });
    });
    if (hoverPoints.length === 0) return;

    const rx = xToPx(ix);
    // enhanced vertical guide
    ctx.strokeStyle = 'rgba(15,23,42,0.3)'; ctx.setLineDash([2,2]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(rx, m.top); ctx.lineTo(rx, m.top+plotH); ctx.stroke();
    ctx.setLineDash([]);

    // enhanced tooltip
    const lines = [`📅 Mês: ${ix}`].concat(hoverPoints.map(h => `💰 ${h.name}: R$ ${Number(h.pt.y).toFixed(2)}`));
    ctx.font = 'bold 12px Inter, sans-serif';
    const padding = 12;
    const tw = Math.max(...lines.map(l => ctx.measureText(l).width)) + padding*2;
    const th = lines.length * 18 + padding;
    let tx = rx + 15; let ty = my - th/2;
    if (tx + tw > W - 12) tx = rx - tw - 15;
    if (ty < 8) ty = 8;
    if (ty + th > H - 8) ty = H - th - 8;

    // tooltip background with shadow
    ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1;
    ctx.fillRect(tx, ty, tw, th); ctx.strokeRect(tx, ty, tw, th);
    ctx.shadowBlur = 0;

    // tooltip content
    ctx.fillStyle = '#0F172A';
    lines.forEach((l,i)=> ctx.fillText(l, tx + padding, ty + padding + (i*18) + 4));
  };

  canvas.onmouseleave = () => { renderBase(); };
}

/* LANDING PAGE EVENT LISTENERS */
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the landing page (has hero header) or app (has auth-screen)
  const hasLandingPage = document.querySelector('header.hero-header');
  const hasAuthScreen = document.getElementById('auth-screen');

  if (hasLandingPage && hasAuthScreen) {
    // Landing page with integrated app - setup both
    const btnDev = document.getElementById('btn-dev');
    const btnLogin = document.getElementById('btn-login');
    const logoutBtn = document.getElementById('logout-btn');
    const signupLink = document.getElementById('btn-signup-link');

    // Setup landing page event listeners
    if (signupLink) {
      signupLink.addEventListener('click', showSignupModal);
    }

    // Setup app functionality
    initializeElements();

    if (btnDev) btnDev.addEventListener('click', () => {
      currentMode = 'dev';
      currentUser = { id: 'admin', nome: 'Administrador (Dev)', email: 'dev@local' };
      showMainScreen();
    });

    if (btnLogin) btnLogin.addEventListener('click', loginUser);

    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Start with landing page visible
  } else if (hasAuthScreen) {
    // Pure app mode - start with login
    initializeElements();
    showLoginScreen();
  }
  // If only landing page, no JS interactions needed
});

// Keep existing functions for compatibility
