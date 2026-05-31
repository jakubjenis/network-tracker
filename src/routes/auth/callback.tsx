import { createFileRoute } from '@tanstack/react-router'
import { handleGoogleCallback } from '../../serverFns/auth'

export const Route = createFileRoute('/auth/callback')({
  loader: () => handleGoogleCallback(),
  component: () => (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-[var(--sea-ink-soft)]">Signing in…</p>
    </div>
  ),
})
