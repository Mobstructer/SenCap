FROM node:20-alpine

WORKDIR /app

# Install deps first (better caching)
COPY package*.json ./
RUN npm install

# Copy rest of app
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]