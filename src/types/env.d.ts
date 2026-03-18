interface ImportMetaEnv {
  readonly VITE_PROJECT_API: string;

  readonly VITE_BAIDU_TONGJI_SITE_ID: string;
  readonly VITE_BAIDU_TONGJI_ACCESS_TOKEN: string;

  readonly VITE_AI_APIPASSWORD: string;
  readonly VITE_AI_MODEL: string;

  readonly VITE_GAODE_WEB_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
