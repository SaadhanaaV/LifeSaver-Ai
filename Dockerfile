# Use an official lightweight Node.js runtime environment
FROM node:18-alpine

# Set the working directory inside the container image
WORKDIR /usr/src/app

# Copy package tracking manifests over first to optimize caching dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy all local project source files into the container directory
COPY . .

# Expose Port 5000 for network routing traffic variables
EXPOSE 5000

# Fire up your live Node server execution process
CMD [ "node", "server.js" ]