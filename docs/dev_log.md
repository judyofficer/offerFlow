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

## 2026-07-29 (简历模块体验深度打磨与底层存储升级)
按照【强制文档沉淀规则】，对本轮迭代进行总结：

### 1. 【本次修改范围】
- **PDF 导出适配**：新增“一页适配”排版缩放功能。在简历预览界面的右上角增加了一个 `Slider`（范围 70% ~ 100%），通过动态设置底层 `zoom` 样式，不仅允许用户在预览时实时查看紧凑模式，还能被 `react-to-print` 完美捕获，轻松实现将超长简历无损压缩导出到单页 A4 纸中。
- **智能简历技能解析**：新增“智能导入”功能。在 `SkillEditor.tsx` 中增加了一套正则表达式启发式解析逻辑，支持无缝粘贴多行带标点、带列表的技能长串，并在前端 0 延迟自动拆分入库。同时优化了 Markdown 加粗语法（`**`）的自动清理。修复了逗号自动切分为标签的问题，恢复用户手动长句输入的能力。
- **UI 交互层**：将浏览器原生的 `prompt` 替换为定制化的精美 Modal；简历列表项增加可直接唤出 Modal 的“重命名(编辑)”功能；编辑器各子模块增加了折叠/展开功能（ChevronDown/Right）。
- **PDF 预览增强**：使用 `iframe` 在 Modal 内嵌直接预览原始 PDF 文件，替代了之前强制下载的设计。
- **解析器补丁**：修改了 `resumeParser.ts`，废弃 LLM 返回的结构化数据中的伪随机 ID，强制在前端重新生成绝对唯一的 ID。
- **拖拽样式修复**：调整了 `SkillEditor`, `ExperienceEditor`, `EducationEditor`, `ProjectEditor` 这四个组件中 `<Draggable>` 的 `style` 属性注入顺序。

### 2. 【架构与设计变更】
- **数据源扩展 (ADR-002 阶段二实施)**：正式引入了 `idb-keyval` (IndexedDB)。从纯粹的 Zustand + localStorage，平滑过渡到混合存储模式：核心状态依旧利用 `localStorage` 保持极速同步读取，而大体积的简历 PDF 源文件则落盘在真正的浏览器级数据库 `IndexedDB` 中，彻底清除了内存和 Quota 的隐患。

### 3. 【开发遇到的问题 & 踩坑记录】
在本轮打磨中，遇到了几个极为隐蔽但又极其经典的“深水坑”：
1. **拖拽白屏导致 React Invariant 崩溃 (元凶：LLM 编造假 ID)**
   - **坑点**：拖拽简历编辑器中的某个区块时，突然整个页面白屏崩溃。
   - **排查**：控制台报错指出 `@hello-pangea/dnd` 找不到对应的 draggableId。追踪发现，因为提示词里让 LLM 返回 `id: "随机短字符串"`，大模型竟直接把所有的 `id` 都填成了字面量 `"随机短字符串"`！这导致 React 渲染时 `key` 冲突，拖拽库在底层绑定 DOM 时直接乱套，引发 Invariant 异常并导致整个 React 组件树崩溃。
   - **解法**：在 `resumeParser.ts` 接收到 JSON 后，拦截并主动使用 `Math.random()` 覆写所有数据项的 ID，确保绝对唯一。
2. **拖拽局部留出双倍空白位置 (元凶：样式优先级覆盖)**
   - **坑点**：拖拽组件时不再白屏崩溃，但拖拽的卡片下方空出了两倍的留白，不仅不丝滑，还严重破坏了排版。
   - **排查**：检查代码发现 `<div style={{ ...provided.draggableProps.style, position: 'relative' }}>` 的写法中，我们硬编码的 `position: 'relative'` 覆写了拖拽库动态计算赋值的 `position: fixed`（拖拽库在拖动时需要脱离文档流）。由于元素没有脱离文档流，再加上拖拽库原本插入的 Placeholder（占位符），两者叠加就霸占了双倍的高度。
   - **解法**：严格遵循 dnd 库的最佳实践，将扩展符写在样式对象的最后 `style={{ position: 'relative', ..., ...provided.draggableProps.style }}`，保障拖拽库的动态计算样式拥有最高优先级。
