import { defineEventHandler, getRouterParam, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const rawCep = getRouterParam(event, 'cep')
  const cep = rawCep?.replace(/\D/g, '')

  if (!cep || cep.length !== 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'CEP inválido. Deve conter 8 dígitos numéricos.'
    })
  }

  try {
    const data: any = await $fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (!data || data.erro) {
      throw createError({
        statusCode: 404,
        statusMessage: 'CEP não encontrado.'
      })
    }
    return {
      zip: cep,
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      complement: data.complemento || ''
    }
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error('Erro ao consultar ViaCEP no servidor:', e)
    throw createError({
      statusCode: 502,
      statusMessage: 'Falha ao consultar serviço de CEP.'
    })
  }
})
