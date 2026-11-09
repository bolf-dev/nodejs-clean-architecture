import type { StoredToken } from '@/auth/token-storage'
import { request } from './client'

export function logIn(email: string, password: string): Promise<StoredToken> {
  return request<StoredToken>('POST', '/v1/auth/login', { email, password })
}
