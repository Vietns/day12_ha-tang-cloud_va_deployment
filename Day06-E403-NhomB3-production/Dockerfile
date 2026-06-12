FROM node:20-alpine AS runtime

WORKDIR /app

COPY package*.json ./
COPY codebase/ ./codebase/
COPY .env.example ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 8080) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "codebase/server.js"]
