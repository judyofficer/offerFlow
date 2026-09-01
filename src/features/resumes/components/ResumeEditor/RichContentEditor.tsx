import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { Bold, List, ListOrdered, Undo2, Redo2, Eye, Edit3 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';

interface RichContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string | number;
  rows?: number;
}

interface HistorySnapshot {
  value: string;
  start: number;
  end: number;
}

export const RichContentEditor: React.FC<RichContentEditorProps> = ({
  value = '',
  onChange,
  placeholder = '使用小圆点列出具体成果，例如：• 基于 React 完成了...',
  minHeight = '100px',
  rows = 4,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Local Undo/Redo history stack
  const historyRef = useRef<HistorySnapshot[]>([{ value, start: 0, end: 0 }]);
  const historyIndexRef = useRef<number>(0);
  const isApplyingHistoryRef = useRef<boolean>(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Push snapshot to local history
  const pushHistory = useCallback((newValue: string, start: number, end: number) => {
    const current = historyRef.current[historyIndexRef.current];
    if (current && current.value === newValue) {
      current.start = start;
      current.end = end;
      return;
    }

    const pruned = historyRef.current.slice(0, historyIndexRef.current + 1);
    pruned.push({ value: newValue, start, end });
    if (pruned.length > 50) pruned.shift();
    historyRef.current = pruned;
    historyIndexRef.current = pruned.length - 1;
  }, []);

  // Handle external value changes
  useEffect(() => {
    if (isApplyingHistoryRef.current) return;
    const current = historyRef.current[historyIndexRef.current];
    if (!current || current.value !== value) {
      pushHistory(value, 0, 0);
    }
  }, [value, pushHistory]);

  // Auto-resize textarea height
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(typeof minHeight === 'number' ? minHeight : parseInt(minHeight as string, 10) || 80, el.scrollHeight + 2)}px`;
    }
  }, [minHeight]);

  useLayoutEffect(() => {
    if (activeTab === 'edit') {
      adjustHeight();
    }
  }, [value, activeTab, adjustHeight]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver(() => adjustHeight());
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [activeTab, adjustHeight]);

  // Undo implementation
  const handleUndo = useCallback(() => {
    const el = textareaRef.current;
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const target = historyRef.current[historyIndexRef.current];
      isApplyingHistoryRef.current = true;
      onChange(target.value);
      setTimeout(() => {
        isApplyingHistoryRef.current = false;
        if (el) {
          el.focus();
          el.setSelectionRange(target.start, target.end);
        }
      }, 0);
    } else {
      useResumeStore.getState().undo();
    }
  }, [onChange]);

  // Redo implementation
  const handleRedo = useCallback(() => {
    const el = textareaRef.current;
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const target = historyRef.current[historyIndexRef.current];
      isApplyingHistoryRef.current = true;
      onChange(target.value);
      setTimeout(() => {
        isApplyingHistoryRef.current = false;
        if (el) {
          el.focus();
          el.setSelectionRange(target.start, target.end);
        }
      }, 0);
    } else {
      useResumeStore.getState().redo();
    }
  }, [onChange]);

  // Insert or toggle bold text around selection
  const handleToggleBold = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = value.substring(start, end);

    // Save pre-mutation state with accurate cursor
    pushHistory(value, start, end);

    let newValue = '';
    let newStart = start;
    let newEnd = end;

    if (selectedText.length > 0) {
      // Check if already bolded
      if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4) {
        const unbolded = selectedText.slice(2, -2);
        newValue = value.substring(0, start) + unbolded + value.substring(end);
        newStart = start;
        newEnd = start + unbolded.length;
      } else {
        const bolded = `**${selectedText}**`;
        newValue = value.substring(0, start) + bolded + value.substring(end);
        newStart = start;
        newEnd = start + bolded.length;
      }
    } else {
      // Insert placeholder bold word
      const placeholderWord = '**关键词**';
      newValue = value.substring(0, start) + placeholderWord + value.substring(end);
      newStart = start + 2;
      newEnd = start + 5; // Select "关键词"
    }

    pushHistory(newValue, newStart, newEnd);
    onChange(newValue);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  // Prefix lines with bullets
  const handleAddBulletList = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    pushHistory(value, start, end);

    // Find the start of the first line and end of the last line in selection
    const firstLineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lastLineEnd = value.indexOf('\n', end);
    if (lastLineEnd === -1) lastLineEnd = value.length;

    const targetSection = value.substring(firstLineStart, lastLineEnd);
    const lines = targetSection.split('\n');

    // If all lines already have bullets, remove them; otherwise add bullets
    const allHaveBullets = lines.every(l => /^[-•*·]\s*/.test(l));
    const modifiedLines = lines.map(line => {
      if (allHaveBullets) {
        return line.replace(/^[-•*·]\s*/, '');
      } else {
        return /^[-•*·]\s*/.test(line) ? line : `• ${line}`;
      }
    });

    const newSection = modifiedLines.join('\n');
    const newValue = value.substring(0, firstLineStart) + newSection + value.substring(lastLineEnd);
    const newStart = firstLineStart;
    const newEnd = firstLineStart + newSection.length;

    pushHistory(newValue, newStart, newEnd);
    onChange(newValue);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  // Prefix lines with numbers
  const handleAddOrderedList = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    pushHistory(value, start, end);

    const firstLineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lastLineEnd = value.indexOf('\n', end);
    if (lastLineEnd === -1) lastLineEnd = value.length;

    const targetSection = value.substring(firstLineStart, lastLineEnd);
    const lines = targetSection.split('\n');

    const allHaveNumbers = lines.every(l => /^\d+\.\s*/.test(l));
    const modifiedLines = lines.map((line, idx) => {
      if (allHaveNumbers) {
        return line.replace(/^\d+\.\s*/, '');
      } else {
        const clean = line.replace(/^([-•*·]|\d+\.)\s*/, '');
        return `${idx + 1}. ${clean}`;
      }
    });

    const newSection = modifiedLines.join('\n');
    const newValue = value.substring(0, firstLineStart) + newSection + value.substring(lastLineEnd);
    const newStart = firstLineStart;
    const newEnd = firstLineStart + newSection.length;

    pushHistory(newValue, newStart, newEnd);
    onChange(newValue);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  // Handle typing in textarea with debounced history
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;

    onChange(val);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      pushHistory(val, start, end);
    }, 400);
  };

  // Handle keyboard shortcuts (Cmd+Z, Cmd+Shift+Z, Cmd+B, Enter continuation)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Undo: Cmd+Z (Mac) or Ctrl+Z (Win) without Shift
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }

    // 2. Redo: Cmd+Shift+Z or Ctrl+Y or Ctrl+Shift+Z
    if (
      ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
      ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')
    ) {
      e.preventDefault();
      handleRedo();
      return;
    }

    // 3. Shortcut: Cmd+B / Ctrl+B -> Bold
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      handleToggleBold();
      return;
    }

    // 4. Smart Enter continuation for bullets and numbers
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const el = textareaRef.current;
      if (!el) return;

      const cursor = el.selectionStart;
      const textBeforeCursor = value.substring(0, cursor);
      const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
      const currentLine = textBeforeCursor.substring(currentLineStart);

      // Check bullet list
      const bulletMatch = currentLine.match(/^([•\-*·])\s*(.*)$/);
      if (bulletMatch) {
        e.preventDefault();
        const bulletSymbol = bulletMatch[1];
        const contentAfterBullet = bulletMatch[2].trim();

        pushHistory(value, cursor, cursor);

        // If line only contains the bullet and nothing else -> delete bullet and exit list
        if (contentAfterBullet.length === 0) {
          const newValue = value.substring(0, currentLineStart) + value.substring(cursor);
          pushHistory(newValue, currentLineStart, currentLineStart);
          onChange(newValue);
          setTimeout(() => {
            el.setSelectionRange(currentLineStart, currentLineStart);
          }, 0);
          return;
        }

        // Otherwise, insert new bullet on next line
        const insertText = `\n${bulletSymbol} `;
        const newValue = value.substring(0, cursor) + insertText + value.substring(cursor);
        const nextCursor = cursor + insertText.length;
        pushHistory(newValue, nextCursor, nextCursor);
        onChange(newValue);
        setTimeout(() => {
          el.setSelectionRange(nextCursor, nextCursor);
        }, 0);
        return;
      }

      // Check numbered list
      const numberMatch = currentLine.match(/^(\d+)\.\s*(.*)$/);
      if (numberMatch) {
        e.preventDefault();
        const currentNum = parseInt(numberMatch[1], 10);
        const contentAfterNum = numberMatch[2].trim();

        pushHistory(value, cursor, cursor);

        if (contentAfterNum.length === 0) {
          const newValue = value.substring(0, currentLineStart) + value.substring(cursor);
          pushHistory(newValue, currentLineStart, currentLineStart);
          onChange(newValue);
          setTimeout(() => {
            el.setSelectionRange(currentLineStart, currentLineStart);
          }, 0);
          return;
        }

        const insertText = `\n${currentNum + 1}. `;
        const newValue = value.substring(0, cursor) + insertText + value.substring(cursor);
        const nextCursor = cursor + insertText.length;
        pushHistory(newValue, nextCursor, nextCursor);
        onChange(newValue);
        setTimeout(() => {
          el.setSelectionRange(nextCursor, nextCursor);
        }, 0);
        return;
      }
    }
  };

  // Render markdown bold text for preview tab
  const renderPreviewContent = (text: string) => {
    if (!text.trim()) {
      return <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontStyle: 'italic' }}>暂无内容</div>;
    }

    const lines = text.split('\n');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
        {lines.map((line, i) => {
          if (!line.trim()) {
            return <div key={i} style={{ height: '6px' }} />;
          }

          const isBullet = /^[-•*·]\s*/.test(line);
          const isNumber = /^\d+\.\s*/.test(line);
          const cleanLine = line.replace(/^([-•*·]|\d+\.)\s*/, '');

          // Parse **bold** parts
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
          const renderedText = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
              return <strong key={pIdx} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '14px', lineHeight: '1.2' }}>•</span>
                <div style={{ flex: 1 }}>{renderedText}</div>
              </div>
            );
          }

          if (isNumber) {
            const numMatch = line.match(/^(\d+\.)\s*/);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600, minWidth: '18px' }}>{numMatch ? numMatch[1] : ''}</span>
                <div style={{ flex: 1 }}>{renderedText}</div>
              </div>
            );
          }

          return <div key={i}>{renderedText}</div>;
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Rich Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 10px',
          backgroundColor: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleUndo}
            title="撤销 (Ctrl+Z / Cmd+Z)"
            style={{ width: '28px', height: '28px', padding: 0 }}
          >
            <Undo2 size={15} />
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleRedo}
            title="重做 (Ctrl+Y / Cmd+Shift+Z)"
            style={{ width: '28px', height: '28px', padding: 0 }}
          >
            <Redo2 size={15} />
          </button>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleToggleBold}
            title="加粗选中文字 (Ctrl+B / Cmd+B)"
            style={{ width: '28px', height: '28px', padding: 0 }}
          >
            <Bold size={15} />
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleAddBulletList}
            title="添加/切换 无序列表项 (• )"
            style={{ width: '28px', height: '28px', padding: 0 }}
          >
            <List size={15} />
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleAddOrderedList}
            title="添加/切换 有序编号列表 (1. 2. )"
            style={{ width: '28px', height: '28px', padding: 0 }}
          >
            <ListOrdered size={15} />
          </button>
        </div>

        {/* Edit / Preview Segmented Switcher */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              backgroundColor: activeTab === 'edit' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'edit' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Edit3 size={11} /> 编辑
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              backgroundColor: activeTab === 'preview' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'preview' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Eye size={11} /> 效果预览
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === 'edit' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: '13.5px',
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
          }}
        />
      ) : (
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-primary)',
            minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
            boxSizing: 'border-box',
          }}
        >
          {renderPreviewContent(value)}
        </div>
      )}

      {/* Footer Helper Tips */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 10px',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px dashed var(--border-color)',
        }}
      >
        <span>
          快捷键：<strong>Ctrl+Z</strong> 撤销 · <strong>Ctrl+Y</strong> 重做 · <strong>Ctrl+B</strong> 加粗
        </span>
        <span>{value.length} 字</span>
      </div>
    </div>
  );
};
