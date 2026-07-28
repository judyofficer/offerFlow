# ADR 004: 为什么在 Dashboard 模块最终选择 ECharts 替代 Recharts？

**时间**: 2026-07-28
**状态**: 已接受
**参与者**: 架构师 (AI), 开发者 (User)

## 背景 (Context)
随着 offerFlow 的投递追踪（Applications）模块趋于完善，我们需要在 Dashboard 中引入数据可视化能力，重点实现**求职转化漏斗图 (Funnel Chart)**。

在第一版技术预研时，我们短暂尝试了 `Recharts`，理由是它基于 React 组件模型，开发手感轻量。但很快我们在实际 UI 落地时遇到了视觉审美的瓶颈。

## 决策 (Decision)
我们决定弃用 Recharts，引入 **ECharts** (搭配 `echarts-for-react`) 作为 offerFlow 的核心可视化引擎。

## 理由 (Rationale - 面试高分对答点)
1. **视觉表现力与上限 (Visual Aesthetics & Limits)**：
   Recharts 的默认 UI 较为基础，且其 Funnel 组件无法轻易实现工业级的阴影、梯形倾斜角、间距缓冲（Gap）以及酷炫的 Hover 强调动画。而 ECharts 的漏斗图 (`type: 'funnel'`) 默认就具备非常强大的图形表现力（如内置的阴影属性 `shadowBlur`，梯形的高级渲染），更符合我们要打造的“高级质感工作台”。
2. **极简配置与 SVG 渲染能力结合**：
   很多人认为 ECharts 体积大、不现代。但实际上 `echarts-for-react` 允许我们以极低迷的成本挂载图表，同时我们开启了 `opts={{ renderer: 'svg' }}`，利用 ECharts 的 SVG 渲染引擎，既保留了它强大的 `option` 表现力，又避免了 Canvas 在高分屏上的模糊问题，同时能被 CSS 顺滑控制。
3. **Tooltip 的多维富文本支持**：
   在复杂的投递统计中，ECharts 自带的 formatter 表达式 (`{b} : {c} ({d}%)`) 可以一键输出名称、数量和百分比占比，而这种“带百分比计算”的 Tooltip 如果在 Recharts 里手写，需要自己计算除法并做异常拦截，ECharts 在业务侧屏蔽了这些统计学底层的脏活。

## 后果 (Consequences)
**正面**：
- 图表颜值大幅度提升，UI 更具备企业级产品的专业感。
- 能够轻而易举地渲染带百分比转化率的富文本 Tooltip。

**负面**：
- 包体积 (Bundle size) 确实比 Recharts 增加了一些（约多出数百 KB）。但由于 offerFlow 是一个重逻辑的工作台应用，且 Vite 生产构建开启了代码分割 (Code Splitting)，加载性能的影响对于我们的目标用户可以忽略不计。
