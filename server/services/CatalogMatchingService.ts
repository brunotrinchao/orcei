import { GoogleGenerativeAI } from "@google/generative-ai"
import { CatalogItem } from '../models/CatalogItem'

export const CatalogMatchingService = {
  // Gera embedding de um texto via Gemini
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const config = useRuntimeConfig()
      if (!config.geminiApiKey) return []

      const genAI = new GoogleGenerativeAI(config.geminiApiKey)
      // text-embedding-004 foi descontinuado, migrando para gemini-embedding-001
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" })
      const result = await model.embedContent(text)
      return result.embedding.values
    } catch (error) {
      console.error('[CatalogMatchingService] Error generating embedding:', error)
      return [] // Retorna vetor vazio em caso de falha para não travar a aplicação
    }
  },

  // Similaridade de cosseno entre dois vetores
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0 // Evita erro se dimensões forem diferentes
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0))
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0))
    return dot / (magA * magB)
  },

  // Retorna os N itens do catálogo mais relevantes para o prompt
  async findRelevantItems(
    userPrompt: string,
    catalog: any[],
    topN: number = 8,
    threshold: number = 0.65
  ): Promise<any[]> {
    const promptEmbedding = await this.getEmbedding(userPrompt)

    const scored = await Promise.all(
      catalog.map(async (item) => {
        let itemEmbedding = item.embedding
        
        // Se não tiver embedding ou a dimensão for incompatível (migração de modelo), gera um novo
        // gemini-embedding-001 usa 3072 dimensões. text-embedding-004 usava 768.
        if (!itemEmbedding || itemEmbedding.length !== promptEmbedding.length) {
          try {
            const itemText = `${item.name}. ${item.description ?? ""}`
            itemEmbedding = await this.getEmbedding(itemText)
            await CatalogItem.updateOne({ _id: item._id }, { 
              $set: { 
                embedding: itemEmbedding,
                embeddingUpdatedAt: new Date()
              } 
            })
          } catch (e) {
            console.error(`[CatalogMatchingService] Error generating embedding for item ${item._id}:`, e)
            return { item, score: 0 }
          }
        }

        const score = this.cosineSimilarity(promptEmbedding, itemEmbedding)
        return { item, score }
      })
    )

    return scored
      .filter(({ score }) => score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(({ item }) => item)
  }
}
