# Продакшн-деплой на Ubuntu VPS (РФ)  
Стек: `Next.js + PostgreSQL + локальные uploads` через `Docker Compose` + `Nginx` + `Let's Encrypt`.

## 1) Подготовка сервера
Подставьте ваш домен и убедитесь, что DNS `A` записи указывают на IP VPS.

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release git nginx certbot python3-certbot-nginx
```

Установка Docker Engine + Compose plugin:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker nginx
```

## 2) Развёртывание проекта
```bash
sudo mkdir -p /var/www/tutor-site
sudo chown -R $USER:$USER /var/www/tutor-site
cd /var/www/tutor-site
```

Скопируйте проект в эту папку (git clone/rsync/scp).

Создайте папку для файлов:

```bash
mkdir -p /var/www/tutor-site/uploads
```

## 3) Настройка env для продакшна
Создайте файл `/var/www/tutor-site/.env.production`:

```env
POSTGRES_DB=tutor_site
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me_db_password

DATABASE_URL=postgresql://postgres:change_me_db_password@db:5432/tutor_site?schema=public
JWT_SECRET=change_me_long_secret

ADMIN_EMAIL=owner@example.ru
ADMIN_PASSWORD=change_me_admin_password
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/ekaterinadrk
```

## 4) Запуск Docker Compose
```bash
cd /var/www/tutor-site
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Проверка контейнеров:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

## 5) Prisma миграции и seed
Применить миграции в контейнере приложения:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

Создать/обновить админа (seed):

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec app npx prisma db seed
```

## 6) Nginx reverse proxy
Скопируйте шаблон `nginx.conf` из проекта в конфиг сайта:

```bash
sudo cp /var/www/tutor-site/nginx.conf /etc/nginx/sites-available/tutor-site
```

Откройте файл и подставьте домен в `server_name`:
- `your-domain.ru`
- `www.your-domain.ru` (если используете)

Активируйте конфиг:

```bash
sudo ln -sf /etc/nginx/sites-available/tutor-site /etc/nginx/sites-enabled/tutor-site
sudo nginx -t
sudo systemctl reload nginx
```

`/uploads/` отдаётся напрямую с диска:
```nginx
location /uploads/ {
    alias /var/www/tutor-site/uploads/;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}
```

## 7) SSL (Let's Encrypt)
Получить сертификат:

```bash
sudo certbot --nginx -d your-domain.ru -d www.your-domain.ru
```

Проверить автообновление:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

## 8) Проверка после запуска
1. Откройте `https://your-domain.ru`.
2. Войдите в `/admin/login`.
3. Загрузите тестовый файл в пост.
4. Проверьте, что файл доступен по ссылке вида `/uploads/<filename>`.
5. Перезапустите контейнеры и убедитесь, что файл остался:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart
```

## 9) Обновление версии приложения
```bash
cd /var/www/tutor-site
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

## 10) Бэкапы (обязательно)
### Дамп PostgreSQL
```bash
mkdir -p /var/backups/tutor-site
docker compose --env-file /var/www/tutor-site/.env.production -f /var/www/tutor-site/docker-compose.prod.yml \
  exec -T db pg_dump -U postgres -d tutor_site > /var/backups/tutor-site/db-$(date +%F-%H%M).sql
```

### Бэкап uploads
```bash
tar -czf /var/backups/tutor-site/uploads-$(date +%F-%H%M).tar.gz -C /var/www/tutor-site uploads
```

Что бэкапить:
- PostgreSQL дампы
- папку `/var/www/tutor-site/uploads`
- файл окружения `/var/www/tutor-site/.env.production` (безопасно)
