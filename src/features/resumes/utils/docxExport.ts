import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Tab,
  TabStopType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ExternalHyperlink,
  ImageRun,
} from 'docx';
import type { Resume, ResumeLayoutConfig } from '../types/resume';

/**
 * 解析 base64 DataURL 提取 Uint8Array 与图片类型
 */
const parseDataUrlImage = (dataUrl: string): { bytes: Uint8Array; type: 'jpg' | 'png' | 'gif' | 'bmp' } | null => {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    let type: 'jpg' | 'png' | 'gif' | 'bmp' = 'jpg';
    if (dataUrl.includes('image/png')) type = 'png';
    else if (dataUrl.includes('image/gif')) type = 'gif';
    else if (dataUrl.includes('image/bmp')) type = 'bmp';

    const binary = atob(parts[1]);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { bytes, type };
  } catch (e) {
    console.warn('Failed to parse avatar for docx export:', e);
    return null;
  }
};

const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const TABLE_NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

/**
 * 模板章节标题：使用纯原生 Paragraph 实现全宽浅灰底色 + 4px 深黑蓝左实线边框
 * 绝对不使用 Table，杜绝 Word 显示虚线网格或宽度折叠 Bug
 */
const createSectionBanner = (
  title: string,
  sectionTitleSize: number,
  sectionSpacing: number
): Paragraph => {
  return new Paragraph({
    shading: { fill: 'F2F4F7' },
    border: {
      left: {
        style: BorderStyle.SINGLE,
        size: 28, // ~3.5pt / 4px
        color: '1F2937',
        space: 10,
      },
    },
    spacing: {
      before: Math.max(160, Math.round(sectionSpacing * 12)),
      after: Math.max(60, Math.round(sectionSpacing * 4)),
    },
    indent: { left: 140 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: sectionTitleSize,
        color: '1F2937',
        font: 'Microsoft YaHei',
      }),
    ],
  });
};

/**
 * 左右两极对齐标题行（左侧名称/单位，右侧起止日期）
 * 使用 Word 官方推荐的制表位（Right-aligned TabStop）实现
 * 无任何 Table 容器，彻底根治 Word 单元格虚线框、文字被挤压换行等顽疾
 */
const createTwoColumnItemHeader = (
  leftTitle: string,
  rightDate: string,
  itemTitleSize: number,
  metaDateSize: number,
  contentWidthDxa: number,
  beforeSpacing: number = 60,
  linkNode?: ExternalHyperlink
): Paragraph => {
  const runs: (TextRun | ExternalHyperlink)[] = [
    new TextRun({
      text: leftTitle,
      bold: true,
      size: itemTitleSize,
      color: '111827',
      font: 'Microsoft YaHei',
    }),
  ];

  if (linkNode) {
    runs.push(new TextRun({ text: '  ' }));
    runs.push(linkNode);
  }

  if (rightDate) {
    runs.push(
      new TextRun({
        children: [new Tab(), rightDate],
        size: metaDateSize,
        color: '4B5563',
        font: 'Microsoft YaHei',
      })
    );
  }

  return new Paragraph({
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: contentWidthDxa,
      },
    ],
    spacing: { before: beforeSpacing, after: 20 },
    children: runs,
  });
};

/**
 * 解析带 Markdown 加粗（**text**）和换行的正文描述段落
 */
