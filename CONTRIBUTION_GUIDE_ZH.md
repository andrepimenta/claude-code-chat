# Claude Code Chat 貢獻指南 (中文版)

## 🎯 歡迎貢獻！

感謝您有興趣為 Claude Code Chat 專案貢獻！這份指南將幫助您了解如何參與專案開發。

## 🌟 貢獻方式

### 1. 回報問題 (Bug Reports)

如果您發現問題，請：

- 檢查是否已有相同的 Issue
- 使用 Issue 範本提供詳細資訊
- 包含重現步驟和環境資訊
- 附上錯誤截圖或日誌

### 2. 功能建議 (Feature Requests)

提出新功能建議時，請：

- 說明功能的使用場景
- 描述期望的行為
- 考慮對現有功能的影響
- 提供 UI/UX 設計想法 (如適用)

### 3. 程式碼貢獻 (Code Contributions)

#### 開發環境設定

```bash
# 1. Fork 並複製倉庫
git clone https://github.com/YOUR_USERNAME/claude-code-chat.git
cd claude-code-chat

# 2. 安裝依賴
npm install

# 3. 設定上游倉庫
git remote add upstream https://github.com/andrepimenta/claude-code-chat.git

# 4. 開始開發
npm run watch
```

#### 開發流程

1. **建立功能分支**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **進行開發**

   - 遵循現有的程式碼風格
   - 撰寫清楚的 commit 訊息
   - 新增適當的測試

3. **測試您的變更**

   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **提交變更**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **推送並建立 PR**

   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 程式碼規範

### TypeScript 風格

- 使用 TypeScript 型別註解
- 遵循 ESLint 設定
- 使用有意義的變數和函數名稱
- 撰寫 JSDoc 註解

```typescript
/**
 * 翻譯指定的鍵值
 * @param key 翻譯鍵值
 * @param params 參數對象
 * @returns 翻譯後的文字
 */
function t(key: string, params?: Record<string, any>): string {
  // 實作...
}
```

### Commit 訊息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**類型 (Types):**

- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件更新
- `style`: 程式碼格式調整
- `refactor`: 程式碼重構
- `test`: 測試相關
- `chore`: 其他維護工作

**範例:**

```text
feat(i18n): add Traditional Chinese support

- Implement i18n infrastructure
- Add zh-TW translations
- Support language switching in settings

Closes #123
```

## 🌍 國際化貢獻

### 新增語言支援

1. **建立語言檔案**

   在 `src/locales/` 目錄建立新的 JSON 檔案：

   ```bash
   cp src/locales/en.json src/locales/your-locale.json
   ```

2. **翻譯內容**

   - 保持 JSON 結構不變
   - 翻譯所有文字內容
   - 注意上下文和語調
   - 保持技術術語的準確性

3. **更新程式碼**

   在 `src/i18n.ts` 中新增語言：

   ```typescript
   const SUPPORTED_LOCALES = ['en', 'zh-TW', 'your-locale'];
   ```

4. **測試翻譯**

   確保在您的語言環境下功能正常運作。

### 翻譯指南

- **一致性**: 統一術語翻譯
- **準確性**: 保持技術概念的準確性
- **本地化**: 符合當地文化和習慣
- **簡潔性**: 保持 UI 文字簡潔

## 🧪 測試

### 執行測試

```bash
# 單元測試
npm run test

# 程式碼檢查
npm run lint

# 建置檢查
npm run build
```

### 手動測試

1. 在 VS Code 中載入擴展進行測試
2. 測試各種使用場景
3. 確認 UI 在不同語言下正常顯示
4. 驗證新功能不會破壞現有功能

## 📋 Pull Request 檢查清單

提交 PR 前請確認：

- [ ] 程式碼遵循專案風格指南
- [ ] 所有測試通過
- [ ] 新增適當的測試 (如適用)
- [ ] 更新相關文件
- [ ] Commit 訊息清楚明確
- [ ] PR 說明完整

## 🤝 程式碼審查流程

1. **提交 PR**: 使用 PR 範本提供完整資訊
2. **自動檢查**: CI/CD 流程會執行自動測試
3. **人工審查**: 維護者會審查您的程式碼
4. **回饋處理**: 根據回饋進行必要的修改
5. **合併**: 通過審查後會合併到主分支

## 📖 資源連結

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript 文件](https://www.typescriptlang.org/docs/)
- [Claude API 文件](https://docs.anthropic.com/)
- [專案 Issue 追蹤](https://github.com/andrepimenta/claude-code-chat/issues)

## 💬 社群

- **GitHub Discussions**: 專案討論和問答
- **Issues**: 錯誤回報和功能建議
- **Pull Requests**: 程式碼貢獻

## 🙏 致謝

感謝所有貢獻者的努力！您的貢獻讓 Claude Code Chat 變得更好。

---

**需要幫助？** 如有任何問題，請隨時在 GitHub Issues 中提出，或參與 Discussions 討論。
