import { v2 as cloudinary } from 'cloudinary'
import { checkRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  // Rate Limit: 5 uploads per 1 minute
  checkRateLimit(event, { max: 5, windowMs: 60 * 1000, keyPrefix: 'upload' })

  const config = useRuntimeConfig()

  const projectName = config.appName
  const folderMain = config.appEnv
  const folderPath = `${folderMain}/${projectName}`

  cloudinary.config({
    cloud_name: config.cloudinaryName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  })

  const body = await readBody(event)
  const { image, folder } = body

  if (!image) {
    throw createError({
      statusCode: 400,
      message: 'Image is required',
    })
  }

  // 1. Validate MIME type
  if (!image.startsWith('data:image/')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid file type. Only images are allowed.',
    })
  }

  // 2. Validate Size (~10MB limit). Base64 is ~4/3 larger than binary.
  if (image.length > 13.5 * 1024 * 1024) {
    throw createError({
      statusCode: 413,
      message: 'File too large. Maximum size is 10MB.',
    })
  }

  // 3. Whitelist folders to prevent Path Traversal
  const allowedFolders = ['catalog', 'logos', 'profiles']
  const targetFolder = allowedFolders.includes(folder) ? folder : 'logos'

  try {
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: `${folderPath.toLowerCase()}/${targetFolder}`,
      resource_type: 'image',
    })

    return {
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to upload image to Cloudinary',
    })
  }
})
