declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    creditsBalance: number
    role?: 'user' | 'admin'
  }

  interface UserSession {
    user: User
    loggedInAt: number
  }
}

export {}