3. **CSS Animation Keyframes 遗漏**
   - **坑点**：在增加解析遮罩层时使用了 `animation: spin 2s linear infinite`，但是 `Loader` 图标并没有转动。
   - **解法**：发现是因为在 `index.css` 忘记全局注册 `@keyframes spin` 导致的，补全后即刻恢复旋转。

### 5. 【性能优化：防抖自动保存机制】
- **问题现象**：原有的 Zustand `persist` 默认是同步的。用户在简历编辑器中每敲击一个字符，都会触发一整棵简历状态树的深度 JSON 序列化并阻塞式地写入 `localStorage`，导致严重的输入卡顿。
- **解决方案**：引入了 `createDebouncedStorage` 工具函数，拦截并接管了 Zustand 的 `setItem` 操作，将其改为基于 1000ms 延迟的防抖（Debounce）写入。
- **数据安全保障**：为了避免防抖延迟期间用户突然关闭标签页导致数据丢失，在 `createDebouncedStorage` 内部绑定了 `beforeunload` 和 `visibilitychange` 原生事件。当检测到页面即将卸载或切换至后台时，会瞬间触发 `flush()`，同步将内存中 pending 的最新数据刷入 `localStorage`，实现了“高性能输入 + 零数据丢失”的最佳平衡。

### 6. 【功能迭代：全局撤销重做 (Ctrl+Z)】
- **问题现象**：简历编辑过程中（尤其是拖拽重排和模块增删），用户极易发生误操作。缺乏全局撤销会导致破坏性数据丢失，严重影响产品可用性。
- **架构决策 (ADR-006)**：我们拒绝了复杂的 Command 模式，选择了 **Memento Pattern (备忘录/快照模式)**，在 `useResumeStore` 中纯手写维护了 `past` 和 `future` 栈，保障了状态恢复的绝对可靠性。
- **技术亮点**：
  - **动态防抖入栈**：针对高频打字，不是每敲一个字母就记录一次快照，而是采用 `1000ms` 防抖拦截，实现了类似 Word 的“段落级”撤销。
  - **原生冲突规避**：在全局绑定 `Ctrl+Z` / `Cmd+Z` 时，智能判断当前焦点是否在 `INPUT` 或 `TEXTAREA` 内。如果在，则放行原生事件（触发浏览器默认文本撤销）；只有在外部时，才触发应用的模块级状态回滚。

### 7. 【工程架构：高级展示页与演示数据引擎】
- **业务背景**：为了更好地向外界（开源社区或面试官）展示系统能力，提供开箱即用的体验。
- **技术实现**：
  - **展示页 (Landing Page)**：在根路由 `/` 脱离主 Layout 架构，纯手写极具科技感的高性能 Vanilla CSS 动画（背景浮动光斑、毛玻璃质感）。
  - **Mock 数据引擎**：编写了 `mockDataInjector.ts`，基于 Zustand 的 `setState` 实现了跨模块（Resume, Job, Application, Schedule）原子的原子级状态重置。点击“体验 Demo”后，可秒级拉起包含丰满漏斗大盘、精美多版本简历、拖拽看板的完美环境，达成震撼的“所见即所得”效果。

### 4. 【关键决策理由】
- **为什么放弃复杂的手动保存，选择防抖自动保存？** 现代 Web 应用（如 Notion、Figma）已经确立了“所见即所存”的用户心智。增加一个“保存”按钮属于逆时代潮流。通过防抖机制控制写入频率，在体验上做到了无感知，在性能上解决了 I/O 阻塞。
- **为什么预览功能要自己弹 Modal 内嵌 iframe？** 因为直接下载源文件打断了用户体验（必须去系统的下载文件夹翻找，再用外部工具打开）。使用原生 iframe 的 `#view=FitH` 参数不仅能极速渲染，还可以让用户留在应用内部，并直接享受浏览器级 PDF 查看器的全部特性（包括另存为、打印等）。
- **为什么不让 LLM 返回真实随机 ID 而是靠前端兜底？** 经过测试，不管怎么在 prompt 里强调，各类大模型在生成纯结构化数据的字段校验时极不稳定，有的返回 1，有的返回 literal string。前端兜底生成 ID 成本极低（一行 `forEach`），且 100% 杜绝了系统级崩溃，是投入产出比最高的工程决策。

