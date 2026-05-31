import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestUrl, setCookie } from '@tanstack/react-start/server'
import { Google, generateCodeVerifier, generateState } from 'arctic'
import {
  ALLOWED_EMAILS,
  clearSession,
  getSessionEmail,
  setSessionEmail,
} from '../lib/session.server'

function googleClient(origin: string) {
  return new Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${origin}/auth/callback`,
  )
}

export const getUser = createServerFn({ method: 'GET' }).handler(() => {
  return getSessionEmail()
})

export const initiateGoogleLogin = createServerFn({
  method: 'GET',
}).handler(async () => {
  const origin = getRequestUrl().origin
  const google = googleClient(origin)

  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const url = google.createAuthorizationURL(state, codeVerifier, [
    'email',
    'profile',
  ])

  setCookie('google_state', state, { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax' })
  setCookie('google_verifier', codeVerifier, { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax' })

  return url.toString()
})

export const handleGoogleCallback = createServerFn({
  method: 'GET',
}).handler(async () => {
  const reqUrl = getRequestUrl()
  const code = reqUrl.searchParams.get('code') ?? ''
  const state = reqUrl.searchParams.get('state') ?? ''

  const storedState = getCookie('google_state')
  const storedVerifier = getCookie('google_verifier')

  if (!code || !storedState || !storedVerifier || state !== storedState) {
    throw redirect({ to: '/login', search: { error: 'invalid_state' } })
  }

  const google = googleClient(reqUrl.origin)
  const tokens = await google.validateAuthorizationCode(code, storedVerifier)

  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokens.accessToken()}` },
  })
  const user = (await res.json()) as { email: string; name?: string }

  if (!ALLOWED_EMAILS.has(user.email)) {
    throw redirect({ to: '/login', search: { error: 'unauthorized' } })
  }

  setSessionEmail(user.email)
  throw redirect({ to: '/' })
})

export const logout = createServerFn({ method: 'POST' }).handler(() => {
  clearSession()
})