const createDescriptionParagraphs = (
  text?: string,
  bodySize: number = 20,
  lineSpacingDxa: number = 300,
  prefixNode?: TextRun
): Paragraph[] => {
  if (!text || !text.trim()) return [];

  const lines = text.split('\n').filter(l => l.trim().length > 0);
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    const isBullet = /^[-*•·]\s*/.test(trimmed);
    const content = trimmed.replace(/^[-*•·]\s*/, '');

    const parts = content.split(/(\*\*.*?\*\*)/g);
    const runs: TextRun[] = [];

    if (lineIdx === 0 && prefixNode) {
      runs.push(prefixNode);
    }

    parts.forEach(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        runs.push(
          new TextRun({
            text: part.slice(2, -2),
            bold: true,
            size: bodySize,
            color: '111827',
            font: 'Microsoft YaHei',
          })
        );
      } else if (part.length > 0) {
        runs.push(
          new TextRun({
            text: part,
            size: bodySize,
            color: '374151',
            font: 'Microsoft YaHei',
          })
        );
      }
    });

    return new Paragraph({
      bullet: isBullet ? { level: 0 } : undefined,
      spacing: { before: 15, after: 15, line: lineSpacingDxa },
      children: runs,
    });
  });
};

/**
 * 100% 保持简历模板样式与排版配置的 Word (.docx) 生成函数
 */
