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
  const folderPath = `${folderMain}/${projectName}`

  cloudinary.config({
    cloud_name: config.cloudinaryName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  })

  const finalOptions = {
    folder: `${folderPath.toLowerCase()}/${options.targetFolder}`,
    resource_type: options.resourceType || 'image',
    ...(options.publicId && { public_id: options.publicId })
  }

  // Se for um Buffer (como o nosso ZIP)
  if (Buffer.isBuffer(file)) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(finalOptions, (error, result) => {
        if (error) return reject(error)
        resolve({ url: result?.secure_url, public_id: result?.public_id })
      })
      Readable.from(file).pipe(uploadStream)
    })
  }

  // Se for uma string (como o Base64 da sua API de imagem antiga)
  const uploadResponse = await cloudinary.uploader.upload(file, finalOptions)
  return {
    url: uploadResponse.secure_url,
    public_id: uploadResponse.public_id,
  }
}