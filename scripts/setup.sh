#!/usr/bin/env bash
# Sobe o ambiente local inteiro (SQL Server + backend Python + front Nuxt) a
# partir de um clone limpo deste repo. Idempotente: pode rodar de novo quando
# quiser, não duplica dados nem recria o que já existe.
#
# Uso:
#   npm run setup          # prepara tudo e deixa pronto pra `npm run dev`
#   npm run setup -- --run # o mesmo, e já sobe back+front no final
#   npm run setup -- --reset  # apaga o banco antes (estado limpo)
#
# É o equivalente do ../pep/demo.sh para a stack nova (FastAPI + Nuxt); a
# lógica é a mesma, com dois passos a mais que aquele não tem: a venv do
# Python e a sincronia de segredos entre os dois .env (ver passo 3).

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

FRONT_DIR="$PWD"
WORKSPACE="$(dirname "$PWD")"
BACK_DIR="$WORKSPACE/python-back-coepp"
PEP_DIR="$WORKSPACE/pep"
GITHUB_USER="GAraujo04"
SA_PASSWORD="${MSSQL_SA_PASSWORD:-Pep_Dev_Password_2026!}"

RUN_AFTER=false
RESET=false
for arg in "$@"; do
  case "$arg" in
    --run) RUN_AFTER=true ;;
    --reset) RESET=true ;;
    *) echo "❌ Opção desconhecida: $arg (use --run e/ou --reset)"; exit 1 ;;
  esac
done

# Escreve KEY=VALUE num arquivo .env, substituindo a linha se a chave já
# existir. awk -v não interpreta o valor como regex — importante porque as
# senhas e a DATABASE_URL têm &, +, ? e ! no meio.
set_env() {
  local key=$1 value=$2 file=$3 tmp
  tmp=$(mktemp)
  awk -v k="$key" -v v="$value" '
    $0 ~ "^" k "=" { print k "=" v; found=1; next }
    { print }
    END { if (!found) print k "=" v }
  ' "$file" >"$tmp" && mv "$tmp" "$file"
}

get_env() {
  local key=$1 file=$2
  grep -m1 "^${key}=" "$file" | cut -d= -f2-
}

# --- 0. Pré-requisitos ----------------------------------------------------
echo "🔎 Conferindo pré-requisitos..."

command -v node >/dev/null || { echo "❌ Node não encontrado. Instale: brew install node@22"; exit 1; }
command -v git  >/dev/null || { echo "❌ Git não encontrado."; exit 1; }
command -v docker >/dev/null || { echo "❌ Docker não encontrado. Instale: brew install --cask docker"; exit 1; }
docker info >/dev/null 2>&1 || { echo "❌ Docker não está rodando. Abra o Docker Desktop, espere ficar pronto e rode de novo."; exit 1; }

PYTHON=""
for candidate in python3.13 python3.14 python3; do
  if command -v "$candidate" >/dev/null 2>&1 &&
     "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 13) else 1)' 2>/dev/null; then
    PYTHON="$candidate"
    break
  fi
done
[[ -n "$PYTHON" ]] || { echo "❌ Python 3.13+ não encontrado. Instale: brew install python@3.13"; exit 1; }

# O pyodbc não conecta sem o ODBC Driver 18 — e o erro que ele dá sem o driver
# ("Can't open lib") só aparece lá na frente, na primeira query.
if command -v odbcinst >/dev/null 2>&1; then
  odbcinst -q -d | grep -q "ODBC Driver 18 for SQL Server" || {
    echo "❌ ODBC Driver 18 não instalado. No macOS:"
    echo "   brew tap microsoft/mssql-release && brew install msodbcsql18"
    exit 1
  }
else
  echo "⚠️  Não deu pra conferir o ODBC Driver 18 (odbcinst não encontrado)."
  echo "   Se o backend falhar com \"Can't open lib\", é isso que está faltando."
fi

# --- 1. Repositórios irmãos ----------------------------------------------
# Os três precisam ser pastas irmãs com estes nomes: o `npm run dev` chama
# ../python-back-coepp/.venv/bin/uvicorn por caminho relativo.
for repo in pep python-back-coepp; do
  if [[ ! -d "$WORKSPACE/$repo" ]]; then
    echo "📥 Clonando $repo (faltando em $WORKSPACE)..."
    git clone "https://github.com/$GITHUB_USER/$repo.git" "$WORKSPACE/$repo"
  fi
done

if [[ "$RESET" == true ]]; then
  echo "⚠️  Apagando o banco local (--reset)..."
  (cd "$PEP_DIR" && docker compose down -v)
fi

# --- 2. Banco (SQL Server via Docker, no repo pep) ------------------------
echo "🗄️  Subindo o SQL Server (na primeira vez demora — a imagem roda emulada no Apple Silicon)..."
(cd "$PEP_DIR" && docker compose up -d --wait mssql)
echo "🗄️  Garantindo que o banco 'pep' existe..."
(cd "$PEP_DIR" && docker compose up mssql-init)

