'use client';
import { deleteLinkAction } from '@/app/actions/links';
import { Button } from './ui';

export function DeleteLinkButton({ id, slug }: { id: string; slug: string }) {
  return (
    <form
      action={deleteLinkAction}
      onSubmit={(e) => {
        if (!confirm(`Delete /${slug}? Anyone using it will get a 404.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">Delete</Button>
    </form>
  );
}
