import type { Resume, ResumeLayoutConfig } from '../types/resume';

/**
 * 触发文件下载辅助函数
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 将简历转换为 Markdown 格式
 */
export const resumeToMarkdown = (resume: Resume): string => {
  const { personalInfo, education, experience, projects, skills, campusExperience, awards } = resume.content;
  const lines: string[] = [];

  // Header
  lines.push(`# ${personalInfo.name || '简历'}`);
  lines.push('');
  
  const contactParts = [
    personalInfo.phone && `📞 **电话**: ${personalInfo.phone}`,
    personalInfo.email && `📧 **邮箱**: ${personalInfo.email}`,
    personalInfo.city && `📍 **城市**: ${personalInfo.city}`,
    personalInfo.github && `🐙 **GitHub**: [${personalInfo.github.replace(/^https?:\/\//, '')}](${personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`})`,
    personalInfo.website && `🌐 **主页**: [${personalInfo.website.replace(/^https?:\/\//, '')}](${personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`})`,
  ].filter(Boolean);
  if (contactParts.length > 0) {
    lines.push(contactParts.join(' | '));
  }

  const metaParts = [
    personalInfo.intendedRole && `🎯 **求职意向**: ${personalInfo.intendedRole}`,
    personalInfo.intendedCity && `🏢 **意向城市**: ${personalInfo.intendedCity}`,
    personalInfo.gender && `👤 **性别**: ${personalInfo.gender}`,
    personalInfo.birthDate && `🎂 **生日**: ${personalInfo.birthDate}`,
    personalInfo.ethnicity && `🏷️ **民族**: ${personalInfo.ethnicity}`,
    personalInfo.politicalStatus && `🚩 **政治面貌**: ${personalInfo.politicalStatus}`,
    ...(personalInfo.customFields || []).filter(f => f.label && f.value).map(f => `📌 **${f.label}**: ${f.value}`),
  ].filter(Boolean);
  if (metaParts.length > 0) {
    lines.push(metaParts.join(' | '));
  }
  lines.push('');

  // Education
  if (education && education.length > 0) {
    lines.push('## 🎓 教育经历');
    lines.push('');
    education.forEach(edu => {
      lines.push(`### ${edu.school} | ${edu.major}${edu.degree ? ` (${edu.degree})` : ''}`);
      lines.push(`*${edu.startDate || ''} ${edu.startDate && edu.endDate ? '-' : ''} ${edu.endDate || ''}*`);
      if (edu.description) {
        lines.push('');
        lines.push(edu.description);
      }
      lines.push('');
    });
  }

  // Experience
  if (experience && experience.length > 0) {
    lines.push('## 💼 工作经历');
    lines.push('');
    experience.forEach(exp => {
      lines.push(`### ${exp.company} - ${exp.title}`);
      lines.push(`*${exp.startDate || ''} ${exp.startDate && exp.endDate ? '-' : ''} ${exp.endDate || ''}*`);
      if (exp.description) {
        lines.push('');
        lines.push(exp.description);
      }
      lines.push('');
    });
  }

  // Projects
  if (projects && projects.length > 0) {
    lines.push('## 🚀 项目经历');
    lines.push('');
    projects.forEach(proj => {
      const linkText = proj.link ? ` ([项目链接](${proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}))` : '';
      lines.push(`### ${proj.name} - ${proj.role}${linkText}`);
      lines.push(`*${proj.startDate || ''} ${proj.startDate && proj.endDate ? '-' : ''} ${proj.endDate || ''}*`);
      if (proj.techStack) {
        lines.push(`- **技术栈**: ${proj.techStack}`);
      }
      if (proj.description) {
        lines.push(`- **项目介绍**: ${proj.description}`);
      }
      if (proj.highlights) {
        lines.push(`- **项目亮点/成果**:`);
        lines.push(proj.highlights.split('\n').map(l => `  ${l}`).join('\n'));
      }
      lines.push('');
    });
  }

  // Skills
  if (skills && skills.length > 0) {
    lines.push('## 🛠️ 专业技能');
    lines.push('');
    skills.forEach(skill => {
      lines.push(`- **${skill.category}**：${skill.items.join(' ')}`);
    });
    lines.push('');
  }

  // Campus Experience
  if (campusExperience && campusExperience.length > 0) {
    lines.push('## 🏫 校园经历');
    lines.push('');
    campusExperience.forEach(camp => {
      lines.push(`### ${camp.organization} - ${camp.role}`);
      lines.push(`*${camp.startDate || ''} ${camp.startDate && camp.endDate ? '-' : ''} ${camp.endDate || ''}*`);
      if (camp.description) {
        lines.push('');
        lines.push(camp.description);
      }
      lines.push('');
    });
  }

  // Awards
  if (awards && awards.length > 0) {
    lines.push('## 🏆 荣誉奖项');
    lines.push('');
    awards.forEach(award => {
      lines.push(`- **${award.name}** (${award.date || '获奖'})${award.awarder ? ` - 颁发机构: ${award.awarder}` : ''}`);
      if (award.description) {
        lines.push(`  ${award.description}`);
      }
    });
    lines.push('');
  }

  // Summary
  if (personalInfo.summary) {
    lines.push('## 💡 自我评价');
    lines.push('');
    lines.push(personalInfo.summary);
    lines.push('');
  }

  return lines.join('\n');
};

/**
 * 将简历转换为纯文本 TXT 格式（适合招聘网站纯文本快速复制粘贴）
 */
export const resumeToTxt = (resume: Resume): string => {
  const { personalInfo, education, experience, projects, skills, campusExperience, awards } = resume.content;
  const lines: string[] = [];

  // Header
  lines.push(`【基本信息】`);
  lines.push(`姓名：${personalInfo.name || '未填写'}`);
  if (personalInfo.phone) lines.push(`电话：${personalInfo.phone}`);
  if (personalInfo.email) lines.push(`邮箱：${personalInfo.email}`);
  if (personalInfo.city) lines.push(`城市：${personalInfo.city}`);
  if (personalInfo.intendedRole) lines.push(`求职意向：${personalInfo.intendedRole}`);
  if (personalInfo.intendedCity) lines.push(`意向城市：${personalInfo.intendedCity}`);
  if (personalInfo.gender) lines.push(`性别：${personalInfo.gender}`);
  if (personalInfo.birthDate) lines.push(`生日：${personalInfo.birthDate}`);
  if (personalInfo.ethnicity) lines.push(`民族：${personalInfo.ethnicity}`);
  if (personalInfo.politicalStatus) lines.push(`政治面貌：${personalInfo.politicalStatus}`);
  (personalInfo.customFields || []).filter(f => f.label && f.value).forEach(f => {
    lines.push(`${f.label}：${f.value}`);
  });
  if (personalInfo.github) lines.push(`GitHub：${personalInfo.github}`);
  if (personalInfo.website) lines.push(`个人主页：${personalInfo.website}`);
  lines.push('');

  // Education
  if (education && education.length > 0) {
    lines.push('【教育经历】');
    education.forEach(edu => {
      lines.push(`• ${edu.school} | ${edu.major} | ${edu.degree || ''} (${edu.startDate || ''} - ${edu.endDate || ''})`);
      if (edu.description) lines.push(`  ${edu.description.replace(/\n/g, '\n  ')}`);
    });
    lines.push('');
  }

  // Experience
  if (experience && experience.length > 0) {
    lines.push('【工作经历】');
    experience.forEach(exp => {
      lines.push(`• ${exp.company} - ${exp.title} (${exp.startDate || ''} - ${exp.endDate || ''})`);
      if (exp.description) lines.push(`  ${exp.description.replace(/\n/g, '\n  ')}`);
    });
    lines.push('');
  }

  // Projects
  if (projects && projects.length > 0) {
    lines.push('【项目经历】');
    projects.forEach(proj => {
      lines.push(`• ${proj.name} - ${proj.role} (${proj.startDate || ''} - ${proj.endDate || ''})`);
      if (proj.link) lines.push(`  项目链接: ${proj.link}`);
      if (proj.techStack) lines.push(`  技术栈: ${proj.techStack}`);
      if (proj.description) lines.push(`  项目描述: ${proj.description}`);
      if (proj.highlights) lines.push(`  项目亮点: \n  ${proj.highlights.replace(/\n/g, '\n  ')}`);
    });
    lines.push('');
  }

  // Skills
  if (skills && skills.length > 0) {
    lines.push('【专业技能】');
    skills.forEach(skill => {
      lines.push(`• ${skill.category}：${skill.items.join(' ')}`);
    });
    lines.push('');
  }

  // Campus Experience
  if (campusExperience && campusExperience.length > 0) {
    lines.push('【校园经历】');
    campusExperience.forEach(camp => {
      lines.push(`• ${camp.organization} - ${camp.role} (${camp.startDate || ''} - ${camp.endDate || ''})`);
      if (camp.description) lines.push(`  ${camp.description.replace(/\n/g, '\n  ')}`);
    });
    lines.push('');
  }

  // Awards
  if (awards && awards.length > 0) {
    lines.push('【荣誉奖项】');
    awards.forEach(award => {
      lines.push(`• ${award.name} (${award.date || ''}) ${award.awarder ? `- ${award.awarder}` : ''}`);
      if (award.description) lines.push(`  ${award.description}`);
    });
    lines.push('');
  }

  // Summary
  if (personalInfo.summary) {
    lines.push('【自我评价】');
    lines.push(personalInfo.summary);
    lines.push('');
  }

  return lines.join('\n');
};

/**
 * 将简历转换为单文件 HTML 格式（附带精美内联样式，可离线双击打开预览）
 */
export const resumeToHtml = (resume: Resume, layout?: ResumeLayoutConfig): string => {
  const name = resume.content.personalInfo.name || resume.name || '简历';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - 个人简历</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      line-height: ${layout?.lineHeight || 1.5};
      font-size: ${layout?.baseFontSize || 13}px;
      color: #1f2937;
      background-color: #f3f4f6;
      margin: 0;
      padding: 24px;
    }
    .page-container {
      max-width: 794px;
      margin: 0 auto;
      background: #ffffff;
      padding: ${layout?.pagePadding || 36}px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      box-sizing: border-box;
    }
    h1 { font-size: ${(layout?.baseFontSize || 13) + 14}px; margin-top: 0; margin-bottom: 8px; color: #111827; }
    h2 {
      background-color: #f2f4f7;
      border-left: 4px solid #1f2937;
      padding: 4px 10px;
      font-size: ${(layout?.baseFontSize || 13) + 3}px;
      margin-top: ${layout?.sectionSpacing || 16}px;
      margin-bottom: 8px;
      color: #1f2937;
    }
    h3 { font-size: ${(layout?.baseFontSize || 13) + 1.5}px; margin: 6px 0 2px 0; color: #111827; }
    p, li { color: #374151; }
    ul { margin: 4px 0 8px 0; padding-left: 20px; }
    li { margin-bottom: 3px; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    @media print {
      body { background: transparent; padding: 0; }
      .page-container { box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    ${resumeToHtmlBody(resume, layout)}
  </div>
</body>
</html>`;
};

const resumeToHtmlBody = (resume: Resume, layout?: ResumeLayoutConfig): string => {
  const { personalInfo, education, experience, projects, skills, campusExperience, awards } = resume.content;
  const baseFontSize = layout?.baseFontSize || 13;
  const itemSpacing = layout?.itemSpacing || 12;
  const sectionSpacing = layout?.sectionSpacing || 16;
  const htmlParts: string[] = [];

  // Header
  const contactParts = [
    personalInfo.phone && `电话：${personalInfo.phone}`,
    personalInfo.email && `邮箱：${personalInfo.email}`,
    personalInfo.city && `现居：${personalInfo.city}`,
  ].filter(Boolean);

  const linkParts = [
    personalInfo.github && `GitHub：<a href="${personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`}" target="_blank">${personalInfo.github.replace(/^https?:\/\//, '')}</a>`,
    personalInfo.website && `主页：<a href="${personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`}" target="_blank">${personalInfo.website.replace(/^https?:\/\//, '')}</a>`,
  ].filter(Boolean);

  const intentParts = [
    personalInfo.intendedCity && `意向城市：${personalInfo.intendedCity}`,
    personalInfo.intendedRole && `求职意向：${personalInfo.intendedRole}`,
    personalInfo.gender && `性别：${personalInfo.gender}`,
    personalInfo.birthDate && `生日：${personalInfo.birthDate}`,
    personalInfo.ethnicity && `民族：${personalInfo.ethnicity}`,
    personalInfo.politicalStatus && `政治面貌：${personalInfo.politicalStatus}`,
  ].filter(Boolean);

  const customParts = (personalInfo.customFields || [])
    .filter(f => f.label && f.value)
    .map(f => {
      const isUrl = /^https?:\/\//i.test(f.value) || /^(www\.|github\.com|gitee\.com|linkedin\.com)/i.test(f.value);
      const href = f.value.startsWith('http') ? f.value : `https://${f.value}`;
      return isUrl 
        ? `${f.label}：<a href="${href}" target="_blank">${f.value.replace(/^https?:\/\//, '')}</a>`
        : `${f.label}：${f.value}`;
    });

  const rows = [contactParts, linkParts, intentParts, customParts].filter(r => r.length > 0);

  htmlParts.push(`
    <header style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${Math.max(12, sectionSpacing * 0.9)}px;">
      <div style="flex: 1;">
        <h1>${personalInfo.name || '您的名字'}</h1>
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: ${baseFontSize}px; color: #4b5563; line-height: 1.35;">
          ${rows.map(r => `<div>${r.join(' | ')}</div>`).join('')}
        </div>
      </div>
      ${personalInfo.avatar ? `<img src="${personalInfo.avatar}" alt="Avatar" style="width: 75px; height: 100px; object-fit: cover; border-radius: 4px; margin-left: 16px;" />` : ''}
    </header>
  `);

  const renderDesc = (desc?: string) => {
    if (!desc) return '';
    const lines = desc.split('\n').filter(Boolean);
    return `<ul>${lines.map(l => `<li>${l.replace(/^[-*•·]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('')}</ul>`;
  };

  // Education
  if (education && education.length > 0) {
    htmlParts.push(`<h2>教育经历</h2>`);
    education.forEach(edu => {
      htmlParts.push(`
        <div style="margin-bottom: ${itemSpacing}px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${edu.school}</span>
            <span style="font-weight: normal; color: #6b7280; font-size: ${baseFontSize - 1}px;">${edu.startDate || ''} - ${edu.endDate || ''}</span>
          </div>
          <div style="color: #4b5563; font-size: ${baseFontSize}px;">${edu.major} ${edu.degree ? `| ${edu.degree}` : ''}</div>
          ${renderDesc(edu.description)}
        </div>
      `);
    });
  }

  // Experience
  if (experience && experience.length > 0) {
    htmlParts.push(`<h2>工作经历</h2>`);
    experience.forEach(exp => {
      htmlParts.push(`
        <div style="margin-bottom: ${itemSpacing}px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${exp.company}</span>
            <span style="font-weight: normal; color: #6b7280; font-size: ${baseFontSize - 1}px;">${exp.startDate || ''} - ${exp.endDate || ''}</span>
          </div>
          <div style="color: #4b5563; font-size: ${baseFontSize}px;">${exp.title}</div>
          ${renderDesc(exp.description)}
        </div>
      `);
    });
  }

  // Projects
  if (projects && projects.length > 0) {
    htmlParts.push(`<h2>项目经历</h2>`);
    projects.forEach(proj => {
      htmlParts.push(`
        <div style="margin-bottom: ${itemSpacing}px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${proj.name} ${proj.link ? `<a href="${proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}" target="_blank" style="font-size: ${baseFontSize}px; font-weight: normal; margin-left: 8px;">链接</a>` : ''}</span>
            <span style="font-weight: normal; color: #6b7280; font-size: ${baseFontSize - 1}px;">${proj.startDate || ''} - ${proj.endDate || ''}</span>
          </div>
          <div style="color: #4b5563; font-size: ${baseFontSize}px;">${proj.role}</div>
          ${proj.techStack ? `<div style="font-size: ${baseFontSize}px; margin-top: 2px;"><strong>技术栈：</strong>${proj.techStack}</div>` : ''}
          ${proj.description ? `<div style="font-size: ${baseFontSize}px; margin-top: 2px;"><strong>项目介绍：</strong>${proj.description}</div>` : ''}
          ${proj.highlights ? `<div style="font-size: ${baseFontSize}px; margin-top: 2px;"><strong>项目亮点：</strong>${renderDesc(proj.highlights)}</div>` : ''}
        </div>
      `);
    });
  }

  // Skills
  if (skills && skills.length > 0) {
    htmlParts.push(`<h2>专业技能</h2>`);
    htmlParts.push(`<div style="display: flex; flex-direction: column; gap: 4px;">`);
    skills.forEach(skill => {
      htmlParts.push(`<div><strong>· ${skill.category}：</strong>${skill.items.join(' ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`);
    });
    htmlParts.push(`</div>`);
  }

  // Campus Experience
  if (campusExperience && campusExperience.length > 0) {
    htmlParts.push(`<h2>校园经历</h2>`);
    campusExperience.forEach(camp => {
      htmlParts.push(`
        <div style="margin-bottom: ${itemSpacing}px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${camp.organization}</span>
            <span style="font-weight: normal; color: #6b7280; font-size: ${baseFontSize - 1}px;">${camp.startDate || ''} - ${camp.endDate || ''}</span>
          </div>
          <div style="color: #4b5563;">${camp.role}</div>
          ${renderDesc(camp.description)}
        </div>
      `);
    });
  }

  // Awards
  if (awards && awards.length > 0) {
    htmlParts.push(`<h2>荣誉奖项</h2>`);
    awards.forEach(award => {
      htmlParts.push(`
        <div style="margin-bottom: ${itemSpacing}px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${award.name}</span>
            <span style="font-weight: normal; color: #6b7280; font-size: ${baseFontSize - 1}px;">${award.date || ''}</span>
          </div>
          <div style="color: #4b5563;">${award.awarder || ''}</div>
          ${award.description ? `<p style="margin: 2px 0;">${award.description}</p>` : ''}
        </div>
      `);
    });
  }

  // Summary
  if (personalInfo.summary) {
    htmlParts.push(`<h2>自我评价</h2>`);
    htmlParts.push(`<p>${personalInfo.summary.replace(/\n/g, '<br/>')}</p>`);
  }

  return htmlParts.join('\n');
};
