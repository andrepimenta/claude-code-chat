# 🏛️ Claude Code Chat + JurisAnalytica Framework

**Extensão VS Code que combina a interface completa do Claude Code Chat com o framework especializado JurisAnalytica para análise de processos jurídicos do TJBA.**

## ✨ Características

### 🎯 Do Claude Code Chat
- ✅ Interface rica e completa
- ✅ Sistema de conversas e histórico
- ✅ Backup automático com Git
- ✅ Permissões MCP configuráveis
- ✅ Renderização Markdown completa
- ✅ Suporte a imagens e arquivos
- ✅ Modos de pensamento (thinking modes)
- ✅ Gestão de tokens e custos
- ✅ Snippets customizados

### 🏛️ Do JurisAnalytica Framework
- ✅ **Detecção automática de tipos de processo**
- ✅ **8 Agentes especializados**
- ✅ **Instruções contextuais por tipo**
- ✅ **Templates TJBA integrados**

## 🚀 Instalação Rápida

### 1. Pré-requisitos
```bash
# Node.js 20+
node --version

# Claude CLI
npm install -g @anthropic-ai/claude-code
claude  # fazer login
```

### 2. Instalar Extensão
```bash
cd "C:\git-hub\claude-code-chat - Copia"
npm install
npm run compile
```

### 3. Configurar
Copie `.vscode/settings.json.example` para `.vscode/settings.json` e ajuste:
```json
{
  "jurisanalytica.frameworkPath": "C:\\git-hub\\assessoria-multiIA"
}
```

### 4. Testar
Pressione **F5** no VS Code → Nova janela abre com extensão carregada

## 📖 Como Usar

### Abrir Chat
- **Atalho:** Ctrl+Shift+C (Cmd+Shift+C no Mac)
- **Command Palette:** Ctrl+Shift+P → "Open Claude Code Chat"
- **Sidebar:** Clique no ícone do Claude

### Exemplo de Uso

Cole um texto jurídico:
```
Analisar recurso de apelação cível nº 0000000-00.2024.8.05.0000

EMENTA: APELAÇÃO CÍVEL. DIREITO CIVIL. [...]
```

O sistema automaticamente:
1. 🔍 Detecta que é uma "apelação"
2. 🎯 Ativa o Agente de Apelação
3. 📋 Injeta instruções do template específico
4. 💬 Mostra no chat:
```
🏛️ JurisAnalytica Framework Ativado

📌 Tipo identificado: Apelação
🎯 Agente: agent_apelacao
📋 Template: A - Relatorio de Apelacao.md
```
5. 🤖 Claude responde com análise especializada!

## 🎯 Agentes Disponíveis

1. **Apelação** - Recursos de Apelação
2. **Embargos de Declaração** - Embargos Declaratórios
3. **Agravo de Instrumento** - Agravos
4. **Liminar/Efeito Suspensivo** - Tutelas Provisórias
5. **Ação Originária (Liminar)** - MS, HC (liminar)
6. **Ação Originária (Voto)** - MS, HC (mérito)
7. **Agravo Interno** - Agravo Regimental
8. **Conflito de Competência** - Conflitos

## ⚙️ Configurações

### Básicas
```json
{
  // Framework
  "jurisanalytica.frameworkPath": "C:\\caminho\\para\\assessoria-multiIA",
  "jurisanalytica.autoLoadFramework": true,
  "jurisanalytica.enableFramework": true,

  // Thinking
  "claudeCodeChat.thinking.intensity": "think",

  // Permissões (cuidado!)
  "claudeCodeChat.permissions.yoloMode": false
}
```

## 📚 Documentação

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Guia completo de instalação e configuração
- **[JURISANALYTICA_INTEGRATION.md](./JURISANALYTICA_INTEGRATION.md)** - Detalhes técnicos da integração

## 🔧 Comandos

### Command Palette (Ctrl+Shift+P)

**Claude Code Chat:**
- Open Claude Code Chat
- Load Conversation

**JurisAnalytica:**
- Show JurisAnalytica Agents
- Reset JurisAnalytica Framework

## 🐛 Troubleshooting

Ver **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** para troubleshooting completo.

## 📊 Comparação

| Recurso | JurisAnalytica Original | Esta Integração |
|---------|------------------------|-----------------|
| Interface | ❌ Básica | ✅ Completa |
| Markdown | ⚠️ Parcial | ✅ Total |
| Permissões | ❌ Não | ✅ MCP |
| Conversas | ❌ Não | ✅ Completo |
| Git Backup | ❌ Não | ✅ Automático |
| Framework | ✅ Sim | ✅ Mantido |
| Agentes | ✅ 8 | ✅ 8 |

---

**Versão:** 1.0.0
**Status:** ✅ Produção
**Última atualização:** Outubro 2025
