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

O `setup` faz o resto sozinho e pode rodar de novo quando quiser: clona os
outros dois repositórios, sobe o SQL Server, gera os segredos (os mesmos nos
dois `.env`, que é onde é fácil errar), aplica as migrations, popula os dados
de exemplo, cria a venv do Python e instala tudo. Sem `--run` ele só prepara o
ambiente; com `--run`, já sobe backend e frontend no final. Para começar do
zero: `npm run setup -- --reset`.

Você não precisa clonar `python-back-coepp` nem `pep` na mão — o script busca
os dois. Mas **os três repositórios são privados**: peça acesso ao dono antes
e deixe o `git` autenticado no GitHub (`gh auth login`, chave SSH ou token),
senão o clone falha com "repository not found".

Se ele parar no meio, a mensagem diz o que faltou. O resto deste documento é o
mesmo processo na mão, passo a passo — útil para entender o que o script fez ou
para consertar um pedaço específico.

## 0. Estrutura de pastas (importante)

São **três repositórios irmãos**, na mesma pasta pai e com estes nomes exatos —
o script `npm run dev` do frontend chama `../python-back-coepp/.venv/bin/uvicorn`
por caminho relativo, então renomear ou aninhar as pastas quebra o comando:

```
<sua-pasta>/
├── nuxt-front-coepp     # frontend Nuxt (este repo)
├── python-back-coepp    # backend FastAPI
└── pep                  # Docker Compose, schema do banco (Prisma) e seed
```

## 1. Instalar as ferramentas

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| Node.js + npm | ≥ 22 | frontend Nuxt e as migrations/seed do `pep` |
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
cd pep
docker compose up -d mssql mssql-init
```

O serviço `mssql-init` cria o banco `pep` (o SQL Server não tem equivalente ao
`POSTGRES_DB`, que criava o banco sozinho). Espere o healthcheck ficar
`healthy` — `docker compose ps` mostra o estado.

Senha padrão do `sa` em dev: `Pep_Dev_Password_2026!` (definida no
`docker-compose.yml`; dá para trocar exportando `MSSQL_SA_PASSWORD` antes do
`up`, mas aí ela precisa bater com as duas `DATABASE_URL` dos passos seguintes).

## 3. Criar o schema e os dados de exemplo

O schema do banco é definido pelo **Prisma**, no repo `pep` — o backend Python
consome o mesmo banco, não o redefine. Então as migrations rodam daqui:

```bash
cd pep/apps/api
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
```

No `.env` que você acabou de copiar, só precisa conferir a `DATABASE_URL` (o
default já aponta para o container com a senha padrão). `JWT_SECRET` e
`ENCRYPTION_KEY` são exigidos pelo backend Fastify, que não usamos no dia a
dia — mas o `db:seed` também os lê, porque grava PII cifrada. Preencha:

```bash
openssl rand -base64 48   # JWT_SECRET
openssl rand -base64 32   # ENCRYPTION_KEY
```

Guarde esses dois valores: eles têm que ser **os mesmos** no `.env` do backend
Python (passo 4).

## 4. Backend Python

```bash
cd python-back-coepp
python3.13 -m venv .venv
.venv/bin/pip install -e ".[dev]"
cp .env.example .env
```

Edite o `.env`:

- **`DATABASE_URL`** — mesmo banco, sintaxe diferente (SQLAlchemy+pyodbc, não
  Prisma). Troque só a senha:
  `mssql+pyodbc://sa:Pep_Dev_Password_2026!@localhost:1433/pep?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes&Encrypt=yes`
- **`JWT_SECRET`** — o mesmo do passo 3 (mínimo 32 caracteres).
- **`ENCRYPTION_KEY`** — o mesmo do passo 3, obrigatoriamente. Chave diferente
  torna ilegível todo o PII já gravado pelo seed (nome do paciente, conteúdo
  clínico): o backend não "erra a senha", ele falha ao decifrar.
- **`TOTVS_MOCK=true`** — já vem assim no `.env.example`. Mantenha: o TOTVS RM
  real da FSA não é acessível de fora da instituição.

Depois, as migrations próprias do Python (três, de criptografia de campos) —
**sempre depois** do `prisma migrate deploy`:

```bash
.venv/bin/alembic upgrade head
```

## 5. Frontend

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

## 6. Logins de teste

Criados pelo `npm run db:seed` do passo 3:

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

## 7. Conferir que está tudo certo

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
`ENCRYPTION_KEY` diferente da que o seed usou. As duas têm que ser idênticas.

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

As decisões (ADRs) e specs vivem no repo `pep`, não nestes dois:

- `pep/docs/adr/0004-frontend-vue-nuxt-repo-proprio.md` — por que Vue/Nuxt
- `pep/docs/adr/0005-backend-python-fastapi-repo-proprio.md` — por que FastAPI
- `pep/CLAUDE.md` — convenções do monorepo original
