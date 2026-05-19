export interface UserDTO {
  id: string
  name: string
  email: string
  avatar?: string
  role?: 'user' | 'admin'
  creditsBalance?: number
}
