#!/usr/bin/env bash
# dev-start.sh — sobe o ambiente de desenvolvimento local completo
# Uso: ./scripts/dev-start.sh [--reset]
#   --reset  recria o banco do zero (DROP + migrate + seed)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}▶ $*${NC}"; }
success() { echo -e "${GREEN}✔ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $*${NC}"; }
error()   { echo -e "${RED}✖ $*${NC}" >&2; exit 1; }

RESET=false
[[ "${1:-}" == "--reset" ]] && RESET=true

# ── pré-requisitos ────────────────────────────────────────────────────────────
command -v docker  &>/dev/null || error "Docker não encontrado. Instale em https://docs.docker.com/get-docker/"
command -v pnpm    &>/dev/null || error "pnpm não encontrado. Execute: npm i -g pnpm"
command -v node    &>/dev/null || error "Node.js não encontrado."

# ── .env ─────────────────────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  warn ".env não encontrado — copiando de .env.example"
  cp .env.example .env
  warn "Edite .env com suas senhas antes de continuar em produção!"
fi

# shellcheck disable=SC1091
source .env

# ── dependências ─────────────────────────────────────────────────────────────
info "Instalando dependências pnpm..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
success "Dependências instaladas"

# ── MySQL ─────────────────────────────────────────────────────────────────────
info "Subindo MySQL..."
docker compose up mysql -d

info "Aguardando MySQL ficar pronto..."
for i in $(seq 1 30); do
  docker exec posgraduacaocms-mysql-1 mysqladmin ping \
    -uroot -p"${MYSQL_ROOT_PASSWORD}" --silent 2>/dev/null && break
  sleep 2
done
docker exec posgraduacaocms-mysql-1 mysqladmin ping \
  -uroot -p"${MYSQL_ROOT_PASSWORD}" --silent 2>/dev/null \
  || error "MySQL não respondeu após 60s"
success "MySQL pronto"

# ── reset opcional ────────────────────────────────────────────────────────────
if [[ "$RESET" == "true" ]]; then
  warn "Recriando banco de dados..."
  docker exec posgraduacaocms-mysql-1 mysql \
    -uroot -p"${MYSQL_ROOT_PASSWORD}" \
    -e "DROP DATABASE IF EXISTS cms; CREATE DATABASE cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON cms.* TO 'cms_user'@'%';" 2>/dev/null
  success "Banco recriado"
fi

# ── migrations ────────────────────────────────────────────────────────────────
info "Aplicando migrations..."
(cd backend && DATABASE_URL="${DATABASE_URL}" pnpm db:migrate)
success "Migrations aplicadas"

# ── seed ─────────────────────────────────────────────────────────────────────
info "Aplicando seed (permissões + Super Admin)..."
(cd backend && DATABASE_URL="${DATABASE_URL}" pnpm db:seed) || warn "Seed já aplicado ou falhou (não crítico)"

# ── admin padrão ─────────────────────────────────────────────────────────────
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@sptech.com}"
ADMIN_NAME="${ADMIN_NAME:-Admin}"
ADMIN_PASS="${ADMIN_PASS:-Admin@1234}"

info "Configurando usuário admin (${ADMIN_EMAIL})..."
ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_NAME="$ADMIN_NAME" ADMIN_PASS="$ADMIN_PASS" \
  DATABASE_URL="$DATABASE_URL" \
  node --no-warnings "$ROOT/scripts/create-admin.mjs" 2>/dev/null \
  && success "Admin pronto: ${ADMIN_EMAIL} / ${ADMIN_PASS}" \
  || warn "Não foi possível criar admin (banco pode estar iniciando — rode novamente)"

# ── backend ───────────────────────────────────────────────────────────────────
info "Iniciando backend em http://localhost:${BACKEND_PORT:-3001}..."
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  API:    http://localhost:${BACKEND_PORT:-3001}${NC}"
echo -e "${GREEN}  Health: http://localhost:${BACKEND_PORT:-3001}/health${NC}"
echo -e "${GREEN}  Login:  POST /auth/login${NC}"
echo -e "${YELLOW}  Email:  ${ADMIN_EMAIL}${NC}"
echo -e "${YELLOW}  Senha:  ${ADMIN_PASS}${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd backend
exec env \
  NODE_ENV="${NODE_ENV:-development}" \
  BACKEND_PORT="${BACKEND_PORT:-3001}" \
  FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}" \
  DATABASE_URL="${DATABASE_URL}" \
  JWT_SECRET="${JWT_SECRET}" \
  MINIO_ENDPOINT="${MINIO_ENDPOINT:-localhost}" \
  MINIO_PORT="${MINIO_PORT:-9000}" \
  MINIO_USE_SSL="${MINIO_USE_SSL:-false}" \
  MINIO_ACCESS_KEY="${MINIO_ROOT_USER}" \
  MINIO_SECRET_KEY="${MINIO_ROOT_PASSWORD}" \
  MINIO_BUCKET="${MINIO_BUCKET:-plataforma}" \
  REDIS_URL="${REDIS_URL:-redis://localhost:6379}" \
  SMTP_HOST="${SMTP_HOST:-localhost}" \
  SMTP_PORT="${SMTP_PORT:-1025}" \
  SMTP_USER="${SMTP_USER:-test@test.com}" \
  SMTP_PASS="${SMTP_PASS:-test}" \
  SMTP_FROM="${SMTP_FROM:-test}" \
  pnpm dev
