📘 MicroPlan – Sistema de Planejamento e Quitação de Dívidas

Aplicação web desenvolvida em Spring Boot + MySQL para ajudar usuários a entender, organizar e quitar suas dívidas de forma inteligente, usando estratégias demonstradas pela educação financeira moderna. O projeto foi criado como atividade avaliativa da disciplina A3.

🏦 Tópico da FAQ do Banco Central (Tema Escolhido)

Tema: Empréstimos e Endividamento – (FAQ do Banco Central do Brasil, seção Meu BC)

📌 Problema Identificado no Tema

Segundo o Banco Central, muitas pessoas entram em ciclos de endividamento por não compreenderem adequadamente:

Como juros compostos funcionam

Como parcelas mínimas prolongam a dívida

Como priorizar qual dívida pagar primeiro

Como atrasos afetam o saldo total

Como falta de planejamento gera aumento de juros

Isso leva a um cenário de juros acumulados, descontrole financeiro e dificuldade de sair do endividamento.

🎯 Como o MicroPlan Resolve Esse Problema

O MicroPlan foi criado como uma solução tecnológica educativa para lidar com esse problema. Ele:

Centraliza todas as dívidas do usuário

Simula juros compostos mensalmente

Gera planos automáticos de quitação

Mostra a ordem ideal de pagamento usando:

Avalanche (maior taxa de juros)

Snowball (menor saldo primeiro)

Exibe gráficos de projeção

Ajuda o usuário a visualizar quanto pagará de juros

Mostra o impacto de pagamentos extras

Fornece educação financeira aplicada

Com isso, o usuário entende sua situação, toma decisões melhores e evita cair em armadilhas financeiras comuns.

🧩 Modelagem do Sistema – Entidades (5 obrigatórias)

O sistema utiliza 5 entidades principais, todas persistidas em MySQL com Spring Data JPA.

1. Usuário

Representa a pessoa cadastrada no sistema.
Campos:

id

nome

email

senha

rendaMensal

Relacionamento:
1 Usuário → N Dívidas
1 Usuário → N Planos

2. Credor

Instituição ou pessoa para quem o usuário deve.
Campos:

id

nome

contato (opcional)

Relacionamento:
1 Credor → N Dívidas

3. Dívida

Registro de cada dívida do usuário.
Campos:

id

usuario_id

credor_id

descricao

saldoAtual

taxaJurosAnual

parcelaMinima

vencimentoMensal

Relacionamentos:
1 Dívida → N Pagamentos
Muitas dívidas → 1 Usuário e 1 Credor

4. Pagamento

Cada pagamento feito em uma dívida.
Campos:

id

divida_id

valor

tipo

observacao

data

5. Plano de Quitação

Resultado gerado pela simulação (Avalanche ou Snowball).
Campos:

id

usuario_id

estrategia

valorDisponivelMensal

dataCriacao

🗂 Diagrama de Relacionamento (ER Simplificado)
Usuário (1) ---- (N) Dívida (N) ---- (1) Credor
     |                  
     | (1)  
     +---- (N) Plano
     
Dívida (1) ---- (N) Pagamento

🚀 Objetivo do MicroPlan

Fornecer gratuitamente uma ferramenta educativa que ajude usuários a:

Entender como juros impactam suas dívidas

Simular cenários de pagamento

Tomar decisões com base em matemática financeira

Visualizar seu progresso e reduzir a ansiedade

Sair do endividamento de forma mais rápida e estratégica

🛠 Tecnologias Utilizadas

Java 17

Spring Boot 3

Spring MVC

Spring Data JPA (Hibernate)

MySQL 8

Flyway (migrações)

HTML + CSS + JS (Frontend simples)

Swagger (documentação da API)

🏃 Como Executar o Projeto Localmente
1️⃣ Clonar o repositório
git clone <url-do-repositorio>
cd microplan

2️⃣ Criar banco de dados
CREATE DATABASE microplan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

