# offerFlow 架构设计 (Architecture)

## 1. 核心定位
offerFlow 并非一个简单的“在线写简历”的页面，而是面向校招/社招候选人的**求职全生命周期管理系统 (JobFlow OS)**。它将所有与求职有关的行为（投递、简历、面经、进度跟进）聚合在一个数据流中。

## 2. 技术选型
- **前端框架**：React 18 (Vite 构建)
- **开发语言**：TypeScript (保证数据模型的严谨性)
- **路由管理**：React Router v6
- **状态管理**：Zustand (轻量级全局状态管理，处理简历和投递数据的跨组件通信)
- **数据持久化**：MVP 阶段使用 `localStorage`，后期演进至 IndexedDB 并支持后端同步。
- **UI 规范**：原生 CSS / CSS Modules。采用“石墨灰・极简开发者风”，对标 Notion / Obsidian 的极简排版和沉浸感体验。

## 3. 模块划分
系统主要划分为以下几大模块（对应一级路由）：
1. `/dashboard` (数据看板)：展示投递漏斗、近期待办面试。
2. `/resumes` (简历库)：简历版本管理与编辑核心区。
3. `/applications` (投递与岗位)：JD 解析、投递状态看板。
4. `/interviews` (面试与面经)：面试题库、面试记录复盘。

## 4. 核心数据模型 (MVP 阶段)

### Resume (简历版本)
```typescript
interface Resume {
  id: string;
  name: string; // 简历版本名称，如"前端开发-大厂通用版"
  createdAt: number;
  updatedAt: number;
  content: {
    personalInfo: PersonalInfo;
    education: Education[];
    experience: Experience[];
    projects: Project[];
    skills: Skill[];
  };
}
```

### Application (投递记录)
```typescript
interface Application {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string; // JD原文
  status: 'wishlist' | 'applied' | 'oa' | 'interview_1' | 'interview_2' | 'hr' | 'offer' | 'rejected';
  appliedAt: number;
  updatedAt: number;
  resumeId: string; // 关联的投递简历版本
}
```

### Interview (面试记录)
```typescript
interface Interview {
  id: string;
  applicationId: string;
  round: string; // e.g., "一面", "HR面"
  time: number; // 面试时间
  notes: string; // 面经、复盘内容
}
```

## 5. UI/UX 原则
- **Content First**：去除冗余的边框和装饰，利用排版、留白和灰度层次区分信息块。
- **Focus Mode**：在编辑简历或阅读 JD 时，尽可能减少外界干扰。
- **Dark-ish Light Mode**：虽然默认是亮色，但保持低饱和度，护眼且具有极客审美。
