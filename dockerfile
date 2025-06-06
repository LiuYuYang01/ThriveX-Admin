# 使用官方的Node.js镜像作为基础镜像
FROM registry.cn-hangzhou.aliyuncs.com/liuyi778/node-20-alpine AS builder

# 设置工作目录
WORKDIR /thrive

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 配置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 使用 Nginx 作为生产环境的基础镜像
FROM nginx:alpine

# 复制构建输出到 Nginx 的默认静态文件目录
COPY --from=builder /thrive/dist /usr/share/nginx/html
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 暴露端口
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]