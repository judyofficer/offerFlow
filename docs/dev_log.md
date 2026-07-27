# offerFlow 开发日志 (Development Log)

## 2026-07-27
- **项目初始化**：接收到需求，明确了“大学生求职工作台”的定位。
- **架构确立**：梳理了核心数据模型 (Resume, Application, Interview)。选定 Vite + React + TS 作为技术栈，并决定 MVP 阶段使用 `localStorage`。
- **UI 风格设计**：确立了“石墨灰・极简开发者风”，默认亮色但低饱和度，对标 Notion 的排版风格。
- **模块开发完成**：
  - 构建了 `Layout` 和基础路由。
  - 完成了 **简历多版本管理模块** (ResumeStore + 左右分屏编辑器与预览)。
  - 完成了 **岗位投递流程** (ApplicationStore + 状态机 Kanban 视图)。
  - 完成了 **Dashboard 看板** (数据统计算法与图表占位)。
- **后续优化**：计划引入更复杂的图表库 (ECharts/Recharts) 完善 Funnel 数据；并且深化面试面经的富文本编辑功能。

## 开发踩坑与 Bug 修复记录
- **问题现象**：执行 `npm run dev` 后，首页出现白屏，无法正常渲染。
- **排查过程**：执行 `npm run build` 时发现多处 TypeScript 编译报错，错误码为 `TS1484` 和 `TS6133`。
- **根本原因**：Vite 的 React TS 模板默认开启了 `verbatimModuleSyntax` 选项。这要求在导入纯 TypeScript 类型 (Type/Interface) 时，必须显式地使用 `import type` 语法。如果把类型和普通的变量混在同一个普通 `import` 里面（或者对类型使用普通 import），TypeScript 编译器就会抛出 `TS1484` 错误，从而导致 Vite 编译失败并阻断渲染。
- **解决方案**：遍历了 `App.tsx` 以及 Zustand store 和各个 page 文件，将类似于 `import { ApplicationStatus } from ...` 的类型导入全部修改为 `import type { ApplicationStatus } from ...`。修复后项目编译顺利通过，白屏问题解决。
## 2026-07-27 (模块架构拆分与简历模块深化)
- **架构升级**：采纳了 Feature-Sliced (按业务模块切分) 架构方案，彻底废弃了原有的 components/pages/store 扁平目录。将代码迁移入 `src/features/` 以及 `src/core/`，成功验证了路由和模块的独立性。
- **简历模块 (Module A) 深度突破**：
  - **组件拆分**：将单文件编辑器拆分为 `PersonalInfoEditor`, `EducationEditor`, `ExperienceEditor`, `ProjectEditor`, `SkillEditor`。
  - **Zustand 状态增强**：引入了对应各个区块数组的 `addSectionItem`, `updateSectionItem`, `deleteSectionItem`, `reorderSectionItems` 状态更新方法。
  - **拖拽排序 (Drag & Drop)**：引入 `@hello-pangea/dnd`，实现了教育、工作、项目、技能各个区块的丝滑拖拽重排功能。
  - **PDF 导出**：引入 `react-to-print`，允许用户一键将右侧的 A4 预览界面导出为标准 PDF 文件。
  - **AI 智能简历解析**：
    - 新增了 `Settings` 模块，用于让用户安全地在本地配置 LLM API Key (支持 OpenAI, DeepSeek, Gemini 等)。
    - 使用 `pdfjs-dist` 实现纯前端 PDF 文本提取。
    - 在 `resumeParser.ts` 内组装提示词并调用大语言模型，返回精准的 JSON 结构并直接通过 `importResume` 注入 Zustand，实现“一键传简历 -> 秒级可视化重排”的最佳体验。
- **当前状态**：第一步“简历准备模块”的深度核心诉求已全面实现，系统可用性大幅提升。

## 2026-07-27 (Bug 修复与 UI 微调)
- **Bug 修复 (白屏问题回归)**：
  - **问题现象**：在新增 `Settings` 模块和 AI 解析功能后，页面再次出现白屏，控制台报 Vite HMR 断开。
  - **排查过程**：执行 `npm run build` 发现 4 处 TypeScript 编译错误（`TS1484` 和 `TS2353` 等）。主要因为 `useSettingsStore` 中普通导入了 `LLMProvider` 类型，违反了 `verbatimModuleSyntax` 规则；同时之前的中文翻译把 `ApplicationStatus` 在 `STATUS_CONFIG` 中的 key 误改了导致类型不匹配。
  - **解决方案**：统一修改为 `import type` 语法，并将 `STATUS_CONFIG` 的键值回滚为匹配联合类型（`oa`, `interview`, `hr`），只保留 label 为中文。再次构建验证无误，成功修复白屏。
- **UI 微调**：
  - **需求**：简历预览界面的字体需要更符合主流。
  - **修改**：将 `ResumePreview` 的 `fontFamily` 从老旧的 `serif` 切换为现代主流的无衬线字体栈：`"Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif`。
  - **理由**：无衬线字体在互联网、科技行业的简历中显得更为整洁、干练和专业。
