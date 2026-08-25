import { TONE_HANZI_MAPPING } from "./pinyinData";

export function getHanziForTone(
  syllable: string,
  tone: number
): string | undefined {
  const clean = syllable.trim().toLowerCase();
  if (!clean || tone < 1 || tone > 4) return undefined;
  const list = TONE_HANZI_MAPPING[clean];
  if (!list) return undefined;
  
  // Đảm bảo lấy đúng index từ 0 -> 3 tương ứng thanh 1 -> 4
  const hanzi = list[tone - 1];
  if (!hanzi || hanzi === "—") return undefined;
  return hanzi;
}

export function applyToneToSyllable(
  syllable: string,
  tone: number
): string {
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

  if (str.includes("a")) return str.replace("a", toneMap.a[toneIdx]);
  if (str.includes("e")) return str.replace("e", toneMap.e[toneIdx]);
  if (str.includes("ou")) return str.replace("o", toneMap.o[toneIdx]);

  for (let i = str.length - 1; i >= 0; i--) {
    const char = str[i];
    if (toneMap[char]) {
      return (
        str.slice(0, i) +
        toneMap[char][toneIdx] +
        str.slice(i + 1)
      );
    }
  }

  return syllable;
}

export function getPronunciationText(
  syllable: string,
  tone: number
): { text: string; isHanzi: boolean; pinyin: string } {
  const clean = syllable.trim().toLowerCase();
  const pinyin = applyToneToSyllable(clean, tone);
  const hanzi = getHanziForTone(clean, tone);

  // QUAN TRỌNG: Nếu có chữ Hán, gửi chữ Hán đó vào API TTS để đọc chuẩn thanh điệu
  if (hanzi) {
    return { text: hanzi, isHanzi: true, pinyin };
  }
  
  // Nếu không có chữ Hán, bắt buộc dùng Pinyin có dấu chuẩn (vd: mā, má...) gửi lên API
  return { text: pinyin, isHanzi: false, pinyin };
}

/**
 * Hàm phát âm chuẩn chỉnh tránh lệch thanh điệu
 */
export const playAudio = (text: string) => {
  if (!text) return;
  
  // Encode chuỗi (hỗ trợ cả chữ Hán lẫn Pinyin có dấu như mā, má...)
  const audioUrl = `https://tiengtrung-7hto.onrender.com/api/tts/speak?text=${encodeURIComponent(text)}`;
  const audio = new Audio(audioUrl);
  
  audio.play().catch(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  });
};