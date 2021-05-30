FROM node:14 AS builder
# Create app directory
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:14
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY --from=builder /app/dist dist
CMD [ "npm", "start" ]
