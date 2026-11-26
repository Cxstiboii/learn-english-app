import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-light-surface px-gutter-md py-gutter-xl text-light-on-surface">
      <main className="flex w-full max-w-md flex-col gap-gutter-lg">
        <header className="flex flex-col items-center gap-gutter-sm text-center">
          <div className="flex items-center gap-gutter-sm">
            <span className="flex size-8 items-center justify-center rounded-sm bg-light-primary font-mono text-label-md text-light-on-primary">
              df
            </span>
            <span className="font-headline text-headline-md tracking-tight text-light-on-surface">
              devfluent
            </span>
          </div>
          <p className="font-body text-body-md text-pretty text-light-on-surface-variant">
            Daily B1 → B2 English training for remote engineers, TOEFL &amp; IELTS.
          </p>
        </header>

        {children}

        <footer className="text-center font-mono text-label-sm text-light-on-surface-variant">
          Protected by Supabase Auth · JWT session
        </footer>
      </main>
    </div>
  )
}
