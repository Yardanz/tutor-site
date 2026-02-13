# Сайт репетитора (Next.js + Prisma + PostgreSQL + S3)

Русскоязычный сайт-визитка с публичной лентой материалов и приватной админкой для одного владельца.

## Стек

- `Next.js 16` (App Router, TypeScript)
- `Tailwind CSS v4`
- `Prisma ORM` + `PostgreSQL`
- `JWT` (httpOnly cookie, `sameSite=strict`)
- `bcryptjs` для хеша пароля
- `AWS SDK S3Client` для S3-совместимого хранилища
- Markdown: `remark/rehype` + `rehype-sanitize`

## Возможности

1. Публичные страницы:
   - `/` - визитка репетитора
   - `/materials?page=1` - лента материалов с пагинацией
   - `/materials/[slug]` - страница конкретного материала
2. Админка:
   - `/admin/login` - вход
   - `/admin` - список материалов, фильтр опубликовано/черновики
   - `/admin/new` - создать материал
   - `/admin/edit/[id]` - редактировать материал
3. API:
   - `POST /api/admin/login`
   - `POST /api/admin/logout`
   - `GET/POST /api/admin/posts`
   - `GET/PUT/DELETE /api/admin/posts/[id]`
   - `POST /api/admin/posts/[id]/attachments`
   - `DELETE /api/admin/attachments/[id]`
   - `GET /api/public/posts`
   - `GET /api/public/posts/[slug]`

## 1. Локальный запуск (максимально пошагово)

1. Скопируйте пример env:
```bash
cp .env.example .env
```
2. Поднимите PostgreSQL в Docker:
```bash
docker compose up -d
```
3. Установите зависимости:
```bash
npm install
```
4. Сгенерируйте Prisma Client:
```bash
npm run prisma:generate
```
5. Примените миграции:
```bash
npx prisma migrate deploy
```
6. Создайте админа из env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`):
```bash
npm run prisma:seed
```
7. Запустите проект:
```bash
npm run dev
```
8. Откройте:
   - Сайт: `http://localhost:3000`
   - Админка: `http://localhost:3000/admin/login`

## 2. Важные переменные окружения

Смотрите файл `.env.example`.

Критично проверить:
- `JWT_SECRET` - длинный случайный ключ
- `S3_PUBLIC_BASE_URL` - публичная база URL для файлов
- `S3_ENDPOINT`/`S3_REGION`/`S3_ACCESS_KEY`/`S3_SECRET_KEY`/`S3_BUCKET`

Пример `S3_PUBLIC_BASE_URL`:
- если бакет доступен по `https://storage.example.ru/my-bucket`, используйте именно это значение (без завершающего `/`).

## 3. Деплой на Ubuntu VPS + nginx + SSL (Let's Encrypt)

Ниже пример для VPS в РФ (Selectel/Timeweb/VK Cloud и т.д.).

1. Подготовьте сервер:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker nginx
```

2. Скопируйте проект на сервер в `/var/www/tutor-site`.

3. В корне проекта создайте и заполните `.env` (реальные секреты и S3).

4. Соберите и запустите приложение:
```bash
cd /var/www/tutor-site
docker compose -f docker-compose.prod.yml up -d --build
```

5. Настройте nginx (`/etc/nginx/sites-available/tutor-site`):
```nginx
server {
    listen 80;
    server_name your-domain.ru www.your-domain.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

6. Активируйте конфиг:
```bash
sudo ln -s /etc/nginx/sites-available/tutor-site /etc/nginx/sites-enabled/tutor-site
sudo nginx -t
sudo systemctl reload nginx
```

7. Выпустите SSL:
```bash
sudo certbot --nginx -d your-domain.ru -d www.your-domain.ru
```

8. Примените миграции и seed в контейнере:
```bash
docker exec -it tutor_app npx prisma migrate deploy
docker exec -it tutor_app npm run prisma:seed
```

9. Обновление при новых версиях:
```bash
cd /var/www/tutor-site
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker exec -it tutor_app npx prisma migrate deploy
```

## 4. Команды

- Запуск dev: `npm run dev`
- Линт: `npm run lint`
- Prisma generate: `npm run prisma:generate`
- Prisma migrate dev: `npm run prisma:migrate`
- Prisma seed: `npm run prisma:seed`
