FROM node:24-alpine AS build

RUN npm install -g pnpm@11

WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY ui/package.json ./ui/
RUN pnpm install --frozen-lockfile --filter recipe-app...

COPY ui ./ui
RUN pnpm --filter recipe-app build

FROM nginx:alpine AS production
COPY --from=build /app/ui/dist /usr/share/nginx/html
