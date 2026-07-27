import React from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { LLMProvider } from '../../store/useSettingsStore';

const Settings: React.FC = () => {
  const { llmProvider, apiKey, apiUrl, model, updateSettings } = useSettingsStore();

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as LLMProvider;
    let defaultUrl = '';
    let defaultModel = '';
    
    switch (provider) {
      case 'openai':
        defaultUrl = 'https://api.openai.com/v1/chat/completions';
        defaultModel = 'gpt-4o';
        break;
      case 'deepseek':
        defaultUrl = 'https://api.deepseek.com/chat/completions';
        defaultModel = 'deepseek-chat';
        break;
      case 'gemini':
        defaultUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
        defaultModel = 'gemini-1.5-pro';
        break;
      case 'custom':
        defaultUrl = '';
        defaultModel = '';
        break;
    }
    
    updateSettings({
      llmProvider: provider,
      apiUrl: defaultUrl,
      model: defaultModel
    });
  };

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-h1" style={{ marginBottom: '8px' }}>系统设置</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>配置您的个人偏好和系统设置。数据仅保存在您的本地浏览器中，十分安全。</p>

      <section style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 className="text-h2" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>AI 简历解析配置</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
          为实现高准确度的简历智能提取，您需要配置大语言模型 (LLM) 的 API。推荐使用 OpenAI 或 DeepSeek。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>模型供应商 (Provider)</label>
            <select 
              value={llmProvider} 
              onChange={handleProviderChange}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="openai">OpenAI (推荐)</option>
              <option value="deepseek">DeepSeek (性价比极高)</option>
              <option value="gemini">Google Gemini</option>
              <option value="custom">自定义 (兼容 OpenAI 格式的代理端)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>API 接口地址 (URL)</label>
            <input 
              type="url" 
              value={apiUrl}
              onChange={(e) => updateSettings({ apiUrl: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace' }}
              placeholder="https://api.openai.com/v1/chat/completions"
            />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label style={{ fontSize: '14px', fontWeight: 600 }}>模型名称 (Model)</label>
              <input 
                type="text" 
                value={model}
                onChange={(e) => updateSettings({ model: e.target.value })}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace' }}
                placeholder="gpt-4o"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>API 密钥 (API Key)</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => updateSettings({ apiKey: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace' }}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>您的 API 密钥只会安全地存储在本地浏览器的 localStorage 中，绝不会上传到任何第三方服务器。</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
