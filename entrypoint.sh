#!/bin/sh

# 创建包含环境变量的配置文件
echo "window.ENV = {" > /usr/share/nginx/html/config.js
echo "  VITE_VERSION: '${VITE_VERSION}'," >> /usr/share/nginx/html/config.js
echo "  VITE_PROJECT_API: '${VITE_PROJECT_API}'," >> /usr/share/nginx/html/config.js
echo "  VITE_BAIDU_TONGJI_SITE_ID: '${VITE_BAIDU_TONGJI_SITE_ID}'," >> /usr/share/nginx/html/config.js
echo "  VITE_BAIDU_TONGJI_ACCESS_TOKEN: '${VITE_BAIDU_TONGJI_ACCESS_TOKEN}'," >> /usr/share/nginx/html/config.js
echo "  VITE_AI_APIPASSWORD: '${VITE_AI_APIPASSWORD}'," >> /usr/share/nginx/html/config.js
echo "  VITE_AI_MODEL: '${VITE_AI_MODEL}'," >> /usr/share/nginx/html/config.js
echo "  VITE_GAODE_WEB_API: '${VITE_GAODE_WEB_API}'" >> /usr/share/nginx/html/config.js
echo "};" >> /usr/share/nginx/html/config.js

exec "$@"