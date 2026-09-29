# Setup do ambiente local — PEP/COEPP

Ao final você terá:

| Serviço | Onde | O quê |
| --- | --- | --- |
| SQL Server | `localhost:1433` | container Docker |
| Backend | `http://localhost:8001` | FastAPI (`python-back-coepp`) |
| Frontend | `http://localhost:3000` | Nuxt (`nuxt-front-coepp`) |

## Caminho rápido

Instale o que está na tabela do [passo 1](#1-instalar-as-ferramentas) (Node 22+,
Python 3.13+, Docker, driver ODBC 18) e deixe o Docker Desktop aberto. Depois:

```bash
git clone https://github.com/GAraujo04/nuxt-front-coepp.git
cd nuxt-front-coepp
npm install
npm run setup -- --run
```

O `setup` faz o resto sozinho e pode rodar de novo quando quiser: clona o repo
do backend, sobe o SQL Server, gera os segredos, cria o schema, popula os dados
de exemplo, cria a venv do Python e instala tudo. Sem `--run` ele só prepara o
ambiente; com `--run`, já sobe backend e frontend no final. Para começar do
zero: `npm run setup -- --reset`.

Você não precisa clonar `python-back-coepp` na mão — o script busca. Mas **os
repositórios são privados**: peça acesso ao dono antes e deixe o `git`
autenticado no GitHub (`gh auth login`, chave SSH ou token), senão o clone
falha com "repository not found".

Se ele parar no meio, a mensagem diz o que faltou. O resto deste documento é o
mesmo processo na mão, passo a passo — útil para entender o que o script fez ou
para consertar um pedaço específico.

## 0. Estrutura de pastas (importante)

São **dois repositórios irmãos**, na mesma pasta pai e com estes nomes exatos —
o script `npm run dev` do frontend chama `../python-back-coepp/.venv/bin/uvicorn`
por caminho relativo, então renomear ou aninhar as pastas quebra o comando:

```
<sua-pasta>/
├── nuxt-front-coepp     # frontend Nuxt (este repo)
└── python-back-coepp    # backend FastAPI, Docker Compose, schema e seed
```

> Existe um terceiro repositório, o `pep`: é a versão antiga do projeto
> (React + Fastify), de onde estes dois foram migrados. Ele **não** faz parte
> do ambiente de desenvolvimento — até 29/09/2026 o banco ainda dependia das
> migrations dele, o que deixou de ser verdade. Continua valendo como
> histórico e como o lugar onde vivem os ADRs e as specs.

## 1. Instalar as ferramentas

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| Node.js + npm | ≥ 22 | frontend Nuxt |
| Python | ≥ 3.13 | backend FastAPI |
| Docker Desktop | atual | sobe o SQL Server 2022 |
| ODBC Driver 18 for SQL Server | 18 | o `pyodbc` não conecta sem ele |

No macOS:

```bash
brew install node python@3.13
brew install --cask docker
brew tap microsoft/mssql-release
brew install msodbcsql18
```

Em Apple Silicon o SQL Server roda emulado (`platform: linux/amd64` no
`docker-compose.yml`) — funciona, só demora mais para subir na primeira vez.

No Windows, o driver ODBC 18 vem do instalador oficial da Microsoft, e o resto
dos comandos abaixo muda de `.venv/bin/...` para `.venv\Scripts\...`.

## 2. Subir o banco

```bash
cd python-back-coepp
docker compose up -d --wait mssql
docker compose up mssql-init
```

O serviço `mssql-init` cria o banco `pep` (o SQL Server não tem equivalente ao
`POSTGRES_DB`, que criava o banco sozinho).

Senha padrão do `sa` em dev: `Pep_Dev_Password_2026!` (definida no
`docker-compose.yml`; dá para trocar exportando `MSSQL_SA_PASSWORD` antes do
`up`, mas aí ela precisa bater com a `DATABASE_URL` do passo seguinte).

## 3. Backend Python

```bash
cd python-back-coepp
python3.13 -m venv .venv
.venv/bin/pip install -e ".[dev]"
cp .env.example .env
```

Edite o `.env`:

- **`DATABASE_URL`** — troque só a senha:
  `mssql+pyodbc://sa:Pep_Dev_Password_2026!@localhost:1433/pep?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes&Encrypt=yes`