3️⃣ Configurar MySQL em application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/microplan
spring.datasource.username=root
spring.datasource.password=sua_senha

4️⃣ Rodar com Maven
./mvnw spring-boot:run


Servidor iniciará em:
👉 http://localhost:8080

🌱 Seed de Dados (opcional para testes)
INSERT INTO usuarios (nome, email, senha, renda_mensal)
VALUES ('Usuário Teste', 'teste@gmail.com', '123', 5000);

INSERT INTO credores (nome) VALUES ('Nubank'), ('Santander');

INSERT INTO dividas (usuario_id, credor_id, descricao, saldo_atual, taxa_juros_anual, parcela_minima, vencimento_mensal)
VALUES
(1, 1, 'Cartão de Crédito', 3000, 400, 200, 10),
(1, 2, 'Empréstimo Pessoal', 50000, 20, 300, 10);

📡 Documentação da API – CRUD Completo

Base URL:

http://localhost:8080/api

👤 Usuários
Criar usuário (POST)
{
  "nome": "João",
  "email": "joao@email.com",
  "senha": "123",
  "rendaMensal": 3500
}

Listar usuários (GET)

/usuarios

Buscar por ID (GET)

/usuarios/{id}

Editar usuário (PUT)

/usuarios/{id}

Excluir usuário (DELETE)

/usuarios/{id}

🏦 Credores
Criar credor (POST)
{
  "nome": "Banco XPTO",
  "contato": "contato@xpto.com"
}

Listar credores (GET)

/credores

Editar credor (PUT)

/credores/{id}

Excluir credor (DELETE)

/credores/{id}

💰 Dívidas
Criar dívida (POST)
{
  "usuario": { "id": 1 },
  "credor": { "id": 1 },
  "descricao": "Carro Financiado",
  "saldoAtual": 120000,
  "taxaJurosAnual": 18,
  "parcelaMinima": 600,
  "vencimentoMensal": 10
}

Listar dívidas (GET)

/dividas

Dívidas por usuário (GET)

/dividas/usuario/{id}

Editar dívida (PUT)

/dividas/{id}

Excluir dívida (DELETE)

/dividas/{id}

🧾 Pagamentos
Criar pagamento (POST)

/pagamentos

{
  "divida": { "id": 1 },
  "valor": 200,
  "tipo": "EXTRA",
  "observacao": "Pagamento adicional"
}

Listar pagamentos (GET)

/pagamentos

Excluir pagamento (DELETE)

/pagamentos/{id}

📊 Planos de Quitação
Gerar plano (POST)
{
  "usuarioId": 1,
  "valorDisponivelMensal": 1700,
  "estrategia": "AVALANCHE"
}

Listar planos do usuário (GET)

/planos/usuario/{id}

Ver um plano por ID (GET)

/planos/{id}

Excluir plano (DELETE)

/planos/{id}

📈 Estratégias Implementadas
🔥 Avalanche (Maior Juros Primeiro)

Foca na dívida mais cara

Reduz o custo total dos juros

Mais eficiente financeiramente

❄️ Snowball (Menor Saldo Primeiro)

Gera vitórias rápidas

Ajuda no psicológico e motivação

🔐 Avisos Importantes

O MicroPlan é uma ferramenta educacional

Não realiza movimentações financeiras

Não oferece crédito

Não substitui orientação profissional

Dados de teste são completamente fictícios

📚 Acesso à Documentação Swagger
http://localhost:8080/swagger-ui.html

🤝 Contribuições

Pull Requests são bem-vindas.
Este projeto foi desenvolvido para fins acadêmicos.

🎓 Integrantes da Equipe

Davi Latif Grecco- RA:942413665 | Vinicius Berbert de Lima - RA:942421547 |Christian Emanuel Alves Cordeiro - RA:942416080 | Thiago Henrique Spejorim - RA:942414099 | Gustavo Mendes - RA:942410482 