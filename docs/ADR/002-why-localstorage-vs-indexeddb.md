# ADR 002: MVP 阶段本地存储的演进策略 (localStorage -> IndexedDB)

**时间**: 2026-07-27 (更新于 2026-07-29)
**状态**: 已接受 (并在部分模块实施阶段二)

## 背景 (Context)
offerFlow 作为一个“大学生求职工作台”，用户会产生大量数据：
1. 大量包含长文本 (Job Description, 个人总结) 的 JSON 数据。
2. 历史投递记录。
3. 经过大模型解析后的简历实体。

对于纯前端应用，我们需要决定数据究竟存在哪里。

## 决策 (Decision)
- **MVP (第一阶段)**：使用 Zustand `persist` 结合 `localStorage` 作为单一真实数据源 (SSOT)。
- **后续迭代 (第二阶段 - 当前进度)**：将核心大型业务数据（特别是带有 PDF/图片/庞大面经附件的记录）迁移至 `IndexedDB`。目前已引入 `idb-keyval` 用于存储用户解析简历时的原始 PDF 文件，以规避 localStorage 5MB 的硬性限制。

## 理由 (Rationale - 面试高分对答点)
1. **为什么 MVP 用 localStorage？**
   - **速度与敏捷**：Zustand 自带开箱即用的 `persist`，通过 JSON.stringify 存入 `localStorage` 零成本，能让我们在几天内验证所有核心链路（简历解析、Kanban 拖拽）。
   - **同步 API**：localStorage 的读写是同步的，在应用初始化时可以直接反序列化 Hydrate 状态，避免了闪烁和复杂的异步状态等待。
2. **为什么最终必须走向 IndexedDB？（localStorage 的致命缺陷）**
   - **容量限制**：localStorage 只有 5MB 的硬性限制。如果用户存储几十个投递记录（每个带有长 JD）和多个简历版本，极易触发 `QuotaExceededError`，导致应用直接崩溃并丢失最新数据。
   - **主线程阻塞**：localStorage 的序列化和反序列化是**同步**阻塞主线程的。当 offerFlow 数据膨胀到 2-3MB 时，每次触发状态持久化都会造成明显的 UI 卡顿和掉帧（特别是在拖拽 Kanban 卡片时）。
   - **结构化查询**：后续我们需要做“搜索我的所有面试记录”、“统计特定公司的投递状态”，localStorage 只能全量取出来自己遍历，而 IndexedDB 支持索引查询，性能呈指数级差异。

## 后果 (Consequences)
- 当前开发极快，但我们时刻面临 5MB 的数据达峰风险。
- 在即将到来的开发周期中，我们需要抽象一个 `StorageProvider` 层，以平滑地将 Zustand 的 persist 引擎切换为异步的 IndexedDB 引擎，届时需处理 React 的异步 Hydration 问题。
