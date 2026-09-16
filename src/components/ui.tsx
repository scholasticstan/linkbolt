import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const variants = {
  primary: 'bg-accent text-bg hover:bg-[#93adff]',
  ghost: 'border border-line bg-transparent text-ink hover:border-accent',
  danger: 'border border-line text-danger hover:border-danger',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink placeholder:text-dim focus:border-accent focus:outline-none ${className}`}
      {...props}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">{children}</label>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-card p-5 ${className}`}>{children}</div>;
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="text-sm text-danger">{children}</p>;
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-[0.85em] text-accent-2">{children}</code>;
}
