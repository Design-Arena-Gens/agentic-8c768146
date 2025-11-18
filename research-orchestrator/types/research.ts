export type EngineId =
  | "openai-deep-research"
  | "perplexity-deep-research"
  | "kimi-k2"
  | "gemini-2_5-pro";

export interface SubQuestion {
  id: string;
  question: string;
  rationale: string;
  focusTerms: string[];
}

export interface SourceDocument {
  id: string;
  title: string;
  url: string;
  summary: string;
  keySentences: string[];
  relevance: number;
  origin: "wikipedia" | "duckduckgo";
}

export interface EngineHighlight {
  subQuestionId: string;
  insight: string;
  confidence: "high" | "medium" | "low";
  sources: string[];
}

export interface EngineAnalysis {
  engine: EngineId;
  engineLabel: string;
  overview: string;
  highlights: EngineHighlight[];
  watchouts: string[];
}

export interface ThemeFinding {
  theme: string;
  summary: string;
  confidence: "high" | "medium" | "low";
  consensus: boolean;
  supportingSources: string[];
  dissentingEngines: string[];
}

export interface ToolComparison {
  engine: EngineId;
  engineLabel: string;
  strengths: string[];
  blindspots: string[];
  bestFor: string;
  coverageScore: number;
}

export interface MasterReport {
  executiveSummary: string[];
  keyFindings: ThemeFinding[];
  toolComparison: ToolComparison[];
  consensusSignals: string[];
  conflictSignals: string[];
  risks: string[];
  recommendations: string[];
}

export interface ResearchResponse {
  question: string;
  generatedAt: string;
  subQuestions: SubQuestion[];
  sources: SourceDocument[];
  analyses: EngineAnalysis[];
  report: MasterReport;
}
