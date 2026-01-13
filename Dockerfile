# syntax=docker/dockerfile:1
FROM node:18-alpine AS builder

WORKDIR /app

# install all deps (including devDependencies for build)
COPY package*.json ./
RUN npm install

COPY . .

# build TypeScript
RUN npm run build

# production stage
FROM node:18-alpine

WORKDIR /app

# install production deps only
COPY package*.json ./
RUN npm install --production

# copy built files from builder
COPY --from=builder /app/dist ./dist

# copy static files
COPY public ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
