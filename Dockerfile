# ビルドステージ
FROM node:22-slim AS builder

WORKDIR /app

# 依存関係のインストール
COPY package.json ./
RUN npm install

# ソースコードのコピーとビルド
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY src/ ./src/
RUN npm run build

# 実行ステージ
FROM node:22-slim

# 本番環境の依存関係のみインストール
COPY package.json ./
RUN npm install --omit=dev

# ビルドステージからビルド成果物をコピー
COPY --from=builder /app/dist ./dist

# アプリケーションの実行
CMD ["node", "dist/server.js"]