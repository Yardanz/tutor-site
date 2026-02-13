import Link from "next/link";
import { TELEGRAM_URL } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-white/85">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-slate-600">
        <p>© {new Date().getFullYear()} Екатерина Драндина</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/materials" className="hover:text-slate-900">
            Материалы
          </Link>
          <Link href="/privacy" className="hover:text-slate-900">
            Политика
          </Link>
          <a href={TELEGRAM_URL} target="_blank" rel="noopener" className="hover:text-slate-900">
            Telegram
          </a>
        </div>
      </div>
    </footer>
  );
}
