FROM node:24-slim

RUN npm install -g pnpm@10.26.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/

RUN pnpm install --frozen-lockfile --filter kdaboa-backend

COPY apps/backend apps/backend
COPY apps/db apps/db

RUN pnpm --filter kdaboa-backend build

WORKDIR /app/apps/backend

EXPOSE 3333

CMD ["node", "dist/server.js"]
