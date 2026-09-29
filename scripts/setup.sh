#!/usr/bin/env bash
# Sobe o ambiente local inteiro (SQL Server + backend Python + front Nuxt) a
# partir de um clone limpo deste repo. Idempotente: pode rodar de novo quando
# quiser, não duplica dados nem recria o que já existe.
#
# Uso:
#   npm run setup             # prepara tudo e deixa pronto pra `npm run dev`
#   npm run setup -- --run    # o mesmo, e já sobe back+front no final
#   npm run setup -- --reset  # apaga o banco antes (estado limpo)
#
# São só dois repositórios: este e o python-back-coepp (banco, schema e seed
# moraram no `pep` até 2026-09-29; ver SETUP.md).

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

FRONT_DIR="$PWD"
WORKSPACE="$(dirname "$PWD")"
BACK_DIR="$WORKSPACE/python-back-coepp"
GITHUB_USER="GAraujo04"

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

# --- 1. Repositório do backend -------------------------------------------
# Os dois precisam ser pastas irmãs com estes nomes: o `npm run dev` chama
# ../python-back-coepp/.venv/bin/uvicorn por caminho relativo.
if [[ ! -d "$BACK_DIR" ]]; then
  echo "📥 Clonando python-back-coepp (faltando em $WORKSPACE)..."
  git clone "https://github.com/$GITHUB_USER/python-back-coepp.git" "$BACK_DIR"
fi

if [[ "$RESET" == true ]]; then
  echo "⚠️  Apagando o banco local (--reset)..."
  (cd "$BACK_DIR" && docker compose down -v)
fi

# --- 2. Banco -------------------------------------------------------------
echo "🗄️  Subindo o SQL Server (na primeira vez demora — a imagem roda emulada no Apple Silicon)..."
(cd "$BACK_DIR" && docker compose up -d --wait mssql)
echo "🗄️  Garantindo que o banco 'pep' existe..."
(cd "$BACK_DIR" && docker compose up mssql-init)

# --- 3. Segredos ----------------------------------------------------------
BACK_ENV="$BACK_DIR/.env"
if [[ ! -f "$BACK_ENV" ]]; then
  echo "🔑 Criando .env do backend com segredos gerados..."
  cp "$BACK_DIR/.env.example" "$BACK_ENV"
  set_env DATABASE_URL "mssql+pyodbc://sa:Pep_Dev_Password_2026!@localhost:1433/pep?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes&Encrypt=yes" "$BACK_ENV"
  set_env JWT_SECRET "$(openssl rand -base64 48 | tr -d '\n')" "$BACK_ENV"
  set_env ENCRYPTION_KEY "$(openssl rand -base64 32 | tr -d '\n')" "$BACK_ENV"
  set_env TOTVS_MOCK "true" "$BACK_ENV"
else
  # .env que já existe não é tocado: a ENCRYPTION_KEY dele é a que cifrou o
  # que está no banco. Trocá-la não dá erro de credencial — deixa o PII já
  # gravado ilegível.
  CURRENT_KEY=$(get_env ENCRYPTION_KEY "$BACK_ENV")
  if [[ -z "$CURRENT_KEY" || "$CURRENT_KEY" == "troque-por-32-bytes-em-base64" ]]; then
    echo "🔑 Preenchendo a ENCRYPTION_KEY que ainda estava no valor de exemplo..."
    set_env ENCRYPTION_KEY "$(openssl rand -base64 32 | tr -d '\n')" "$BACK_ENV"
  fi
  if [[ "$(get_env JWT_SECRET "$BACK_ENV")" == "troque-por-um-segredo-de-32-caracteres-no-minimo" ]]; then
    set_env JWT_SECRET "$(openssl rand -base64 48 | tr -d '\n')" "$BACK_ENV"
  fi
fi

# --- 4. Backend: dependências, schema e dados -----------------------------
if [[ ! -d "$BACK_DIR/.venv" ]]; then
  echo "🐍 Criando a venv ($PYTHON)..."
  "$PYTHON" -m venv "$BACK_DIR/.venv"
fi
echo "📦 Instalando dependências do backend..."
(cd "$BACK_DIR" && .venv/bin/pip install --quiet --upgrade pip && .venv/bin/pip install --quiet -e ".[dev]")

echo "🗄️  Aplicando migrations..."
(cd "$BACK_DIR" && .venv/bin/alembic upgrade head)

echo "🌱 Populando dados de exemplo (idempotente)..."
(cd "$BACK_DIR" && .venv/bin/python -m scripts.seed)

# --- 5. Frontend ----------------------------------------------------------
if [[ ! -d "$FRONT_DIR/node_modules" ]]; then
  echo "📦 Instalando dependências do front..."
  (cd "$FRONT_DIR" && npm install)
fi

# --- 6. Pronto ------------------------------------------------------------
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
