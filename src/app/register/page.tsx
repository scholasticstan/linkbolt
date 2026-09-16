import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { Card } from '@/components/ui';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Sign up' };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/dashboard');
  return (
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="mb-1 text-2xl font-semibold">Create an account</h1>
      <p className="mb-6 text-sm text-muted">Permanent links, custom slugs, analytics and API keys.</p>
      <Card><AuthForm mode="register" /></Card>
    </div>
  );
}
