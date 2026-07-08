// Cobre www + domínio apex com o mesmo cookie: se o usuário inicia um fluxo
// (ex: OAuth) em um subdomínio (www.orceifacil.com.br) mas o callback sempre
// retorna para o domínio fixo do siteUrl (orceifacil.com.br), um cookie sem
// "domain" explícito não é enviado de volta e validações de state falham.
export function getCookieDomain(siteUrl: string): string | undefined {
  try {
    const hostname = new URL(siteUrl).hostname.replace(/^www\./, '')
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return undefined
    return `.${hostname}`
  } catch {
    return undefined
  }
}
