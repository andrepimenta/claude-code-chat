import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface Agent {
    id: string;
    name: string;
    specialization: string;
    template: string;
    triggers: string[];
}

export interface Template {
    id: string;
    name: string;
    type: string;
    path: string;
    content?: string;
}

export class FrameworkManager {
    private context: vscode.ExtensionContext;
    private frameworkPath: string;
    private agents: Agent[] = [];
    private templates: Template[] = [];
    private isLoaded: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        const config = vscode.workspace.getConfiguration('jurisanalytica');
        this.frameworkPath = config.get('frameworkPath', 'C:\\git-hub\\assessoria-multiIA');
    }

    async loadFramework(): Promise<boolean> {
        try {
            vscode.window.showInformationMessage('🔄 Carregando JurisAnalytica Framework...');

            // Carregar agentes
            await this.loadAgents();

            // Carregar templates
            await this.loadTemplates();

            this.isLoaded = true;
            vscode.window.showInformationMessage('✅ Framework carregado com sucesso!');
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Erro ao carregar framework: ${error}`);
            return false;
        }
    }

    private async loadAgents(): Promise<void> {
        this.agents = [
            {
                id: 'agent_apelacao',
                name: 'Apelação',
                specialization: 'Recursos de Apelação',
                template: 'A - Relatorio de Apelacao.md',
                triggers: ['apelação', 'apelacao', 'recurso de apelação']
            },
            {
                id: 'agent_embargos',
                name: 'Embargos de Declaração',
                specialization: 'Embargos de Declaração',
                template: 'B - Relatorio de Embargos de Declaração.md',
                triggers: ['embargos', 'embargos de declaração', 'embargos declaratórios']
            },
            {
                id: 'agent_agravo_instrumento',
                name: 'Agravo de Instrumento',
                specialization: 'Agravo de Instrumento',
                template: 'C - Relatorio de Agravo de Instrumento.md',
                triggers: ['agravo de instrumento', 'agravo']
            },
            {
                id: 'agent_liminar',
                name: 'Liminar/Efeito Suspensivo',
                specialization: 'Tutelas Provisórias',
                template: 'E - Relatório para análise de pedido de atribuição de efeito suspensivo ou liminar.md',
                triggers: ['liminar', 'efeito suspensivo', 'tutela provisória', 'tutela de urgência']
            },
            {
                id: 'agent_acao_originaria_liminar',
                name: 'Ação Originária (Liminar)',
                specialization: 'Ações Originárias - Liminar pendente',
                template: 'F - Relatorio Liminar Acao originaria.md',
                triggers: ['ação originária liminar', 'mandado de segurança', 'habeas corpus']
            },
            {
                id: 'agent_acao_originaria_voto',
                name: 'Ação Originária (Voto)',
                specialization: 'Ações Originárias - Voto',
                template: 'G - Relatorio Voto Acao originaria v2.md',
                triggers: ['ação originária voto', 'mérito ação originária']
            },
            {
                id: 'agent_agravo_interno',
                name: 'Agravo Interno',
                specialization: 'Agravo Interno',
                template: 'H- Relatorio Agravo Interno.md',
                triggers: ['agravo interno', 'agravo regimental']
            },
            {
                id: 'agent_conflito_competencia',
                name: 'Conflito de Competência',
                specialization: 'Conflito de Competência',
                template: 'I - Relatorio Conflito de Competencia.md',
                triggers: ['conflito de competência', 'conflito']
            }
        ];
    }

    private async loadTemplates(): Promise<void> {
        const mainPath = path.join(this.frameworkPath, 'main');

        if (!fs.existsSync(mainPath)) {
            throw new Error(`Pasta main não encontrada em: ${mainPath}`);
        }

        const files = fs.readdirSync(mainPath);
        this.templates = [];

        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = path.join(mainPath, file);
                this.templates.push({
                    id: file.replace('.md', '').toLowerCase().replace(/\s+/g, '_'),
                    name: file,
                    type: this.getTemplateType(file),
                    path: filePath
                });
            }
        }
    }

    private getTemplateType(fileName: string): string {
        if (fileName.startsWith('A ')) return 'Recurso - Apelação';
        if (fileName.startsWith('B ')) return 'Recurso - Embargos';
        if (fileName.startsWith('C ')) return 'Recurso - Agravo Instrumento';
        if (fileName.startsWith('H')) return 'Recurso - Agravo Interno';
        if (fileName.startsWith('E ')) return 'Tutela Provisória';
        if (fileName.startsWith('F ')) return 'Ação Originária - Liminar';
        if (fileName.startsWith('G ')) return 'Ação Originária - Voto';
        if (fileName.startsWith('I ')) return 'Competência';
        if (fileName.includes('Voto')) return 'Modelo - Voto';
        if (fileName.includes('ementa')) return 'Modelo - Ementa';
        if (fileName.includes('FIRAC')) return 'Modelo - Análise';
        return 'Outros';
    }

    getAgents(): Agent[] {
        return this.agents;
    }

    getTemplates(): Template[] {
        return this.templates;
    }

    getAgentById(id: string): Agent | undefined {
        return this.agents.find(a => a.id === id);
    }

    getTemplateById(id: string): Template | undefined {
        return this.templates.find(t => t.id === id);
    }

    identifyProcessType(text: string): Agent | null {
        const lowerText = text.toLowerCase();

        for (const agent of this.agents) {
            for (const trigger of agent.triggers) {
                if (lowerText.includes(trigger.toLowerCase())) {
                    return agent;
                }
            }
        }

        return null;
    }

    async loadTemplateContent(templateId: string): Promise<string> {
        const template = this.getTemplateById(templateId);
        if (!template) {
            throw new Error(`Template não encontrado: ${templateId}`);
        }

        if (!template.content) {
            template.content = fs.readFileSync(template.path, 'utf-8');
        }

        return template.content;
    }

    async getCoreInstructions(): Promise<string> {
        const corePath = path.join(this.frameworkPath, 'framework', 'CORE.md');
        return fs.readFileSync(corePath, 'utf-8');
    }

    async getOrchestratorInstructions(): Promise<string> {
        const orchPath = path.join(this.frameworkPath, 'framework', 'ORCHESTRATOR.md');
        return fs.readFileSync(orchPath, 'utf-8');
    }

    async getAgentsInstructions(): Promise<string> {
        const agentsPath = path.join(this.frameworkPath, 'framework', 'agents', 'AGENTS.md');
        return fs.readFileSync(agentsPath, 'utf-8');
    }

    async getCustomInstructions(): Promise<string> {
        const customPath = path.join(this.frameworkPath, 'jurisanalytica-chat', '.claude', 'custom_instructions.md');
        return fs.readFileSync(customPath, 'utf-8');
    }

    isFrameworkLoaded(): boolean {
        return this.isLoaded;
    }

    getFrameworkPath(): string {
        return this.frameworkPath;
    }

    /**
     * Obtém instruções específicas de um agente
     */
    getAgentInstructions(agentId: string): string | null {
        const agent = this.getAgentById(agentId);
        if (!agent) {
            return null;
        }

        // TODO: Carregar arquivo específico do agente quando existir
        // Por enquanto, retorna instruções gerais baseadas no tipo
        let instructions = `## Agente: ${agent.name}\n\n`;
        instructions += `**Especialização:** ${agent.specialization}\n\n`;
        instructions += `**Template Aplicável:** ${agent.template}\n\n`;

        instructions += `**Responsabilidades:**\n`;
        instructions += `- Análise completa do processo ${agent.name}\n`;
        instructions += `- Identificação de partes, pedidos e fundamentos\n`;
        instructions += `- Levantamento de questões jurídicas relevantes\n`;
        instructions += `- Aplicação de jurisprudência do STF/STJ\n`;
        instructions += `- Estruturação de relatório conforme template\n\n`;

        return instructions;
    }
}
