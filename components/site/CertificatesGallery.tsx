"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type CertificateItem = {
  src: string;
  title: string;
};

const certificates: CertificateItem[] = [
  { src: "/certificates/cert-1.jpg", title: "CELTA, 2025" },
  { src: "/certificates/cert-2.jpg", title: "TEFL/TESOL, 2024" },
  { src: "/certificates/cert-3.jpg", title: "МПГУ, 2025" },
];

function CertificateCard({
  item,
  onOpen,
  onImageError,
  failed,
}: {
  item: CertificateItem;
  onOpen: () => void;
  onImageError: () => void;
  failed: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl border border-[var(--border)] bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md hover:ring-1 hover:ring-black/10"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-50">
        {failed ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Нет превью</div>
        ) : (
          <Image
            src={item.src}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 ease-out scale-90 group-hover:scale-100"
            onError={onImageError}
          />
        )}
      </div>
      <p className="mt-3 truncate text-center text-sm font-medium text-slate-700">{item.title}</p>
    </button>
  );
}

export function CertificatesGallery() {
  const [opened, setOpened] = useState<CertificateItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const closeModal = () => {
    setIsModalVisible(false);
    window.setTimeout(() => {
      setOpened(null);
    }, 180);
  };

  useEffect(() => {
    if (!opened) return;

    const timer = window.setTimeout(() => {
      setIsModalVisible(true);
    }, 10);

    return () => window.clearTimeout(timer);
  }, [opened]);

  useEffect(() => {
    if (!opened) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [opened]);

  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((item) => (
          <CertificateCard
            key={item.src}
            item={item}
            onOpen={() => {
              setOpened(item);
            }}
            failed={Boolean(failed[item.src])}
            onImageError={() => setFailed((prev) => ({ ...prev, [item.src]: true }))}
          />
        ))}
      </div>

      {opened ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200 ease-out ${
            isModalVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`relative w-full max-w-4xl transition-all duration-200 ease-out ${
              isModalVisible ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-white"
              aria-label="Закрыть"
            >
              X
            </button>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/30 bg-white">
              {failed[opened.src] ? (
                <div className="flex h-full w-full items-center justify-center text-slate-500">Не удалось загрузить изображение</div>
              ) : (
                <Image src={opened.src} alt={opened.title} fill className="object-contain bg-slate-100" sizes="100vw" />
              )}
            </div>
            <p className="mt-2 text-center text-sm text-slate-200">{opened.title}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
