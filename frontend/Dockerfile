# --- Build stage ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Bake the backend URL in at build time (override with --build-arg if needed)
ARG VITE_API_URL=http://localhost:8000
ARG VITE_DEV_USER_ID

# Vite environment variables are baked into the frontend during build.
ENV VITE_DEV_USER_ID=$VITE_DEV_USER_ID
ENV VITE_API_URL=$VITE_API_URL


RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