- **`JWT_SECRET`** — mínimo 32 caracteres: `openssl rand -base64 48`
- **`ENCRYPTION_KEY`** — 32 bytes em base64: `openssl rand -base64 32`
- **`TOTVS_MOCK=true`** — já vem assim no `.env.example`. Mantenha: o TOTVS RM
  real da FSA não é acessível de fora da instituição.

⚠️ Depois que o banco tiver dados, **não troque a `ENCRYPTION_KEY`**. É ela que
cifra o PII em repouso (nome do paciente, CPF, conteúdo clínico). Uma chave
diferente não dá erro de credencial: deixa ilegível tudo que já está gravado.

Schema e dados:

```bash
.venv/bin/alembic upgrade head      # cria as tabelas, RLS e triggers
.venv/bin/python -m scripts.seed    # usuários e paciente de exemplo (idempotente)
```

## 4. Frontend

```bash
cd nuxt-front-coepp
npm install
npm run dev
```

O `npm run dev` sobe os dois processos juntos (`concurrently`): o uvicorn na
8001 e o Nuxt na 3000. Abra http://localhost:3000.

Não existe `.env` no frontend. Em dev, `/api/*` é encaminhado para a 8001 pelo
proxy do `nuxt.config.ts`, o que mantém front e back na mesma origem para o
navegador (é o que faz o cookie httpOnly do refresh token funcionar). Para
apontar para outro backend: `API_TARGET=http://localhost:8000 npm run dev`.

## 5. Logins de teste

Criados pelo `scripts.seed` do passo 3:

| Papel | Como entrar |
| --- | --- |
| Admin | `admin@clinica.br` / `senha1234` |
| Supervisor | `supervisor@clinica.br` / `senha1234` |
| Paciente | CPF `000.000.000-00` + nascimento `20/05/1998` (sem senha) |

O estagiário **não** entra por e-mail/senha — nem o criado pelo seed. O único
caminho é o TOTVS, e com `TOTVS_MOCK=true` o mock aceita:

| Usuário RM | Senha | Resultado |
| --- | --- | --- |
| `11111111111` | `mock123` | aluno válido — é este que você quer |
| `22222222222` | `mock123` | só funcionário, sem vínculo de aluno → recusado |
| `55555555555` | `mock123` | sem nenhum vínculo → recusado |
| `99999999999` | qualquer | simula o TOTVS fora do ar |

No primeiro acesso do estagiário o sistema pede para completar o cadastro
(disciplina, supervisor, disponibilidade, termo) — é esperado.

## 6. Conferir que está tudo certo

```bash
# backend
cd python-back-coepp
.venv/bin/pytest
.venv/bin/ruff check app/
.venv/bin/mypy app/

# frontend
cd nuxt-front-coepp
npm run test
npm run lint
npm run typecheck
```

## Problemas comuns

**`Can't open lib 'ODBC Driver 18 for SQL Server'`** — o driver não está
instalado, ou o `pip install` rodou antes dele. Instale o `msodbcsql18` e
refaça o `.venv/bin/pip install -e ".[dev]"`.

**Backend sobe, mas nome do paciente vem embaralhado ou dá erro ao decifrar** —
a `ENCRYPTION_KEY` mudou depois que o dado foi gravado. Volte a chave anterior,
ou recomece com `npm run setup -- --reset`.

**`Login failed for user 'sa'`** — a senha na `DATABASE_URL` não bate com a do
container. Se você já tinha subido o container antes com outra senha, o volume
`mssqldata` guardou a antiga; `docker compose down -v` apaga e recria (perde os
dados, então rode o seed de novo).

**Porta 1433 ocupada** — outro SQL Server rodando na máquina. `docker compose
down` nos outros projetos, ou mude o mapeamento de porta no compose.

**O front sobe mas toda chamada dá 500/conexão recusada** — o backend não subiu
junto. Olhe a saída azul (`back`) no terminal; quase sempre é `.env` faltando
ou banco fora do ar.

## Onde está a documentação de arquitetura

As decisões (ADRs) e specs vivem no repo `pep`, o projeto antigo:

- `pep/docs/adr/0004-frontend-vue-nuxt-repo-proprio.md` — por que Vue/Nuxt
- `pep/docs/adr/0005-backend-python-fastapi-repo-proprio.md` — por que FastAPI
- `pep/CLAUDE.md` — convenções do monorepo original
