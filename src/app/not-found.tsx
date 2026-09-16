import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-semibold">Not found</h1>
      <p className="mt-2 text-muted">That page does not exist.</p>
      <Link href="/" className="mt-6 inline-block text-accent">Back home</Link>
    </div>
  );
}
