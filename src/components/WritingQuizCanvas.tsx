"use client";

import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { Button, Space, Tag, message } from "antd";
import { EyeOutlined, RedoOutlined, CheckCircleOutlined } from "@ant-design/icons";

interface Props {
  character: string;
  wordId: number;
  onSuccess: (usedHint: boolean) => void;
  onPenalty?: (penaltyPoints: number) => void;
}

export default function WritingQuizCanvas({ character, wordId, onSuccess, onPenalty }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const initWriter = () => {
    if (!containerRef.current || !character) return;
    containerRef.current.innerHTML = "";
    setIsDone(false);
    setMistakes(0);
    setUsedHint(false);

    try {
      // Khởi tạo HanziWriter ở chế độ ẩn nét mờ hoàn toàn (Thêm as any để tránh lỗi type)
      const writer = HanziWriter.create(containerRef.current, character, {
        width: 260,
        height: 260,
        padding: 20,
        showOutline: false,
        showCharacter: false,
        strokeColor: "#1677ff",
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 150,
        grid: {
          gridColor: "#ffd591",
        },
      } as any);

      writerRef.current = writer;

      // Bắt đầu Quiz viết ngay lập tức
      writer.quiz({
        onMistake: () => {
          setMistakes((prev) => prev + 1);

          if (onPenalty) {
            onPenalty(5);
          }

          message.warning("❌ Sai nét hoặc sai thứ tự! (-5 điểm)");
        },
        onComplete: async () => {
          setIsDone(true);
          message.success(`✨ Xuất sắc! Đã viết đúng chữ "${character}"!`);

          // Cấu hình headers an toàn TypeScript
          const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
          const authHeaders: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (token) {
            authHeaders["Authorization"] = `Bearer ${token}`;
          }

          // Gọi API cập nhật tiến độ
          try {
            await fetch(`https://tiengtrung-7hto.onrender.com/api/notebook/words/${wordId}/practice`, {
              method: "PATCH",
              headers: authHeaders,
            });
          } catch (e) {
            console.error(e);
          }

          onSuccess(usedHint);
        },
      });
    } catch (e) {
      console.error("Quiz init error:", e);
    }
  };

  useEffect(() => {
    initWriter();
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [character]);

  // Xem gợi ý nét viết (sẽ bị đánh dấu usedHint)
  const handleShowHint = () => {
    if (!writerRef.current) return;
    setUsedHint(true);
    writerRef.current.animateCharacter();
  };

  const handleReset = () => {
    initWriter();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {/* Ô Mễ tập viết */}
      <div
        style={{
          background: "#fffbe6",
          borderRadius: 20,
          border: "3px solid #ffe58f",
          padding: 10,
          boxShadow: "0 6px 20px rgba(250,173,20,0.15)",
        }}
      >
        <div ref={containerRef} />
      </div>

      <Space size="middle">
        <Tag color="error" style={{ fontSize: 13, padding: "3px 10px" }}>
          Lỗi nét: {mistakes} (-{mistakes * 5}đ)
        </Tag>
        {usedHint && (
          <Tag color="volcano" style={{ fontSize: 13, padding: "3px 10px" }}>
            Đã xem gợi ý (-50% điểm)
          </Tag>
        )}
        {isDone && (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 13, padding: "3px 10px" }}>
            Đã hoàn thành nét chữ
          </Tag>
        )}
      </Space>

      <Space>
        <Button icon={<EyeOutlined />} onClick={handleShowHint} disabled={isDone}>
          Xem nét mẫu (Gợi ý)
        </Button>
        <Button icon={<RedoOutlined />} onClick={handleReset}>
          Viết lại từ đầu
        </Button>
      </Space>
    </div>
  );
}