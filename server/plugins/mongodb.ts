import mongoose from 'mongoose'

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig()
  try {
    await mongoose.connect(process.env.MONGODB_URI!)
    console.log('MongoDB connected')
  } catch (e) {
    console.error('MongoDB connection error', e)
  }
})
