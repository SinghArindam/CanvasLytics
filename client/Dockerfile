# Stage 1: Install dependencies and build the app
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the built app from a minimal server
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]