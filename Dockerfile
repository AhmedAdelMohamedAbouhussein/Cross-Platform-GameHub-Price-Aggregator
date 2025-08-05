# Stage 1: Use official Node.js image to build the app
FROM node:22.17.1 AS build

# Set the working directory in the container
WORKDIR /app

# Copy only package files to install dependencies first
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies cleanly and reproducibly
RUN npm ci

# Copy the rest of the source code
COPY frontend ./
COPY docker ./

# Build the production app
RUN npm run build


#FROM node:22.17.1 AS build	                    Uses Node.js v22.17.1 as the base image for building.
#WORKDIR /app	                                Creates and sets /app as the working directory.
#COPY package.json package-lock.json ./	        Copies dependency files separately for better caching.
#RUN npm ci	                                    Installs dependencies in a clean and reproducible way.
#COPY . .	                                    Copies your app source code into the image.
#RUN npm run build	                            Builds your app for production, typically outputs to dist/ or build/.
