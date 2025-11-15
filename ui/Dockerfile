FROM node:24-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build:prod

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
