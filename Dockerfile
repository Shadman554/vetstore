FROM node:20-slim
RUN npm install -g pnpm@10
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY scripts/package.json ./scripts/

RUN pnpm install --frozen-lockfile

COPY . .

RUN BASE_PATH=/ PORT=3000 pnpm --filter @workspace/kid-store run build
RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter @workspace/db run push-force 2>&1 || true; node --enable-source-maps backend/dist/index.mjs"]
