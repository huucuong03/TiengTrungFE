"use client";

import { useState } from "react";
import { Card, Button, Typography, Tag, message } from "antd";
import { BranchesOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface Game3Props {
  sessionData: any;
  onFinishGame: (finalScore: number, finalCorrect: number) => void;
  updateScoreAndCorrect: (points: number, isCorrect: boolean) => void;
}

export default function Game3MatchColumns({
  sessionData,
  onFinishGame,
  updateScoreAndCorrect,
}: Game3Props) {
  const [g3Hanzi, setG3Hanzi] = useState<any>(null);
  const [g3Pinyin, setG3Pinyin] = useState<any>(null);
  const [g3Meaning, setG3Meaning] = useState<any>(null);
  const [g3Matched, setG3Matched] = useState<number[]>([]);
  const [isWrongAttempt, setIsWrongAttempt] = useState(false); // Trạng thái báo lỗi chớp đỏ
  const [localScore, setLocalScore] = useState(0);
  const [localCorrect, setLocalCorrect] = useState(0);

  const totalPairs = sessionData?.game3_match3?.total_pairs || 1;

  const handleSelectG3 = (card: any) => {
    if (g3Matched.includes(card.id) || isWrongAttempt) return;

    let nextH = g3Hanzi;
    let nextP = g3Pinyin;
    let nextM = g3Meaning;

    // Xử lý chọn từng cột độc lập
    if (card.type === "hanzi") {
      nextH = g3Hanzi?.id === card.id ? null : card;
      setG3Hanzi(nextH);
    } else if (card.type === "pinyin") {
      nextP = g3Pinyin?.id === card.id ? null : card;
      setG3Pinyin(nextP);
    } else if (card.type === "meaning") {
      nextM = g3Meaning?.id === card.id ? null : card;
      setG3Meaning(nextM);
    }

    // Nếu đã chọn đủ 3 cột, tiến hành kiểm tra ID đồng bộ
    if (nextH && nextP && nextM) {
      if (nextH.id === nextP.id && nextP.id === nextM.id) {
        // ĐÚNG CẢ 3 CỘT (+30 điểm)
        const nextMatched = [...g3Matched, nextH.id];
        setG3Matched(nextMatched);
        
        const gainedPts = 30;
        setLocalScore((prev) => prev + gainedPts);
        setLocalCorrect((prev) => prev + 1);
        updateScoreAndCorrect(gainedPts, true);
        message.success("✨ Nối khớp hoàn hảo 3 cột! (+30đ)");

        setG3Hanzi(null);
        setG3Pinyin(null);
        setG3Meaning(null);

        if (nextMatched.length === totalPairs) {
          setTimeout(() => {
            onFinishGame(localScore + gainedPts, localCorrect + 1);
          }, 900);
        }
      } else {
        // SAI CẶP LIÊN KẾT (-10 điểm)
        setIsWrongAttempt(true);
        const penaltyPts = 10;
        
        setLocalScore((prev) => Math.max(0, prev - penaltyPts));
        updateScoreAndCorrect(-penaltyPts, false);
        message.error("❌ 3 thẻ không khớp nhau! (-10đ)");

        setTimeout(() => {
          setG3Hanzi(null);
          setG3Pinyin(null);
          setG3Meaning(null);
          setIsWrongAttempt(false);
        }, 600);
      }
    }
  };

  return (
    <Card style={{ borderRadius: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", background: "linear-gradient(135deg, #fdfefe 0%, #f7f9fb 100%)" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
          <BranchesOutlined style={{ color: "#fa541c", marginRight: 8 }} />
          Nối 3 Cột: Chữ Hán ➔ Pinyin ➔ Nghĩa
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Chọn lần lượt 1 thẻ Chữ Hán, 1 thẻ Pinyin và 1 thẻ Nghĩa tương ứng. Ghép sai sẽ bị trừ 10 điểm!
        </Text>
        <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 12 }}>
          <Tag color="green" style={{ fontSize: 13, padding: "4px 12px", borderRadius: 12 }}>
            ✨ Đã nối: {g3Matched.length} / {totalPairs} từ
          </Tag>
          <Tag color="volcano" style={{ fontSize: 13, padding: "4px 12px", borderRadius: 12 }}>
            ⭐ Điểm tạm tính: {localScore}
          </Tag>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, maxWidth: 760, margin: "0 auto" }}>
        
        {/* CỘT 1: CHỮ HÁN */}
        <div>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <Tag color="blue" style={{ fontWeight: 700 }}>1. Chữ Hán</Tag>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessionData.game3_match3.hanzi_col.map((card: any) => {
              const isMatched = g3Matched.includes(card.id);
              const isSelected = g3Hanzi?.id === card.id;
              return (
                <Button
                  key={`g3h-${card.id}`}
                  size="large"
                  block
                  disabled={isMatched}
                  onClick={() => handleSelectG3(card)}
                  style={{
                    height: 56,
                    fontSize: 24,
                    fontWeight: 700,
                    borderRadius: 12,
                    opacity: isMatched ? 0.25 : 1,
                    background: isMatched ? "#f6ffed" : isWrongAttempt && isSelected ? "#fff2f0" : isSelected ? "#1677ff" : "#ffffff",
                    border: isWrongAttempt && isSelected ? "2px solid #ff4d4f" : isSelected ? "2px solid #1677ff" : "1.5px solid #d9d9d9",
                    color: isSelected && !isWrongAttempt ? "#ffffff" : isWrongAttempt && isSelected ? "#ff4d4f" : "#262626",
                    boxShadow: isSelected ? "0 4px 12px rgba(22,119,255,0.3)" : "none",
                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {card.text} {isMatched && <CheckCircleOutlined style={{ color: "#52c41a" }} />}
                </Button>
              );
            })}
          </div>
        </div>

        {/* CỘT 2: PINYIN */}
        <div>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <Tag color="volcano" style={{ fontWeight: 700 }}>2. Pinyin</Tag>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessionData.game3_match3.pinyin_col.map((card: any) => {
              const isMatched = g3Matched.includes(card.id);
              const isSelected = g3Pinyin?.id === card.id;
              return (
                <Button
                  key={`g3p-${card.id}`}
                  size="large"
                  block
                  disabled={isMatched}
                  onClick={() => handleSelectG3(card)}
                  style={{
                    height: 56,
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 12,
                    opacity: isMatched ? 0.25 : 1,
                    background: isMatched ? "#f6ffed" : isWrongAttempt && isSelected ? "#fff2f0" : isSelected ? "#fa541c" : "#ffffff",
                    border: isWrongAttempt && isSelected ? "2px solid #ff4d4f" : isSelected ? "2px solid #fa541c" : "1.5px solid #d9d9d9",
                    color: isSelected && !isWrongAttempt ? "#ffffff" : isWrongAttempt && isSelected ? "#ff4d4f" : "#d4380d",
                    boxShadow: isSelected ? "0 4px 12px rgba(250,84,28,0.3)" : "none",
                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {card.text}
                </Button>
              );
            })}
          </div>
        </div>

        {/* CỘT 3: NGHĨA VIỆT */}
        <div>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <Tag color="green" style={{ fontWeight: 700 }}>3. Nghĩa Việt</Tag>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessionData.game3_match3.meaning_col.map((card: any) => {
              const isMatched = g3Matched.includes(card.id);
              const isSelected = g3Meaning?.id === card.id;
              return (
                <Button
                  key={`g3m-${card.id}`}
                  size="large"
                  block
                  disabled={isMatched}
                  onClick={() => handleSelectG3(card)}
                  style={{
                    height: 56,
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 12,
                    opacity: isMatched ? 0.25 : 1,
                    background: isMatched ? "#f6ffed" : isWrongAttempt && isSelected ? "#fff2f0" : isSelected ? "#52c41a" : "#ffffff",
                    border: isWrongAttempt && isSelected ? "2px solid #ff4d4f" : isSelected ? "2px solid #52c41a" : "1.5px solid #d9d9d9",
                    color: isSelected && !isWrongAttempt ? "#ffffff" : isWrongAttempt && isSelected ? "#ff4d4f" : "#262626",
                    boxShadow: isSelected ? "0 4px 12px rgba(82,196,26,0.3)" : "none",
                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.2s ease",
                    whiteSpace: "normal",
                    lineHeight: 1.2,
                  }}
                >
                  {card.text}
                </Button>
              );
            })}
          </div>
        </div>

      </div>
    </Card>
  );
}