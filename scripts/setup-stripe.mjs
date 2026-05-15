import Stripe from 'stripe';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load .env manually
const envPath = new URL('../.env', import.meta.url).pathname;
const envContent = readFileSync(envPath, 'utf8');
const stripeKey = envContent.match(/STRIPE_SECRET_KEY=(.*)/)?.[1]?.trim().replace(/['"]/g, '');

if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY not found in .env');
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

async function setup() {
  console.log('🚀 Iniciando configuração de planos no Stripe...');

  // 1. Plano Mensal
  const prodMonthly = await stripe.products.create({
    name: 'Orcei - Plano Mensal',
    description: 'Uso ilimitado de orçamentos, agenda e relatórios IA (Cobrança Mensal)',
  });
  const priceMonthly = await stripe.prices.create({
    product: prodMonthly.id,
    unit_amount: 1990,
    currency: 'brl',
    recurring: { interval: 'month' },
  });
  console.log(`✅ Plano Mensal criado: ${priceMonthly.id}`);

  // 2. Plano Anual
  const prodAnnual = await stripe.products.create({
    name: 'Orcei - Plano Anual',
    description: 'Acesso completo com 15% de desconto (Cobrança Anual)',
  });
  const priceAnnual = await stripe.prices.create({
    product: prodAnnual.id,
    unit_amount: 19990,
    currency: 'brl',
    recurring: { interval: 'year' },
  });
  console.log(`✅ Plano Anual criado: ${priceAnnual.id}`);

  // 3. Crédito Avulso
  const prodCredit = await stripe.products.create({
    name: 'Orcei - Crédito Avulso',
    description: '1 crédito para emissão de um orçamento profissional',
  });
  const priceCredit = await stripe.prices.create({
    product: prodCredit.id,
    unit_amount: 599,
    currency: 'brl',
  });
  console.log(`✅ Crédito Avulso criado: ${priceCredit.id}`);

  console.log('\n📌 COPIE ESTES IDs PARA O SEU .ENV:');
  console.log(`STRIPE_PRICE_MONTHLY=${priceMonthly.id}`);
  console.log(`STRIPE_PRICE_ANNUAL=${priceAnnual.id}`);
  console.log(`STRIPE_PRICE_CREDIT=${priceCredit.id}`);
}

setup().catch(console.error);
