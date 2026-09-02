import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import PersonalInfoEditor from './PersonalInfoEditor';
import SummaryEditor from './SummaryEditor';
import EducationEditor from './EducationEditor';
import ExperienceEditor from './ExperienceEditor';
import CampusExperienceEditor from './CampusExperienceEditor';
import ProjectEditor from './ProjectEditor';
import SkillEditor from './SkillEditor';
import AwardEditor from './AwardEditor';

const ResumeEditor: React.FC = () => {
  const { resumes, activeResumeId, setActiveResume, updateActiveResume } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);

  const fillDemoData = () => {
    updateActiveResume({
      personalInfo: {
        name: '张三 (演示版)',
        email: 'zhangsan@example.com',
        phone: '13800138000',
        github: 'github.com/zhangsan-dev',
        website: 'zhangsan.dev',
        summary: '本人在校期间深入学习前端开发，具备扎实的 **React/Next.js** 开发能力。熟悉主流技术栈并有丰富的实战项目经验。热爱开源，拥有强烈的求知欲和优秀的团队协作能力。希望能够在极客团队中持续成长。',
        gender: '男',
        birthDate: '2002.03',
        ethnicity: '汉族',
        city: '北京',
        intendedCity: '北京 / 上海 / 深圳',
        intendedRole: '前端开发实习生 / 全栈开发'
      },
      education: [
        {
          id: 'edu-1',
          school: '示例大学',
          degree: '本科',
          major: '计算机科学与技术',
          startDate: '2023.09',
          endDate: '2027.06',
          description: ''
        }
      ],
      experience: [
        {
          id: 'exp-1',
          company: '示例公司',
          title: '前端开发实习生',
          startDate: '2024.03',
          endDate: '至今',
          description: '1. 负责公司核心产品的前端研发，基于 **React** 和 **TypeScript** 构建高性能页面。\\n2. 参与组件库的搭建，封装 10+ 常用基础组件，提升团队研发效率 **30%**。\\n3. 配合后端完成 API 接口联调，优化首屏加载时间降低 **200ms**。'
        }
      ],
      projects: [
        {
          id: 'proj-1',
          name: 'Demo 项目 — 智能聚合服务平台',
          role: '独立全栈',
          startDate: '2026.03',
          endDate: '至今',
          link: 'openstore.qzz.io',
          techStack: 'Next.js 16 + React 19 + TypeScript + Prisma + Neon PostgreSQL + DeepSeek API',
          description: `- **向量语义检索**：基于 BAAI/bge-m3 生成文本向量，利用余弦相似度实现自然语言检索；检索异常自动降级 Prisma 模糊匹配，保障链路稳定。
- **自动化数据管线**：封装自动化流水线完成 GitHub 仓库爬取、AI 质检、分类入库；调用 DeepSeek 过滤无效仓库，通过 upsert 自动去重更新数据。
- **服务端身份权限架构**：基于 HttpOnly Cookie 区分普通用户 / 开发者，依托 Next.js RSC 服务端差异化渲染内容，消除客户端首屏闪烁。`,
          highlights: `- **流式 AI 对话交互**：使用 Vercel AI SDK + Edge Runtime 实现打字机流式对话，多轮 Prompt 澄清用户需求，识别检索指令自动跳转搜索页。
- **全链路性能优化**：数据库查询改用 Promise.all 并发，页面提速 60%；搭配 unstable_cache、ISR 增量静态再生多级缓存，高频查询耗时 < 5ms。
- **运营后台鉴权**：搭建项目管理后台，通过 proxy.ts 统一拦截管理路由；HttpOnly Cookie 存储登录态，规避前端敏感信息泄露。`
        },
        {
          id: 'proj-2',
          name: '电商数据可视化平台',
          role: '前端负责人',
          startDate: '2025.09',
          endDate: '2025.12',
          techStack: 'React 19 + TypeScript + Ant Design 5 + Zustand + ECharts + Axios + MSW',
          description: `- 基于 React19 Hooks 函数组件完成页面开发，通过 useMemo / useCallback 缓存计算值与回调函数，减少组件冗余重渲染；封装 useRequest、useAuth 自定义 Hook，抽离接口请求、登录鉴权通用逻辑，提升代码复用性。
- 采用 Ant Design 5 组件库统一页面 UI 风格，使用 Zustand 管理全局跨组件状态，搭配持久化插件实现多模块业务数据本地缓存共享。`,
          highlights: `- **自主封装 Axios 请求工具**，配置请求 / 响应拦截器实现 Token 自动携带，捕获 401 未授权状态统一跳转登录页；引入 MSW 完成接口 Mock 模拟，脱离后端接口实现前后端并行开发。
- **集成 ECharts 实现折线、柱状、饼图等 6 类可视化看板**，完成饼图多级下钻交互；用 React 状态管理实现饼图多级下钻，封装 ResizeObserver 监听容器自适应缩放；提取 ECharts 基础配置实现图表组件化，减少 40% 重复代码。`
        }
      ],
      skills: [
        {
          id: 'skill-1',
          category: '专业技能',
          items: ['JavaScript', 'React', 'Node.js', 'SQL']
        }
      ],
      campusExperience: [
        {
          id: 'campus-1',
          organization: '示例大学学生会',
          role: '技术部干事',
          startDate: '2023.09',
          endDate: '2024.06',
          description: '负责校园官方网站的日常维护和新功能开发。'
        }
      ],
      awards: '2024.05 校级一等奖学金 (示例大学，全系排名前 5%)\n2023.11 全国大学生数学建模竞赛 省级二等奖\n2023.06 校级优秀学生干部'
    });
  };

  if (!activeResume) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
        请在左侧选择或新建一个简历版本。
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setActiveResume(null as any)}
          style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', marginLeft: '-8px' }}
          title="返回版本列表"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          <span style={{ marginLeft: '4px' }}>返回</span>
        </button>
        <h2 className="text-h2" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeResume.name}</h2>
      </div>
      <PersonalInfoEditor />
      <EducationEditor />
      <ExperienceEditor />
      <ProjectEditor />
      <CampusExperienceEditor />
      <SkillEditor />
      <AwardEditor />
      <SummaryEditor />

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px dashed var(--border-color)' }}>
        <button className="btn btn-outline" style={{ width: '100%', color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={fillDemoData}>
          一键注入完整简历演示数据
        </button>
      </div>
    </div>
  );
};

export default ResumeEditor;