### 8. 【工程部署：Vercel 生产环境配置】
- **部署环境**：Vercel
- **问题与挑战**：由于我们使用的是纯前端的 React Router (`BrowserRouter`)，一旦将代码推送到 Vercel 等静态托管平台，如果在非根目录 `/` 刷新页面，Vercel 默认会去查找对应的静态目录文件，导致报出 404 Not Found 错误。
- **解决方案**：在根目录新增了 `vercel.json` 配置文件，加入 `rewrites` 规则 `{"source": "/(.*)", "destination": "/index.html"}`，强制将所有的前端路由回退给 `index.html`，由 React Router 接管后续渲染。
- **Mock数据策略**：最终决定保留 `mockDataInjector` 的自动注入演示数据，让初次访问的用户立刻看到丰富的数据效果，增强开源作品集的展示能力。

### 9. 【工程部署：Netlify 生产环境配置】
- **问题与挑战**：切换到 Netlify 部署后，由于使用了 React Router (`BrowserRouter`)，子路由（如 `/jobs`）在刷新时直接报出 404 Page Not Found，这是因为 Netlify 默认找不到对应的静态 HTML 文件。
- **解决方案**：在 `public/` 目录下新增了 `_redirects` 配置文件，加入规则 `/* /index.html 200`。Vite 打包时会自动将此文件后台合并，完美解决了 SPA 的 404 问题。

## 2026-07-31 (架构演进：跨端移动化与云端最终一致性同步)
### 10. 【架构升级：跨端移动 App 与 Local-First 同步引擎】
- **业务背景**：为了实现多端设备联动，需要将应用从“纯网页版”打包升维为“真跨端 App”，同时打破“本地单机局限”，引入数据云端同步。
- **技术决策 (ADR-007)**：
  - **打包方案选型**：采纳了基于 Webview 容器的 **Capacitor**（负责 iOS/Android 构建）。相比重写 React Native，该方案实现了零成本迁移现有的复杂 Kanban UI，体验同样极佳。
  - **同步方案选型 (Local-First Architecture)**：否决了“实时强依赖云端（WebSocket Push）”的方案，确立了 **“最终一致性的自动同步 (Eventual Consistency)”**。即：继续保留目前的 IndexedDB/LocalStorage 作为**绝对的 Single Source of Truth（单一数据源）**，从而保障离线秒开和极致的交互速度；通过后台引入 **Supabase**，在设备连网时静默将本地快照推送到云端关系型数据库中，实现云端备份与跨设备“最终一致性”恢复。
- **环境初始化**：
  - 已在项目中引入 `@capacitor/core`, `@capacitor/cli` 并初始化了 `capacitor.config.ts`。
  - 已引入 `@supabase/supabase-js` 并构建了云端通信 Client `src/core/services/supabaseClient.ts`。

### 11. 【架构升级：全站移动端响应式 (Mobile Responsive Overhaul)】
- **业务背景**：既然已通过 Capacitor 将项目打包为 Android/iOS Native App，则必须彻底重构原先基于 PC 端宽屏设计的 UI（如大面积 Sidebar、横铺的 Dashboard 网格、以及固定宽度的 Kanban 拖拽列），让用户在狭窄的手机屏幕上获得无缝的原生级操作体验。
- **本次修改范围**：
  - **核心布局 (Layout)**：将原先固定于左侧的 Sidebar (`Layout.module.css`) 在移动设备（`max-width: 768px`）下彻底隐去，并降维转换为**底部的 Fixed Tab Bar (底部导航栏)**，包含系统设置入口，贴合原生 App 的拇指操作习惯。
  - **数据看板 (Dashboard)**：将写死的四列卡片和三列图表网格抽离出 `Dashboard.module.css`，在移动端自动折叠为单列/双列展示，保障大字体和可视化图表在小屏不被挤压。
  - **拖拽看板 (Kanban)**：重构了 `Applications.module.css`，为移动端引入了 iOS 级的 `scroll-snap-type: x mandatory` 特性。允许用户在屏幕上流畅地横向滑动（Swipe）来翻阅不同的投递状态列，避免了传统表格在小屏上的“灾难级”排版。
  - **入口分发**：利用 `@capacitor/core` 提供的 `Capacitor.isNativePlatform()` API，若检测到环境为原生客户端容器，则强制在挂载时（`useEffect`）跳过供 PC 浏览器使用的 `LandingPage` 营销页，直接进入 App 的主界面或登录页，进一步强化了 Native 体验。
