# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## 职位链接自动解析

“投递追踪 → 添加岗位”和“岗位收藏 → 添加收藏”共用链接与招聘文案解析。只需粘贴受支持招聘站点的职位链接：先读取专用职位详情接口（已适配顺丰校招），再提取 JobPosting 结构化数据；动态页面会自动使用独立无登录浏览器渲染后提取真实职位标题、职责和要求。网站宣传语不会被当成岗位。自动识别的字段可被后续详情数据修正，手动修改会保留；更换链接会清除上一岗位的自动字段。需要登录或验证码的页面无法保证自动读取，但会提示未读取成功，不伪造职位信息。

- 本地使用 `npm run dev`，Vite 会提供 `/api/job-page` 读取接口。
- Netlify 部署使用 `netlify/functions/job-page.ts` 和根目录 `netlify.toml`；`public/_redirects` 必须先匹配 `/api/job-page`，再匹配 SPA 首页兜底规则。通过关联 Git 仓库构建，或在项目根目录执行 Netlify CLI 构建部署，不能仅拖拽上传 `dist`（静态上传不会部署服务端函数）。
- Vercel 部署使用 `api/job-page.ts`，并打包 `@sparticuz/chromium` 作为 Linux 动态渲染环境；该函数设置了 60 秒运行上限。纯静态托管和 `vite preview` 不提供读取接口。
- 本地动态渲染优先使用已安装的 Chrome，也可以通过 `JOB_BROWSER_EXECUTABLE` 指定 Chrome/Chromium 可执行文件。浏览器使用全新上下文，不读取用户的登录状态；网络请求仅允许公开 HTTPS 地址的只读 GET。
- 静态站点或 Capacitor 应用可通过 `VITE_JOB_PARSER_ENDPOINT=https://你的服务域名/api/job-page` 指向已部署的读取接口。
- 自动读取不需要 AI Key；配置 AI 接口后，“AI 解析职位”可以直接使用链接已读取到的真实职位正文，无需再手动粘贴文案。

解析回归测试：`node --test tests/*.test.mjs`（Node.js 24+）。


### Netlify 上出现“接口返回网页”或“Failed to fetch”

1. 使用包含 `netlify.toml`、`netlify/functions/`、`server/` 和 `api/` 的完整仓库重新构建部署，构建命令为 `npm run build`，发布目录为 `dist`。只有上传前端构建目录时，无法运行网页读取和动态浏览器。
2. 在 Netlify 的 Functions 页面确认存在 `job-page` 函数，访问 `https://你的站点.netlify.app/api/job-page` 应得到 JSON 错误 `请提供有效的职位链接。`（HTTP 422），而不是应用首页或 404 网页。
3. 使用同站点函数时不必配置 `VITE_JOB_PARSER_ENDPOINT`。若此前设置了错误的外部地址，清除该变量后重新构建；该变量在构建阶段写入前端，单纯刷新页面不会更新。
4. 若是 HTTP 502/504，请查看 `job-page` 函数日志，检查 Chromium 资源是否正确打包、函数执行是否超时。
