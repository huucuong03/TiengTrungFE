"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Typography, Tag, message, Progress, Button, Space, Switch } from "antd";
import { AppstoreOutlined, FireOutlined, TrophyOutlined, ReloadOutlined, SoundOutlined, ThunderboltOutlined } from "@ant-design/icons";

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
  playAudio,
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
  const [g2Mistakes, setG2Mistakes] = useState(0);
  const [g2BestCombo, setG2BestCombo] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // 🔥 TÍNH NĂNG MỚI: Chế độ Siêu Khó (Ẩn Pinyin) & Thanh Stamina thời gian
  const [hardMode, setHardMode] = useState(false);
  const [stamina, setStamina] = useState(60); // 60 giây đếm ngược sinh tử

  const g2TimerRef = useRef<NodeJS.Timeout | null>(null);
  const staminaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const totalPairs = sessionData?.game2_match?.total_pairs || 1;

  // Khởi tạo game
  const initCards = () => {
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
  };

  useEffect(() => {
    initCards();
    startTimers();

    return () => {
      clearAllTimers();
    };
  }, [sessionData, hardMode]);

  const startTimers = () => {
    clearAllTimers();
    g2TimerRef.current = setInterval(() => {
      setG2TimeSeconds((prev) => prev + 1);
    }, 1000);

    // Nếu bật chế độ khó, kích hoạt thanh Stamina giảm dần
    if (hardMode) {
      setStamina(50); // Cho 50 giây ban đầu
      staminaTimerRef.current = setInterval(() => {
        setStamina((prev) => {
          if (prev <= 1) {
            clearInterval(staminaTimerRef.current!);
            handleTimeOutLoss();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const clearAllTimers = () => {
    if (g2TimerRef.current) clearInterval(g2TimerRef.current);
    if (staminaTimerRef.current) clearInterval(staminaTimerRef.current);
  };

  const handleTimeOutLoss = () => {
    setIsFinished(true);
    clearAllTimers();
    message.error("⏰ Hết giờ! Thử thách sinh tử đã kết thúc.");
  };

  // Reset game
  const resetGame = () => {
    initCards();
    setG2FirstSelection(null);
    setG2SecondSelection(null);
    setG2IsChecking(false);
    setG2MatchedPairsCount(0);
    setG2Flips(0);
    setG2Combo(0);
    setG2TimeSeconds(0);
    setG2Mistakes(0);
    setG2BestCombo(0);
    setIsFinished(false);
    setLocalScore(0);
    setLocalCorrect(0);
    startTimers();
  };

  const handleFlipCard = (card: any) => {
    if (g2IsChecking || card.isMatched || g2FirstSelection?.uniqueKey === card.uniqueKey || isFinished) return;

    if (card.cardType === "hanzi" && card.text) {
      playAudio(card.text);
    }

    if (!g2FirstSelection) {
      setG2FirstSelection(card);
      return;
    }

    setG2SecondSelection(card);
    setG2Flips((prev) => prev + 1);
    setG2IsChecking(true);

    const isMatch = g2FirstSelection.id === card.id && g2FirstSelection.cardType !== card.cardType;

    if (isMatch) {
      setG2Cards((prev) =>
        prev.map((c) =>
          c.id === card.id || c.id === g2FirstSelection.id
            ? { ...c, isMatched: true, matchedAt: Date.now() }
            : c
        )
      );

      const newCombo = g2Combo + 1;
      setG2Combo(newCombo);
      if (newCombo > g2BestCombo) setG2BestCombo(newCombo);

      // Điểm thưởng nhân theo hệ số combo và chế độ khó
      const multiplier = hardMode ? 2 : 1;
      const bonusPts = (30 + newCombo * 10) * multiplier;
      const timeBonus = Math.max(0, 15 - Math.floor(g2TimeSeconds / 8));

      setLocalScore((prev) => prev + bonusPts + timeBonus);
      setLocalCorrect((prev) => prev + 1);
      updateScoreAndCorrect(bonusPts + timeBonus, true);

      // Cộng thêm 5 giây Stamina nếu ở chế độ khó khi ghép đúng
      if (hardMode) {
        setStamina((prev) => Math.min(60, prev + 6));
      }

      const pairIndex = g2MatchedPairsCount + 1;
      setG2MatchedPairsCount(pairIndex);

      if (newCombo >= 3) {
        message.success(`🔥 CỰC CHÁY! Combo x${newCombo} (+${bonusPts}đ)!`);
      } else {
        message.success(`✅ Chuẩn xác! +${bonusPts}đ`);
      }

      resetG2Turn();

      if (pairIndex === totalPairs) {
        setIsFinished(true);
        clearAllTimers();
        setTimeout(() => {
          onFinishGame(localScore + bonusPts + timeBonus, localCorrect + 1);
        }, 1500);
      }
    } else {
      // Sai: Phạt trừ thêm điểm hoặc thời gian
      setG2Combo(0);
      setG2Mistakes((prev) => prev + 1);
      if (hardMode) {
        setStamina((prev) => Math.max(0, prev - 4)); // Phạt trừ 4 giây khi chọn sai ở chế độ khó
      }
      message.error("❌ Không khớp! Thử lại nhé");
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

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Card
      style={{
        borderRadius: 20,
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        textAlign: "center",
        background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e8ecf0",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div></div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: "#1f1f1f" }}>
            <AppstoreOutlined style={{ color: "#52c41a", marginRight: 8 }} />
            Thử Thách Lật Thẻ Trí Nhớ {hardMode && "🔥 [Chế Độ Khó]"}
          </Title>
          {/* Nút bật/tắt chế độ khó */}
          <Space>
            <ThunderboltOutlined style={{ color: hardMode ? "#faad14" : "#bfbfbf" }} />
            <Switch
              checked={hardMode}
              onChange={(checked) => setHardMode(checked)}
              checkedChildren="Hard"
              unCheckedChildren="Normal"
            />
          </Space>
        </div>

        <Text type="secondary" style={{ fontSize: 14 }}>
          {hardMode 
            ? "⚡ Ẩn Pinyin + Đồng hồ sinh tử 50s! Ghép sai trừ thời gian, ghép đúng thưởng điểm gấp đôi!"
            : "Ghép nhanh {totalPairs} cặp Chữ Hán - Nghĩa tiếng Việt để đạt điểm cao nhất!"}
        </Text>

        {/* Thanh Stamina nếu bật chế độ khó */}
        {hardMode && (
          <div style={{ marginTop: 10, maxWidth: 350, marginInline: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#fa8c16" }}>
              <span>⚡ Năng lượng sinh tử</span>
              <span>{stamina}s</span>
            </div>
            <Progress percent={(stamina / 50) * 100} status={stamina < 15 ? "exception" : "active"} showInfo={false} strokeColor="#fa8c16" size="small" />
          </div>
        )}

        {/* Thanh tiến độ */}
        <div style={{ marginTop: 14, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <Text type="secondary">Tiến độ hoàn thành</Text>
            <Text strong>{g2MatchedPairsCount} / {totalPairs}</Text>
          </div>
          <Progress
            percent={Math.round((g2MatchedPairsCount / totalPairs) * 100)}
            strokeColor={{ "0%": "#1677ff", "100%": "#52c41a" }}
            size="small"
            showInfo={false}
          />
        </div>

        {/* Thông số game */}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <Tag color="blue">⏱️ {formatTime(g2TimeSeconds)}</Tag>
          <Tag color="orange">🔄 {g2Flips} lần lật</Tag>
          <Tag color="red">❌ {g2Mistakes} lỗi</Tag>
          {g2Combo > 1 && (
            <Tag color="volcano" icon={<FireOutlined />}>COMBO x{g2Combo} 🔥</Tag>
          )}
          <Tag color="green">✅ {g2MatchedPairsCount}/{totalPairs}</Tag>
        </div>

        <div style={{ marginTop: 8 }}>
          <Text type="secondary">Điểm tích lũy: </Text>
          <Text strong style={{ fontSize: 20, color: "#1677ff" }}>{localScore}</Text>
        </div>
      </div>

      {/* Bảng thẻ bài */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 12,
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
              onClick={() => !card.isMatched && !isFinished && handleFlipCard(card)}
              style={{
                height: 95,
                borderRadius: 14,
                background: card.isMatched
                  ? "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)"
                  : isWrongSelection
                  ? "linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)"
                  : isFlipped
                  ? "linear-gradient(135deg, #ffffff 0%, #f0f5ff 100%)"
                  : "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
                border: card.isMatched
                  ? "2.5px solid #52c41a"
                  : isWrongSelection
                  ? "2.5px solid #ff4d4f"
                  : "2.5px solid #1677ff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: card.isMatched || isFinished ? "default" : "pointer",
                boxShadow: isFlipped ? "0 4px 12px rgba(0,0,0,0.06)" : "0 6px 20px rgba(22,119,255,0.25)",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isFlipped ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
                userSelect: "none",
                padding: "8px",
                position: "relative",
                opacity: card.isMatched ? 0.85 : 1,
              }}
            >
              {isFlipped ? (
                <>
                  <span
                    style={{
                      fontSize: card.cardType === "hanzi" ? 30 : 14,
                      fontWeight: 700,
                      color: card.isMatched ? "#389e0d" : "#1f1f1f",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {card.display}
                  </span>
                  {/* Nếu bật chế độ khó, ẩn hoàn toàn Pinyin để thử thách trí nhớ */}
                  {!hardMode && card.cardType === "hanzi" && card.pinyin && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#d4380d",
                        fontWeight: 600,
                        marginTop: 4,
                        background: "rgba(255,255,255,0.7)",
                        padding: "1px 8px",
                        borderRadius: 8,
                      }}
                    >
                      {card.pinyin}
                    </span>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 28, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>🀄</span>
                  <div style={{ fontSize: 10, color: "#ffffff", opacity: 0.8, fontWeight: 600, marginTop: 2 }}>
                    LẬT THẺ
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Điều khiển */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={resetGame} style={{ borderRadius: 10 }}>
          Chơi lại từ đầu
        </Button>
        {isFinished && (
          <Button type="primary" icon={<TrophyOutlined />} onClick={() => onFinishGame(localScore, localCorrect)} style={{ borderRadius: 10, background: "#52c41a" }}>
            Tiếp tục hành trình
          </Button>
        )}
      </div>
    </Card>
  );
}