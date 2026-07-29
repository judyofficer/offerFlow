import { useResumeStore } from '../../features/resumes/store/useResumeStore';
import { useApplicationStore } from '../../features/applications/store/useApplicationStore';
import { useJobStore } from '../../features/jobBoard/store/useJobStore';
import { useScheduleStore } from '../../features/schedule/store/useScheduleStore';

const generateId = () => Math.random().toString(36).substring(2, 9);
const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;

export const injectMockData = () => {
  // 1. Inject Resumes
  const resume1Id = generateId();
  const resume2Id = generateId();

  useResumeStore.setState({
    resumes: [
      {
        id: resume1Id,
        name: '前端开发-大厂特供版',
        createdAt: now - 30 * oneDay,
        updatedAt: now - 2 * oneDay,
        content: {
          personalInfo: {
            name: '李华 (Li Hua)',
            email: 'lihua.dev@example.com',
            phone: '138-0000-0000',
            github: 'github.com/lihua-dev',
            summary: '热爱前端技术的全栈开发者，对 React 生态和前端工程化有深入理解。熟悉现代前端架构（FSD），拥有丰富的从 0 到 1 项目落地经验。'
          },
          education: [
            {
              id: generateId(),
              school: 'xx大学',
              degree: '本科',
              major: '计算机科学与技术',
              startDate: '2020-09',
              endDate: '2024-06',
              description: '主修课程：数据结构、计算机网络、操作系统。多次获得校级一等奖学金，蓝桥杯省级一等奖。'
            }
          ],
          experience: [
            {
              id: generateId(),
              company: '字节跳动 (ByteDance)',
              title: '前端开发实习生',
              startDate: '2023-06',
              endDate: '2023-11',
              description: '- 参与抖音电商商家后台研发，使用 React + TypeScript 重构核心订单管理链路，页面加载首屏性能提升 30%。\n- 封装高复用性业务组件，主导了前端 Mock 拦截方案的设计与落地，缩短了 20% 的联调时间。'
            }
          ],
          projects: [
            {
              id: generateId(),
              name: 'offerFlow 大学生求职工作台',
              role: '独立开发者 / 全栈研发',
              startDate: '2024-01',
              endDate: '至今',
              description: '- 基于 Feature-Sliced Design 架构设计，使用 Zustand 配合 IndexedDB 实现极致流畅的纯前端离线体验。\n- 集成 LLM API 打造基于大模型的简历解析与 STAR 法则重写引擎。\n- 手写拖拽 Kanban 状态机，结合 ECharts 漏斗图分析求职数据转化率。'
            }
          ],
          skills: [
            {
              id: generateId(),
              category: '前端框架',
              items: ['React 19', 'Zustand', 'Next.js', 'Vite', 'TailwindCSS']
            },
            {
              id: generateId(),
              category: '工程化与进阶',
              items: ['TypeScript', 'Webpack', 'CI/CD', 'Docker', 'IndexedDB']
            }
          ]
        }
      },
      {
        id: resume2Id,
        name: '全栈开发-外企英文版',
        createdAt: now - 15 * oneDay,
        updatedAt: now,
        content: {
          personalInfo: {
            name: 'Hua Li',
            email: 'lihua.dev@example.com',
            phone: '+86 138-0000-0000',
            github: 'github.com/lihua-dev',
            summary: 'Passionate Full Stack Developer with deep expertise in the React ecosystem and modern web engineering. Experienced in architecting robust frontend applications and delivering high-performance UI.'
          },
          education: [],
          experience: [],
          projects: [],
          skills: []
        }
      }
    ],
    activeResumeId: resume1Id,
    past: [],
    future: []
  });

  // 2. Inject Job Bookmarks
  const job1Id = generateId();
  const job2Id = generateId();
  useJobStore.setState({
    bookmarks: [
      {
        id: job1Id,
        companyName: '腾讯 (Tencent)',
        jobTitle: '前端开发工程师 - WXG',
        salary: '25k-40k',
        location: '广州',
        url: 'https://careers.tencent.com/',
        source: '校招官网',
        notes: '微信核心业务线前端研发，负责高并发高可用的 Web 应用开发。',
        createdAt: now - 5 * oneDay
      },
      {
        id: job2Id,
        companyName: '阿里 (Alibaba)',
        jobTitle: '高级前端工程师 - 淘天集团',
        salary: '30k-50k',
        location: '杭州',
        url: 'https://talent.alibaba.com/',
        source: '脉脉内推',
        notes: '负责淘宝天猫核心交易链路前端研发，挑战极端的性能优化。',
        createdAt: now - 3 * oneDay
      },
      {
        id: generateId(),
        companyName: '字节跳动 (ByteDance)',
        jobTitle: '前端研发工程师 - 飞书',
        salary: '28k-45k',
        location: '北京',
        url: 'https://jobs.bytedance.com/',
        source: '牛客网',
        notes: '参与飞书文档/多维表格前端研发，对架构能力要求较高，需要深厚的 Canvas/WebGL 功底。',
        createdAt: now - 1 * oneDay
      },
      {
        id: generateId(),
        companyName: '美团 (Meituan)',
        jobTitle: '前端开发工程师 - 到店',
        salary: '22k-35k',
        location: '上海',
        url: 'https://zhaopin.meituan.com/',
        source: 'BOSS直聘',
        notes: '负责美团到店餐饮、综合等核心业务的前端开发。团队技术氛围好，基建完善。',
        createdAt: now - 8 * oneDay
      },
      {
        id: generateId(),
        companyName: '快手 (Kuaishou)',
        jobTitle: '前端工程师 - 国际化',
        salary: '25k-45k',
        location: '深圳',
        url: 'https://zhaopin.kuaishou.cn/',
        source: '猎头推荐',
        notes: '负责快手海外短视频产品矩阵的 Web/H5 研发，会有跨时区沟通需求。',
        createdAt: now - 2 * oneDay
      }
    ]
  });

  // 3. Inject Applications (for Kanban / Dashboard Funnel)
  useApplicationStore.setState({
    applications: [
      {
        id: generateId(),
        companyName: '美团 (Meituan)',
        jobTitle: '前端开发工程师 (基础架构)',
        jobDescription: '',
        status: 'hr',
        resumeId: resume1Id,
        url: '',
        notes: 'HR面很顺利，主要聊了职业规划和离职原因，给了 3 天时间等意向书。',
        updatedAt: now - 1 * oneDay,
        appliedAt: now - 20 * oneDay
      },
      {
        id: generateId(),
        companyName: '字节跳动 (ByteDance)',
        jobTitle: '前端研发 - 抖音电商',
        jobDescription: '',
        status: 'offer',
        resumeId: resume1Id,
        url: '',
        notes: '总包 40W+，签字费 3W。核心部门，非常满意！',
        updatedAt: now - 2 * oneDay,
        appliedAt: now - 25 * oneDay
      },
      {
        id: generateId(),
        companyName: '小红书 (Xiaohongshu)',
        jobTitle: '前端开发',
        jobDescription: '',
        status: 'interview',
        resumeId: resume1Id,
        url: '',
        notes: '二面准备中，需要重点复习 React Fiber 源码和 Webpack 性能优化。',
        updatedAt: now - 3 * oneDay,
        appliedAt: now - 10 * oneDay
      },
      {
        id: generateId(),
        companyName: '快手 (Kuaishou)',
        jobTitle: '前端工程师',
        jobDescription: '',
        status: 'oa',
        resumeId: resume2Id,
        url: '',
        notes: '笔试题包含 3 道算法，2 道 Hard，比较难。',
        updatedAt: now - 1 * oneDay,
        appliedAt: now - 2 * oneDay
      },
      {
        id: generateId(),
        companyName: '京东 (JD)',
        jobTitle: '前端研发',
        jobDescription: '',
        status: 'rejected',
        resumeId: resume1Id,
        url: '',
        notes: '简历挂了，可能是不匹配。',
        updatedAt: now - 10 * oneDay,
        appliedAt: now - 15 * oneDay
      },
      {
        id: generateId(),
        companyName: '百度 (Baidu)',
        jobTitle: 'Web前端研发工程师',
        jobDescription: '',
        status: 'applied',
        resumeId: resume1Id,
        url: '',
        notes: '官网内推，据说部门很核心。',
        updatedAt: now - 2 * oneDay,
        appliedAt: now - 4 * oneDay
      },
      {
        id: generateId(),
        companyName: '拼多多 (Pinduoduo)',
        jobTitle: '前端开发工程师',
        jobDescription: '',
        status: 'interview',
        resumeId: resume2Id,
        url: '',
        notes: '已约下周二面，需要准备下计算机网络。',
        updatedAt: now - 1 * oneDay,
        appliedAt: now - 12 * oneDay
      },
      {
        id: generateId(),
        companyName: '微软 (Microsoft)',
        jobTitle: 'Software Engineer',
        jobDescription: '',
        status: 'wishlist',
        resumeId: resume2Id,
        url: '',
        notes: '等秋招开启再投递，要再刷点 LeetCode。',
        updatedAt: now,
        appliedAt: now
      },
      {
        id: generateId(),
        companyName: '虾皮 (Shopee)',
        jobTitle: '前端工程师',
        jobDescription: '',
        status: 'oa',
        resumeId: resume1Id,
        url: '',
        notes: '机试全英文，题量偏大。',
        updatedAt: now - 5 * oneDay,
        appliedAt: now - 6 * oneDay
      }
    ]
  });

  // 4. Inject Schedule Events
  useScheduleStore.setState({
    events: [
      {
        id: generateId(),
        title: '小红书 - 二面 (视频)',
        type: 'interview',
        date: new Date(now + 1 * oneDay).toISOString().split('T')[0],
        time: '14:30',
        notes: '准备 React 源码相关的知识点。',
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        title: '快手 - 线上笔试',
        type: 'oa',
        date: new Date(now + 2 * oneDay).toISOString().split('T')[0],
        time: '19:00',
        notes: '平台是牛客网，记得提前调试好摄像头。',
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        title: '美团 Offer 截止反馈',
        type: 'deadline',
        date: new Date(now + 3 * oneDay).toISOString().split('T')[0],
        time: '12:00',
        notes: '在此之前必须给 HR 答复。',
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        title: '拼多多 - 二面 (视频)',
        type: 'interview',
        date: new Date(now + 4 * oneDay).toISOString().split('T')[0],
        time: '15:00',
        notes: '牛客网面试，重点看网络协议。',
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        title: '虾皮 (Shopee) 在线笔试',
        type: 'oa',
        date: new Date(now - 1 * oneDay).toISOString().split('T')[0],
        time: '19:00',
        notes: '已完成。',
        createdAt: now - 2 * oneDay,
        updatedAt: now - 1 * oneDay
      }
    ]
  });
};