- **关键决策理由**：
  - **为什么移动端不保留 Kanban 的拖拽 (Drag and Drop)？**：在移动端，屏幕的纵向滚动与 Kanban 组件的横向 Swipe 滑动已经占用了用户的绝大部分手势习惯，若强行加入长按拖拽，极易引发手势冲突和误触（如页面乱跳）。由于我们本就存在卡片的 Detail Panel 内置了状态切换下拉菜单，因此在小屏幕下“点击卡片 -> 在详情面板修改状态”是体验最稳定且开发成本极低的 Mobile 方案。
  - **为什么在 Capacitor 容器下跳过 Landing Page？**：网页端的 Landing Page 是典型的 SEO/营销手段。当用户已经通过 App Store 或 APK 下载了客户端并打开，他们就是明确的用户。此时要求他们先看一堆“吹嘘产品有多棒”的光斑动画，是对移动端宝贵注意力的极大浪费。直接跳转 Auth/Dashboard 符合 App 的启动直觉。

### 12. 【体验优化：移动端暗黑模式与 UI 细节打磨】
- **业务背景**：首次打包至移动端后，在真机上暴露出若干交互与视觉上的“水土不服”。
- **本次修改范围**：
  - **登录拦截失效修复**：Capacitor 不支持 SPA 在没有服务器重定向环境下的直接 `window.location.href = '/dashboard'` 强制跳转（会导致 404 白屏）。我们将状态同步完成后的硬跳转改为了 `window.location.href = '/'`，使其安全降落并由 React Router 接管分发。
  - **日历宽度溢出修复**：为 `CalendarView` 增加了横向滚动 wrapper，防止七日网格的最小尺寸撑破手机屏幕。
  - **暗黑模式对比度修复**：修复了暗黑模式下，主按钮背景色反转为浅色时，文字仍然为 `white` 导致无法看清的问题。抽离了 `--accent-foreground` 变量实现字体的自适应黑白反转。
  - **简历管理页移动端重构**：将原本割裂的上下两截布局，升级为“顶部横向滚动小胶囊 (Pills)”切换版本，使得简历编辑器能够霸占 90% 的屏幕空间，提升了移动端的可用性。

### 18. 【结构升级：项目经历字段拆分】
- **业务背景**：用户反馈“项目经历”板块之前将所有的技术栈、介绍、成果全揉在了一个输入框里，导致在预览页面渲染时没有清晰的分点和层次，且不够美观。
- **改动范围**：
  1. **数据模型 (`types/resume.ts`)**：将 `Project` 接口的单一 `description` 拆分为了 `techStack` (技术栈), `description` (项目介绍), `highlights` (项目亮点) 三个字段。
  2. **AI 解析引擎 (`resumeParser.ts`)**：同步更新了 LLM 的 JSON schema Prompt，使 AI 能够智能识别这三个维度并分类填充。
  3. **视图渲染 (`ProjectEditor.tsx`, `ResumePreview/index.tsx`)**：在编辑器中拆分了输入框；在预览区域加入了“**技术栈：**”前缀，并且完美继承了之前的 `formatDescription` 圆点列表功能。
- **技术亮点**：在重构字段时兼顾了旧数据的向后兼容性（旧版数据依旧会作为“项目介绍”被安全渲染出来）。

