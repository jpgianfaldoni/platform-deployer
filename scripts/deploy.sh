#!/bin/bash

# Script para fazer deploy da aplicação PWA no GitHub Pages
# Este script copia os arquivos da pasta deploy/ para o branch gh-pages

set -e  # Para na primeira ocorrência de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verifica se estamos em um repositório git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Este diretório não é um repositório Git!"
    exit 1
fi

# Obtém o diretório raiz do repositório
REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PWA_DIR="$(dirname "$SCRIPT_DIR")"
# Garante que o caminho seja absoluto
DEPLOY_DIR="$(cd "$PWA_DIR/deploy" && pwd)"

# Verifica se a pasta deploy existe
if [ ! -d "$DEPLOY_DIR" ]; then
    print_error "Pasta deploy/ não encontrada em $DEPLOY_DIR"
    print_info "Diretório do script: $SCRIPT_DIR"
    print_info "Diretório PWA: $PWA_DIR"
    print_info "Diretório raiz do repo: $REPO_ROOT"
    exit 1
fi

# Verifica se há arquivos na pasta deploy antes de continuar
if [ -z "$(ls -A "$DEPLOY_DIR" 2>/dev/null)" ]; then
    print_error "A pasta deploy/ está vazia!"
    exit 1
fi

# Verifica se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Existem mudanças não commitadas no repositório."
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_info "Deploy cancelado."
        exit 0
    fi
fi

# Detecta o branch atual
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Branch atual: $CURRENT_BRANCH"

# Salva o branch atual para voltar depois
ORIGINAL_BRANCH=$CURRENT_BRANCH

# Nome do branch de deploy
DEPLOY_BRANCH="gh-pages"

print_info "Iniciando deploy para GitHub Pages..."

# Muda para o diretório raiz do repositório
cd "$REPO_ROOT"

# Verifica se o branch gh-pages existe
if git show-ref --verify --quiet refs/heads/$DEPLOY_BRANCH; then
    print_info "Branch $DEPLOY_BRANCH já existe. Fazendo checkout..."
    git checkout $DEPLOY_BRANCH
    git pull origin $DEPLOY_BRANCH 2>/dev/null || true
else
    print_info "Branch $DEPLOY_BRANCH não existe. Criando novo branch..."
    # Cria um branch órfão (sem histórico)
    git checkout --orphan $DEPLOY_BRANCH
    # Remove todos os arquivos do staging
    git rm -rf . 2>/dev/null || true
fi

# Limpa o diretório atual (exceto .git)
print_info "Limpando diretório de deploy..."
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} + 2>/dev/null || true

# Verifica novamente se há arquivos na pasta deploy (pode ter mudado)
if [ -z "$(ls -A "$DEPLOY_DIR" 2>/dev/null)" ]; then
    print_error "A pasta deploy/ está vazia!"
    git checkout $ORIGINAL_BRANCH
    exit 1
fi

# Copia os arquivos da pasta deploy/
print_info "Copiando arquivos de $DEPLOY_DIR para $(pwd)..."

# Usa rsync se disponível (mais robusto), senão usa cp com método seguro
if command -v rsync >/dev/null 2>&1; then
    print_info "Usando rsync para copiar arquivos..."
    if ! rsync -av --exclude='.git' "$DEPLOY_DIR/" .; then
        print_error "Erro ao copiar arquivos com rsync"
        git checkout $ORIGINAL_BRANCH
        exit 1
    fi
else
    # Usa cp com método que funciona mesmo com padrões vazios
    print_info "Usando cp para copiar arquivos..."
    # Muda temporariamente para o diretório deploy e copia tudo
    (cd "$DEPLOY_DIR" && tar cf - .) | tar xf -
    if [ $? -ne 0 ]; then
        print_error "Erro ao copiar arquivos de $DEPLOY_DIR"
        print_info "Verifique se a pasta deploy/ contém arquivos válidos"
        print_info "Listando conteúdo de $DEPLOY_DIR:"
        ls -la "$DEPLOY_DIR" || true
        git checkout $ORIGINAL_BRANCH
        exit 1
    fi
fi

# Adiciona todos os arquivos ao staging
print_info "Adicionando arquivos ao staging..."
git add -A

# Verifica se há mudanças para commitar
if [ -z "$(git status --porcelain)" ]; then
    print_warning "Nenhuma mudança detectada. Nada para fazer deploy."
    git checkout $ORIGINAL_BRANCH
    exit 0
fi

# Cria o commit
COMMIT_MESSAGE="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
print_info "Criando commit: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE" --no-verify

# Faz push para o branch gh-pages
print_info "Fazendo push para origin/$DEPLOY_BRANCH..."
if git push -u origin $DEPLOY_BRANCH; then
    print_success "Deploy concluído com sucesso!"
    
    # Tenta detectar a URL do GitHub Pages
    REMOTE_URL=$(git config --get remote.origin.url)
    if [[ $REMOTE_URL =~ github.com[:/]([^/]+)/([^/]+) ]]; then
        OWNER="${BASH_REMATCH[1]}"
        REPO="${BASH_REMATCH[2]}"
        REPO="${REPO%.git}"  # Remove .git se existir
        print_info "A aplicação estará disponível em alguns minutos em:"
        print_info "https://${OWNER}.github.io/${REPO}/"
    else
        print_info "Configure o GitHub Pages nas configurações do repositório para:"
        print_info "Branch: $DEPLOY_BRANCH"
        print_info "Folder: / (root)"
    fi
else
    print_error "Erro ao fazer push. Verifique suas credenciais e permissões."
    git checkout $ORIGINAL_BRANCH
    exit 1
fi

# Volta para o branch original
print_info "Voltando para o branch $ORIGINAL_BRANCH..."
git checkout $ORIGINAL_BRANCH

print_success "Deploy finalizado! O GitHub Pages será atualizado em alguns minutos."

