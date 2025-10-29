FROM node:20

# Allow the same Dockerfile to work whether the build context is the repo root
# (e.g. Render) or the backend folder itself (e.g. local docker compose).
ARG SERVICE_DIR=backend

WORKDIR /app

# Install production dependencies for the backend service only
COPY ${SERVICE_DIR}/package*.json ./
RUN npm install --omit=dev

# Copy backend source code
COPY ${SERVICE_DIR}/ ./

# Expose the API port
EXPOSE 4000

# Run the backend server
CMD ["npm", "run", "start"]
