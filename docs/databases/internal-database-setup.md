# Internal MySQL Database Setup (Docker Compose)

This guide documents how to run a local, persistent MySQL instance for development using Docker Compose, with passwords stored as Docker secrets and an optional first‑time SQL import.

## Folder layout

```
researcher-platform/
└─ database/
   └─ docker/
      ├─ docker-compose.yml
      ├─ secrets/
      │  ├─ mysql_root_password
      │  └─ mysql_user_password
      ├─ db-init/
      │  └─ initial.sql  # first-time import (optional)
      └─ .env          # non-secret config (optional)
└─ docs/
   └─ databases/
      └─ internal-database-setup.md
```

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2 (part of Docker Desktop)
- MySQL client (e.g., `brew install mysql`)

If Docker CLI complaints about `docker-credential-desktop`:

```
echo 'export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Secrets and environment

- Place passwords in Docker secrets (one file per password):
  - `database/docker/secrets/mysql_root_password`
  - `database/docker/secrets/mysql_user_password`
- Non-secret values can go in `.env` (optional):
  - `database/docker/.env`
  - Example:

```
MYSQL_DATABASE=example_db
MYSQL_USER=admin
```

## First‑time SQL import (optional)

- Put your SQL dump(s) in `database/docker/db-init/` (e.g., `initial.sql`).
- The MySQL image auto‑executes all `.sql`/`.sql.gz` in `/docker-entrypoint-initdb.d` only when the data directory is empty (first initialization).
- If you have multiple scripts, prefix with numbers to control order (e.g., `01-init.sql`, `02-data.sql`).

## Start the database

From the repository root:

```
# Avoid unnecessary pulls if the image is already present
docker compose -f database/docker/docker-compose.yml up -d

# Follow logs until MySQL is ready
docker compose -f database/docker/docker-compose.yml logs -f mysql
```

The service uses `restart: unless-stopped`, so it will start automatically on reboot when Docker Desktop starts.

## Verify and connect

Check container status:

```
docker compose -f database/docker/docker-compose.yml ps
```

Connect via TCP (do not use the UNIX socket):

```
# App user
mysql -h 127.0.0.1 -P 3306 -u $MYSQL_USER -p $MYSQL_DATABASE

# Or specify explicitly if not using .env
mysql -h 127.0.0.1 -P 3306 -u admin -p example_db
```

List databases/tables (remember to quote names with hyphens):

```
SHOW DATABASES;
USE `example_db`;
SHOW TABLES;
```

## Re‑importing data later

If the volume was already initialized and you need to import again:

```
# From repo root, run an import inside the container
docker compose -f database/docker/docker-compose.yml exec -T mysql \
  bash -lc 'mysql -uroot -p"$(cat /run/secrets/mysql_root_password)" -D "example_db" -e "SOURCE /docker-entrypoint-initdb.d/initial.sql"'
```

Alternatively, stream a local dump file:

```
cat path/to/dump.sql | docker compose -f database/docker/docker-compose.yml exec -T mysql \
  bash -lc 'mysql -uroot -p"$(cat /run/secrets/mysql_root_password)" "example_db"'
```

## Troubleshooting

- Access denied for user `admin`@`…`:
  - Ensure the password matches `secrets/mysql_user_password`.
  - Ensure the user can connect from any host:

```
docker compose -f database/docker/docker-compose.yml exec mysql bash -lc '
  mysql -uroot -p"$(cat /run/secrets/mysql_root_password)" -e "
    CREATE USER IF NOT EXISTS \'admin\'@\'%\' IDENTIFIED BY \'$(cat /run/secrets/mysql_user_password)\';
    ALTER USER \'admin\'@\'%\' IDENTIFIED BY \'$(cat /run/secrets/mysql_user_password)\';
    GRANT ALL PRIVILEGES ON `example_db`.* TO \'admin\'@\'%\';
    FLUSH PRIVILEGES;"'
```

- Lost connection at reading initial packet:
  - Can happen during initialization; wait until logs show "ready for connections".
  - Test without SSL negotiation:

```
mysql --protocol=TCP --ssl-mode=DISABLED -h 127.0.0.1 -P 3306 -u admin -p example_db
```

- Prevent unwanted pulls during `up` if image exists locally:
  - Add `pull_policy: never` to the service or run `docker compose up --pull never -d`.

## Notes

- Consider pinning the image tag for stability (e.g., `mysql:8.4`) instead of `latest`.
- Healthcheck can target TCP explicitly (optional):

```
healthcheck:
  test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -P 3306 -uroot -p$(cat /run/secrets/mysql_root_password) || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 10
```
