FROM node:18-slim AS build

WORKDIR /app

# Copy only package.json and tsconfig.json for faster install
COPY package.json tsconfig.json ./
RUN npm install -g typescript

# copy is not needed as we are using volumes for development
# # Copy the rest of the source files
# COPY src ./src

# Compile TypeScript files
RUN tsc

# Python runtime stage
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy is not needed as we are using volumes for development
# # Copy FastAPI app and static files
# COPY App.py .
# COPY manifest.webmanifest .
# COPY robots.txt .
# COPY src ./src
# COPY dist ./dist

# Expose port
EXPOSE 8000

# Start FastAPI with Uvicorn
CMD ["uvicorn", "App:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
