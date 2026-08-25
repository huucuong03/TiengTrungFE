import { message } from "antd";

export const playChineseAudio = (text: string) => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  } else {
    message.warning("Trình duyệt không hỗ trợ phát âm");
  }
};

export const copyText = (text: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text);
    message.success("Đã sao chép vào bộ nhớ tạm");
  }
};