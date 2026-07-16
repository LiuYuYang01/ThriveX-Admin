# Docker运行教程

## 环境变量说明

`.env`里主要有一个变量：

```env
VITE_PROJECT_API=https://你的后端域名/api
```

### VITE_PROJECT_API

后台管理端请求后端接口的地址。

示例：

```env
VITE_PROJECT_API=https://api.example.com/api
```

注意：生产环境建议使用真实 `https` 域名，不要使用 `localhost`。

## 构建镜像

```powershell
docker build --build-arg VITE_PROJECT_API=https://你的后端域名/api -t thrivex-admin .
```

说明：

`VITE_PROJECT_API` 是构建时变量，Vite 会在构建时写进前端静态文件。

## 启动容器

```powershell
docker run -d --name thrivex-admin -p 9002:80 thrivex-admin
```

说明：

- `-d`：后台运行
- `--name thrivex-admin`：容器名称
- `-p 9002:80`：本机9002端口映射到容器80端口
- `thrivex-admin`：镜像名称

## 访问页面

本地访问：

```text
http://localhost:9002
```

服务器直接访问：

```text
http://服务器IP:9002
```

域名访问：

```text
https://你的后台域名
```

## 查看日志

```powershell
docker logs -f thrivex-admin
```

## 重新构建并启动

```powershell
docker rm -f thrivex-admin
docker build --build-arg VITE_PROJECT_API=https://你的后端域名/api -t thrivex-admin .
docker run -d --name thrivex-admin -p 9002:80 thrivex-admin
```
