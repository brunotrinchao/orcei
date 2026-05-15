import { v2 as cloudinary } from 'cloudinary'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
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

  try {
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: folderPath.toLowerCase() + (folder || '/logos'),
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
