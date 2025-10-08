# 🧪 TESTE AGORA - Passo a Passo

## ✅ Validação Executada

Execute primeiro:
```bash
cd "C:\git-hub\claude-code-chat - Copia"
./validate.bat
```

Se aparecer "✓ VALIDACAO COMPLETA - TUDO OK!", prossiga!

## 🚀 Teste Rápido (5 minutos)

### Passo 1: Configurar (1 min)

**1.1** Copie o arquivo de exemplo:
```bash
copy .vscode\settings.json.example .vscode\settings.json
```

**1.2** Edite `.vscode\settings.json`:
```json
{
  "jurisanalytica.frameworkPath": "C:\\git-hub\\assessoria-multiIA"
}
```
⚠️ Ajuste para o caminho correto no seu sistema!

### Passo 2: Abrir no VS Code (30 seg)

```bash
code .
```

Ou: File → Open Folder → `C:\git-hub\claude-code-chat - Copia`

### Passo 3: Executar em Modo Debug (30 seg)

No VS Code:
1. Pressione **F5**
2. Selecione "VS Code Extension Development" (se perguntar)
3. Nova janela do VS Code abre com [Extension Development Host]

### Passo 4: Abrir o Chat (30 seg)

Na nova janela:
1. Pressione **Ctrl+Shift+P**
2. Digite: "Open Claude Code Chat"
3. Enter

Ou simplesmente: **Ctrl+Shift+C**

### Passo 5: Verificar Framework Carregado (30 seg)

No terminal/Output da primeira janela VS Code, procure:
```
🔄 Carregando JurisAnalytica Framework...
✅ Framework carregado com sucesso!
```

Se aparecer erro:
- Verifique o caminho em settings.json
- Confirme que existe a pasta `C:\git-hub\assessoria-multiIA\main`

### Passo 6: Testar Detecção (2 min)

Cole no chat um de cada vez:

#### Teste 1: Apelação
```
Analisar recurso de apelação cível nº 0000000-00.2024.8.05.0000

EMENTA: APELAÇÃO CÍVEL. DIREITO PROCESSUAL CIVIL.
Preliminar de ilegitimidade passiva. Mérito. Responsabilidade civil.

RELATÓRIO
Trata-se de recurso de apelação interposto contra sentença...
```

**Resultado esperado:**
```
🏛️ JurisAnalytica Framework Ativado

📌 Tipo identificado: Apelação
🎯 Agente: agent_apelacao
📋 Template: A - Relatorio de Apelacao.md

[Resposta do Claude com análise especializada]
```

#### Teste 2: Embargos
```
Analisar embargos de declaração opostos contra acórdão...
```

**Resultado esperado:**
```
🏛️ JurisAnalytica Framework Ativado

📌 Tipo identificado: Embargos de Declaração
🎯 Agente: agent_embargos
📋 Template: B - Relatorio de Embargos de Declaração.md
```

#### Teste 3: Agravo
```
Analisar agravo de instrumento contra decisão que indeferiu liminar...
```

**Resultado esperado:**
```
🏛️ JurisAnalytica Framework Ativado

📌 Tipo identificado: Agravo de Instrumento
🎯 Agente: agent_agravo_instrumento
📋 Template: C - Relatorio de Agravo de Instrumento.md
```

## ✅ Checklist de Validação

Durante o teste, marque:

- [ ] Extensão carrega sem erros
- [ ] Framework carrega automaticamente
- [ ] Chat abre corretamente (Ctrl+Shift+C)
- [ ] Interface completa aparece (markdown, botões, etc)
- [ ] Apelação é detectada
- [ ] Embargos é detectado
- [ ] Agravo é detectado
- [ ] Mensagem "Framework Ativado" aparece
- [ ] Claude responde com contexto especializado

## 🐛 Troubleshooting Rápido

### ❌ "Framework não carregado"

**Console mostra erro?**

1. Abra Output: View → Output → Extension Host
2. Procure por erro com "JurisAnalytica"
3. Provavelmente: caminho incorreto

**Solução:**
```json
{
  "jurisanalytica.frameworkPath": "CAMINHO_CORRETO_AQUI"
}
```

Verificar se existe:
```bash
dir "CAMINHO\main"  # deve ter arquivos .md
```

### ❌ "Claude CLI not found"

```bash
# Instalar
npm install -g @anthropic-ai/claude-code

# Fazer login
claude

# Testar
claude --version
```

### ❌ Framework não detecta tipo

**Causa:** Falta palavra-chave

**Solução:** Use exatamente:
- "apelação" (com ç)
- "embargos de declaração"
- "agravo de instrumento"

### ❌ Chat não abre

**F5 abriu janela nova?**
- Se não: Veja se há erros no terminal da primeira janela
- Se sim mas chat não abre: Verifique console (Help → Toggle Developer Tools)

## 🎯 Teste Completo (Todos os 8 Agentes)

Se quiser testar todos:

```
1. Apelação: "analisar apelação..."
2. Embargos: "embargos de declaração..."
3. Agravo Instrumento: "agravo de instrumento..."
4. Liminar: "pedido de liminar..." ou "efeito suspensivo..."
5. Ação Originária Liminar: "mandado de segurança com liminar..."
6. Ação Originária Voto: "voto ação originária..."
7. Agravo Interno: "agravo interno..." ou "agravo regimental..."
8. Conflito: "conflito de competência..."
```

## 📊 Comandos Extras para Testar

### Ver Agentes Disponíveis

1. Ctrl+Shift+P
2. "JurisAnalytica: Show JurisAnalytica Agents"
3. Deve listar os 8 agentes

### Recarregar Framework

1. Ctrl+Shift+P
2. "JurisAnalytica: Reset JurisAnalytica Framework"
3. Deve recarregar

## 🎉 Teste Bem-Sucedido?

Se tudo funcionou:

✅ **PARABÉNS!** Você tem:
- Interface completa do Claude Code Chat
- Framework JurisAnalytica integrado
- Detecção automática funcionando
- 8 agentes especializados ativos

### Próximos passos:

1. **Usar no dia a dia** - Cole processos reais
2. **Ajustar instruções** - Edite FrameworkManager se necessário
3. **Configurar permissões** - Via UI do chat
4. **Explorar features** - Conversas, backups, snippets

## 📚 Documentação Completa

- **SETUP_GUIDE.md** - Instalação detalhada
- **JURISANALYTICA_INTEGRATION.md** - Detalhes técnicos
- **RESUMO_FINAL.md** - Visão completa do projeto
- **README_JURISANALYTICA.md** - Visão geral

---

**Tempo estimado:** 5 minutos
**Dificuldade:** Fácil
**Pré-requisito:** Node.js + Claude CLI instalados

**Dúvidas?** Consulte SETUP_GUIDE.md ou veja logs em Output Console
