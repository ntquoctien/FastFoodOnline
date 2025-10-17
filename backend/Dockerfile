FROM node:20

WORKDIR /app

# Install dependencies based on package metadata
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Expose the API port
EXPOSE 4000

# Run the development server with live reload
CMD ["npm", "run", "server"]
