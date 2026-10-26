export function jobServiceResponseError(status: number, contentType: string | null, isNetlify: boolean): string | undefined {
  if (contentType?.toLowerCase().includes('application/json')) return;
  if (status === 502 || status === 503 || status === 504) return `职位解析服务启动失败或超时（HTTP ${status}），请查看服务端函数日志后重试。`;
  return isNetlify
    ? `Netlify 职位解析接口未正常启用（HTTP ${status}）。请使用包含 netlify.toml 和 Functions 的完整项目重新部署，不能只上传 dist。`
    : `职位解析接口返回了网页而非数据（HTTP ${status}），请检查 /api/job-page 的部署和路由配置。`;
}

export function jobServiceNetworkError(isNetlify: boolean): string {
  return isNetlify
    ? '无法连接职位解析服务。请确认 Netlify Functions 已部署；若配置了 VITE_JOB_PARSER_ENDPOINT，请检查接口地址及跨域设置。'
    : '无法连接职位解析服务，请检查网络、接口地址及跨域设置。';
}
