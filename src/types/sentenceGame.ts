// types/sentenceGame.ts
export interface SentenceGameWord {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  position: number; // Vị trí trong câu
  isBlank?: boolean; // Có phải từ cần điền không
}

export interface SentenceGameQuestion {
  id: string;
  fullSentence: string;
  fullPinyin: string;
  meaning: string; // Nghĩa tiếng Việt
  words: SentenceGameWord[];
  blankIndex: number; // Vị trí từ bị thiếu
  blankWord: SentenceGameWord; // Từ cần điền
  options: string[]; // Các lựa chọn (gồm cả đáp án đúng và nhiễu)
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CharacterGameQuestion {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  strokes: number; // Số nét
  radical: string; // Bộ thủ
  examples: string[]; // Ví dụ từ ghép
  difficulty: 'easy' | 'medium' | 'hard';
}