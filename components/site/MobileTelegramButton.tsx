import { Button } from "@/components/ui/Button";
import { TELEGRAM_URL } from "@/lib/site-config";

export function MobileTelegramButton() {
  return (
    <div className="fixed right-4 z-40 md:hidden" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}>
      <Button asChild className="h-12 rounded-full px-5 shadow-lg">
        <a href={TELEGRAM_URL} target="_blank" rel="noopener">
          <span aria-hidden="true" className="mr-2 inline-flex">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" focusable="false">
              <path d="M21.5 3.8c.3-.2.7-.2 1 .1.3.2.5.6.4 1l-3.4 16.1c-.1.6-.7 1-1.3.8l-4.8-1.8-2.6 2.3c-.3.2-.6.3-.9.2-.4-.1-.6-.4-.7-.8l-.3-5.1L2.8 14c-.4-.2-.7-.6-.7-1s.3-.8.8-.9L21.5 3.8Zm-2.9 3.1-9.9 7.9c-.2.2-.3.4-.3.6l.2 3.2 1.2-1.1c.3-.2.6-.3 1-.2l4.8 1.8 2.9-13.2Z" />
            </svg>
          </span>
          Записаться
        </a>
      </Button>
    </div>
  );
}
