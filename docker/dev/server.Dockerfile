FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
