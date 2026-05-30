FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npx", "@softeria/ms-365-mcp-server", "--http", "8080"]
