'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { login, register, type AuthState } from '@/app/actions/auth';
import { Button, ErrorText, Input, Label } from './ui';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === 'login' ? login : register, undefined);
  return (
    <form action={action} className="space-y-4">
      {mode === 'register' && (
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Optional" defaultValue={state?.name} />
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state?.email} required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required />
      </div>
      <ErrorText>{state?.error}</ErrorText>
      <Button type="submit" disabled={pending} className="w-full">{pending ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</Button>
      <p className="text-center text-sm text-muted">
        {mode === 'login' ? (
          <>No account? <Link href="/register" className="text-accent">Sign up</Link></>
        ) : (
          <>Already have one? <Link href="/login" className="text-accent">Log in</Link></>
        )}
      </p>
    </form>
  );
}
