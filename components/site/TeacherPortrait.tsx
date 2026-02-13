"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
};

function AvatarFallback() {
  return (
    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-3xl border border-[var(--border)] bg-slate-100">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-bold text-slate-600 shadow-sm">ЕД</div>
    </div>
  );
}

export function TeacherPortrait({ src, alt }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <AvatarFallback />;
  }

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition-[box-shadow,border-color,background-color] duration-200 ease-out hover:border-slate-300 hover:bg-white hover:shadow-[0_18px_44px_rgba(15,23,42,0.12)]">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.2rem]">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 460px" onError={() => setFailed(true)} />
      </div>
    </div>
  );
}