export const generateResumeDocx = async (
  resume: Resume,
  layout?: ResumeLayoutConfig
): Promise<Blob> => {
  const {
    personalInfo,
    education = [],
    experience = [],
    projects = [],
    skills = [],
    campusExperience = [],
    awards = [],
  } = resume.content;

  // 严格从用户排版微调配置读取数值
  const baseFontSize = layout?.baseFontSize || 13;
  const lineHeight = layout?.lineHeight || 1.5;
  const sectionSpacing = layout?.sectionSpacing || 16;
  const itemSpacing = layout?.itemSpacing || 12;
  const pagePadding = layout?.pagePadding || 36;

  // 统一换算为 Word half-points (1pt = 2 half-points, 1px ≈ 1.6 half-points)
  const nameSize = Math.round((baseFontSize + 14) * 1.6);
  const sectionTitleSize = Math.round((baseFontSize + 3) * 1.6);
  const itemTitleSize = Math.round((baseFontSize + 1.5) * 1.6);
  const itemSubtitleSize = Math.round((baseFontSize + 0.5) * 1.6);
  const bodySize = Math.round(baseFontSize * 1.6);
  const metaDateSize = Math.round(Math.max(11, baseFontSize - 0.5) * 1.6);
  const subSmallSize = Math.round((baseFontSize - 1) * 1.6);

  // A4 标准纸张（210mm x 297mm = 11906 x 16838 dxa）
  const pageWidthDxa = 11906;
  const pageMarginDxa = Math.round(Math.max(20, pagePadding) * 15);
  // 可视打印宽度（制表位终点）
  const contentWidthDxa = pageWidthDxa - pageMarginDxa * 2;
  const lineSpacingDxa = Math.round(lineHeight * 200);

  const docChildren: (Paragraph | Table)[] = [];

  // ================= 1. 个人信息 (Header) =================
  const headerParagraphs: Paragraph[] = [];

  // 姓名 (超大加粗标题)
  headerParagraphs.push(
    new Paragraph({
      spacing: { before: 0, after: Math.round(sectionSpacing * 3) },
      children: [
        new TextRun({
          text: personalInfo.name || '您的名字',
          bold: true,
          size: nameSize,
          color: '111827',
          font: 'Microsoft YaHei',
        }),
      ],
    })
  );

  // 联系方式 (电话 | 邮箱 | 现居城市)
  const contactItems = [
    personalInfo.phone && `电话：${personalInfo.phone}`,
    personalInfo.email && `邮箱：${personalInfo.email}`,
    personalInfo.city && `现居城市：${personalInfo.city}`,
  ].filter(Boolean) as string[];

  if (contactItems.length > 0) {
    headerParagraphs.push(
      new Paragraph({
        spacing: { before: 12, after: 12, line: lineSpacingDxa },
        children: [
          new TextRun({
            text: contactItems.join('  |  '),
            size: bodySize,
            color: '4B5563',
            font: 'Microsoft YaHei',
          }),
        ],
      })
    );
  }

  // 链接行 (GitHub | 个人主页)
  const linkRuns: (TextRun | ExternalHyperlink)[] = [];
  if (personalInfo.github) {
    const ghUrl = personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`;
    linkRuns.push(new TextRun({ text: 'GitHub：', size: bodySize, color: '4B5563', font: 'Microsoft YaHei' }));
    linkRuns.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: personalInfo.github.replace(/^https?:\/\//, ''),
            size: bodySize,
            color: '2563EB',
            underline: {},
            font: 'Microsoft YaHei',
          }),
        ],
        link: ghUrl,
      })
    );
  }

  if (personalInfo.website) {
    if (linkRuns.length > 0) linkRuns.push(new TextRun({ text: '  |  ', size: bodySize, color: 'D1D5DB' }));
    const wsUrl = personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`;
    linkRuns.push(new TextRun({ text: '主页：', size: bodySize, color: '4B5563', font: 'Microsoft YaHei' }));
    linkRuns.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: personalInfo.website.replace(/^https?:\/\//, ''),
            size: bodySize,
            color: '2563EB',
            underline: {},
            font: 'Microsoft YaHei',
          }),
        ],
        link: wsUrl,
      })
    );
  }

  if (linkRuns.length > 0) {
    headerParagraphs.push(
      new Paragraph({
        spacing: { before: 12, after: 12, line: lineSpacingDxa },
        children: linkRuns,
      })
    );
  }

  // 人口统计信息 (性别 | 生日 | 民族 | 政治面貌)
  const demographicItems = [
    personalInfo.gender && `性别：${personalInfo.gender}`,
    personalInfo.birthDate && `生日：${personalInfo.birthDate}`,
    personalInfo.ethnicity && `民族：${personalInfo.ethnicity}`,
    personalInfo.politicalStatus && `政治面貌：${personalInfo.politicalStatus}`,
  ].filter(Boolean) as string[];

  if (demographicItems.length > 0) {
    headerParagraphs.push(
      new Paragraph({
        spacing: { before: 12, after: 12, line: lineSpacingDxa },
        children: [
          new TextRun({
            text: demographicItems.join('  |  '),
            size: bodySize,
            color: '4B5563',
            font: 'Microsoft YaHei',
          }),
        ],
      })
    );
  }

  // 自定义信息项 (微信号 | 期望薪资 | 英语水平等)
  const customItems = (personalInfo.customFields || []).filter(f => f.label && f.value);
  if (customItems.length > 0) {
    const customRuns: (TextRun | ExternalHyperlink)[] = [];
    customItems.forEach((field, fIdx) => {
      if (fIdx > 0) customRuns.push(new TextRun({ text: '  |  ', size: bodySize, color: 'D1D5DB' }));
      const isUrl = /^https?:\/\//i.test(field.value) || /^(www\.|github\.com|gitee\.com|linkedin\.com)/i.test(field.value);
      if (isUrl) {
        const href = field.value.startsWith('http') ? field.value : `https://${field.value}`;
        customRuns.push(new TextRun({ text: `${field.label}：`, size: bodySize, color: '4B5563', font: 'Microsoft YaHei' }));
        customRuns.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: field.value.replace(/^https?:\/\//, ''),
                size: bodySize,
                color: '2563EB',
                underline: {},
                font: 'Microsoft YaHei',
              }),
            ],
            link: href,
          })
        );
      } else {
        customRuns.push(new TextRun({ text: `${field.label}：${field.value}`, size: bodySize, color: '4B5563', font: 'Microsoft YaHei' }));
      }
    });

    headerParagraphs.push(
      new Paragraph({
        spacing: { before: 12, after: 12, line: lineSpacingDxa },
        children: customRuns,
      })
    );
  }

  // 求职意向 (意向城市 | 求职意向)
  const intentItems = [
    personalInfo.intendedCity && `意向城市：${personalInfo.intendedCity}`,
    personalInfo.intendedRole && `求职意向：${personalInfo.intendedRole}`,
  ].filter(Boolean) as string[];

  if (intentItems.length > 0) {
    headerParagraphs.push(
      new Paragraph({
        spacing: { before: 12, after: 20, line: lineSpacingDxa },
        children: [
          new TextRun({
            text: intentItems.join('  |  '),
            size: bodySize,
            color: '4B5563',
            font: 'Microsoft YaHei',
          }),
        ],
      })
    );
  }

  // 照片与头部排版：若有头像，使用确定的绝对 DXA 宽度双列布局（左大右小），杜绝百分比折叠
  const avatarImage = personalInfo.avatar ? parseDataUrlImage(personalInfo.avatar) : null;
  if (avatarImage) {
    const avatarWidthPx = Math.round(baseFontSize * 5.8);
    const avatarHeightPx = Math.round(baseFontSize * 7.8);
    const avatarColDxa = 1500; // 宽约 2.6cm
    const textColDxa = contentWidthDxa - avatarColDxa;

    docChildren.push(
      new Table({
        width: { size: contentWidthDxa, type: WidthType.DXA },
        columnWidths: [textColDxa, avatarColDxa],
        borders: TABLE_NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: textColDxa, type: WidthType.DXA },
                borders: TABLE_NO_BORDERS,
                children: headerParagraphs,
              }),
              new TableCell({
                width: { size: avatarColDxa, type: WidthType.DXA },
                borders: TABLE_NO_BORDERS,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new ImageRun({
                        data: avatarImage.bytes,
                        type: avatarImage.type,
                        transformation: { width: avatarWidthPx, height: avatarHeightPx },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    docChildren.push(...headerParagraphs);
  }

  // ================= 2. 教育经历 (Education) =================
  if (education.length > 0) {
    docChildren.push(createSectionBanner('教育经历', sectionTitleSize, sectionSpacing));
    education.forEach((edu, idx) => {
      const dateRange = `${edu.startDate || ''} ${edu.startDate && edu.endDate ? '-' : ''} ${edu.endDate || ''}`.trim();
      const beforeSpacing = idx === 0 ? 30 : Math.round(itemSpacing * 6);
      docChildren.push(
        createTwoColumnItemHeader(
          edu.school || '学校名称',
          dateRange,
          itemTitleSize,
          metaDateSize,
          contentWidthDxa,
          beforeSpacing
        )
      );

      // 专业 | 学位 | GPA
      const subParts = [
        edu.major && edu.degree ? `${edu.major}  |  ${edu.degree}` : (edu.major || edu.degree),
        edu.gpa && `GPA：${edu.gpa}`,
      ].filter(Boolean) as string[];

      if (subParts.length > 0) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 10, after: Math.round(Math.max(2, itemSpacing * 0.35) * 8) },
            children: [
              new TextRun({
                text: subParts.join('  |  '),
                size: itemSubtitleSize,
                color: '374151',
                font: 'Microsoft YaHei',
              }),
            ],
          })
        );
      }

      // 主修课程
      if (edu.courses) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 12, after: 12, line: lineSpacingDxa },
            children: [
              new TextRun({ text: '主修课程：', bold: true, size: subSmallSize, color: '374151', font: 'Microsoft YaHei' }),
              new TextRun({ text: edu.courses, size: subSmallSize, color: '4B5563', font: 'Microsoft YaHei' }),
            ],
          })
        );
      }

      // 自定义项 (学院、研究方向等)
      (edu.customFields || []).filter(f => f.label && f.value).forEach(f => {
        docChildren.push(
          new Paragraph({
            spacing: { before: 12, after: 12, line: lineSpacingDxa },
            children: [
              new TextRun({ text: `${f.label}：`, bold: true, size: subSmallSize, color: '374151', font: 'Microsoft YaHei' }),
              new TextRun({ text: f.value, size: subSmallSize, color: '4B5563', font: 'Microsoft YaHei' }),
            ],
          })
        );
      });

      // 经历描述
      docChildren.push(...createDescriptionParagraphs(edu.description, bodySize, lineSpacingDxa));
    });
  }

  // ================= 3. 工作经历 (Experience) =================
  if (experience.length > 0) {
    docChildren.push(createSectionBanner('工作经历', sectionTitleSize, sectionSpacing));
    experience.forEach((exp, idx) => {
      const dateRange = `${exp.startDate || ''} ${exp.startDate && exp.endDate ? '-' : ''} ${exp.endDate || ''}`.trim();
      const beforeSpacing = idx === 0 ? 30 : Math.round(itemSpacing * 6);
      docChildren.push(
        createTwoColumnItemHeader(
          exp.company || '公司名称',
          dateRange,
          itemTitleSize,
          metaDateSize,
          contentWidthDxa,
          beforeSpacing
        )
      );

      if (exp.title) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 10, after: Math.round(Math.max(2, itemSpacing * 0.35) * 8) },
            children: [
              new TextRun({
                text: exp.title,
                size: itemSubtitleSize,
                color: '374151',
                font: 'Microsoft YaHei',
              }),
            ],
          })
        );
      }

      docChildren.push(...createDescriptionParagraphs(exp.description, bodySize, lineSpacingDxa));
    });
  }

  // ================= 4. 项目经历 (Projects) =================
  if (projects.length > 0) {
    docChildren.push(createSectionBanner('项目经历', sectionTitleSize, sectionSpacing));
    projects.forEach((proj, idx) => {
      const dateRange = `${proj.startDate || ''} ${proj.startDate && proj.endDate ? '-' : ''} ${proj.endDate || ''}`.trim();
      const beforeSpacing = idx === 0 ? 30 : Math.round(itemSpacing * 6);

      let linkNode: ExternalHyperlink | undefined;
      if (proj.link) {
        const pUrl = proj.link.startsWith('http') ? proj.link : `https://${proj.link}`;
        linkNode = new ExternalHyperlink({
          children: [
            new TextRun({
              text: proj.link.replace(/^https?:\/\//, ''),
              size: bodySize,
              color: '2563EB',
              underline: {},
              font: 'Microsoft YaHei',
            }),
          ],
          link: pUrl,
        });
      }

      docChildren.push(
        createTwoColumnItemHeader(
          proj.name || '项目名称',
          dateRange,
          itemTitleSize,
          metaDateSize,
          contentWidthDxa,
          beforeSpacing,
          linkNode
        )
      );

      if (proj.role) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 10, after: Math.round(Math.max(2, itemSpacing * 0.35) * 8) },
            children: [
              new TextRun({
                text: proj.role,
                size: itemSubtitleSize,
                color: '374151',
                font: 'Microsoft YaHei',
              }),
            ],
          })
        );
      }

      // 技术栈
      if (proj.techStack) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 12, after: 12, line: lineSpacingDxa },
            children: [
              new TextRun({ text: '技术栈：', bold: true, size: bodySize, color: '111827', font: 'Microsoft YaHei' }),
              new TextRun({ text: proj.techStack, size: bodySize, color: '374151', font: 'Microsoft YaHei' }),
            ],
          })
        );
      }

      // 项目描述
      if (proj.description) {
        docChildren.push(
          ...createDescriptionParagraphs(
            proj.description,
            bodySize,
            lineSpacingDxa,
            new TextRun({ text: '项目介绍：', bold: true, size: bodySize, color: '111827', font: 'Microsoft YaHei' })
          )
        );
      }

      // 项目亮点
      if (proj.highlights) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 16, after: 8 },
            children: [
              new TextRun({ text: '项目亮点：', bold: true, size: bodySize, color: '111827', font: 'Microsoft YaHei' }),
            ],
          })
        );
        docChildren.push(...createDescriptionParagraphs(proj.highlights, bodySize, lineSpacingDxa));
      }
    });
  }

  // ================= 5. 校园与组织经历 (Campus Experience) =================
  if (campusExperience.length > 0) {
    docChildren.push(createSectionBanner('校园经历', sectionTitleSize, sectionSpacing));
    campusExperience.forEach((camp, idx) => {
      const dateRange = `${camp.startDate || ''} ${camp.startDate && camp.endDate ? '-' : ''} ${camp.endDate || ''}`.trim();
      const beforeSpacing = idx === 0 ? 30 : Math.round(itemSpacing * 6);
      const roleText = camp.role || camp.organization || '职务/角色';

      const runs: TextRun[] = [
        new TextRun({
          text: roleText,
          bold: true,
          size: itemTitleSize,
          color: '111827',
          font: 'Microsoft YaHei',
        }),
      ];

      if (camp.role && camp.organization) {
        runs.push(
          new TextRun({
            text: `  |  ${camp.organization}`,
            size: bodySize,
            color: '4B5563',
            font: 'Microsoft YaHei',
          })
        );
      }

      if (dateRange) {
        runs.push(
          new TextRun({
            children: [new Tab(), dateRange],
            size: metaDateSize,
            color: '4B5563',
            font: 'Microsoft YaHei',
          })
        );
      }

      docChildren.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: contentWidthDxa,
            },
          ],
          spacing: { before: beforeSpacing, after: 15 },
          children: runs,
        })
      );

      docChildren.push(...createDescriptionParagraphs(camp.description, bodySize, lineSpacingDxa));
    });
  }

  // ================= 6. 专业技能 (Skills) =================
  if (skills.length > 0) {
    docChildren.push(createSectionBanner('专业技能', sectionTitleSize, sectionSpacing));
    skills.forEach(skill => {
      const itemsText = Array.isArray(skill.items) ? skill.items.join('、') : String(skill.items || '');
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 20, after: 20, line: lineSpacingDxa },
          children: [
            new TextRun({
              text: `${skill.category}：`,
              bold: true,
              size: bodySize,
              color: '111827',
              font: 'Microsoft YaHei',
            }),
            new TextRun({
              text: itemsText,
              size: bodySize,
              color: '374151',
              font: 'Microsoft YaHei',
            }),
          ],
        })
      );
    });
  }

  // ================= 7. 荣誉奖项 (Awards) =================
  const awardsText = typeof awards === 'string'
    ? awards
    : (Array.isArray(awards)
        ? awards.map(a => [a.date, a.name, a.awarder ? `(${a.awarder})` : '', a.description ? `- ${a.description}` : ''].filter(Boolean).join(' ')).filter(Boolean).join('\n')
        : '');

  if (awardsText && awardsText.trim()) {
    docChildren.push(createSectionBanner('荣誉奖项', sectionTitleSize, sectionSpacing));
    const awardLines = awardsText.split('\n').filter(line => line.trim().length > 0);
    awardLines.forEach(line => {
      const cleanLine = line.replace(/^[-*•·]\s*/, '');
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const runs: TextRun[] = [];

      parts.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
          runs.push(
            new TextRun({
              text: part.slice(2, -2),
              bold: true,
              size: bodySize,
              color: '111827',
              font: 'Microsoft YaHei',
            })
          );
        } else if (part.length > 0) {
          runs.push(
            new TextRun({
              text: part,
              size: bodySize,
              color: '374151',
              font: 'Microsoft YaHei',
            })
          );
        }
      });

      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 12, after: 12, line: lineSpacingDxa },
          children: runs,
        })
      );
    });
  }

  // ================= 8. 自我评价 (Summary) =================
  if (personalInfo.summary && personalInfo.summary.trim()) {
    docChildren.push(createSectionBanner('自我评价', sectionTitleSize, sectionSpacing));
    docChildren.push(...createDescriptionParagraphs(personalInfo.summary, bodySize, lineSpacingDxa));
  }

  // 构建统一 A4 标准文档
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Microsoft YaHei',
            size: bodySize,
            color: '111827',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: pageMarginDxa,
              right: pageMarginDxa,
              bottom: pageMarginDxa,
              left: pageMarginDxa,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
};
