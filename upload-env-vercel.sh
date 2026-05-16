#!/bin/bash

# Script para subir variáveis do .env local para a Vercel

echo "🚀 Iniciando upload de variáveis de ambiente para a Vercel..."

# Verifica se .env existe
if [ ! -f .env ]; then
    echo "❌ Erro: Arquivo .env não encontrado!"
    exit 1
fi

# Linkar o projeto se ainda não estiver
vercel link --yes

# Loop para ler o arquivo .env
# Ignora comentários (#) e linhas vazias
grep -v '^#' .env | grep -v '^$' | while IFS='=' read -r key value; do
    # Remove aspas se existirem no valor
    clean_value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    echo "📤 Enviando: $key..."
    
    # Tenta adicionar a variável para os 3 ambientes (production, preview, development)
    # Usamos printf para passar o valor e evitar problemas com caracteres especiais
    printf "%s" "$clean_value" | vercel env add "$key" production --force &> /dev/null
    printf "%s" "$clean_value" | vercel env add "$key" preview --force &> /dev/null
    printf "%s" "$clean_value" | vercel env add "$key" development --force &> /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ $key configurada."
    else
        echo "⚠️  Aviso: Falha ao configurar $key (pode já existir ou ser inválida)."
    fi
done

echo ""
echo "✨ Todas as variáveis do .env foram enviadas!"
echo "💡 Nota: Use 'vercel env pull' para sincronizar de volta se necessário."