### 13. 【架构重构：全局按钮样式抽象与状态残留 Bug 修复】
- **业务背景**：暗黑模式下出现了多处字体颜色反转失败的问题，排查后发现前期开发存在“大量按钮滥用 Inline Styles”的坏味道；同时，用户在落地页体验 Demo 后登录，依然展示 Demo 数据。
- **本次修改范围**：
  - **CSS 架构抽象**：在 `index.css` 注入了一套原子的全局按钮类（`.btn`, `.btn-primary`, `.btn-outline` 等），利用 CSS Variables 全局接管了 hover 和 active 状态的颜色计算。
  - **全量组件重构**：删除了所有业务组件（如 `JobBoard`, `Applications` 等）中的内联 style，强制使用规范类名，彻底消灭了暗黑模式漏网之鱼。
  - **状态残留 Bug 修复**：在 `LandingPage` 中修复了 `handleStart` 的逻辑。如果用户已经登录但内存中存有 Demo 数据，将不再是简单的软跳转，而是强制调用 `syncEngine.pullFromCloud(true)` 全量覆盖后，通过 `window.location.href` 执行硬加载重构内存状态。
- **关键决策理由**：FSD 架构中的 `shared/ui` 层在前期被忽略，本次大扫除是对底层基础设施的重新重视，极大地提高了样式的可维护性。

### 14. 【体验升级：简历编辑页可拖拽多列布局】
- **业务背景**：用户反馈简历管理页面加号按钮紧贴右边界，且希望能够自由拖拽调整各列的宽度（版本列表、编辑器、预览界面）。
- **架构变更**：引入了在现代 Web IDE 中流行的 `react-resizable-panels` 拖拽引擎，替代了原有的固定宽度 CSS Flex 布局。
- **实施细节**：
  - 将 `Resumes` 的核心布局重构为 `PanelGroup` 结构。
  - 设置智能阈值：左侧版本列表在 15% 到 40% 之间游走，中间编辑器保持不低于 30%。
  - 设计了带有 `col-resize` 光标的透明 `PanelResizeHandle`，提供丝滑且不易误触的调整手柄。
- **收益**：不仅从根源上消除了小屏幕被挤压贴边的问题（因动态空间容错），还赋予了用户极客级的 IDE 拖拉体验。

### 15. 【架构重构：简历编辑页布局精简与拖拽 Bug 修复】
- **业务背景**：用户反馈三列布局（版本、编辑、预览）在普通屏幕下显得拥挤。同时在使用 `react-resizable-panels` 动态显示/隐藏面板时，出现了拖拽方向反转的幽灵 Bug。
- **本次修改范围**：
  - **核心布局 (Layout)**：将“版本列表”和“编辑器”合并为统一的左侧操作面板，彻底废弃三列布局。在无选中简历时显示版本列表，选中后进入下钻式的编辑器，提供带有“返回”按钮的沉浸式体验。
  - **组件精简**：移除了原有的 `showVersions` 和 `showEditor` 状态变量，极大简化了组件的复杂度，释放了预览区的头部空间。
  - **拖拽反转 Bug 修复**：为动态挂载的 `<Panel>` 组件硬编码了 `order={1}` 和 `order={2}` 属性，确保 `react-resizable-panels` 的内部排列算法不会因 DOM 的懒加载而导致序列错位。
- **关键决策理由**：两列布局更加贴合主流文档编辑工具（如 Notion、腾讯文档）的体验，减少了屏幕切分带来的视觉疲劳。强制分配 `order` 是修复拖拽引擎幽灵 Bug 的标准解法。
### 16. 【功能新增：简历编辑器数据扩容与专项独立板块】
- **业务背景**：用户反馈虽然获得了新模板，但是编辑面板中缺失了“自我评价”等关键字段的独立入口。同时，上一版模板包含的补充信息（性别、生日等）以及“校园经历”、“荣誉奖项”无法被录入。
- **本次修改范围**：
  - **数据层重构 (`types/resume.ts`)**：拓展了 `PersonalInfo` 接口，新增了 `city`, `gender`, `birthDate`, `ethnicity`, `intendedCity`, `intendedRole` 等可选字段；并新建了 `CampusExperience` 和 `Award` 两大数据模型。
  - **编辑器重组 (`ResumeEditor`)**：将深藏于基础信息中的 `summary` 字段剥离，创建了独立的 `<SummaryEditor />` 组件以提升“自我评价”的编辑权重；并全量开发了 `<CampusExperienceEditor />` 与 `<AwardEditor />` 的增删改模块。
  - **预览层增强 (`ResumePreview`)**：适配了新增的可选个人信息，通过灵活的条件渲染（Filter Boolean）在 Header 中呈多行展示；完整渲染了校园经历与荣誉奖项板块。
  - **提效工具（重点）**：为用户在编辑器底部注入了临时开发用的 `fillDemoData` 函数，实现一键无缝注入包含完整工作、校园、获奖的极客简历 Demo 数据，极大地降低了用户重新录入的时间成本。
