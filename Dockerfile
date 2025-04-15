ARG NODE_VERSION=${NODE_VERSION:-22}-alpine

FROM node:${NODE_VERSION}

USER node

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Nerf our postinstall script
RUN \
  mv package.json package.json.bkp && \
  cat package.json.bkp > package.json && \
  rm package.json.bkp && \
  npm pkg set scripts.postinstall="echo Skipping postinstall..."

# Install dependencies with production flag to keep the image small
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the necessary port (adjust as needed)
EXPOSE 3000

ENV NODE_ENV=production
ENV NODE_OPTIONS="--disable-warning=ExperimentalWarning --experimental-strip-types"

# Set the command to start the application
CMD ["node", "--env-file-if-exists", ".env", "--require", "./src/utils/instrumentation.ts", "src/index.ts"]
