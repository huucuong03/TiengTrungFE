"use client";

import {
  Card,
  Typography,
  Button,
  Tag,
  Progress,
  Result,
  Popconfirm,
} from "antd";
import {
  SoundOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  CustomerServiceOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { QuestionItem, ListeningMode, QuizHistoryItem } from "./types";

const { Title, Text, Paragraph } = Typography;

interface PinyinQuizProps {
  listeningMode: ListeningMode;
  isGameRunning: boolean;
  isQuizFinished: boolean;
  currentQ?: QuestionItem;
  quizIndex: number;
  totalQuestions: number;
  timeLeft: number;
  explanationTimeLeft: number;
  quizChecked: boolean;
  quizSelected: string;
  correctCount: number;
  quizHistory: QuizHistoryItem[];
  startQuiz: (mode: ListeningMode) => void;
  playAudioTwice: (base: string, tone: number) => void;
  handlePickOption: (opt: string) => void;
  handleEarlyExit: () => void;
  setIsQuizFinished: (val: boolean) => void;
  setIsGameRunning: (val: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export default function PinyinQuiz({
  listeningMode,
  isGameRunning,
  isQuizFinished,
  currentQ,
  quizIndex,
  totalQuestions,
  timeLeft,
  explanationTimeLeft,
  quizChecked,
  quizSelected,
  correctCount,
  quizHistory,
  startQuiz,
  playAudioTwice,
  handlePickOption,
  handleEarlyExit,
  setIsQuizFinished,
  setIsGameRunning,
  setActiveTab,
}: PinyinQuizProps) {
  // 1. MÀN HÌNH CHỌN CHẾ ĐỘ (Đã lược bỏ 2 thẻ cũ, chỉ giữ Hỗn Hợp từ có nghĩa)
  if (!isGameRunning && !isQuizFinished) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Card
          style={{
            borderRadius: 16,
            textAlign: "center",
            background: "linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)",
            border: "1px solid #adc6ff",
            marginBottom: 20,
          }}
        >
          <CustomerServiceOutlined style={{ fontSize: 44, color: "#1677ff", marginBottom: 12 }} />
          <Title level={3} style={{ margin: "0 0 8px 0", fontWeight: 800 }}>
            Luyện Phản Xạ Nghe 13s & Giải Nghĩa 5s
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 15, maxWidth: 580, margin: "0 auto" }}>
            Mỗi câu máy tự động đọc <strong>2 lần (cách 2 giây)</strong>. Bạn có{" "}
            <strong>13 giây suy nghĩ</strong>, chọn đáp án xong hệ thống sẽ{" "}
            <strong>dừng 5 giây giải thích</strong> mặt chữ Hán và nghĩa tiếng Việt trước khi chuyển câu!
          </Paragraph>
        </Card>

        {/* Thẻ Thử Thách Hỗn Hợp DUY NHẤT */}
        <Card
          hoverable
          onClick={() => startQuiz("mixed")}
          style={{
            borderRadius: 16,
            border: "1.5px solid #91caff",
            background: "#f0f5ff",
            padding: "12px 8px",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(22,119,255,0.08)",
          }}
        >
          <Tag color="blue" style={{ fontWeight: 600, padding: "2px 10px", fontSize: 13 }}>
            THỬ THÁCH (20 CÂU)
          </Tag>
          <Title level={3} style={{ margin: "12px 0 6px 0", color: "#0958d9" }}>
            🌪️ Thử Thách Từ Vựng Hỗn Hợp
          </Title>
          <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 20 }}>
            Luyện nghe các từ vựng Hán ngữ thực tế có đầy đủ Chữ Hán và Nghĩa. Thử thách phản xạ nhận diện phiên âm chuẩn.
          </Text>

          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            style={{
              borderRadius: 10,
              height: 48,
              paddingLeft: 32,
              paddingRight: 32,
              fontSize: 16,
              fontWeight: 700,
              background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
            }}
          >
            Bắt đầu luyện tập ngay
          </Button>
        </Card>
      </div>
    );
  }

  // 2. MÀN HÌNH ĐANG LÀM BÀI
  if (isGameRunning && currentQ) {
    return (
      <Card style={{ borderRadius: 16, textAlign: "center", padding: "24px 20px", maxWidth: 840, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Tag color="blue" style={{ fontSize: 13, padding: "3px 10px", borderRadius: 12 }}>
            🌪️ Hỗn hợp (Từ có nghĩa)
          </Tag>

          {!quizChecked ? (
            <Tag color={timeLeft <= 3 ? "error" : "processing"} icon={<ClockCircleOutlined />} style={{ fontSize: 14, fontWeight: "bold", padding: "3px 12px", borderRadius: 12 }}>
              ⏱️ {timeLeft}s
            </Tag>
          ) : (
            <Tag color="purple" icon={<InfoCircleOutlined />} style={{ fontSize: 14, fontWeight: "bold", padding: "3px 12px", borderRadius: 12 }}>
              📖 {explanationTimeLeft}s
            </Tag>
          )}

          <Popconfirm
            title="Kết thúc bài luyện tập sớm?"
            description="Hệ thống sẽ tính điểm theo số câu bạn đã làm."
            okText="Kết thúc & Tính điểm"
            cancelText="Làm tiếp"
            onConfirm={handleEarlyExit}
          >
            <Button danger size="small" icon={<StopOutlined />} style={{ borderRadius: 8 }}>
              Kết thúc sớm
            </Button>
          </Popconfirm>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Tiến độ bài thi</Text>
            <Text strong style={{ fontSize: 12 }}>Câu {quizIndex + 1} / {totalQuestions}</Text>
          </div>
          <Progress percent={Math.round(((quizIndex + 1) / totalQuestions) * 100)} showInfo={false} strokeColor="#1677ff" />
        </div>

        {/* Hiển thị số câu đúng/sai */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }}>
          <Text>
            ✅ Đúng: <strong style={{ color: "#52c41a" }}>{correctCount}</strong>
          </Text>
          <Text>
            ❌ Sai: <strong style={{ color: "#ff4d4f" }}>{quizHistory.length - correctCount}</strong>
          </Text>
        </div>

        <div style={{ margin: "20px 0" }}>
          <Button
            type="primary"
            shape="circle"
            icon={<SoundOutlined style={{ fontSize: 36 }} />}
            onClick={() => playAudioTwice(currentQ.base, currentQ.tone)}
            style={{
              width: 88,
              height: 88,
              background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
              boxShadow: "0 8px 24px rgba(22,119,255,0.35)",
              border: "none",
            }}
          />
          <div style={{ marginTop: 10, fontSize: 13, color: "#8c8c8c" }}>
            Máy phát 2 lần (cách 2 giây)...
          </div>
        </div>

        {quizChecked && (
          <div style={{ background: "#f6ffed", padding: "16px 20px", borderRadius: 12, border: "1.5px solid #b7eb8f", marginBottom: 20 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#1677ff", marginBottom: 4 }}>
              {currentQ.target}
            </div>

            {/* Mô phỏng hướng đi của thanh điệu */}
            <Tag color="blue" style={{ fontSize: 13, padding: "2px 10px", marginBottom: 8 }}>
              {currentQ.tone === 1 && "Thanh 1: Cao, bằng phẳng (5-5)"}
              {currentQ.tone === 2 && "Thanh 2: Bắt đầu trung bình, tăng cao (3-5)"}
              {currentQ.tone === 3 && "Thanh 3: Xuống thấp rồi lên nhẹ (2-1-4)"}
              {currentQ.tone === 4 && "Thanh 4: Từ cao nhất giật mạnh xuống (5-1)"}
            </Tag>

            {/* Hiển thị chữ Hán và Nghĩa thực tế */}
            {currentQ.hanzi && (
              <div style={{ marginTop: 6, color: "#262626", fontSize: 15 }}>
                Chữ Hán: <strong style={{ fontSize: 18, color: "#d4b106" }}>{currentQ.hanzi}</strong>
                {currentQ.meaning && <span> — Nghĩa: <strong>{currentQ.meaning}</strong></span>}
              </div>
            )}
          </div>
        )}

        {/* Thông báo hết giờ */}
        {quizChecked && quizSelected === "Hết giờ" && (
          <div style={{ background: "#fff1f0", padding: "12px 20px", borderRadius: 12, border: "1.5px solid #ffa39e", marginBottom: 20 }}>
            <Text type="danger" style={{ fontSize: 16 }}>
              ⏰ Hết giờ! Đáp án đúng là: <strong>{currentQ.target}</strong>
            </Text>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "16px 0", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          {currentQ.options.map((opt: string) => {
            let isCorrectOpt = false;
            let isWrongSelected = false;
            let isSelected = false;

            if (quizChecked) {
              if (opt === currentQ.target) isCorrectOpt = true;
              if (opt === quizSelected && opt !== currentQ.target) isWrongSelected = true;
              if (opt === quizSelected) isSelected = true;
            }

            return (
              <Button
                key={opt}
                size="large"
                disabled={quizChecked}
                onClick={() => handlePickOption(opt)}
                style={{
                  height: 60,
                  fontSize: 22,
                  fontWeight: 700,
                  borderRadius: 12,
                  background: isCorrectOpt ? "#52c41a" : isWrongSelected ? "#ff4d4f" : undefined,
                  borderColor: isCorrectOpt ? "#52c41a" : isWrongSelected ? "#ff4d4f" : undefined,
                  color: isCorrectOpt || isWrongSelected ? "#ffffff" : undefined,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  opacity: quizChecked && !isCorrectOpt && !isSelected ? 0.5 : 1,
                }}
              >
                {opt}
                {isCorrectOpt && <CheckCircleOutlined style={{ marginLeft: 8 }} />}
                {isWrongSelected && <CloseCircleOutlined style={{ marginLeft: 8 }} />}
              </Button>
            );
          })}
        </div>
      </Card>
    );
  }

  // 3. MÀN HÌNH KẾT QUẢ
  const attemptedCount = quizHistory.length || 1;
  const scorePercent = Math.round((correctCount / attemptedCount) * 100);

  return (
    <Card style={{ borderRadius: 16, padding: "24px 16px", maxWidth: 840, margin: "0 auto" }}>
      <Result
        status={correctCount / attemptedCount >= 0.7 ? "success" : "info"}
        title={
          <span style={{ fontWeight: 800 }}>
            {quizHistory.length === 0
              ? "Đã hủy phiên luyện tập"
              : correctCount / attemptedCount >= 0.8
              ? "🎉 Xuất Sắc! Phản Xạ Thính Giác Tiếng Trung Cực Nhạy!"
              : correctCount / attemptedCount >= 0.5
              ? "👍 Khá Tốt! Cần Luyện Thêm Một Chút!"
              : "💪 Cần Ôn Lại Bảng Ngữ Âm!"}
          </span>
        }
        subTitle={
          quizHistory.length > 0 ? (
            <div style={{ fontSize: 16, marginTop: 8 }}>
              Điểm số: <strong style={{ color: "#fa8c16", fontSize: 22 }}>{scorePercent} / 100</strong> (Đúng {correctCount} / {quizHistory.length} câu đã làm)
            </div>
          ) : null
        }
        extra={[
          <Button type="primary" key="retry" size="large" icon={<ReloadOutlined />} onClick={() => startQuiz("mixed")} style={{ borderRadius: 8 }}>
            Luyện tập lại (20 câu mới)
          </Button>,
          <Button key="menu" size="large" onClick={() => { setIsQuizFinished(false); setIsGameRunning(false); }} style={{ borderRadius: 8 }}>
            Màn hình chính
          </Button>,
          <Button key="table" size="large" onClick={() => setActiveTab("table")}>
            Xem Bảng Pinyin
          </Button>,
        ]}
      />
    </Card>
  );
}