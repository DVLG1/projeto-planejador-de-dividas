# Frontend (simples) - Microplan

Este é um frontend estático mínimo em JavaScript (vanilla) para uso em desenvolvimento e demonstração.

Como usar

1. Certifique-se de que o backend esteja rodando (por padrão em `http://localhost:8080`).
2. Sirva este diretório em `http://localhost:3000` (recomendado para evitar problemas de CORS). Exemplo usando `http-server`:

```powershell
npx http-server ./frontend -p 3000
```

Alternativa (Python):

```powershell
# Python 3
python -m http.server 3000 --directory frontend
```

3. Abra `http://localhost:3000` no navegador.

Observações
- O frontend usa `fetch` para chamar as rotas: `/api/usuarios`, `/api/credores`, `/api/dividas`, `/api/pagamentos` e `/api/planos/generate`.
- Se você alterou a porta do backend, edite `frontend/app.js` e ajuste `API_BASE`.

Este frontend é intencionalmente simples para ser um ponto de partida — posso converter para React/Vite mais tarde se desejar.