# Stage 1: Build the Vite app
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install cleanly
RUN npm ci

# Copy all frontend files
COPY . .

# Build for production
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose Nginx default port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
