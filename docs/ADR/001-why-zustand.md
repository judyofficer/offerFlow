# ADR 001: 为什么选择 Zustand 而不是 Redux?

**时间**: 2026-07-27
**状态**: 已接受
**参与者**: 架构师 (AI), 开发者 (User)

## 背景 (Context)
在 offerFlow 这一复杂的前端应用中，我们需要管理诸多跨组件的状态：
1. **多版本简历状态**：不同简历的数据结构深且嵌套（如经历、项目的数组）。
2. **投递状态机**：Kanban 面板的跨列数据流转。
3. **全局设置**：AI API Keys 等偏好设置。

我们需要一个状态管理库。常见的行业选择是 Redux (Redux Toolkit)，或者是基于 Context API 的轻量级方案。

## 决策 (Decision)
我们决定使用 **Zustand** 作为唯一的全局状态管理解决方案，并完全抛弃 Redux。

## 理由 (Rationale - 面试高分对答点)
1. **无样板代码 (Boilerplate-free)**：
   Redux 即使有 RTK，依然需要编写 Slice、Action、Reducer 和 Provider。而在本应用中，简历数据结构的增删改查极度频繁（如 `addSectionItem`, `reorderSectionItems`）。Zustand 允许我们用极其精简的闭包直接更新状态，降低了至少 50% 的代码量。
2. **规避 React Context 的性能陷阱**：
   如果单纯用 Context API，任何顶层状态的改变都会导致整个树的 Re-render（比如修改一个技能标签，会导致整个预览区重新渲染）。Zustand 采用了基于发布订阅 (Pub/Sub) 模式和 React `useSyncExternalStore` 的机制，做到了 **Selector 级别的精准渲染**，极大地提升了复杂的简历编辑器的性能。
3. **中间件的极简接入**：
   offerFlow 是一个纯前端优先的工作台，我们需要将状态持久化到本地。Zustand 内置的 `persist` 中间件让我们只需要包一层函数，就能自动将 State 持久化到 `localStorage` 中，这比配置 Redux Persist 简单优雅得多。

## 后果 (Consequences)
**正面**：
- 极快的开发迭代速度。
- 包体积更小，运行时开销更低。
- 代码更贴近 React Hooks 原生思维。

**负面**：
- 缺乏 Redux DevTools 那么大而全的时间旅行（Time-travel）调试生态（尽管 Zustand 也支持 devtools 中间件，但不如 Redux 体系庞大）。对于目前业务量级，这个代价完全可以接受。
