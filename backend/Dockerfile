# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies including dev (needed for build)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to Javascript
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package.json and lockfile for production installs
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
# Copy prisma client (it's generated into node_modules)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/index.js"]
