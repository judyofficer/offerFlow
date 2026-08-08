import React, { useLayoutEffect, useEffect, useRef } from 'react';

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

export const AutoResizeTextarea: React.FC<Props> = ({ value, style, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      // Reset height to auto to accurately measure the new scrollHeight
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + 2}px`;
    }
  };

  useLayoutEffect(() => {
    adjustHeight();
  }, [value]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Listen for container/panel resizes
    const resizeObserver = new ResizeObserver(() => {
      adjustHeight();
    });
    
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      style={{
        ...style,
        overflow: 'hidden',
        resize: 'none',
        minHeight: style?.minHeight || '80px'
      }}
      {...props}
    />
  );
};
