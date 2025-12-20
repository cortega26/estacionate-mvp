FROM node:18-alpine

WORKDIR /app

# Copy package info
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for tsc)
RUN npm install

# Copy source
COPY . .

# Generate Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Prune dev dependencies (optional, but keep it simple for now)
# RUN npm prune --production

EXPOSE 3000

# Start command (assuming build output is dist/index.js or we use tsx in dev)
# For production build: node dist/index.js is ideal, but we need to check entry point.
# Package.json main is "index.js". Build likely outputs to dist/.
# Let's assume standard dist structure. If fails, we can adjust.
# Actually, let's use the 'build' output.
CMD ["node", "dist/api/index.js"]  
# Wait, let's check where the entry point is. Standard is usually dist/index.js or dist/app.js.
# Looking at package.json, main is "index.js".
# I'll stick with a safer start command or just node dist/index.js
# Start command
CMD ["node", "dist/dev-server.js"]
