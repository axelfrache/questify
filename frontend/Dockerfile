FROM node:20-alpine AS build

LABEL org.opencontainers.image.title="Questify Frontend"
LABEL org.opencontainers.image.description="Questify Frontend Application"
LABEL org.opencontainers.image.source="https://github.com/axelfrache/questify"

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM nginxinc/nginx-unprivileged:alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["/docker-entrypoint.sh"]