- **关键决策理由**：通过将“个人信息”里选填项全面铺开，并通过提取独立板块，不仅提升了组件的单一职责（Solid 原则），也完美契合了应届生及初级职场人的典型简历诉求。提供「一键 Mock 数据注入」是极佳的开发体验与用户体验双重保障。

### 17. 【架构重构：简历 A4 真实分页预览与原生单页适配系统】
- **业务背景**：用户反馈导出的 PDF 与屏幕预览效果不一致（预览区没有分页指示），且之前简单采用 CSS `zoom` 缩放画布导致打印时页面右侧与下方留有大片未占满的空白区域，无法达到真正的“单页简历”标准。
- **本次修改范围**：
  1. **数据与状态层 (`types/resume.ts`, `useResumeStore.ts`)**：
     - 新增 `ResumeLayoutConfig` 接口，定义了 `pagePadding`, `sectionSpacing`, `itemSpacing`, `lineHeight`, `baseFontSize`, `showPageBreakGuide` 6 个核心排版维度。
     - 在 `useResumeStore` 中新增 `updateActiveResumeLayout` 状态更新方法，并在 `initialResumeContent` 中注入标准默认值。
  2. **渲染与标尺层 (`ResumePreview/index.tsx`)**：
     - 彻底解耦硬编码的 px 样式，全面转为读取 `layout` 状态的响应式流式布局。
     - 使用 `ResizeObserver` 实时监听内容高度变化，当总高度超出标准 A4 单页高度（1123px）时，自动渲染带有标尺徽章的 **A4 分页截断虚线（如“第 1 页 截断线”）**。
  3. **工具与交互层 (`Resumes/index.tsx`)**：
     - 彻底移除了带有缺陷的全局 `zoom` 缩放。
     - 新增 **【紧凑单页】/【标准平衡】/【宽松大方】** 3 档一键预设。
     - 开发了 **【✨ 智能一键单页适配】** 引擎：自动计算内容当前总高度与 1123px 的溢出比率，一键动态反向压缩字号、行距、条目与模块间距，使内容刚好收进 1 页 A4 纸内。
     - 新增 **【⚙️ 排版间距微调】** 弹窗面板，支持滑块精细调节 5 个物理维度参数。
  4. **打印与导出层 (`react-to-print`)**：
     - 配置精准的 `@page { size: A4 portrait; margin: 0mm; }` 样式。
     - 确保打印媒体下 `.resume-paper` 严格占据 `210mm` 标准物理宽度并居中，隐藏所有分页辅助线，实现 1:1 所见即所得。
- **架构与设计变更**：
  - **新旧对比**：旧方案采用全局 Canvas Zoom 变形，打乱了物理盒模型且破坏了打印排版；新方案采用**原生物理流式密度调节**，所有文本始终 100% 撑满 A4 页面全宽，仅在垂直方向通过参数平滑压缩。
- **开发遇到的问题 & 踩坑记录**：
  - **坑点 1：CSS `zoom` 在浏览器 Print 媒体下的物理宽度失真**：使用 `zoom: 0.8` 时，虽然内容变小了，但在 A4 纸（210mm）上其渲染基准盒也跟着等比缩小到了 168mm，导致右侧出现 42mm 的巨大空白。
  - **解决方案**：放弃全局 Zoom，转为针对 font-size、margin、padding、line-height 5 个层级进行原生物理压缩，使宽度始终与 A4 纸 1:1 贴合。
  - **坑点 2：分页线在打印时被一并输出**：
  - **解决方案**：为分页线赋予 `.page-break-line` 专属类名，并在 `pageStyle` 的 `@media print` 中强制注入 `display: none !important;`。
- **关键决策理由**：
  - 优秀的前端简历排版工具（如 Reactive Resume）核心价值就在于“边距与密度的可控性”。提供「一键自适应单页」结合「参数微调面板」，兼顾了小白用户的“一键搞定”诉求与极客用户的“像素级微调”诉求。
