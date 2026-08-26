"use client";

import { useState, useEffect } from "react";
import { Card, Button, Typography, Space, message, Spin } from "antd";
import { OrderedListOutlined, SoundOutlined, ReloadOutlined, ArrowRightOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface SentenceWordItem {
  zh: string;
  py: string;
}

interface Game4Props {
  sessionData: any;
  onFinishGame: (finalScore: number, finalCorrect: number) => void;
  playAudio: (text: string) => void;
  updateScoreAndCorrect: (points: number, isCorrect: boolean) => void;
  refreshGame4?: () => void; // 🆕 Thêm prop để refresh
}

export default function Game4SentenceBuilder({
  sessionData,
  onFinishGame,
  playAudio,
  updateScoreAndCorrect,
  refreshGame4,
}: Game4Props) {
  const [g4Index, setG4Index] = useState(0);
  const [g4UserSeq, setG4UserSeq] = useState<SentenceWordItem[]>([]);
  const [g4Available, setG4Available] = useState<SentenceWordItem[]>([]);
  const [g4Checked, setG4Checked] = useState(false);
  const [g4IsCorrect, setG4IsCorrect] = useState(false);
  const [localScore, setLocalScore] = useState(0);
  const [localCorrect, setLocalCorrect] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentG4Task = sessionData?.game4_sentence?.[g4Index];
  const totalSentences = sessionData?.game4_sentence?.length || 1;

  // Reset khi có dữ liệu mới
  useEffect(() => {
    if (currentG4Task?.shuffled_words) {
      setG4Available([...currentG4Task.shuffled_words]);
      setG4UserSeq([]);
      setG4Checked(false);
      setG4IsCorrect(false);
    }
  }, [g4Index, sessionData]);

  // 🆕 Hàm làm mới câu (gọi lại API)
  const handleRefreshSentences = async () => {
    if (refreshGame4) {
      setLoading(true);
      await refreshGame4();
      setG4Index(0); // Reset về câu đầu tiên
      setLoading(false);
      message.success("Đã tạo câu mới!");
    }
  };

  const handlePickG4Word = (wordItem: SentenceWordItem, index: number) => {
    if (g4Checked) return;
    setG4UserSeq([...g4UserSeq, wordItem]);
    const nextAvail = [...g4Available];
    nextAvail.splice(index, 1);
    setG4Available(nextAvail);
  };

  const handleRemoveG4Word = (wordItem: SentenceWordItem, index: number) => {
    if (g4Checked) return;
    const nextSeq = [...g4UserSeq];
    nextSeq.splice(index, 1);
    setG4UserSeq(nextSeq);
    setG4Available([...g4Available, wordItem]);
  };

  const handleResetCurrentSentence = () => {
    if (g4Checked || !currentG4Task) return;
    setG4Available([...currentG4Task.shuffled_words]);
    setG4UserSeq([]);
  };

  const handleCheckG4 = () => {
    if (!currentG4Task) return;
    const userZhList = g4UserSeq.map((w) => w.zh);
    const correctZhList = currentG4Task.correct_sequence.map((w: any) => w.zh);
    const isCorrect = JSON.stringify(userZhList) === JSON.stringify(correctZhList);

    setG4IsCorrect(isCorrect);
    setG4Checked(true);

    if (isCorrect) {
      const points = 35;
      setLocalScore((prev) => prev + points);
      setLocalCorrect((prev) => prev + 1);
      updateScoreAndCorrect(points, true);
      message.success(`✨ Sắp xếp câu chính xác! (+${points}đ)`);
    } else {
      updateScoreAndCorrect(0, false);
      message.error("❌ Thứ tự câu chưa đúng!");
    }
  };

  const handleNextG4 = () => {
    if (g4Index < totalSentences - 1) {
      setG4Index((prev) => prev + 1);
    } else {
      onFinishGame(localScore, localCorrect);
    }
  };

  if (!currentG4Task || loading) {
    return (
      <Card style={{ borderRadius: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin tip="Đang tạo câu từ AI..." />
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
          <OrderedListOutlined style={{ color: "#722ed1", marginRight: 8 }} />
          Sắp Xếp Câu Hoàn Chỉnh ({g4Index + 1} / {totalSentences})
        </Title>
        
        {/* 🆕 Nút làm mới câu */}
        <Button 
          size="small" 
          icon={<ReloadOutlined />} 
          onClick={handleRefreshSentences}
          style={{ marginTop: 8 }}
          disabled={g4Checked}
        >
          Tạo câu mới
        </Button>

        <div style={{ marginTop: 10, padding: "10px 20px", background: "#f0f2f5", borderRadius: 12, display: "inline-block" }}>
          <Text style={{ fontSize: 15 }}>
            Ý nghĩa: <strong style={{ color: "#1f1f1f" }}>"{currentG4Task.vi}"</strong>
          </Text>
        </div>
      </div>

      {/* VÙNG THẢ TỪ */}
      <div style={{
        minHeight: 96, padding: "16px", background: "#ffffff", borderRadius: 16,
        border: g4Checked ? (g4IsCorrect ? "2px solid #52c41a" : "2px solid #ff4d4f") : "2px dashed #91caff",
        display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center",
        gap: 10, marginBottom: 16, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.02)",
      }}>
        {g4UserSeq.length > 0 ? (
          g4UserSeq.map((w, idx) => (
            <Button key={`g4u-${idx}`} type="primary" disabled={g4Checked}
              onClick={() => handleRemoveG4Word(w, idx)}
              style={{
                height: "auto", padding: "8px 16px", borderRadius: 10,
                display: "flex", flexDirection: "column", alignItems: "center",
                background: "#1677ff", borderColor: "#1677ff",
                boxShadow: "0 4px 10px rgba(22,119,255,0.25)",
              }}>
              <span style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.1 }}>{w.py}</span>
              <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginTop: 2 }}>{w.zh}</span>
            </Button>
          ))
        ) : (
          <Text type="secondary" style={{ fontSize: 14 }}>
            👉 Bấm các khối từ bên dưới để sắp xếp...
          </Text>
        )}
      </div>

      {g4UserSeq.length > 0 && !g4Checked && (
        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <Button size="small" icon={<ReloadOutlined />} onClick={handleResetCurrentSentence} style={{ borderRadius: 6 }}>
            Làm lại từ đầu
          </Button>
        </div>
      )}

      {/* KHO TỪ */}
      <div style={{
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12,
        padding: "12px", background: "#fafafa", borderRadius: 14, border: "1px solid #f0f0f0", marginBottom: 24,
      }}>
        {g4Available.map((w, idx) => (
          <Button key={`g4a-${idx}`} disabled={g4Checked} onClick={() => handlePickG4Word(w, idx)}
            style={{
              height: "auto", padding: "8px 18px", borderRadius: 10,
              background: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center",
              border: "1.5px solid #d9d9d9", boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              cursor: "pointer",
            }}>
            <span style={{ fontSize: 11, color: "#d4380d", fontWeight: 700 }}>{w.py}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#262626", marginTop: 2 }}>{w.zh}</span>
          </Button>
        ))}
      </div>

      {/* NÚT ĐIỀU KHIỂN */}
      <div style={{ textAlign: "center" }}>
        {!g4Checked ? (
          <Button type="primary" size="large" disabled={g4UserSeq.length === 0} onClick={handleCheckG4}
            style={{ minWidth: 180, height: 48, borderRadius: 10, fontSize: 16, fontWeight: 700 }}>
            Kiểm tra câu
          </Button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!g4IsCorrect && (
              <div style={{ background: "#fff2f0", padding: "12px 18px", borderRadius: 12, border: "1px solid #ffccc7", textAlign: "left" }}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 2 }}>Đáp án chuẩn:</Text>
                <div style={{ color: "#d4380d", fontSize: 13, marginBottom: 2, fontWeight: 600 }}>{currentG4Task.full_pinyin}</div>
                <Text strong style={{ fontSize: 22, color: "#1677ff" }}>{currentG4Task.full_sentence}</Text>
              </div>
            )}

            <Space size="middle" style={{ justifyContent: "center" }}>
              <Button icon={<SoundOutlined />} size="large"
                onClick={() => playAudio(currentG4Task.full_sentence)}
                style={{ borderRadius: 10, height: 46 }}>
                🔊 Nghe phát âm
              </Button>
              <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={handleNextG4}
                style={{ borderRadius: 10, height: 46, fontWeight: 700 }}>
                {g4Index < totalSentences - 1 ? "Câu tiếp theo" : "Xem tổng kết"}
              </Button>
            </Space>
          </div>
        )}
      </div>
    </Card>
  );
}