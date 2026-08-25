"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Card, Typography, Space, Progress, Tag, message } from "antd";
import {
  AudioOutlined,
  SoundOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface PronunciationTrainerProps {
  hanzi: string;
  pinyin: string;
  meaning: string;
  onPass?: () => void;
}

export default function PronunciationTrainer({
  hanzi,
  pinyin,
  meaning,
  onPass,
}: PronunciationTrainerProps) {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const recognitionRef = useRef<any>(null);

  // Phát âm mẫu
  const playSampleAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(hanzi);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      message.error("Trình duyệt không hỗ trợ nhận diện giọng nói");
      return;
    }

    setSpokenText("");
    setStatus("idle");

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const results = event.results[0];
      const matched = Array.from(results).map((r: any) => r.transcript.trim());
      const recognized = matched[0] || "";
      setSpokenText(recognized);

      // Kiểm tra xem chuỗi thu âm có khớp với chữ Hán mục tiêu không
      const isCorrect = matched.some((text: string) => text.includes(hanzi) || hanzi.includes(text));

      if (isCorrect) {
        setStatus("correct");
        message.success("Phát âm chuẩn xác!");
        onPass?.();
      } else {
        setStatus("incorrect");
      }
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      message.warning("Không nhận diện được giọng nói, vui lòng thử lại.");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <Card
      style={{
        textAlign: "center",
        borderRadius: 12,
        background: status === "correct" ? "#f6ffed" : status === "incorrect" ? "#fff2e8" : "#ffffff",
      }}
    >
      {/* Sửa lại direction="vertical" chuẩn Ant Design */}
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text style={{ fontSize: 48, fontWeight: "bold", color: "#1677ff", lineHeight: 1 }}>
            {hanzi}
          </Text>
          <div style={{ marginTop: 8 }}>
            <Text code style={{ fontSize: 22, color: "#d4380d" }}>
              {pinyin}
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {meaning}
          </Text>
        </div>

        <Space wrap size="middle">
          <Button
            shape="round"
            icon={<SoundOutlined />}
            onClick={playSampleAudio}
          >
            Nghe phát âm mẫu
          </Button>

          <Button
            type={isListening ? "dashed" : "primary"}
            danger={isListening}
            shape="round"
            icon={<AudioOutlined />}
            loading={isListening}
            onClick={startListening}
          >
            {isListening ? "Đang lắng nghe..." : "Bấm và đọc to"}
          </Button>
        </Space>

        {/* Kết quả đánh giá */}
        {spokenText && (
          <div style={{ marginTop: 8, padding: "8px 12px", background: "#fafafa", borderRadius: 8 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Giọng bạn đọc: <strong style={{ color: "#262626" }}>{spokenText}</strong>
            </Text>
            <div style={{ marginTop: 6 }}>
              {status === "correct" ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Phát âm rất tốt
                </Tag>
              ) : (
                <Tag color="error" icon={<CloseCircleOutlined />}>
                  Chưa chuẩn (Thử lại)
                </Tag>
              )}
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
}