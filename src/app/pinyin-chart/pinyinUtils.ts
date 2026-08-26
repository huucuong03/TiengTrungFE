import { TONE_HANZI_MAPPING } from "./pinyinData";

export function applyToneToSyllable(syllable: string, tone: number): string {
  if (!syllable || tone < 1 || tone > 4) return syllable;
  
  const toneIdx = tone - 1; 
  const str = syllable.toLowerCase().trim();

  const toneMap: Record<string, string[]> = {
    a: ["ā", "á", "ǎ", "à"],
    e: ["ē", "é", "ě", "è"],
    o: ["ō", "ó", "ǒ", "ò"],
    i: ["ī", "í", "ǐ", "ì"],
    u: ["ū", "ú", "ǔ", "ù"],
    ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
    v: ["ǖ", "ǘ", "ǚ", "ǜ"],
  };

  const primaryVowels = ['a', 'e', 'o'];
  for (const v of primaryVowels) {
    if (str.includes(v)) return str.replace(v, toneMap[v][toneIdx]);
  }

  const vowels = ['i', 'u', 'ü', 'v'];
  for (let i = str.length - 1; i >= 0; i--) {
    const char = str[i];
    if (vowels.includes(char)) {
      return str.slice(0, i) + toneMap[char][toneIdx] + str.slice(i + 1);
    }
  }

  return syllable;
}

export function getHanziForTone(syllable: string, tone: number): string | undefined {
  const clean = syllable.trim().toLowerCase();
  if (!clean || tone < 1 || tone > 4) return undefined;
  
  const list = TONE_HANZI_MAPPING[clean];
  if (!list) return undefined;
  
  const hanzi = list[tone - 1];
  if (!hanzi || hanzi === "—") return undefined;
  return hanzi;
}

export function getPronunciationText(syllable: string, tone: number): { text: string; isHanzi: boolean; pinyin: string } {
  const clean = syllable.trim().toLowerCase();
  const pinyin = applyToneToSyllable(clean, tone);
  
  // ƯU TIÊN SỐ 1: Lấy chữ Hán chuẩn từ từ điển (giống như từ "pei" đang hoạt động rất tốt)
  const hanzi = getHanziForTone(clean, tone);
  if (hanzi) {
    return { text: hanzi, isHanzi: true, pinyin };
  }
  
  // NẾU TỪ ĐIỂN KHÔNG CÓ: Dùng Pinyin có dấu chuẩn làm fallback
  return { text: pinyin, isHanzi: false, pinyin };
}

// Biến giữ luồng âm thanh để chống đè tiếng
let currentAudioInstance: HTMLAudioElement | null = null;

export const playAudio = async (text: string) => {
  if (!text) return;

  if (currentAudioInstance) {
    currentAudioInstance.pause();
    currentAudioInstance.currentTime = 0;
    currentAudioInstance = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  try {
    // Gọi API Backend (vì các chữ Hán trong từ điển như "pei" chạy rất mượt với API này)
    const audioUrl = `https://tiengtrung-7hto.onrender.com/api/tts/speak?text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    currentAudioInstance = audio;
    await audio.play();
  } catch (err) {
    // Fallback sang Web Speech API nếu gọi API lỗi
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }
};