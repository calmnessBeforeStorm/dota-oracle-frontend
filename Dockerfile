# Production image: the built SPA behind nginx.
#
# Built and published by GitHub Actions on push to `main`, then pulled by the server - which
# is why this repository builds alone. An earlier layout put the SPA and the API in one image
# built from a directory holding both checkouts, and no CI job can do that: it checks out one
# repository.
#
# The API is not mentioned anywhere in here. Caddy puts both behind one origin, so the SPA
# calls /api and /ws with no base URL compiled in and no CORS to configure.

FROM node:22-alpine AS build

WORKDIR /app

# Dependencies first: this layer is cached until the lockfile changes, and it is the slow one.
COPY package.json package-lock.json ./
# `npm ci`, never `npm install`: it installs the lockfile exactly, and a production image
# quietly resolving a different tree than the one that was tested is not a build, it is a
# guess.
RUN npm ci

COPY . .
RUN npm run build


FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# wget rather than curl: busybox already has it, and an image that faces the network is not
# the place to add a package for a health check.
# 127.0.0.1, not localhost. The image resolves `localhost` to both 127.0.0.1 and ::1,
# busybox wget takes the v6 address, and nginx listens on IPv4 only - so the container
# reported `unhealthy` for its whole life while serving every real request correctly.
# Measured inside this image: wget to localhost is refused, wget to 127.0.0.1 answers.
#
# A check that is always red is worse than no check: it teaches you to ignore the column
# you need when something is genuinely broken, and it makes `depends_on: service_healthy`
# unusable against this container.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1
