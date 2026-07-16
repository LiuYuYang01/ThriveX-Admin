# 使用国内代理 Node20 镜像
FROM docker.m.daocloud.io/library/node:20-alpine AS builder
# 设置应用目录
WORKDIR /app
# 复制依赖清单
COPY package.json package-lock.json ./
# 使用锁文件安装依赖
RUN npm ci
# 复制项目源码
COPY . .
# 接收接口地址
ARG VITE_PROJECT_API
# 写入接口地址
ENV VITE_PROJECT_API=$VITE_PROJECT_API
# 构建静态文件
RUN npm run build
# 使用国内代理 Nginx 镜像
FROM docker.m.daocloud.io/library/nginx:1.27-alpine AS runner
# 写入 Nginx 路由配置
RUN printf 'server { listen 80; server_name _; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
#复制静态文件
COPY --from=builder /app/dist /usr/share/nginx/html
# 暴露网页端口
EXPOSE 80
# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
