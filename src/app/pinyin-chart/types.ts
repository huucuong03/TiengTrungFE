export interface PinyinDataState {
  basic_finals: string[];
  nasal_finals: string[];
  special_red_syllables: string[];
  rows: any[];
}

export interface QuestionItem {
  id?: number;
  target: string;
  base: string;
  tone: number;
  options: string[];
  hanzi?: string;
  meaning?: string;
}

export type ListeningMode = "tones" | "syllables" | "mixed";


export interface QuizHistoryItem {
  target: string;
  selected: string;
  isCorrect: boolean;
  hanzi?: string;
  meaning?: string;
}