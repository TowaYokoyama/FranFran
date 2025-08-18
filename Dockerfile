# Dockerfile

# ベースとなるNode.jsのバージョンを指定
FROM node:20-alpine

# アプリケーションの作業ディレクトリを作成
WORKDIR /app

# 最初にpackage.json関連ファイルのみをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# プロジェクトの全てのファイルをコピー
COPY . .

# Next.jsが使用するポート3000番を開放
EXPOSE 3000

# 開発サーバーを起動するコマンド
CMD ["npm", "run", "dev"]