import { NuxtAuthHandler } from '#auth'
import Google from '@auth/core/providers/google'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import mongoose from 'mongoose'

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  adapter: MongoDBAdapter(mongoose.connection.db as any),
  providers: [
    // @ts-expect-error import issue
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
})
