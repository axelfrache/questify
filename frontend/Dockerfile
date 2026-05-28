FROM node:20-alpine AS build

LABEL org.opencontainers.image.title="Questify Frontend"
LABEL org.opencontainers.image.description="Questify Frontend Application"
LABEL org.opencontainers.image.source="https://github.com/axelfrache/questify"

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_OIDC_ISSUER_URL=""
ARG VITE_OIDC_CLIENT_ID=""
ARG VITE_OIDC_REDIRECT_URI=""
ARG VITE_OIDC_SCOPES="openid profile email roles"

ENV VITE_OIDC_ISSUER_URL=$VITE_OIDC_ISSUER_URL
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
ENV VITE_OIDC_REDIRECT_URI=$VITE_OIDC_REDIRECT_URI
ENV VITE_OIDC_SCOPES=$VITE_OIDC_SCOPES

RUN pnpm run build

FROM nginxinc/nginx-unprivileged:alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
