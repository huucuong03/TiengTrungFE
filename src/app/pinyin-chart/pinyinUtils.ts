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
  const hanzi = getHanziForTone(clean, tone);

  // Nếu từ điển không có chữ Hán cho từ này -> Dùng Pinyin
  if (!hanzi) {
    return { text: pinyin, isHanzi: false, pinyin };
  }

  // Để an toàn, với thanh 2 và thanh 3 ta kiểm tra xem chữ Hán có bị trùng nhau không
  if (tone === 2 || tone === 3) {
    const h2 = getHanziForTone(clean, 2);
    const h3 = getHanziForTone(clean, 3);
    if (h2 === h3) {
      return { text: pinyin, isHanzi: false, pinyin };
    }
  }

  // Mặc định trả về chữ Hán nếu có
  return { text: hanzi, isHanzi: true, pinyin };
}

// Biến giữ luồng âm thanh để chống đè tiếng
let currentAudioInstance: HTMLAudioElement | null = null;

// Hàm fallback dùng trình duyệt đọc Pinyin
const fallbackSpeech = (text: string) => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel(); // Tắt âm cũ nếu đang đọc dở
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }
};

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

  // KIỂM TRA: Nếu text chứa chữ Hán thì gọi API, nếu chỉ là Pinyin thì gọi trình duyệt
  const isChinese = /[\u4e00-\u9fa5]/.test(text);

  if (isChinese) {
    try {
      const audioUrl = `https://tiengtrung-7hto.onrender.com/api/tts/speak?text=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      currentAudioInstance = audio;
      await audio.play();
    } catch (err) {
      fallbackSpeech(text);
    }
  } else {
    // TEXT LÀ PINYIN (vd: á, ǎ): Không gọi API Backend vì API sẽ đọc sai thành thanh 1
    // Dùng trình duyệt đọc trực tiếp để phát âm chuẩn dấu Pinyin!
    fallbackSpeech(text);
  }
};