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
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1
