📘 MicroPlan – Sistema de Planejamento e Quitação de Dívidas

Aplicação web em Spring Boot + MySQL desenvolvida como atividade avaliativa A3.
O objetivo é ajudar usuários a entender, organizar e quitar dívidas de forma inteligente.

🏦 Tópico da FAQ do Banco Central (Escolhido)

Tema: Empréstimos e Endividamento (Meu BC – FAQ)

📌 Problema Identificado

O Banco Central aponta que muitas pessoas caem em ciclos de endividamento por não entender:

juros compostos

impacto da parcela mínima

prioridade entre dívidas

efeito dos atrasos

necessidade de planejamento

Isso resulta em mais juros, mais tempo endividado e perda de controle financeiro.

🎯 Solução Proposta (MicroPlan)

O MicroPlan funciona como uma ferramenta educativa que:

centraliza todas as dívidas do usuário

simula juros compostos mês a mês

gera planos automáticos de quitação

aplica estratégias:

Avalanche (maior juros primeiro)

Snowball (menor saldo primeiro)

exibe projeções e gráficos

ajuda na tomada de decisão financeira

🧩 Entidades do Sistema (5 obrigatórias)
Usuário

id

nome

email

senha

rendaMensal

Credor

id

nome

contato

Dívida

id

usuario_id

credor_id

descricao

saldoAtual

taxaJurosAnual

parcelaMinima

vencimentoMensal

Pagamento

id

divida_id

valor

tipo

observacao

data

Plano de Quitação

id

usuario_id

estrategia

valorDisponivelMensal

dataCriacao

🏃 Como Executar o Projeto
1️⃣ Clonar o repositório
git clone <url>
cd microplan

2️⃣ Criar o banco
CREATE DATABASE microplan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

3️⃣ Configurar o application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/microplan
spring.datasource.username=root
spring.datasource.password=sua_senha

4️⃣ Rodar
./mvnw spring-boot:run


Acessar:
http://localhost:8080

📡 API – CRUD

Base URL: /api

Usuários

POST /usuarios/register

POST /usuarios/login

GET /usuarios

GET /usuarios/{id}

PUT /usuarios/{id}

DELETE /usuarios/{id}

Credores

POST /credores

GET /credores

PUT /credores/{id}

DELETE /credores/{id}

Dívidas

POST /dividas

GET /dividas

GET /dividas/usuario/{id}

PUT /dividas/{id}

DELETE /dividas/{id}

Pagamentos

POST /pagamentos

GET /pagamentos

DELETE /pagamentos/{id}

Planos de Quitação

POST /planos/generate

GET /planos/usuario/{id}

GET /planos/{id}

DELETE /planos/{id}

📈 Estratégias de Quitação
Avalanche

prioriza maior taxa de juros

reduz custo total

Snowball

prioriza menor saldo

gera motivação inicial

🔐 Avisos

Ferramenta educativa

Não realiza operações financeiras reais

Dados de exemplo são fictícios

📚 Swagger

http://localhost:8080/swagger-ui.html

🎓 Equipe

Davi Latif Grecco – RA 942413665

Vinicius Berbert de Lima – RA 942421547

Christian Emanuel Alves Cordeiro – RA 942416080

Thiago Henrique Spejorim – RA 942414099

Gustavo Mendes – RA 942410482