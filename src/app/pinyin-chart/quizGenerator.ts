import { QuestionItem } from "./types";

export interface PinyinDataItem {
  hanzi: string;
  pinyin: string;      // Ví dụ: "mā"
  base: string;        // Ví dụ: "ma"
  tone: number;        // 1, 2, 3, 4
  meaning?: string;    // Ví dụ: "Mẹ"
}

/**
 * Tạo danh sách câu hỏi Hỗn Hợp chỉ dùng từ có nghĩa thực tế
 */
export function buildMeaningfulMixedQuestions(
  dataPool: PinyinDataItem[],
  count: number = 15
): QuestionItem[] {
  // 1. Lọc chỉ lấy những từ thực tế (bắt buộc có chữ Hán và nghĩa)
  const validPool = dataPool.filter(
    (item) => item.hanzi && item.pinyin && item.meaning
  );

  // 2. Xáo trộn danh sách và lấy ra `count` từ vựng
  const shuffledPool = [...validPool].sort(() => 0.5 - Math.random());
  const selectedItems = shuffledPool.slice(0, count);

  // 3. Tạo cấu trúc câu hỏi + 3 đáp án nhiễu có nghĩa khác
  return selectedItems.map((item, index) => {
    const correctTarget = item.pinyin;

    // Lấy 3 đáp án nhiễu từ các từ vựng hợp lệ khác
    const wrongOptions = validPool
      .filter((d) => d.pinyin !== correctTarget && d.base !== item.base)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((d) => d.pinyin);

    // Ghép đáp án đúng với 3 đáp án sai rồi xáo trộn vị trí
    const options = [correctTarget, ...wrongOptions].sort(() => 0.5 - Math.random());

    return {
      id: `mixed_${index}_${Date.now()}`,
      base: item.base,
      tone: item.tone || 1,
      target: correctTarget,
      options: options,
      hanzi: item.hanzi,
      meaning: item.meaning,
    };
  });
}