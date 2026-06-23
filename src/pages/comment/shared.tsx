import RandomAvatar from '@/components/RandomAvatar';
import { FiExternalLink } from 'react-icons/fi';

export function CommentAvatar({ avatar }: { avatar?: string | null }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        className="size-9 shrink-0 rounded-full border border-slate-200/80 object-cover dark:border-strokedark"
      />
    );
  }
  return (
    <RandomAvatar className="size-9 shrink-0 rounded-full border border-slate-200/80 dark:border-strokedark" />
  );
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-w-0 items-center gap-1 text-primary transition-colors hover:underline"
    >
      <span className="truncate">{children}</span>
      <FiExternalLink size={12} className="shrink-0 opacity-60" />
    </a>
  );
}

export function StatusBadge({ status }: { status: number }) {
  if (status === 1) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        已通过
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
      待审核
    </span>
  );
}
