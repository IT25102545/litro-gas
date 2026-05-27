# Stage 1: build
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build the Vite frontend
COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:18-alpine AS runtime

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built frontend and Express server from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

EXPOSE 3000

CMD ["node", "server.js"]
