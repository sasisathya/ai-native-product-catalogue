FROM node:22-bookworm-slim AS client-build
WORKDIR /build/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-bookworm-slim AS server-build
WORKDIR /build/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

FROM node:22-bookworm-slim AS server-production-dependencies
WORKDIR /build/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    CLIENT_DIST_DIR=/app/client/dist
WORKDIR /app

COPY --from=server-production-dependencies --chown=node:node /build/server/node_modules ./server/node_modules
COPY --from=server-build --chown=node:node /build/server/package.json ./server/package.json
COPY --from=server-build --chown=node:node /build/server/dist/src ./server/dist/src
COPY --from=client-build --chown=node:node /build/client/dist ./client/dist

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/dist/src/index.js"]
