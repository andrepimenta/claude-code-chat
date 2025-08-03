# 國際化貢獻技術實作說明

## 🌍 概述

本文件詳細說明 Claude Code Chat 國際化 (i18n) 功能的技術實作，包括架構設計、實作細節和擴展方法。

## 🏗️ 架構設計

### 1. 核心檔案結構

```
src/
├── i18n.ts                 # 國際化核心邏輯
├── locales/                # 語言檔案目錄
│   ├── en.json             # 英文 (預設)
│   └── zh-TW.json          # 繁體中文
├── extension.ts            # 擴展主檔案
└── ui.ts                   # UI 邏輯
```

### 2. 國際化系統架構

```typescript
// i18n.ts 核心功能
interface I18nSystem {
  getCurrentLocale(): string;
  setLocale(locale: string): void;
  t(key: string, params?: Record<string, any>): string;
  getAvailableLocales(): string[];
}
```

## 🔧 技術實作細節

### 1. 語言檔案格式

語言檔案採用巢狀 JSON 結構，支援參數化翻譯：

```json
{
  "ui": {
    "messages": {
      "sessionInfo": "🆔 工作階段 ID：{sessionId}",
      "tokens": "📊 代幣：{total}"
    }
  }
}
```

### 2. 翻譯函數實作

```typescript
function t(key: string, params?: Record<string, any>): string {
  // 支援巢狀鍵值查找
  const value = getNestedValue(translations, key);
  
  // 支援參數替換
  if (params && typeof value === 'string') {
    return value.replace(/{(\w+)}/g, (match, paramKey) => {
      return params[paramKey] || match;
    });
  }
  
  return value || key;
}
```

### 3. 語言偵測機制

```typescript
function detectLocale(): string {
  // 1. VS Code 設定優先
  const userSetting = vscode.workspace.getConfiguration('claudeCodeChat').get<string>('language');
  if (userSetting) return userSetting;
  
  // 2. VS Code 介面語言
  const vscodeLocale = vscode.env.language;
  if (supportedLocales.includes(vscodeLocale)) return vscodeLocale;
  
  // 3. 系統語言
  const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  if (supportedLocales.includes(systemLocale)) return systemLocale;
  
  // 4. 預設英文
  return 'en';
}
```

### 4. 動態語言切換

```typescript
// 設定變更監聽
vscode.workspace.onDidChangeConfiguration((event) => {
  if (event.affectsConfiguration('claudeCodeChat.language')) {
    const newLocale = getConfiguredLocale();
    i18n.setLocale(newLocale);
    
    // 重新載入 UI
    webviewPanel.webview.postMessage({
      type: 'languageChanged',
      locale: newLocale,
      translations: i18n.getAllTranslations()
    });
  }
});
```

## 🌐 繁體中文實作

### 1. 翻譯原則

- **準確性**: 保持技術術語的準確性
- **一致性**: 統一術語翻譯，如 "token" → "代幣"
- **本地化**: 符合台灣使用習慣
- **簡潔性**: 保持 UI 文字簡潔明瞭

### 2. 關鍵術語對照

| 英文 | 繁體中文 | 說明 |
|------|----------|------|
| Token | 代幣 | AI 使用量單位 |
| Session | 工作階段 | 對話會話 |
| Prompt | 提示 | 輸入指令 |
| Slash Commands | 斜槓指令 | 快速指令 |
| MCP Server | MCP 伺服器 | 模型連接協議伺服器 |

### 3. UI 適配

```typescript
// 處理長文字適配
function adaptUIForLocale(locale: string) {
  if (locale === 'zh-TW') {
    // 中文文字通常較長，調整 UI 間距
    document.documentElement.style.setProperty('--button-min-width', '120px');
    document.documentElement.style.setProperty('--input-padding', '12px');
  }
}
```

## 📦 擴展新語言

### 1. 新增語言檔案

1. 在 `src/locales/` 目錄建立新的語言檔案，如 `ja.json`
2. 複製 `en.json` 的結構
3. 翻譯所有文字內容

### 2. 更新語言列表

```typescript
// i18n.ts
const SUPPORTED_LOCALES = ['en', 'zh-TW', 'ja']; // 新增 'ja'

const LOCALE_NAMES = {
  'en': 'English',
  'zh-TW': '繁體中文',
  'ja': '日本語' // 新增日文
};
```

### 3. 測試新語言

```typescript
// 測試語言切換
await vscode.workspace.getConfiguration('claudeCodeChat').update('language', 'ja');
```

## 🧪 測試策略

### 1. 單元測試

```typescript
describe('i18n', () => {
  test('should translate with parameters', () => {
    const result = t('ui.messages.sessionInfo', { sessionId: '123' });
    expect(result).toBe('🆔 工作階段 ID：123');
  });
});
```

### 2. 視覺測試

- 檢查各語言下的 UI 排版
- 確認長文字不會破版
- 驗證特殊字符顯示正常

### 3. 功能測試

- 語言切換功能
- 設定持久化
- 回退機制

## 📈 效能優化

### 1. 延遲載入

```typescript
// 僅載入當前語言
async function loadTranslations(locale: string) {
  const translations = await import(`./locales/${locale}.json`);
  return translations;
}
```

### 2. 快取機制

```typescript
const translationCache = new Map<string, any>();

function getCachedTranslations(locale: string) {
  if (!translationCache.has(locale)) {
    translationCache.set(locale, loadTranslations(locale));
  }
  return translationCache.get(locale);
}
```

## 🔄 維護和更新

### 1. 翻譯完整性檢查

```bash
# 檢查遺漏的翻譯鍵值
npm run i18n:check
```

### 2. 自動化工具

- 翻譯鍵值提取
- 未使用鍵值清理
- 翻譯完整性驗證

## 🤝 貢獻指南

1. **新增翻譯**: 確保翻譯準確且符合當地文化
2. **測試**: 在對應語言環境下測試功能
3. **文件**: 更新相關技術文件
4. **程式碼審查**: 遵循專案程式碼規範

## 📝 未來規劃

- [ ] 支援 RTL 語言 (右到左書寫)
- [ ] 複數形式處理
- [ ] 日期時間本地化
- [ ] 數字格式本地化
- [ ] 更多語言支援 (日文、韓文、法文等)

---

*此文件會隨著國際化功能的發展持續更新。*
