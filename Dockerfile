ARG NODE_VERSION=${NODE_VERSION:-22}

FROM node:${NODE_VERSION}-alpine

USER node

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json lefthook.yml ./

# Install dependencies with production flag to keep the image small
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the necessary port (adjust as needed)
EXPOSE 3000

ENV NODE_ENV=production

# Set the command to start the application
CMD ["node",  "--env-file", ".env", "--require", "./src/init/instrumentation.ts", "src/index.ts"]