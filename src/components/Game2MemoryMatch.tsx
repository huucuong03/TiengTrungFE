"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Typography, Tag, message } from "antd";
import { AppstoreOutlined, FireOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface Game2Props {
  sessionData: any;
  onFinishGame: (finalScore: number, finalCorrect: number) => void;
  playAudio: (text: string) => void;
  updateScoreAndCorrect: (points: number, isCorrect: boolean) => void;
}

export default function Game2MemoryMatch({
  sessionData,
  onFinishGame,
  updateScoreAndCorrect,
}: Game2Props) {
  const [g2Cards, setG2Cards] = useState<any[]>([]);
  const [g2FirstSelection, setG2FirstSelection] = useState<any>(null);
  const [g2SecondSelection, setG2SecondSelection] = useState<any>(null);
  const [g2IsChecking, setG2IsChecking] = useState(false);
  const [g2MatchedPairsCount, setG2MatchedPairsCount] = useState(0);
  const [g2Flips, setG2Flips] = useState(0);
  const [g2Combo, setG2Combo] = useState(0);
  const [g2TimeSeconds, setG2TimeSeconds] = useState(0);
  const [localScore, setLocalScore] = useState(0);
  const [localCorrect, setLocalCorrect] = useState(0);

  const g2TimerRef = useRef<NodeJS.Timeout | null>(null);
  const totalPairs = sessionData?.game2_match?.total_pairs || 1;

  useEffect(() => {
    if (sessionData?.game2_match) {
      const hCards = sessionData.game2_match.hanzi_cards.map((c: any) => ({
        ...c,
        display: c.text,
        pinyin: c.pinyin || "",
        cardType: "hanzi",
        uniqueKey: `h-${c.id}-${Math.random()}`,
      }));
      const mCards = sessionData.game2_match.meaning_cards.map((c: any) => ({
        ...c,
        display: c.text,
        cardType: "meaning",
        uniqueKey: `m-${c.id}-${Math.random()}`,
      }));

      const combined = [...hCards, ...mCards].sort(() => 0.5 - Math.random());
      setG2Cards(combined);
    }

    g2TimerRef.current = setInterval(() => {
      setG2TimeSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (g2TimerRef.current) clearInterval(g2TimerRef.current);
    };
  }, [sessionData]);

  const handleFlipCard = (card: any) => {
    if (g2IsChecking || card.isMatched || g2FirstSelection?.uniqueKey === card.uniqueKey) return;
    
    // Đã gỡ bỏ hoàn toàn lệnh gọi playAudio tại đây

    if (!g2FirstSelection) {
      setG2FirstSelection(card);
      return;
    }

    setG2SecondSelection(card);
    setG2Flips((prev) => prev + 1);
    setG2IsChecking(true);

    // Kiểm tra cặp đôi (1 bên Hanzi, 1 bên Meaning cùng ID)
    if (g2FirstSelection.id === card.id && g2FirstSelection.cardType !== card.cardType) {
      setG2Cards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, isMatched: true } : c))
      );
      
      const newCombo = g2Combo + 1;
      setG2Combo(newCombo);
      const bonusPts = 25 + newCombo * 5;
      
      setLocalScore((prev) => prev + bonusPts);
      setLocalCorrect((prev) => prev + 1);
      updateScoreAndCorrect(bonusPts, true);
      message.success(`Ghép đúng! +${bonusPts} điểm (Combo x${newCombo})`);

      const nextMatchedCount = g2MatchedPairsCount + 1;
      setG2MatchedPairsCount(nextMatchedCount);
      resetG2Turn();

      if (nextMatchedCount === totalPairs) {
        if (g2TimerRef.current) clearInterval(g2TimerRef.current);
        setTimeout(() => {
          onFinishGame(localScore + bonusPts, localCorrect + 1);
        }, 1000);
      }
    } else {
      setG2Combo(0);
      setTimeout(() => {
        resetG2Turn();
      }, 800);
    }
  };

  const resetG2Turn = () => {
    setG2FirstSelection(null);
    setG2SecondSelection(null);
    setG2IsChecking(false);
  };

  return (
    <Card
      style={{
        borderRadius: 20,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        textAlign: "center",
        background: "linear-gradient(135deg, #f9fbfd 0%, #ffffff 100%)",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 800, color: "#1f1f1f" }}>
          <AppstoreOutlined style={{ color: "#52c41a", marginRight: 8 }} />
          Thử Thách Lật Thẻ Trí Nhớ (Memory Match)
        </Title>
        <Text type="secondary">
          Lật các thẻ bài úp để tìm và ghép nối chính xác Chữ Hán với Nghĩa tiếng Việt tương ứng.
        </Text>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Tag color="blue" style={{ fontSize: 13, padding: "4px 12px", borderRadius: 12 }}>
            ⏱️ Thời gian: {g2TimeSeconds}s
          </Tag>
          <Tag color="orange" style={{ fontSize: 13, padding: "4px 12px", borderRadius: 12 }}>
            🔄 Lật: {g2Flips} lần
          </Tag>
          {g2Combo > 1 && (
            <Tag color="volcano" icon={<FireOutlined />} style={{ fontSize: 13, padding: "4px 12px", borderRadius: 12, fontWeight: "bold" }}>
              COMBO x{g2Combo}!
            </Tag>
          )}
          <Tag color="green" style={{ fontSize: 13, padding: "4px 12px", borderRadius: 12 }}>
            ✨ Đã ghép: {g2MatchedPairsCount} / {totalPairs}
          </Tag>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))",
          gap: 14,
          maxWidth: 720,
          margin: "0 auto",
          padding: "10px",
        }}
      >
        {g2Cards.map((card: any) => {
          const isFlipped =
            card.isMatched ||
            g2FirstSelection?.uniqueKey === card.uniqueKey ||
            g2SecondSelection?.uniqueKey === card.uniqueKey;

          const isWrongSelection =
            g2IsChecking &&
            (g2FirstSelection?.uniqueKey === card.uniqueKey || g2SecondSelection?.uniqueKey === card.uniqueKey) &&
            !card.isMatched;

          return (
            <div
              key={card.uniqueKey}
              onClick={() => !card.isMatched && handleFlipCard(card)}
              style={{
                height: 100,
                borderRadius: 16,
                background: card.isMatched
                  ? "#f6ffed"
                  : isWrongSelection
                  ? "#fff2f0"
                  : isFlipped
                  ? "#ffffff"
                  : "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
                border: card.isMatched
                  ? "2px solid #52c41a"
                  : isWrongSelection
                  ? "2px solid #ff4d4f"
                  : isFlipped
                  ? "2px solid #1677ff"
                  : "2px solid #0958d9",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: card.isMatched ? "default" : "pointer",
                boxShadow: isFlipped ? "0 6px 16px rgba(0,0,0,0.08)" : "0 8px 20px rgba(22,119,255,0.3)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isFlipped ? "translateY(-2px)" : "translateY(0)",
                userSelect: "none",
                padding: "8px",
              }}
            >
              {isFlipped ? (
                <>
                  <span
                    style={{
                      fontSize: card.cardType === "hanzi" ? 30 : 14,
                      fontWeight: 700,
                      color: card.isMatched ? "#52c41a" : "#1f1f1f",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {card.display}
                  </span>
                  {card.cardType === "hanzi" && card.pinyin && (
                    <span style={{ fontSize: 11, color: "#d4380d", fontWeight: 600, marginTop: 4 }}>
                      {card.pinyin}
                    </span>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 28, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>
                    🀄
                  </span>
                  <div style={{ fontSize: 10, color: "#ffffff", opacity: 0.8, fontWeight: 600, marginTop: 2 }}>
                    LẬT THẺ
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}