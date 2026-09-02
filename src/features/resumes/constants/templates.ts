import type { ResumeTemplateId, ResumeTemplate } from '../types/resume';

export { type ResumeTemplateId, type ResumeTemplate };

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic',
    name: '经典商务',
    description: '标准黑白灰商务排版，适合互联网、金融与传统行业',
  },
  {
    id: 'modern',
    name: '现代极简',
    description: '高雅精致线条，适合科技大厂与创新企业求职',
  },
  {
    id: 'compact',
    name: '紧凑单页',
    description: '专为丰富经历优化的单页高密度信息排版',
  },
  {
    id: 'standard',
    name: '标准通用',
    description: '通用于各行各业的均衡简历排版',
  },
];
