import { createHmac } from 'node:crypto'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'

const COOKIE = 'nw_session'
export const ALLOWED_EMAILS = new Set([
  'jakubjenis@gmail.com',
  'nguyen.veronika@gmail.com',
])

function secret() {
  return process.env.SESSION_SECRET ?? 'dev-secret-change-before-deploying'
}

function sign(value: string): string {
  const mac = createHmac('sha256', secret()).update(value).digest('base64url')
  return `${value}.${mac}`
}

function unsign(signed: string): string | null {
  const i = signed.lastIndexOf('.')
  if (i < 0) return null
  const value = signed.slice(0, i)
  if (sign(value) !== signed) return null
  return value
}

export function getSessionEmail(): string | null {
  const raw = getCookie(COOKIE)
  if (!raw) return null
  const email = unsign(raw)
  if (!email || !ALLOWED_EMAILS.has(email)) return null
  return email
}

export function setSessionEmail(email: string): void {
  setCookie(COOKIE, sign(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

export function clearSession(): void {
  deleteCookie(COOKIE, { path: '/' })
}
