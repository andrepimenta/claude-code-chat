# 🏛️ JurisAnalytica Framework Integration

## Visão Geral

Este projeto integra o **Claude Code Chat** (interface completa e funcional) com o **JurisAnalytica Framework** (sistema especializado para análise de processos jurídicos do TJBA).

## O que foi integrado?

### ✅ Funcionalidades Mantidas do Claude Code Chat
- Interface rica e completa
- Sistema de gerenciamento de conversas
- Backup automático com Git
- Sistema de permissões via MCP
- Suporte a imagens e arquivos
- Renderização markdown completa
- Gestão de tokens e custos em tempo real
- Modo de pensamento (thinking modes)
- Snippets customizados

### ✅ Funcionalidades Adicionadas do JurisAnalytica
- **Detecção automática de tipo de processo jurídico**
- **Injeção de prompts especializados por tipo de processo**
- **8 Agentes especializados:**
  - Apelação
  - Embargos de Declaração
  - Agravo de Instrumento
  - Liminar/Efeito Suspensivo
  - Ação Originária (Liminar)
  - Ação Originária (Voto)
  - Agravo Interno
  - Conflito de Competência

## Como Funciona?

### 1. Detecção Automática

Quando você cola um texto no chat, o sistema:
1. Analisa o conteúdo em busca de palavras-chave (triggers)
2. Identifica automaticamente o tipo de processo
3. Ativa o agente especializado correspondente
4. Injeta as instruções específicas no prompt enviado ao Claude

### 2. Exemplo de Uso

**Você envia:**
```
Analisar apelação cível nº 123456...
[texto do processo]
```

**O sistema:**
1. ✅ Detecta que é uma "apelação"
2. ✅ Ativa o **Agente de Apelação**
3. ✅ Injeta instruções especializadas
4. ✅ Mostra no chat:
   ```
   🏛️ JurisAnalytica Framework Ativado
   📌 Tipo identificado: Apelação
   🎯 Agente: agent_apelacao
   📋 Template: A - Relatorio de Apelacao.md
   ```

**Claude responde** com análise especializada seguindo o template do framework!

## Configurações

### Obrigatórias

```json
{
  "jurisanalytica.frameworkPath": "C:\\git-hub\\assessoria-multiIA"
}
```
⚠️ **IMPORTANTE:** Ajuste este caminho para onde está o framework JurisAnalytica em seu sistema!

### Opcionais

```json
{
  "jurisanalytica.autoLoadFramework": true,  // Carrega framework ao iniciar
  "jurisanalytica.enableFramework": true     // Habilita/desabilita framework
}
```

## Comandos Disponíveis

### Via Command Palette (Ctrl+Shift+P)

- **JurisAnalytica: Show Agents** - Lista todos os agentes especializados
- **JurisAnalytica: Reset Framework** - Recarrega o framework

### No Chat (todos os comandos originais do Claude Code Chat continuam funcionando)

- Modo de pensamento (think modes)
- Gestão de conversas
- Controles de permissões
- etc.

## Diferenças vs. JurisAnalytica Chat Original

| Aspecto | JurisAnalytica Original | Esta Integração |
|---------|------------------------|-----------------|
| Interface | ❌ Básica, incompleta | ✅ Completa, rica |
| Renderização Markdown | ⚠️ Parcial | ✅ Completa |
| Sistema de Permissões | ❌ Não implementado | ✅ MCP completo |
| Gestão de Conversas | ❌ Não implementado | ✅ Completo |
| Backup Git | ❌ Não implementado | ✅ Automático |
| Framework JurisAnalytica | ✅ Arquitetura modular | ✅ Totalmente integrado |
| Detecção de Tipos | ✅ Implementada | ✅ Mantida |
| Agentes Especializados | ✅ 8 agentes | ✅ Mantidos |

## Estrutura de Arquivos

```
src/
├── extension.ts              # Extensão principal com integração JurisAnalytica
├── framework/
│   └── FrameworkManager.ts   # Gerenciador do framework (copiado do JurisAnalytica)
├── ui.ts                     # Interface completa do Claude Code Chat
├── ui-styles.ts              # Estilos da interface
└── script.ts                 # Lógica JavaScript da webview
```

## Instalação e Uso

### 1. Pré-requisitos

- VS Code
- Claude CLI instalado (`npm install -g @anthropic-ai/claude-code`)
- Framework JurisAnalytica na pasta configurada

### 2. Instalação da Extensão

```bash
cd "C:\git-hub\claude-code-chat - Copia"
npm install
npm run compile
```

### 3. Testar no VS Code

Pressione **F5** no VS Code para abrir uma nova janela com a extensão carregada.

### 4. Usar o Chat

1. Abrir Command Palette (Ctrl+Shift+P)
2. Digitar: "Open Claude Code Chat"
3. Colar texto de processo jurídico
4. Ver o framework ser ativado automaticamente!

## Troubleshooting

### Framework não carrega

Verifique:
```json
"jurisanalytica.frameworkPath": "C:\\caminho\\correto\\assessoria-multiIA"
```

### Agente não é detectado

Adicione palavras-chave ao texto:
- Para apelação: use "apelação" ou "recurso de apelação"
- Para embargos: use "embargos de declaração"
- Para agravo: use "agravo de instrumento"

### Desabilitar framework temporariamente

```json
"jurisanalytica.enableFramework": false
```

## Benefícios desta Integração

1. ✅ **Melhor experiência de usuário** - Interface completa do Claude Code Chat
2. ✅ **Funcionalidades robustas** - Permissões, backups, conversas
3. ✅ **Framework especializado** - Detecção e instruções jurídicas
4. ✅ **Manutenção facilitada** - Usa código maduro e testado
5. ✅ **Extensível** - Fácil adicionar novos agentes e templates

## Próximos Passos

1. Ajustar instruções dos agentes conforme templates evoluem
2. Adicionar comandos de chat específicos (ex: /ementa, /voto)
3. Implementar carregamento dinâmico de templates do framework
4. Criar visualizações especiais para relatórios jurídicos

---

**Desenvolvido por:** Integração entre Claude Code Chat e JurisAnalytica Framework
**Data:** Outubro 2025
**Versão:** 1.0.0
