# MAMUTE – Gestão de Frotas

Sistema web para gestão de veículos, pneus, manutenção, mobilização e combustível.
Front-end em **React + Vite** (estático, publicável na **Netlify**), back-end em **Supabase** (PostgreSQL, Auth e Storage).

## Módulos

| Menu | Função |
|---|---|
| Painel | Indicadores da frota e atalhos |
| Controle de pneus → Vistorias | Inspeções periódicas (sulco, condição, km) |
| Controle de pneus → Pareceres técnicos | Parecer de análise de avaria no padrão do modelo MAMUTE (4 fotos, análise, conclusão, parecer final, perda) — visualização e impressão/PDF |
| Manutenção → Corretiva | Ordens de serviço, custos de peças e serviços |
| Manutenção → Preventiva | Painel de vencimentos (km ou dias), registros e planos |
| Mobilização / Desmobilização | Deslocamentos entre obras e centros de custo; atualiza a situação do veículo |
| Combustível | Abastecimentos com cálculo de km/L |
| Cadastros → Veículos / Pneus / Produtos | Campos conforme planilha MAMUTE_FROTAS |

## 1. Configurar o Supabase

1. Crie (ou use) um projeto em https://supabase.com.
2. Abra **SQL Editor** e execute o conteúdo de `supabase/migrations/0001_schema.sql`.
   Ele cria as tabelas, o trigger de perfis, as políticas RLS e o bucket privado `vistorias` (fotos dos pareceres).
3. Em **Authentication → Users**, crie os usuários (**Add user → Create new user**, com e-mail e senha).
   A autenticação por e-mail/senha já vem habilitada. Para impedir cadastro público, desative **Authentication → Providers → Email → Allow new users to sign up**.
4. Para tornar um usuário administrador (opcional):
   ```sql
   update public.perfis set perfil = 'admin' where email = 'seu-email@dominio.com';
   ```
5. Em **Project Settings → API**, copie a **Project URL** e a chave **publishable** (ou anon).

> Observação: a migração não pôde ser aplicada automaticamente pelo ambiente de geração (a conexão disponível era somente leitura). Por isso ela precisa ser executada uma vez no SQL Editor.

## 2. Rodar localmente

```bash
cp .env.example .env.local   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev                  # http://localhost:5173
```

## 3. Publicar na Netlify

O arquivo `netlify.toml` já define build (`npm run build`), pasta de publicação (`dist`) e o redirecionamento de SPA.

1. Suba o repositório no GitHub/GitLab e, na Netlify, escolha **Add new site → Import an existing project**.
2. Em **Site settings → Environment variables**, crie:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Faça o deploy. Depois, em **Supabase → Authentication → URL Configuration**, adicione a URL do site Netlify em *Site URL* e *Redirect URLs*.

Somente a chave **publishable/anon** vai ao front-end. Nunca use a `service_role` no código.

## Estrutura

```
src/
  App.jsx                 rotas e proteção de login
  auth/AuthContext.jsx    sessão e perfil do usuário
  components/             layout, formulários, tabela CRUD genérica, UI
  pages/                  telas de cada módulo
  lib/                    cliente Supabase, formatação, listas, cálculo de vencimentos e parecer
  assets/                 logos (completa e ícone)
supabase/migrations/      schema SQL
```

## Acessibilidade e responsividade

- Layout em uma coluna no celular, com menu lateral deslizante e tabelas transformadas em cartões.
- Campos com rótulos explícitos, mensagens de erro associadas e navegação por teclado.
- Impressão do parecer em A4 sem o menu.
