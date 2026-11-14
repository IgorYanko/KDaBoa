FROM node:24-slim

RUN npm install -g pnpm@10.26.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
# O postinstall do backend gera o client do Prisma a partir de apps/db.
COPY apps/db apps/db

RUN pnpm install --frozen-lockfile --filter kdaboa-backend

COPY apps/backend apps/backend

RUN pnpm --filter kdaboa-backend build

WORKDIR /app/apps/backend

EXPOSE 3333

# Aplica as migrations pendentes e sobe a API.
CMD ["pnpm", "start"]
