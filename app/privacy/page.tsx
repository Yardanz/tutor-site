import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { TELEGRAM_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Краткая информация об обработке технических данных на сайте.",
};

export default function PrivacyPage() {
  return (
    <main className="container-page max-w-6xl py-10">
      <section className="card mx-auto max-w-3xl p-6 md:p-8">
        <h1 className="text-3xl font-extrabold">Политика конфиденциальности</h1>
        <div className="mt-4 space-y-4 leading-7 text-slate-700">
          <p>Сайт не собирает персональные данные через формы и не предоставляет личный кабинет посетителям.</p>
          <p>Для корректной работы сайта могут обрабатываться технические данные (например, IP-адрес и cookies).</p>
          <p>По вопросам можно написать в Telegram: @ekaterinadrk.</p>
        </div>
        <div className="mt-6">
          <Button asChild>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener">
              Написать в Telegram
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
