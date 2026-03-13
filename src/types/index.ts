export interface AnalysisResult {
  summary: string;
  keywords: string[];
  readabilityScore: number;
  readabilityLabel: string;
}

export interface HistoryEntry {
  id: string;
  inputSnippet: string;
  readabilityScore: number;
  readabilityLabel: string;
  keywords: string[];
  createdAt: string;
}
