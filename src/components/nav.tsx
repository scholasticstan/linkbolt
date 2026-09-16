import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { logout } from '@/app/actions/auth';

export async function Nav() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-bg">⚡</span>
          LinkBolt
        </Link>
        <nav className="flex shrink-0 items-center gap-1 text-sm">
          <Link href="/docs" className="hidden rounded-md px-3 py-1.5 text-muted hover:text-ink sm:inline">API</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-muted hover:text-ink">Dashboard</Link>
              <Link href="/dashboard/settings" className="hidden rounded-md px-3 py-1.5 text-muted hover:text-ink sm:inline">Settings</Link>
              <form action={logout}>
                <button className="whitespace-nowrap rounded-md px-3 py-1.5 text-muted hover:text-ink">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-1.5 text-muted hover:text-ink">Log in</Link>
              <Link href="/register" className="rounded-md bg-accent px-3 py-1.5 font-medium text-bg hover:bg-[#93adff]">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
