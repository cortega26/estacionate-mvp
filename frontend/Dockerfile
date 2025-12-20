FROM node:18-alpine

WORKDIR /app

# Copy package info
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build Vite App
RUN npm run build

EXPOSE 5173

# Serve using Vite Preview (allows host access)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
