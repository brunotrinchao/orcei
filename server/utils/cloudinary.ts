import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

/**
 * Função utilitária centralizada para upload no Cloudinary
 */
export async function uploadToCloudinary(
  file: string | Buffer, 
  options: { targetFolder: string; resourceType?: 'image' | 'raw'; publicId?: string }
) {
  const config = useRuntimeConfig()
  const projectName = config.appName
  const folderMain = config.appEnv
  const sanitize = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').toLowerCase() : ''
  const folderPath = `${sanitize(folderMain)}/${sanitize(projectName)}`

  cloudinary.config({
    cloud_name: config.cloudinaryName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  })

  const finalOptions = {
    folder: `${folderPath.toLowerCase()}/${options.targetFolder}`,
    resource_type: options.resourceType || 'image',
    access_mode: 'public',
    use_filename: true,
    unique_filename: true,
    ...(options.publicId && { public_id: options.publicId })
  }

  // Se for um Buffer (como o nosso ZIP)
  if (Buffer.isBuffer(file)) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(finalOptions, (error, result) => {
        if (error) return reject(error)
          // Gerar URL assinada para arquivos raw para garantir acesso público
          let finalUrl = result?.secure_url;
          if (options.resourceType === 'raw' && result?.public_id) {
            finalUrl = cloudinary.url(result.public_id, {
              resource_type: 'raw',
              type: 'upload',
              secure: true,
              sign_url: true,
              flags: 'attachment'
            });
          }

          resolve({ 
            url: finalUrl, 
            public_id: result?.public_id,
            size: result?.bytes,              // Tamanho em bytes
            created_at: result?.created_at    // Data de geração enviada pelo Cloudinary (ISO String)
          })
        })
      Readable.from(file).pipe(uploadStream)
    })
  }

  // Se for uma string (como o Base64 da sua API de imagem antiga)
  const uploadResponse = await cloudinary.uploader.upload(file, finalOptions)
  let finalUrlResponse = uploadResponse.secure_url;
  if (options.resourceType === 'raw') {
    finalUrlResponse = cloudinary.url(uploadResponse.public_id, {
      resource_type: 'raw',
      type: 'upload',
      secure: true,
      sign_url: true,
      flags: 'attachment'
    });
  }

  return {
    url: finalUrlResponse,
    public_id: uploadResponse.public_id,
    size: uploadResponse.bytes,             // Tamanho em bytes
    created_at: uploadResponse.created_at
  }
}