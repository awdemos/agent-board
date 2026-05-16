FROM oven/bun:1.3.13 AS builder

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock bunfig.toml turbo.json ./
COPY packages/app/package.json ./packages/app/
COPY packages/core/package.json ./packages/core/
COPY packages/desktop/package.json ./packages/desktop/
COPY packages/enterprise/package.json ./packages/enterprise/
COPY packages/function/package.json ./packages/function/
COPY packages/http-recorder/package.json ./packages/http-recorder/
COPY packages/llm/package.json ./packages/llm/
COPY packages/opencode/package.json ./packages/opencode/
COPY packages/opencode/script ./packages/opencode/script
COPY packages/plugin/package.json ./packages/plugin/
COPY packages/script/package.json ./packages/script/
COPY packages/slack/package.json ./packages/slack/
COPY packages/storybook/package.json ./packages/storybook/
COPY packages/ui/package.json ./packages/ui/
COPY packages/web/package.json ./packages/web/
COPY packages/sdk/js/package.json ./packages/sdk/js/
COPY packages/console/app/package.json ./packages/console/app/
COPY packages/console/core/package.json ./packages/console/core/
COPY packages/console/function/package.json ./packages/console/function/
COPY packages/console/mail/package.json ./packages/console/mail/
COPY packages/console/resource/package.json ./packages/console/resource/
COPY patches ./patches

RUN bun install --frozen-lockfile

COPY packages/app ./packages/app
COPY packages/sdk/js ./packages/sdk/js
COPY packages/ui ./packages/ui
COPY packages/core ./packages/core
COPY packages/opencode ./packages/opencode

RUN bun --cwd packages/app build

FROM nginx:alpine

COPY --from=builder /app/packages/app/dist /usr/share/nginx/html
COPY packages/app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
