// Tipos para a API do Figma
export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  componentId?: string;
  children?: FigmaNode[];
  visible?: boolean;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // Propriedades específicas para TEXT nodes
  textStyleId?: string;
  fillStyleId?: string;
  fills?: Array<{
    type: string;
    color?: {
      r: number;
      g: number;
      b: number;
    };
    boundVariables?: Record<string, any>;
  }>;
  boundVariables?: Record<string, any>;
  // Propriedade styles da API REST (diferente da Plugin API)
  styles?: {
    fill?: string;
    text?: string;
  };
}

export interface FigmaFile {
  nodes: Record<string, { document: FigmaNode }>;
}

export interface ComponentAnalysis {
  name: string;
  type: 'INSTANCE' | 'COMPONENT' | 'TEXT' | 'OTHER';
  isConnectedToDS: boolean;
  priority: number;
  nodeId: string;
  depth: number;
}

export interface AnalysisResult {
  components: ComponentAnalysis[];
  summary: {
    connected: number;
    disconnected: number;
    total: number;
  };
  frameInfo: {
    name: string;
    nodeId: string;
    url: string;
  };
}

export interface UserFeedback {
  type: 'missed_component' | 'wrong_classification' | 'should_ignore' | 'other';
  description: string;
  componentName?: string;
  expectedClassification?: 'connected' | 'disconnected';
  nodeId?: string;
  timestamp: number;
}

export interface LearningPattern {
  frameId: string;
  frameUrl: string;
  timestamp: number;
  components: {
    connected: number;
    disconnected: number;
  };
  corrections?: {
    connected: number;
    disconnected: number;
  };
  feedback?: UserFeedback[];
  analysisRules?: AnalysisRule[];
}

export interface AnalysisRule {
  id: string;
  type: 'include' | 'exclude' | 'classify';
  condition: {
    nodeType?: string;
    nodeName?: string;
    namePattern?: string;
    parentType?: string;
  };
  action: {
    classify?: 'connected' | 'disconnected';
    ignore?: boolean;
  };
  confidence: number;
  source: 'user_feedback' | 'pattern_recognition';
  createdAt: number;
} 