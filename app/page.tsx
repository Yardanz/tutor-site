import Image from "next/image";
import Link from "next/link";
import { CertificatesGallery } from "@/components/site/CertificatesGallery";
import { TeacherPortrait } from "@/components/site/TeacherPortrait";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { TELEGRAM_URL } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const helpItems = [
  "Подтянуть оценки и уверенность на уроках",
  "Закрыть пробелы в грамматике и лексике",
  "Подготовиться к ОГЭ/ЕГЭ по структуре экзамена",
  "Разговориться: понимать речь и отвечать без «ступора»",
  "Научиться учиться: план, привычка, контроль прогресса",
];

const lessonItems = [
  "Только онлайн (Zoom/Google Meet)",
  "Индивидуальная программа под уровень и цель",
  "Домашние задания - по силам, с проверкой и разбором",
  "Материалы и опоры после уроков (в разделе «Материалы»)",
  "Регулярные мини-проверки, чтобы видеть рост",
];

const faqItems = [
  {
    question: "С какого возраста берете?",
    answer: "Работаю с детьми и подростками (точный возраст можно уточнить в сообщении).",
  },
  {
    question: "Сколько длится занятие?",
    answer: "Обычно 60 минут, при необходимости можно подстроить.",
  },
  {
    question: "Можно ли без домашки?",
    answer: "Можно, но с домашней работой прогресс заметно быстрее.",
  },
  {
    question: "Что нужно для занятий?",
    answer: "Интернет, наушники/микрофон и удобный способ вести заметки.",
  },
];

type FeaturedPost = {
  title: string;
  slug: string;
  content: string;
  isPinned: boolean;
  coverAttachmentId: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
  attachments: {
    id: number;
    url: string;
    mimeType: string;
    filename: string;
  }[];
  coverAttachment: {
    id: number;
    url: string;
    mimeType: string;
    filename: string;
  } | null;
} | null;

function formatRuDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function excerptFromMarkdown(content: string) {
  const plain = content
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1")
    .replace(/[#>*_`~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return plain.length > 160 ? `${plain.slice(0, 160)}...` : plain;
}

function pickNewest<T extends { publishedAt: Date | null; updatedAt: Date }>(items: T[]) {
  if (!items.length) return null;

  return items.reduce((best, current) => {
    const bestTime = (best.publishedAt ?? best.updatedAt).getTime();
    const currentTime = (current.publishedAt ?? current.updatedAt).getTime();
    return currentTime > bestTime ? current : best;
  });
}

function isImageAttachment(attachment: { mimeType?: string | null; filename?: string | null; url?: string | null }) {
  const mime = attachment.mimeType?.toLowerCase();
  if (mime?.startsWith("image/")) return true;

  const source = (attachment.filename || attachment.url || "").toLowerCase();
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(source);
}

function isGifAttachment(attachment: { mimeType?: string | null; filename?: string | null; url?: string | null }) {
  const mime = attachment.mimeType?.toLowerCase();
  if (mime === "image/gif") return true;

  const source = (attachment.filename || attachment.url || "").toLowerCase();
  return /\.gif$/i.test(source);
}

async function getFeaturedPost(): Promise<FeaturedPost> {
  const select = {
    title: true,
    slug: true,
    content: true,
    isPinned: true,
    coverAttachmentId: true,
    publishedAt: true,
    updatedAt: true,
    attachments: {
      select: {
        id: true,
        url: true,
        mimeType: true,
        filename: true,
      },
    },
    coverAttachment: {
      select: {
        id: true,
        url: true,
        mimeType: true,
        filename: true,
      },
    },
  } as const;

  const pinnedPublished = await prisma.post.findMany({
    where: { isPublished: true, isPinned: true },
    select,
  });

  const pinned = pickNewest(pinnedPublished);
  if (pinned) return pinned;

  const published = await prisma.post.findMany({
    where: { isPublished: true },
    select,
  });

  return pickNewest(published);
}

export default async function HomePage() {
  const featuredPost = await getFeaturedPost();
  const featuredImage =
    (featuredPost?.coverAttachment && isImageAttachment(featuredPost.coverAttachment)
      ? featuredPost.coverAttachment
      : null) ?? featuredPost?.attachments.find((attachment) => isImageAttachment(attachment)) ?? null;
  const isFeaturedGif = featuredImage ? isGifAttachment(featuredImage) : false;

  return (
    <main className="container-page max-w-6xl py-8 md:py-12">
      <section className="card relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-slate-50/80 to-sky-50/60" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.15fr_0.85fr] md:gap-10">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {["Онлайн", "ОГЭ/ЕГЭ", "Дети и подростки"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[var(--border)] bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {chip}
                </span>
              ))}
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold leading-[1.08] md:text-5xl">
              Английский онлайн для школьников и подростков
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Подготовка к ОГЭ/ЕГЭ и уверенный прогресс в школе - по понятной системе и без перегруза
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild>
                <a href={TELEGRAM_URL} target="_blank" rel="noopener">
                  Записаться в Telegram
                </a>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/materials">Смотреть материалы</Link>
              </Button>
            </div>
          </div>

          <div>
            <TeacherPortrait src="/images/ekaterina.jpg" alt="Екатерина Драндина" />
            <p className="mt-3 text-center text-sm text-slate-600">Екатерина Драндина • репетитор по английскому</p>
          </div>
        </div>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-2xl font-bold">С чем помогу</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {helpItems.map((item) => (
            <li key={item} className="rounded-xl border border-[var(--border)] bg-white p-4 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-2xl font-bold">Как проходят занятия</h2>
        <ul className="mt-4 space-y-3 text-slate-700">
          {lessonItems.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-slate-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-2xl font-bold">О преподавателе</h2>
        <p className="mt-3 max-w-4xl leading-7 text-slate-700">
          Екатерина Драндина - репетитор по английскому языку. Занимаюсь онлайн с детьми и подростками: помогаю
          подтянуть школьную программу и готовлю к ОГЭ/ЕГЭ. Работаю по понятному плану, с регулярной практикой и
          разбором ошибок, чтобы прогресс был заметен уже в первые недели.
        </p>
        <p className="mt-3 font-semibold text-slate-900">Опыт: N лет.</p>

        <h3 className="mt-6 text-xl font-bold">Образование и квалификация</h3>
        <ul className="mt-3 space-y-2 text-slate-700">
          <li>Московский Педагогический Государственный Университет, 2025 г.</li>
          <li>
            Педагогическое образование, «Иностранный язык (английский) и Информационные технологии в образовании».
          </li>
          <li>CELTA (Certificate in English Language Teaching to Adults), Cambridge English, 2025 г.</li>
          <li>TEFL/TESOL certificate, INTERNATIONAL CERTIFICATION LTD, 250 часов, 2024 г.</li>
        </ul>

        <h3 className="mt-6 text-xl font-bold">Сертификаты</h3>
        <CertificatesGallery />
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-2xl font-bold">Материалы</h2>
        {featuredPost ? (
          <article className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              {featuredImage ? (
                <div className="w-full max-w-full md:w-[240px] md:max-w-[240px] md:flex-none">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--border)] bg-slate-100">
                    {isFeaturedGif ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featuredImage.url}
                        alt={featuredPost.title}
                        className="h-full w-full object-cover object-[50%_35%]"
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src={featuredImage.url}
                        alt={featuredPost.title}
                        fill
                        className="object-cover object-[50%_35%]"
                        sizes="(max-width: 768px) 100vw, 240px"
                      />
                    )}
                  </div>
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {featuredPost.isPinned ? (
                    <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-slate-700">
                      📌 Закреплено
                    </span>
                  ) : null}
                  <span>{formatRuDate(featuredPost.publishedAt ?? featuredPost.updatedAt)}</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{featuredPost.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{excerptFromMarkdown(featuredPost.content)}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild variant="secondary">
                    <Link href={`/materials/${featuredPost.slug}`}>Читать</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/materials">Все материалы</Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ) : (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="text-slate-700">Материалы скоро появятся</p>
            <div className="mt-3">
              <Button asChild variant="secondary">
                <Link href="/materials">Перейти в материалы</Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-2xl font-bold">FAQ</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-xl border border-[var(--border)] bg-white p-4">
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contacts" className="mt-6 card p-6">
        <h2 className="text-2xl font-bold">Запись на занятия</h2>
        <p className="mt-3 text-slate-700">Напишите в Telegram - отвечу, уточню цель и предложу удобное время.</p>
        <div className="mt-4">
          <Button asChild>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener">
              Записаться в Telegram
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
