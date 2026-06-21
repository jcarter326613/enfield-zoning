FROM public.ecr.aws/docker/library/node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY node_modules ./node_modules
COPY dist ./dist
COPY .env ./.env

ENTRYPOINT ["node", "/app/dist/lambda-main.js"]