📘 MicroPlan – Sistema de Planejamento e Quitação de Dívidas

Aplicação web em Spring Boot + MySQL desenvolvida como atividade avaliativa A3.
O objetivo é ajudar usuários a entender, organizar e quitar dívidas de forma inteligente.

🏦 Tópico da FAQ do Banco Central (Escolhido)

Tema: Empréstimos e Endividamento (Meu BC – FAQ)

📌 Problema Identificado

O Banco Central aponta que muitas pessoas caem em ciclos de endividamento por não entender:

- juros compostos

- impacto da parcela mínima

- prioridade entre dívidas

- efeito dos atrasos

- necessidade de planejamento

Isso resulta em mais juros, mais tempo endividado e perda de controle financeiro.

🎯 Solução Proposta (MicroPlan)

O MicroPlan funciona como uma ferramenta educativa que:

- centraliza todas as dívidas do usuário
- simula juros compostos mês a mês
- gera planos automáticos de quitação
- aplica estratégias:
  - Avalanche (maior juros primeiro)
  - Snowball (menor saldo primeiro)
- exibe projeções e gráficos
- ajuda na tomada de decisão financeira

🧩 Entidades do Sistema (5 obrigatórias)

**Usuário**
- id
- nome
- email
- senha
- rendaMensal

**Credor**
- id
- nome
- contato

**Dívida**
- id
- usuario_id
- credor_id
- descricao
- saldoAtual
- taxaJurosAnual
- parcelaMinima
- vencimentoMensal

**Pagamento**
- id
- divida_id
- valor
- tipo
- observacao
- data

**Plano de Quitação**
- id
- usuario_id
- estrategia
- valorDisponivelMensal
- dataCriacao

🏃 Como Executar o Projeto

1️⃣ **Clonar o repositório**
```bash
git clone <url>
cd microplan
```

2️⃣ **Criar o banco**
```sql
CREATE DATABASE microplan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3️⃣ **Configurar o application.properties**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/microplan
spring.datasource.username=root
spring.datasource.password=sua_senha
```

4️⃣ **Executar a aplicação**
```bash
./mvnw spring-boot:run
```

🔗 **Acessar:**
- Interface web: http://localhost:8080

📡 API – CRUD

**Base URL:** `/api`

**👤 Usuários**
- `POST /usuarios/register` - Registrar novo usuário
- `POST /usuarios/login` - Fazer login
- `GET /usuarios` - Listar todos os usuários
- `GET /usuarios/{id}` - Buscar usuário por ID
- `PUT /usuarios/{id}` - Atualizar usuário
- `DELETE /usuarios/{id}` - Excluir usuário

**🏦 Credores**
- `POST /credores` - Criar credor
- `GET /credores` - Listar credores
- `PUT /credores/{id}` - Atualizar credor
- `DELETE /credores/{id}` - Excluir credor

**💰 Dívidas**
- `POST /dividas` - Criar dívida
- `GET /dividas` - Listar todas as dívidas
- `GET /dividas/usuario/{id}` - Dívidas de um usuário
- `PUT /dividas/{id}` - Atualizar dívida
- `DELETE /dividas/{id}` - Excluir dívida

**💳 Pagamentos**
- `POST /pagamentos` - Registrar pagamento
- `GET /pagamentos` - Listar pagamentos
- `DELETE /pagamentos/{id}` - Excluir pagamento

**📊 Planos de Quitação**
- `POST /planos/generate` - Gerar plano de quitação
- `GET /planos/usuario/{id}` - Planos de um usuário
- `GET /planos/{id}` - Buscar plano por ID
- `DELETE /planos/{id}` - Excluir plano

📈 Estratégias de Quitação

**Avalanche**
- prioriza maior taxa de juros
- reduz custo total

**Snowball**
- prioriza menor saldo
- gera motivação inicial

🔐 Avisos

- Ferramenta educativa
- Não realiza operações financeiras reais
- Dados de exemplo são fictícios

📚 Swagger

http://localhost:8080/swagger-ui.html

🎓 Equipe

Davi Latif Grecco – RA 942413665

Vinicius Berbert de Lima – RA 942421547

Christian Emanuel Alves Cordeiro – RA 942416080

Thiago Henrique Spejorim – RA 942414099

Gustavo Mendes – RA 942410482
