declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    avatar?: string
    creditsBalance: number
    role?: 'user' | 'admin'
  }

  interface UserSession {
    user: User
    loggedInAt: number
    impersonatedBy?: { id: string; name: string } | null
  }
}

export {}
