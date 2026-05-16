#!/bin/bash

# Script de Configuração e Deploy Vercel - Orcei

echo "🚀 Iniciando configuração do ambiente Orcei..."

# 1. Instalar dependências do projeto
echo "📦 Instalando dependências do NPM..."
npm install

# 2. Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null
then
    echo "⚠️ Vercel CLI não encontrado. Instalando globalmente..."
    npm install -g vercel
else
    echo "✅ Vercel CLI já está instalado."
fi

# 3. Login na Vercel (se necessário)
echo "🔑 Verificando autenticação na Vercel..."
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "Sua sessão expirou ou você não está logado."
    vercel login
fi

# 4. Vincular projeto e configurar variáveis
echo "🔗 Vinculando projeto à Vercel e baixando variáveis de ambiente..."
# --yes aceita os defaults (criar novo projeto ou vincular existente)
vercel link --yes

# 5. Baixar variáveis locais para desenvolvimento (opcional)
echo "📥 Sincronizando variáveis de ambiente (.env.local)..."
vercel env pull .env.local

# 6. Executar build local para teste
echo "🛠️ Executando build de teste..."
npm run build

echo ""
echo "✅ Ambiente configurado com sucesso!"
echo "--------------------------------------------------------"
echo "Comandos úteis:"
echo "  vercel dev      - Iniciar ambiente de desenvolvimento local com Vercel"
echo "  vercel          - Deploy para ambiente de PREVIEW"
echo "  vercel --prod   - Deploy para ambiente de PRODUÇÃO"
echo "--------------------------------------------------------"
