FROM nginx:alpine

# Remove default configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy web files
COPY . /usr/share/nginx/html

EXPOSE 80
EXPOSE 3030

CMD ["nginx", "-g", "daemon off;"]
