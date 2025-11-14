const API_BASE = 'http://localhost:8080/api';

const pageTitle = document.getElementById('page-title');
const page = document.getElementById('page');

document.querySelectorAll('.sidebar nav button').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.route));
});

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
    page.appendChild(createTable(['ID','Dívida ID','Data','Valor','Tipo','Observação'], data.map(p => [p.id,p.dividaId,p.data,p.valor,p.tipo,p.observacao])));
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

// inicial
navigate('home');
