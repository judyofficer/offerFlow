import { useEffect, useRef, useState } from 'react';
import { Clipboard, Loader2, Sparkles } from 'lucide-react';
import { extractUrlFromText, parseJobLinkOrText } from '../utils/urlJobParser';
import type { ParsedJobResult } from '../utils/urlJobParser';
import { parseJobWithAI } from '../services/parseJobWithAI';
import { readJobLink } from '../services/readJobLink';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onParsed: (result: ParsedJobResult, reset?: boolean) => void;
}

const FIELD_LABELS = { companyName: '公司', jobTitle: '岗位', salary: '薪资', location: '地点', source: '来源', jobDescription: '岗位描述', deadline: '截止日期' } as const;

export const JobLinkInput = ({ value, onChange, onParsed }: Props) => {
  const apiKey = useSettingsStore(state => state.apiKey);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [pageText, setPageText] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  const parseCallback = useRef(onParsed);
  const currentRequest = useRef<AbortController | null>(null);
  useEffect(() => { parseCallback.current = onParsed; }, [onParsed]);
  useEffect(() => { input.current?.focus(); }, []);

  const describe = (result: ParsedJobResult) => {
    const fields = Object.entries(FIELD_LABELS).filter(([key]) => result[key as keyof typeof FIELD_LABELS]).map(([, label]) => label);
    return fields.length ? `已识别${fields.join('、')}；已更新自动识别字段，保留手动修改，请核对后保存。` : '未识别到职位信息，请粘贴招聘文案或手动填写。';
  };

  useEffect(() => {
    const controller = new AbortController();
    currentRequest.current = controller;
    setLoading(false);
    setPageText('');
    if (!value.trim()) { setNotice(''); return () => controller.abort(); }
    const local = parseJobLinkOrText(value);
    setNotice('准备解析…');
    const timer = window.setTimeout(async () => {
      parseCallback.current(local, true);
      setNotice(describe(local));
      if (!local.url) return;
      setLoading(true);
      setNotice('正在读取职位网页…');
      try {
        const response = await readJobLink(local.url, AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]));
        if (controller.signal.aborted) return;
        const merged = { ...local, ...response.job };
        setPageText(response.text);
        parseCallback.current(merged);
        setNotice(response.warning || (merged.jobTitle ? describe(merged) : '暂未读取到可核实的职位详情，请点击重新解析。'));
      } catch (error) {
        if (!controller.signal.aborted) setNotice(`${error instanceof Error ? error.message : '无法读取职位网页。'} 已保留链接及可识别信息，请稍后重新解析。`);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 500);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [value, retry]);

  const pasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) onChange(text);
      else setNotice('剪贴板为空，请先复制职位链接或招聘文案。');
    } catch {
      input.current?.focus();
      setNotice('无法读取剪贴板，请在输入框内按 Ctrl / ⌘ + V 粘贴。');
    }
  };

  const parseAI = async () => {
    currentRequest.current?.abort();
    const controller = new AbortController();
    currentRequest.current = controller;
    setLoading(true);
    setNotice('正在提取招聘文案…');
    try {
      let content = value;
      const extracted = extractUrlFromText(value);
      if (extracted.url && !extracted.cleanedText.trim()) {
        const evidence = pageText || (await readJobLink(extracted.url, AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]))).text;
        if (!evidence.trim()) throw new Error('未读取到真实职位正文，暂时无法进行 AI 解析。');
        content = `${evidence}\n原始职位链接：${extracted.url}`;
      }
      const result = await parseJobWithAI(content, AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]));
      if (!controller.signal.aborted) { parseCallback.current(result); setNotice(describe(result)); }
    } catch (error) {
      if (!controller.signal.aborted) setNotice(error instanceof Error ? error.message : 'AI 提取失败，请检查接口设置或重新解析。');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  // Also cancel an explicitly started AI request when the modal closes or input changes.
  useEffect(() => () => currentRequest.current?.abort(), [value]);

  return (
    <div style={{ border: '1px dashed var(--border-color)', background: 'var(--bg-secondary)', borderRadius: 8, padding: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
        粘贴职位链接或招聘文案，自动解析
        <textarea ref={input} value={value} onChange={event => onChange(event.target.value)} rows={3}
          placeholder="粘贴 Boss直聘、牛客、拉勾或公司官网职位链接，也支持分享文案和职位描述"
          style={{ display: 'block', marginTop: 8, width: '100%', padding: 10, border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)', font: 'inherit', fontWeight: 400, resize: 'vertical' }} />
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={pasteClipboard}><Clipboard size={13} /> 读取剪贴板</button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={!value.trim() || loading} onClick={() => setRetry(count => count + 1)}>重新解析</button>
        {apiKey && <button type="button" className="btn btn-ghost btn-sm" disabled={!value.trim() || loading} onClick={parseAI}><Sparkles size={13} /> {extractUrlFromText(value).url ? 'AI 解析职位' : 'AI 解析文案'}</button>}
        {loading && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}><Loader2 size={13} /> 解析中…</span>}
      </div>
      <p role="status" aria-live="polite" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
        {notice || '自动填写公司、岗位、薪资、地点等信息；手动修改的字段会保留。'}
      </p>
    </div>
  );
};
