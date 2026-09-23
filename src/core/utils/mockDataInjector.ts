import { useResumeStore } from '../../features/resumes/store/useResumeStore';
import { useApplicationStore } from '../../features/applications/store/useApplicationStore';
import { useJobStore } from '../../features/jobBoard/store/useJobStore';
import { useScheduleStore } from '../../features/schedule/store/useScheduleStore';
import { useAuthStore } from '../store/useAuthStore';
import { getTodayDateStr, getRelativeDateStr, getRelativeTimestamp } from './dateUtils';

export { getTodayDateStr, getRelativeDateStr, getRelativeTimestamp };

const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Injects rich, realistic mock data for Demo mode, dynamically aligned with Today's date
 */
export const injectMockData = (baseDate: Date = new Date()) => {
  const todayStr = getRelativeDateStr(0, baseDate);
  const now = baseDate.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

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
            name: '李华',
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
          ],
          campusExperience: [],
          awards: []
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
          skills: [],
          campusExperience: [],
          awards: []
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
        createdAt: getRelativeTimestamp(-5, 0, baseDate)
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
        createdAt: getRelativeTimestamp(-3, 0, baseDate)
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
        createdAt: getRelativeTimestamp(-1, 0, baseDate)
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
        createdAt: getRelativeTimestamp(-8, 0, baseDate)
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
        createdAt: getRelativeTimestamp(-2, 0, baseDate)
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
        priority: 'dream',
        location: '北京',
        salary: '25k-35k * 15.5',
        resumeId: resume1Id,
        url: 'https://zhaopin.meituan.com/',
        notes: 'HR面很顺利，主要聊了职业规划和团队业务，给了承诺意向。',
        updatedAt: getRelativeTimestamp(-1, 0, baseDate),
        appliedAt: getRelativeTimestamp(-18, 0, baseDate)
      },
      {
        id: generateId(),
        companyName: '字节跳动 (ByteDance)',
        jobTitle: '前端研发 - 抖音电商',
        jobDescription: '',
        status: 'offer',
        priority: 'dream',
        location: '杭州',
        salary: '28k-45k * 15',
        resumeId: resume1Id,
        url: 'https://jobs.bytedance.com/',
        notes: '总包 40W+，签字费 3W。核心业务部门，非常满意！',
        updatedAt: getRelativeTimestamp(-2, 0, baseDate),
        appliedAt: getRelativeTimestamp(-25, 0, baseDate)
      },
      {
        id: generateId(),
        companyName: '小红书 (Xiaohongshu)',
        jobTitle: '前端开发',
        jobDescription: '',
        status: 'interview',
        priority: 'target',
        location: '上海',
        salary: '22k-32k * 14',
        resumeId: resume1Id,
        url: '',
        notes: '今天安排二面，重点复习 React Fiber 源码与 Webpack 性能优化指标。',
        updatedAt: getRelativeTimestamp(0, -2, baseDate),
        appliedAt: getRelativeTimestamp(-10, 0, baseDate)
      },
      {
        id: generateId(),
        companyName: '快手 (Kuaishou)',
        jobTitle: '前端工程师',
        jobDescription: '',
        status: 'oa',
        priority: 'target',
        location: '北京',
        salary: '24k-38k',
        resumeId: resume2Id,
        url: '',
        notes: '收到牛客网在线笔试邀请，3天内自选作答。包含 3 道算法题。',
        updatedAt: getRelativeTimestamp(0, -1, baseDate),
        appliedAt: getRelativeTimestamp(-2, 0, baseDate)
      },
      {
        id: generateId(),
        companyName: '京东 (JD)',
        jobTitle: '前端研发',
        jobDescription: '',
        status: 'rejected',
        priority: 'safety',
        location: '北京',
        salary: '20k-30k',
        resumeId: resume1Id,
        url: '',
        notes: '简历初筛未通过，保持平常心。',
        updatedAt: getRelativeTimestamp(-10, 0, baseDate),
        appliedAt: getRelativeTimestamp(-15, 0, baseDate)
      },
      {
        id: generateId(),
        companyName: '百度 (Baidu)',
        jobTitle: 'Web前端研发工程师',
        jobDescription: '',
        status: 'applied',
        priority: 'target',
        location: '北京',
        salary: '22k-35k',
        resumeId: resume1Id,
        url: '',
        notes: '官网内推已提交，等待初筛反馈。',
        updatedAt: getRelativeTimestamp(-2, 0, baseDate),
        appliedAt: getRelativeTimestamp(-4, 0, baseDate)
      },
      {
        id: generateId(),
        companyName: '拼多多 (Pinduoduo)',
        jobTitle: '前端开发工程师',
        jobDescription: '',
        status: 'interview',
        priority: 'dream',
        location: '上海',
        salary: '30k-50k * 16',
        resumeId: resume2Id,
        url: '',
        notes: '已约加面，需要重点准备计算机网络协议与工程化基建。',
        updatedAt: getRelativeTimestamp(-1, 0, baseDate),
        appliedAt: getRelativeTimestamp(-12, 0, baseDate)
      },
      {
        id: generateId(),
        companyName: '微软 (Microsoft)',
        jobTitle: 'Software Engineer',
        jobDescription: '',
        status: 'wishlist',
        priority: 'dream',
        location: '苏州/上海',
        salary: '30W-45W',
        resumeId: resume2Id,
        url: '',
        notes: '等秋招开启再投递，近期多刷 LeetCode 英文版。',
        updatedAt: getRelativeTimestamp(0, 0, baseDate),
        appliedAt: getRelativeTimestamp(0, 0, baseDate)
      },
      {
        id: generateId(),
        companyName: '虾皮 (Shopee)',
        jobTitle: '前端工程师',
        jobDescription: '',
        status: 'oa',
        priority: 'safety',
        location: '深圳',
        salary: '20k-32k',
        resumeId: resume1Id,
        url: '',
        notes: '笔试已作答完毕，等待 HR 推进下一轮。',
        updatedAt: getRelativeTimestamp(-8, 0, baseDate), // Stalled 8 days to realistically demo StalledApplications widget
        appliedAt: getRelativeTimestamp(-9, 0, baseDate)
      }
    ]
  });

  // 4. Inject Schedule Events (Dynamically centered around Today)
  useScheduleStore.setState({
    events: [
      {
        id: generateId(),
        title: '小红书 - 二面 (技术深挖与项目实战)',
        type: 'interview',
        date: getRelativeDateStr(0, baseDate), // Today!
        time: '14:30',
        timeType: 'specific',
        location: 'https://meeting.tencent.com/dm/123-456-789',
        notes: '重点准备 React 19 新特性、Fiber 并发模式与大文件分片断点续传项目。',
        isCompleted: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        title: '快手 - 线上笔试 (3天内自选时段作答)',
        type: 'oa',
        date: getRelativeDateStr(3, baseDate), // In 3 days
        startDate: todayStr,
        time: '23:59',
        timeType: 'deadline',
        location: 'https://nowcoder.com/exam/test/889922',
        notes: '平台为牛客网，3天内任选连续2小时作答，提前调试好摄像头和双机位。',
        isCompleted: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        title: '字节跳动 - 抖音电商前端一面 (视频)',
        type: 'interview',
        date: getRelativeDateStr(1, baseDate), // Tomorrow!
        time: '16:00',
        timeType: 'specific',
        location: 'https://meeting.tencent.com/dm/888-666-999',
        notes: '准备算法 LeetCode 字符串/动态规划，以及性能优化实战指标。',
        isCompleted: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        title: '美团 - Offer 意向反馈截止',
        type: 'deadline',
        date: getRelativeDateStr(3, baseDate), // In 3 days
        startDate: todayStr,
        time: '18:00',
        timeType: 'deadline',
        notes: '在此时间前需要给 HR 答复意向书确认。',
        isCompleted: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        title: '拼多多 - 业务技术加面 (视频)',
        type: 'interview',
        date: getRelativeDateStr(5, baseDate), // In 5 days
        time: '15:00',
        timeType: 'specific',
        location: 'https://meeting.tencent.com/dm/987-654-321',
        notes: '重点看网络协议 (HTTP/2, HTTP/3, QUIC) 与工程化基建。',
        isCompleted: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        title: '虾皮 (Shopee) 在线笔试',
        type: 'oa',
        date: getRelativeDateStr(-1, baseDate), // Yesterday
        time: '19:00',
        timeType: 'specific',
        notes: '全英文选择题与两道算法题，已顺利完成作答。',
        isCompleted: true,
        isArchived: false,
        createdAt: now - 2 * oneDay,
        updatedAt: now - 1 * oneDay
      },
      {
        id: generateId(),
        title: '腾讯 WXG - 前端开发一面 (已完成)',
        type: 'interview',
        date: getRelativeDateStr(-3, baseDate), // 3 days ago
        time: '14:00',
        timeType: 'specific',
        location: 'https://meeting.tencent.com/dm/334-556-778',
        notes: '【复盘总结】面试官考察了 React 渲染机制与 Web Worker。已存入日程回收站，可随时回顾或恢复。',
        isCompleted: true,
        isArchived: true,
        archivedAt: getRelativeTimestamp(-2, 0, baseDate),
        createdAt: now - 5 * oneDay,
        updatedAt: now - 2 * oneDay
      }
    ]
  });
};

/**
 * Automatically checks and re-aligns demo data dates if they have drifted into the past
 */
export const alignDemoDataDatesIfStale = () => {
  const { isGuest } = useAuthStore.getState();
  if (!isGuest) return;

  const todayStr = getTodayDateStr();
  const events = useScheduleStore.getState().events;
  const activeUpcoming = events.filter(e => !e.isArchived && e.date >= todayStr);

  // If there are no upcoming active events (e.g. all drifted into the past), re-align demo dates!
  if (activeUpcoming.length === 0) {
    injectMockData();
  }
};
