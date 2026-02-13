import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-white/85 backdrop-blur">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="text-sm font-bold tracking-tight text-slate-900 md:text-base">
          Екатерина Драндина
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/materials" className="transition hover:text-slate-900">
            Материалы
          </Link>
          <Link href="/#contacts" className="transition hover:text-slate-900">
            Контакты
          </Link>
        </nav>
      </div>
    </header>
  );
}
