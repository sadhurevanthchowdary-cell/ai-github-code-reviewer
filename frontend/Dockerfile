FROM node:18-alpine

WORKDIR /app

# Copy package requirements first for dependency caching
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy all source files
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# Start Vite with default dev script
CMD ["npm", "run", "dev"]
