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

## 2026-07-27 (模块 B 岗位投递追踪重构)
- **企业规范 SOP 落地**：采用 `/grill-me` 标准化提问对齐需求，锁定功能设计（支持详情侧边抽屉与拖拽流转），之后一次性完成开发交付。
- **UI 彻底重构**：
  - 引入了完整的 Kanban 拖拽交互（借助 `@hello-pangea/dnd`），现在用户可以在列与列之间平滑拖拽卡片来改变状态。
  - 新增了 `ApplicationCard` 单独组件封装卡片渲染逻辑，展示最新状态和信息。
  - 新增了 `ApplicationDetailPanel` 详情抽屉，使用精美的右侧滑入 (Slide-over) 动画。
- **数据流闭环**：
  - 在详情页中实现了与 `useResumeStore` 的跨 Store 数据读取，允许用户在下拉框中选择当时投递该岗位使用的哪一版简历（关联 `resumeId`）。
  - 支持长文本的 JD（岗位描述）和 Notes（面试面经备注）记录，解决了早期版本只能用 prompt 编辑几个短字符串的痛点。
- **当前状态**：核心的简历管理 (模块 A) 和投递流转 (模块 B) 已双双实现重度结构化和高可用体验。
- **UI 优化与交互增强**：
  - **需求**：横向的看板在使用普通鼠标时，需要拖动底部滚动条，操作不便，希望能直接使用鼠标滚轮左右滑动。
  - **修改**：在 `Applications/index.tsx` 中通过 `useRef` 捕获 `.kanbanBoard` DOM 节点，利用原生的 `addEventListener` 绑定 `wheel` 事件，将垂直滚动的增量 (`e.deltaY`) 平滑转换为横向滚动 (`scrollLeft`)。
  - **收益**：极大地提升了桌面端用户的浏览体验，更加丝滑自然。

## 2026-07-28 (模块 C 面试日程与日历管理)
- **手写极简日历引擎**：拒绝引入庞大的 `react-big-calendar` 等第三方库，从零手写了一套基于 `Grid` 布局的 7x6 极简日历视图，符合“石墨灰开发者风”，极大地减少了打包体积并保证了 UI 的高度定制化。
- **模块间的强联动 (Cross-module Linkage)**：
  - 在投递看板 (Applications) 中，当用户把某张卡片拖拽进入“笔试、面试、HR面、Offer”等实质性推进列时，系统会自动触发 Confirm。
  - 用户确认后，通过 React Router 的 URL 参数 (`?createFor=appId`) 无缝跳转并唤起 Schedule 模块的“新建日程抽屉”。
  - 日程抽屉会自动填入相应的公司名和岗位名，极大降低了用户的手动输入成本。

## 2026-07-28 (模块 D 数据看板 Dashboard)
- **ECharts 数据可视化**：抛弃了 Recharts，引入强大的 `echarts` 和 `echarts-for-react` 开发了 `FunnelChart` 漏斗图组件，不仅能直观展示（投递 -> 面试 -> 录用）的转化漏斗，还自带完美的阴影渲染和百分比 Tooltip。
- **指挥中心布局**：采用 Vercel / Supabase 后台的高级质感网格布局。顶部 4 张核心指标卡片（总投递、面试中、已拿 Offer、整体回复率），下半部分左侧为漏斗图，右侧为“近期日程 (Upcoming Schedule)”，实现了模块 B (投递) 与模块 C (日程) 数据的高度聚合。

## 2026-07-28 (架构解耦：招聘信息池 Job Board)
- **FSD 架构重构**：响应高级应用架构的“关注点分离”原则，将“海量信息的收集(准备阶段)”与“严谨状态的追踪(投递阶段)”彻底在物理层和 UI 层双向解耦。
- **独立的数据层 (JobStore)**：新增独立的 `useJobStore` 存储结构，抛弃了无关的流转状态，专精于 `url`, `salary`, `location`, `source` 等 JD 属性。
- **一键流转闭环**：在【招聘信息池】列表中加入了“一键投递”按钮。当用户确定意向后，数据会从 JobStore 剔除并自动注入到 ApplicationStore，无缝衔接至【投递追踪】看板。
- **UI 纯净化**：移除了【投递追踪】中臃肿的 Table 视图切换，恢复了纯粹的流程管理功能（移除了 Kanban 中的 Wishlist 列）。
- **极客体验：智能录入引擎 (Smart Parser)**：抛弃了连续多个 `prompt` 的反人类设计，开发了质感极佳的 `JobAddModal` 弹窗。内置本地启发式正则匹配算法 (`parser.ts`)，能够从一段混杂的粘贴文本（如 `前端开发 北京 30-50K 字节跳动`）中瞬间切分并提取出薪资、地点、公司和岗位，实现了最硬核的高效“一键填表”体验。

## 2026-07-28 (架构裁剪：砍掉面经模块，聚焦核心数据)
- **产品边界收缩 (ADR-005)**：经过产品方向的复盘，决定在 MVP 阶段彻底砍掉“模块D：面试与面经复盘”。核心原因在于，强行造一个记事本会与用户现有的专业笔记软件（Notion/Obsidian）产生严重的体验和数据冗余竞争。
- **物理与逻辑清理**：清除了 `src/features/interviews` 目录及相关路由，使核心聚焦于“漏斗数据的流动”（大盘 -> 信息池 -> 看板 -> 日程）。
