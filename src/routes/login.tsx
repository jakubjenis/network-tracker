import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { initiateGoogleLogin } from '../serverFns/auth'

export const Route = createFileRoute('/login')({
  validateSearch: (s) => ({ error: s.error as string | undefined }),
  component: LoginPage,
})

function isEmbeddedBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|MicroMessenger|Line\/|Snapchat|TikTok|BytedanceWebview|GSA\//.test(ua)
    || (/iPhone|iPod|iPad/.test(ua) && /WebView/.test(ua))
    || (!/Safari\//.test(ua) && /AppleWebKit/.test(ua) && /Mobile/.test(ua))
}

function LoginPage() {
  const { error } = useSearch({ from: '/login' })
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const embedded = typeof window !== 'undefined' && isEmbeddedBrowser()
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  function handleCopy() {
    navigator.clipboard?.writeText(pageUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleLogin() {
    setLoading(true)
    try {
      const url = await initiateGoogleLogin()
      window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="island-shell w-full max-w-sm rounded-3xl p-8 text-center">
        <div className="mb-6 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4fb8b2,#2f6a4a)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="white"/>
            </svg>
          </span>
        </div>

        <p className="island-kicker mb-1">Personal Finance</p>
        <h1 className="display-title mb-2 text-2xl font-bold text-[var(--sea-ink)]">
          Net Worth Tracker
        </h1>
        {embedded ? (
          <>
            <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
              Google sign-in is blocked inside in-app browsers (Facebook, Instagram, etc.).
              Open this page in Safari or Chrome to sign in.
            </p>
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <span className="flex-1 truncate text-left text-xs text-[var(--sea-ink-soft)]">{pageUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 rounded-lg px-3 py-1 text-xs font-semibold text-[var(--lagoon-deep)] transition hover:bg-[rgba(79,184,178,0.1)]"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)]">
              Copy the link and paste it into Safari or Chrome.
            </p>
          </>
        ) : (
          <>
            <p className="mb-8 text-sm text-[var(--sea-ink-soft)]">
              Sign in to access your dashboard
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error === 'unauthorized'
                  ? 'This Google account is not authorised.'
                  : 'Authentication failed. Please try again.'}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-5 py-3 text-sm font-semibold text-[var(--sea-ink)] shadow-sm transition hover:bg-[var(--surface)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              {loading ? 'Redirecting…' : 'Sign in with Google'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
