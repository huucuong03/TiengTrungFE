"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, Button, Typography, Tag, Space, message } from "antd";
import {
  SoundOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export type QuizQuestionPair = "hanzi_to_meaning" | "pinyin_to_meaning" | "meaning_to_hanzi";

interface Game1Props {
  sessionData: any;
  onFinishGame: (finalScore: number, finalCorrect: number) => void;
  playAudio: (text: string) => void;
  updateScoreAndCorrect: (points: number, isCorrect: boolean) => void;
  currentScore?: number;
}

export default function Game1Flashcard({
  sessionData,
  onFinishGame,
  playAudio,
  updateScoreAndCorrect,
  currentScore = 0,
}: Game1Props) {
  const [g1Index, setG1Index] = useState(0);
  const [g1Selected, setG1Selected] = useState<string>("");
  const [g1Checked, setG1Checked] = useState(false);
  const [g1TimeLeft, setG1TimeLeft] = useState(15);
  const [g1CurrentPair, setG1CurrentPair] = useState<QuizQuestionPair>("hanzi_to_meaning");
  const [localCorrectCount, setLocalCorrectCount] = useState(0);
  const [localScore, setLocalScore] = useState(0);

  const g1TimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentG1Task = sessionData?.game1_single?.[g1Index];

  const determinePairType = (index: number): QuizQuestionPair => {
    const types: QuizQuestionPair[] = [
      "hanzi_to_meaning",
      "pinyin_to_meaning",
      "meaning_to_hanzi",
    ];
    return types[index % types.length];
  };

  const g1OptionsList = useMemo(() => {
    if (!currentG1Task || !sessionData?.game1_single) return [];

    if (g1CurrentPair === "hanzi_to_meaning" || g1CurrentPair === "pinyin_to_meaning") {
      const correctItem = {
        label: currentG1Task.word.meaning,
        value: currentG1Task.word.meaning,
      };
      const distractors = sessionData.game1_single
        .filter((item: any) => item.word.id !== currentG1Task.word.id)
        .slice(0, 3)
        .map((item: any) => ({
          label: item.word.meaning,
          value: item.word.meaning,
        }));
      return [correctItem, ...distractors].sort(() => 0.5 - Math.random());
    } else {
      const correctItem = {
        label: currentG1Task.word.hanzi,
        value: currentG1Task.word.hanzi,
      };
      const distractors = sessionData.game1_single
        .filter((item: any) => item.word.id !== currentG1Task.word.id)
        .slice(0, 3)
        .map((item: any) => ({
          label: item.word.hanzi,
          value: item.word.hanzi,
        }));
      return [correctItem, ...distractors].sort(() => 0.5 - Math.random());
    }
  }, [currentG1Task, g1CurrentPair, sessionData]);

  const correctTargetValue = useMemo(() => {
    if (!currentG1Task) return "";
    if (g1CurrentPair === "hanzi_to_meaning" || g1CurrentPair === "pinyin_to_meaning") {
      return currentG1Task.word.meaning;
    }
    return currentG1Task.word.hanzi;
  }, [currentG1Task, g1CurrentPair]);

  const isG1Correct = g1Selected === correctTargetValue;

  useEffect(() => {
    if (!currentG1Task || g1Checked) {
      if (g1TimerRef.current) clearInterval(g1TimerRef.current);
      return;
    }

    setG1TimeLeft(15);
    setG1CurrentPair(determinePairType(g1Index));
    if (currentG1Task.word.hanzi) playAudio(currentG1Task.word.hanzi);

    g1TimerRef.current = setInterval(() => {
      setG1TimeLeft((prev) => {
        if (prev <= 1) {
          if (g1TimerRef.current) clearInterval(g1TimerRef.current);
          handleG1Timeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (g1TimerRef.current) clearInterval(g1TimerRef.current);
    };
  }, [g1Index, g1Checked]);

  const handleG1Timeout = () => {
    setG1Checked(true);
    setG1Selected("Hết giờ");
    message.error("Hết thời gian suy nghĩ!");
  };

  const handleSelectG1Option = (val: string) => {
    if (g1Checked) return;
    if (g1TimerRef.current) clearInterval(g1TimerRef.current);
    setG1Selected(val);
    setG1Checked(true);

    const correct = val === correctTargetValue;
    if (correct) {
      setLocalScore((prev) => prev + 20);
      setLocalCorrectCount((prev) => prev + 1);
      updateScoreAndCorrect(20, true);
      message.success("Chính xác! +20 Điểm");
    } else {
      updateScoreAndCorrect(0, false);
      message.error("Chưa chính xác!");
    }
  };

  const handleNextG1 = () => {
    setG1Selected("");
    setG1Checked(false);
    if (g1Index < (sessionData.game1_single?.length || 5) - 1) {
      setG1Index((prev) => prev + 1);
    } else {
      onFinishGame(localScore + (isG1Correct ? 20 : 0), localCorrectCount + (isG1Correct ? 1 : 0));
    }
  };

  if (!currentG1Task) return null;

  return (
    <Card style={{ borderRadius: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <Space>
          <Tag color="blue" style={{ fontSize: 13, padding: "3px 10px", borderRadius: 12 }}>
            Câu {g1Index + 1} / {sessionData.game1_single.length}
          </Tag>
          <Tag color="purple" style={{ fontSize: 12, borderRadius: 12 }}>
            {g1CurrentPair === "hanzi_to_meaning" ? "🀄 Chữ Hán ➔ Nghĩa" :
             g1CurrentPair === "pinyin_to_meaning" ? "🔤 Pinyin ➔ Nghĩa" : "📖 Nghĩa ➔ Chữ Hán"}
          </Tag>
        </Space>
        {!g1Checked ? (
          <Tag color={g1TimeLeft <= 3 ? "error" : "warning"} icon={<ClockCircleOutlined />}
            style={{ fontSize: 14, fontWeight: 700, padding: "3px 12px", borderRadius: 12 }}>
            ⏱️ {g1TimeLeft}s
          </Tag>
        ) : (
          <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 13, borderRadius: 12 }}>
            ✅ Đã hoàn thành
          </Tag>
        )}
      </div>

      <div style={{
        background: !g1Checked ? "linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)" :
          isG1Correct ? "#f6ffed" : "#fff2f0",
        borderRadius: 16, padding: "24px 20px", textAlign: "center",
        border: !g1Checked ? "1.5px solid #d6e4ff" :
          isG1Correct ? "1.5px solid #b7eb8f" : "1.5px solid #ffccc7",
        marginBottom: 24,
      }}>
        {g1CurrentPair === "hanzi_to_meaning" && (
          <>
            <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
              Nhìn Chữ Hán, chọn nghĩa tương ứng:
            </Text>
            <div style={{ fontSize: 64, fontWeight: 800, color: "#1677ff", lineHeight: 1.1 }}>
              {currentG1Task.word.hanzi}
            </div>
          </>
        )}
        {g1CurrentPair === "pinyin_to_meaning" && (
          <>
            <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
              Nhìn Pinyin, chọn nghĩa tương ứng:
            </Text>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#d4380d", lineHeight: 1.2 }}>
              {currentG1Task.word.pinyin}
            </div>
          </>
        )}
        {g1CurrentPair === "meaning_to_hanzi" && (
          <>
            <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
              Nhìn Nghĩa, chọn Chữ Hán tương ứng:
            </Text>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fa8c16", lineHeight: 1.2 }}>
              "{currentG1Task.word.meaning}"
            </div>
          </>
        )}

        <div style={{ marginTop: 12 }}>
          <Button type="primary" shape="circle" icon={<SoundOutlined style={{ fontSize: 20 }} />}
            onClick={() => playAudio(currentG1Task.word.hanzi)}
            style={{ width: 44, height: 44 }} />
          <span style={{ marginLeft: 8, fontSize: 13, color: "#8c8c8c" }}>🔊 Nghe phát âm</span>
        </div>

        {g1Checked && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <Space size="large" wrap>
              <div><Text type="secondary" style={{ fontSize: 12 }}>Chữ Hán:</Text>
                <Text strong style={{ fontSize: 22, color: "#1677ff" }}>{currentG1Task.word.hanzi}</Text>
              </div>
              <div><Text type="secondary" style={{ fontSize: 12 }}>Pinyin:</Text>
                <Text code style={{ fontSize: 20, color: "#d4380d" }}>{currentG1Task.word.pinyin}</Text>
              </div>
              <div><Text type="secondary" style={{ fontSize: 12 }}>Nghĩa:</Text>
                <Tag color="cyan" style={{ fontSize: 15 }}>{currentG1Task.word.meaning}</Tag>
              </div>
            </Space>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 640, margin: "0 auto" }}>
        {g1OptionsList.map((opt: any, idx: number) => {
          let isCorrect = false, isWrong = false;
          if (g1Checked) {
            if (opt.value === correctTargetValue) isCorrect = true;
            else if (opt.value === g1Selected) isWrong = true;
          }
          return (
            <Button key={idx} size="large" disabled={g1Checked}
              onClick={() => handleSelectG1Option(opt.value)}
              style={{
                height: 60, fontSize: 16, borderRadius: 12, fontWeight: 700,
                background: isCorrect ? "#52c41a" : isWrong ? "#ff4d4f" : "#ffffff",
                borderColor: isCorrect ? "#52c41a" : isWrong ? "#ff4d4f" : "#d9d9d9",
                color: isCorrect || isWrong ? "#ffffff" : "#262626",
              }}>
              <span style={{ opacity: 0.7, marginRight: 6 }}>{String.fromCharCode(65 + idx)}.</span>
              {opt.label}
            </Button>
          );
        })}
      </div>

      {g1Checked && (
        <div style={{ marginTop: 24 }}>
          <Button type="primary" size="large" block icon={<ArrowRightOutlined />}
            onClick={handleNextG1}
            style={{ height: 48, borderRadius: 10, fontSize: 16, fontWeight: 700 }}>
            {g1Index < sessionData.game1_single.length - 1 ? "Câu tiếp theo ➔" : "Xem tổng kết"}
          </Button>
        </div>
      )}
    </Card>
  );
}