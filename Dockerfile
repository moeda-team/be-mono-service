# Use a stable Node.js version with Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy the rest of the app
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Expose the development port
EXPOSE 3000

# Start the app (e.g., using ts-node-dev or nodemon)
CMD ["npm", "run", "dev"]
