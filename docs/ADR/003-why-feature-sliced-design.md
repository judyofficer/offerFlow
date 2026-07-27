# ADR 003: 为什么采用 Feature-Sliced Design (FSD) 架构？

**时间**: 2026-07-27
**状态**: 已接受

## 背景 (Context)
在项目初期，我们将所有的文件按类型扁平化存放：所有的组件在 `src/components`，所有的状态在 `src/store`，所有的类型在 `src/types`。
当我们在第二个模块引入了“简历 AI 解析”（涉及 PDF 提取服务、AI 调用 API、特定的 Hook 和类型）以及“岗位拖拽 Kanban”时，发现如果要修改一个特定的业务逻辑，需要在不同的深层文件夹中跳来跳去。

## 决策 (Decision)
我们重构了目录结构，全面采用类似于 **Feature-Sliced Design (FSD)** 的分层业务模块化架构，将业务逻辑收敛于 `src/features/` 下。

## 理由 (Rationale - 面试高分对答点)
1. **高内聚，低耦合**：
   按技术类型（如 /components, /hooks）划分目录适合小项目，但在复杂业务中，一处业务改动往往同时涉及这三者。将其划分为 `features/resumes` 和 `features/applications` 后，修改“简历业务”时，所有的 UI、Store、API Service 都在同一个目录下闭环，极大地降低了认知负载。
2. **可维护性与扩展性**：
   如果我们后续想把这套前端开源或者重构为微前端架构，FSD 的强隔离性意味着我们可以像拔插头一样，直接把 `features/resumes` 整个文件夹抽离成一个独立的 NPM 包或者微应用，而不需要去全局的 `store` 和 `components` 里进行痛苦的“解焊”。
3. **安全边界 (Cross-import 限制)**：
   我们规定不同的 feature 之间只能通过最顶层的 Store 或者特定的入口暴露 API（例如投递模块只能引入简历模块的 store，不能直接引入其内部的编辑器组件），有效防止了代码变成一团乱麻（Spaghetti Code）。

## 后果 (Consequences)
- 增加了项目的层级嵌套（如 `src/features/applications/components/ApplicationCard.tsx` 路径变深）。
- 对于极其简单的通用 UI 组件，必须严格下沉到 `src/core/components` 中，防止各个 feature 重复造轮子。
