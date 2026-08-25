"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Button, Typography, Tag, Space, message, Segmented } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface TowerWordItem {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  x: number; 
  y: number; 
  speed: number; 
}

interface TowerGameProps {
  sessionData: any;
  onFinishGame: (finalScore: number, finalCorrect: number) => void;
  playAudio: (text: string) => void;
}

export default function GameVocabularyTower({
  sessionData,
  onFinishGame,
  playAudio,
}: TowerGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [fallingWords, setFallingWords] = useState<TowerWordItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  
  // Thêm trạng thái lựa chọn chế độ: "meaning" (chọn nghĩa) hoặc "pinyin" (chọn pinyin)
  const [towerMode, setTowerMode] = useState<"meaning" | "pinyin">("meaning");

  const requestRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const correctRef = useRef(0);
  correctRef.current = correctCount;

  const vocabList = sessionData?.game1_single || sessionData?.game2_match?.hanzi_cards || [];

  const startGame = () => {
    setScore(0);
    setLives(3);
    setCorrectCount(0);
    setFallingWords([]);
    setIsPlaying(true);
    spawnNewTarget(vocabList);
  };

  const spawnNewTarget = (list: any[]) => {
    if (!list || list.length === 0) return;
    
    const target = list[Math.floor(Math.random() * list.length)];
    const wordData = target.word || { hanzi: target.text, pinyin: target.pinyin || "pinyin", meaning: target.meaning || "nghĩa" };
    setCurrentQuestion(wordData);
    playAudio(wordData.hanzi);

    // Tạo 4 lựa chọn ở thanh dưới dựa theo chế độ (Nghĩa hoặc Pinyin)
    const isMeaningMode = towerMode === "meaning";
    const targetValue = isMeaningMode ? wordData.meaning : wordData.pinyin;

    const distractors = list
      .filter((item: any) => {
        const itemWord = item.word || { hanzi: item.text, pinyin: item.pinyin, meaning: item.meaning };
        const val = isMeaningMode ? itemWord.meaning : itemWord.pinyin;
        return itemWord.id !== wordData.id && val !== targetValue;
      })
      .slice(0, 3)
      .map((item: any) => {
        const itemWord = item.word || { hanzi: item.text, pinyin: item.pinyin, meaning: item.meaning };
        return isMeaningMode ? itemWord.meaning : itemWord.pinyin;
      });
    
    const allOpts = [targetValue, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(allOpts);

    const newFallingWord: TowerWordItem = {
      id: Math.random(),
      hanzi: wordData.hanzi,
      pinyin: wordData.pinyin,
      meaning: wordData.meaning,
      x: Math.random() * 70 + 15,
      y: 0,
      speed: 0.25 + Math.random() * 0.15,
    };

    setFallingWords((prev) => [...prev, newFallingWord]);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const updateGame = () => {
      setFallingWords((prevWords) => {
        let currentLivesLoss = 0;
        const updated = prevWords
          .map((w) => ({ ...w, y: w.y + w.speed }))
          .filter((w) => {
            if (w.y >= 88) {
              currentLivesLoss += 1;
              return false;
            }
            return true;
          });

        if (currentLivesLoss > 0) {
          setLives((l) => {
            const nextLives = l - currentLivesLoss;
            if (nextLives <= 0) {
              setIsPlaying(false);
              message.error("Tháp từ vựng đã sụp đổ!");
              setTimeout(() => {
                onFinishGame(scoreRef.current, correctRef.current);
              }, 0);
            }
            return nextLives;
          });
        }

        return updated;
      });

      requestRef.current = requestAnimationFrame(updateGame);
    };

    requestRef.current = requestAnimationFrame(updateGame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, onFinishGame]);

  const handleSelectAnswer = (selectedVal: string) => {
    if (!isPlaying || !currentQuestion) return;

    const correctVal = towerMode === "meaning" ? currentQuestion.meaning : currentQuestion.pinyin;

    if (selectedVal === correctVal) {
      setScore((s) => s + 20);
      setCorrectCount((c) => c + 1);
      message.success("Bắn trúng từ chính xác! +20đ");
      setFallingWords([]);
      spawnNewTarget(vocabList);
    } else {
      message.error("Chọn sai đáp án!");
      setLives((l) => {
        const next = l - 1;
        if (next <= 0) {
          setIsPlaying(false);
          setTimeout(() => {
            onFinishGame(scoreRef.current, correctRef.current);
          }, 0);
        }
        return next;
      });
    }
  };

  return (
    <Card style={{ borderRadius: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", textAlign: "center", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
          <ThunderboltOutlined style={{ color: "#fa541c", marginRight: 6 }} />
          Tháp Từ Vựng (Vocabulary Tower)
        </Title>

        {!isPlaying && (
          <Segmented
            value={towerMode}
            onChange={(val: any) => setTowerMode(val)}
            options={[
              { label: "📖 Chọn Nghĩa Việt", value: "meaning" },
              { label: "🔤 Chọn Pinyin", value: "pinyin" },
            ]}
          />
        )}

        <Space>
          <Tag color="red">❤️ {lives}</Tag>
          <Tag color="gold">⭐ {score}đ</Tag>
        </Space>
      </div>

      {!isPlaying ? (
        <div style={{ padding: "30px 0" }}>
          <Title level={3}>Bảo vệ Tháp Từ Vựng!</Title>
          <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
            Chữ Hán sẽ rơi từ đỉnh tháp xuống. Hãy nhìn mặt chữ và bấm chọn đúng <strong>{towerMode === "meaning" ? "Nghĩa tiếng Việt" : "Pinyin"}</strong> tương ứng trước khi chạm đáy!
          </Text>
          <Button type="primary" size="large" onClick={startGame} style={{ borderRadius: 8, background: "#fa541c", height: 48, padding: "0 32px", fontWeight: 700 }}>
            Bắt đầu thủ thành
          </Button>
        </div>
      ) : (
        <div>
          {/* KHUNG THÁP RƠI */}
          <div style={{ position: "relative", height: 300, background: "linear-gradient(180deg, #1f1f1f 0%, #141414 100%)", borderRadius: 16, overflow: "hidden", border: "2px solid #303030", marginBottom: 20 }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: "#ff4d4f" }} />
            {fallingWords.map((word) => (
              <div key={word.id} style={{ position: "absolute", left: `${word.x}%`, top: `${word.y}%`, background: "rgba(22, 119, 255, 0.9)", border: "2px solid #91caff", borderRadius: 10, padding: "8px 16px", color: "#fff", fontWeight: 800, fontSize: 32, transform: "translateX(-50%)", boxShadow: "0 4px 12px rgba(22,119,255,0.4)" }}>
                {word.hanzi}
              </div>
            ))}
          </div>

          {/* HIỂN THỊ MỤC TIÊU ĐANG RƠI */}
          {currentQuestion && (
            <div style={{ background: "#fffbe6", padding: 12, borderRadius: 12, border: "1px solid #ffe58f", marginBottom: 16 }}>
              <Text type="secondary" style={{ display: "block", fontSize: 13 }}>Đang rơi chữ Hán, hãy tìm {towerMode === "meaning" ? "Nghĩa tiếng Việt" : "Pinyin"} phù hợp:</Text>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#d46b08", marginTop: 2 }}>
                Lắng nghe hoặc quan sát các khối chữ phía trên!
              </div>
            </div>
          )}

          {/* 4 NÚT CHỌN ĐÁP ÁN (NGHĨA HOẶC PINYIN) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, maxWidth: 560, margin: "0 auto" }}>
            {options.map((optVal, idx) => (
              <Button key={idx} size="large" onClick={() => handleSelectAnswer(optVal)} style={{ height: 56, fontSize: 18, fontWeight: 700, borderRadius: 12, background: "#f0f5ff", borderColor: "#adc6ff", color: "#1d39c4", whiteSpace: "normal", lineHeight: 1.2 }}>
                {optVal}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}