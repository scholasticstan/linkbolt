import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { Card } from '@/components/ui';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Log in' };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/dashboard');
  return (
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      <Card><AuthForm mode="login" /></Card>
    </div>
  );
}