# --- 3. Segredos ----------------------------------------------------------
# JWT_SECRET e ENCRYPTION_KEY são gerados UMA vez (no .env do pep) e copiados
# pro .env do Python. Tem que ser os mesmos nos dois: o seed grava PII cifrada
# com essa chave, e uma chave diferente não dá "senha errada" — dá falha ao
# decifrar o que já está no banco.
PEP_ENV="$PEP_DIR/apps/api/.env"
if [[ ! -f "$PEP_ENV" ]]; then
  echo "🔑 Gerando segredos em apps/api/.env do pep..."
  cp "$PEP_DIR/apps/api/.env.example" "$PEP_ENV"
  set_env JWT_SECRET "$(openssl rand -base64 48 | tr -d '\n')" "$PEP_ENV"
  set_env ENCRYPTION_KEY "$(openssl rand -base64 32 | tr -d '\n')" "$PEP_ENV"
  set_env DATABASE_URL "sqlserver://localhost:1433;database=pep;user=sa;password=${SA_PASSWORD};trustServerCertificate=true;encrypt=true" "$PEP_ENV"
fi

JWT_SECRET=$(get_env JWT_SECRET "$PEP_ENV")
ENCRYPTION_KEY=$(get_env ENCRYPTION_KEY "$PEP_ENV")

BACK_ENV="$BACK_DIR/.env"
if [[ -f "$BACK_ENV" ]]; then
  # Já existia: nunca sobrescrever a ENCRYPTION_KEY em silêncio — se ela for
  # diferente da que cifrou o que está no banco, o dado vira ilegível. Melhor
  # parar e deixar a pessoa decidir qual das duas é a boa.
  # Com --reset o banco já foi apagado, então não há dado para ficar ilegível.
  CURRENT_KEY=$(get_env ENCRYPTION_KEY "$BACK_ENV")
  if [[ "$RESET" == false && -n "$CURRENT_KEY" && "$CURRENT_KEY" != "$ENCRYPTION_KEY" &&
        "$CURRENT_KEY" != "troque-por-32-bytes-em-base64" ]]; then
    echo "❌ ENCRYPTION_KEY diferente entre os dois .env:"
    echo "     $PEP_ENV"
    echo "     $BACK_ENV"
    echo "   Não vou sobrescrever: se a chave errada ganhar, o PII já gravado"
    echo "   no banco fica ilegível. Iguale as duas na mão (mantendo a que"
    echo "   cifrou os dados atuais) e rode de novo — ou apague o banco com"
    echo "   'npm run setup -- --reset', que recria tudo do zero."
    exit 1
  fi
else
  echo "🔑 Criando .env do backend Python com os mesmos segredos..."
  cp "$BACK_DIR/.env.example" "$BACK_ENV"
fi
set_env DATABASE_URL "mssql+pyodbc://sa:${SA_PASSWORD}@localhost:1433/pep?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes&Encrypt=yes" "$BACK_ENV"
set_env JWT_SECRET "$JWT_SECRET" "$BACK_ENV"
set_env ENCRYPTION_KEY "$ENCRYPTION_KEY" "$BACK_ENV"
set_env TOTVS_MOCK "true" "$BACK_ENV"

# --- 4. Schema + dados de exemplo (Prisma, no repo pep) -------------------
# O schema do banco é do Prisma; o backend Python consome o mesmo banco, não o
# redefine. Por isso as migrations do pep vêm primeiro, e as do Alembic depois.
if [[ ! -d "$PEP_DIR/node_modules" ]]; then
  echo "📦 Instalando dependências do pep (primeira vez, demora)..."
  (cd "$PEP_DIR" && npm install)
fi
echo "🗄️  Aplicando migrations do Prisma..."
(cd "$PEP_DIR/apps/api" && npx prisma generate && npx prisma migrate deploy)
echo "🌱 Populando dados de exemplo (idempotente)..."
(cd "$PEP_DIR/apps/api" && npm run db:seed)

# --- 5. Backend Python ----------------------------------------------------
if [[ ! -d "$BACK_DIR/.venv" ]]; then
  echo "🐍 Criando a venv ($PYTHON)..."
  "$PYTHON" -m venv "$BACK_DIR/.venv"
fi
echo "📦 Instalando dependências do backend..."
(cd "$BACK_DIR" && .venv/bin/pip install --quiet --upgrade pip && .venv/bin/pip install --quiet -e ".[dev]")
echo "🗄️  Aplicando migrations do Alembic (criptografia de campos)..."
(cd "$BACK_DIR" && .venv/bin/alembic upgrade head)

# --- 6. Frontend ----------------------------------------------------------
if [[ ! -d "$FRONT_DIR/node_modules" ]]; then
  echo "📦 Instalando dependências do front..."
  (cd "$FRONT_DIR" && npm install)
fi

# --- 7. Pronto ------------------------------------------------------------
cat <<'EOF'

✅ Ambiente pronto.

   npm run dev     → backend (:8001) + front (:3000) juntos
                     http://localhost:3000

   Logins de teste:
     admin ......... admin@clinica.br      / senha1234
     supervisor .... supervisor@clinica.br / senha1234
     paciente ...... CPF 000.000.000-00 + nascimento 20/05/1998 (sem senha)
     estagiário .... usuário RM 11111111111 / mock123 (TOTVS mockado;
                     estagiário NÃO entra por e-mail/senha, é por design)

   Detalhes, e o que fazer quando algo falha: SETUP.md
EOF

if [[ "$RUN_AFTER" == true ]]; then
  echo ""
  echo "🚀 Subindo tudo (Ctrl+C encerra)..."
  cd "$FRONT_DIR" && exec npm run dev
fi
