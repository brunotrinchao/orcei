declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    creditsBalance: number
  }

  interface UserSession {
    user: User
    loggedInAt: number
  }
}

export {}
