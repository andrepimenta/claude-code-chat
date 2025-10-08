# 🚀 Guia de Instalação e Configuração

## Pré-requisitos

### 1. Node.js e npm
```bash
node --version  # Deve ser v20.x ou superior
npm --version
```

### 2. Claude CLI
```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

Se não tiver Claude CLI instalado:
```bash
# Instalar
npm install -g @anthropic-ai/claude-code

# Fazer login
claude
```

### 3. Framework JurisAnalytica
Certifique-se que o framework está em: `C:\git-hub\assessoria-multiIA`

Estrutura esperada:
```
C:\git-hub\assessoria-multiIA\
├── main/                    # Templates (.md)
├── framework/
│   ├── CORE.md
│   ├── ORCHESTRATOR.md
│   └── agents/
│       └── AGENTS.md
└── jurisanalytica-chat/
    └── .claude/
        └── custom_instructions.md
```

## Instalação da Extensão

### Passo 1: Instalar Dependências

```bash
cd "C:\git-hub\claude-code-chat - Copia"
npm install
```

### Passo 2: Compilar

```bash
npm run compile
```

Deve compilar sem erros!

### Passo 3: Configurar VS Code

Copie o arquivo de exemplo:
```bash
cp .vscode/settings.json.example .vscode/settings.json
```

Edite `.vscode/settings.json` e ajuste o caminho:
```json
{
  "jurisanalytica.frameworkPath": "C:\\git-hub\\assessoria-multiIA"
}
```

## Testando a Extensão

### Opção A: Modo de Desenvolvimento (F5)

1. Abra o projeto no VS Code
2. Pressione **F5**
3. Nova janela do VS Code abre com a extensão carregada

### Opção B: Empacotar e Instalar

```bash
# Instalar vsce se não tiver
npm install -g @vscode/vsce

# Empacotar
npm run package

# Instalar no VS Code
code --install-extension claude-code-chat-1.0.7.vsix
```

## Uso Básico

### 1. Abrir o Chat

**Opção 1:** Command Palette
- Ctrl+Shift+P → "Open Claude Code Chat"

**Opção 2:** Atalho
- Ctrl+Shift+C (Windows/Linux)
- Cmd+Shift+C (Mac)

**Opção 3:** Sidebar
- Clique no ícone Claude Code Chat na barra lateral

### 2. Testar Framework JurisAnalytica

Cole um texto assim:

```
Analisar recurso de apelação cível nº 0000000-00.2024.8.05.0000

EMENTA: APELAÇÃO CÍVEL. DIREITO CIVIL. [...]

RELATÓRIO
O apelante recorre contra sentença que [...]
```

Você deve ver:
```
🏛️ JurisAnalytica Framework Ativado

📌 Tipo identificado: Apelação
🎯 Agente: agent_apelacao
📋 Template: A - Relatorio de Apelacao.md
```

### 3. Testar Outros Tipos

**Embargos:**
```
Analisar embargos de declaração no processo [...]
```

**Agravo:**
```
Analisar agravo de instrumento [...]
```

**Liminar:**
```
Analisar pedido de liminar / efeito suspensivo [...]
```

## Comandos Disponíveis

### Via Command Palette (Ctrl+Shift+P)

**Claude Code Chat:**
- `Claude Code Chat: Open Claude Code Chat`
- `Claude Code Chat: Load Conversation`

**JurisAnalytica:**
- `JurisAnalytica: Show JurisAnalytica Agents` - Lista todos os 8 agentes
- `JurisAnalytica: Reset JurisAnalytica Framework` - Recarrega framework

## Configurações Avançadas

### Habilitar/Desabilitar Framework

Temporariamente desabilitar detecção automática:
```json
{
  "jurisanalytica.enableFramework": false
}
```

### Modo YOLO (sem permissões)

**⚠️ Use com CUIDADO!** Permite Claude executar qualquer comando sem pedir permissão:
```json
{
  "claudeCodeChat.permissions.yoloMode": true
}
```

### Thinking Modes

Controle o nível de "pensamento" do Claude:
```json
{
  "claudeCodeChat.thinking.intensity": "think-harder"
}
```

Opções: `think`, `think-hard`, `think-harder`, `ultrathink`

### WSL (Windows Subsystem for Linux)

Se usar Claude via WSL:
```json
{
  "claudeCodeChat.wsl.enabled": true,
  "claudeCodeChat.wsl.distro": "Ubuntu",
  "claudeCodeChat.wsl.nodePath": "/usr/bin/node",
  "claudeCodeChat.wsl.claudePath": "/usr/local/bin/claude"
}
```

## Troubleshooting

### ❌ "Framework não carregado"

**Problema:** Framework não é encontrado

**Solução:**
1. Verifique o caminho em settings.json
2. Confirme estrutura de pastas do framework
3. Veja logs no Output Console (View → Output → Claude Code Chat)

### ❌ "Claude CLI não encontrado"

**Problema:** Extensão não encontra o comando `claude`

**Solução:**
```bash
# Verificar instalação
which claude   # Linux/Mac
where claude   # Windows

# Reinstalar se necessário
npm install -g @anthropic-ai/claude-code
```

### ❌ Agente não é detectado

**Problema:** Framework não identifica tipo de processo

**Solução:**
Use palavras-chave específicas no texto:
- `apelação` ou `recurso de apelação`
- `embargos de declaração`
- `agravo de instrumento`
- `liminar` ou `efeito suspensivo`
- `ação originária`
- `mandado de segurança`
- `habeas corpus`
- `agravo interno` ou `agravo regimental`
- `conflito de competência`

### ❌ "Invalid API key" ou erro de autenticação

**Problema:** Claude CLI não está autenticado

**Solução:**
```bash
# No terminal
claude

# Siga instruções de login
```

### ❌ Permissões sendo solicitadas demais

**Problema:** Claude pede permissão para cada comando

**Solução 1:** Configurar permissões permanentes na UI

**Solução 2:** Habilitar YOLO mode (⚠️ cuidado!)
```json
{
  "claudeCodeChat.permissions.yoloMode": true
}
```

## Logs e Debug

### Ver logs da extensão

1. View → Output
2. Selecionar "Extension Host" no dropdown
3. Procurar por "Claude Code Chat" ou "JurisAnalytica"

### Ver logs do Claude CLI

Os processos Claude aparecem no console do VS Code

### Recarregar extensão

Após mudanças:
- Ctrl+Shift+P → "Developer: Reload Window"

## Próximos Passos

Depois de tudo funcionando:

1. ✅ Testar com todos os 8 tipos de processo
2. ✅ Ajustar instruções dos agentes conforme necessário
3. ✅ Configurar permissões permanentes para comandos comuns
4. ✅ Criar snippets customizados para workflows frequentes
5. ✅ Explorar funcionalidades avançadas do Claude Code Chat

## Suporte

- Documentação completa: `JURISANALYTICA_INTEGRATION.md`
- Issues: Reportar problemas no repositório
- Logs: Sempre verificar Output Console primeiro

---

**Versão:** 1.0.0
**Última atualização:** Outubro 2025
