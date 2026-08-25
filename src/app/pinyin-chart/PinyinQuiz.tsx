"use client";

import {
  Card,
  Typography,
  Button,
  Tag,
  Progress,
  Result,
  Row,
  Col,
  Popconfirm,
  Space,
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
  if (!isGameRunning && !isQuizFinished) {
    return (
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
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
            <strong>dừng 5 giây giải thích</strong> mặt chữ và nghĩa trước khi chuyển câu!
          </Paragraph>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => startQuiz("tones")}
              style={{
                borderRadius: 14,
                height: "100%",
                border: "1px solid #ffe58f",
                background: "#fffbe6",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <Tag color="orange" style={{ fontWeight: 600 }}>CƠ BẢN (15 CÂU)</Tag>
                <Title level={4} style={{ margin: "8px 0 4px 0" }}>🎯 4 Thanh Điệu</Title>
                <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                  Cố định âm vị, phân biệt 4 dấu thanh (mā, má, mǎ, mà).
                </Text>
              </div>
              <Button type="primary" block icon={<PlayCircleOutlined />} style={{ marginTop: 16, borderRadius: 8, background: "#fa8c16" }}>
                Bắt đầu ngay
              </Button>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => startQuiz("syllables")}
              style={{
                borderRadius: 14,
                height: "100%",
                border: "1px solid #b7eb8f",
                background: "#f6ffed",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <Tag color="green" style={{ fontWeight: 600 }}>TRUNG CẤP (15 CÂU)</Tag>
                <Title level={4} style={{ margin: "8px 0 4px 0" }}>⚡ Âm Ghép</Title>
                <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                  Nghe và chọn đúng âm tiết trong các âm tương tự (bā, pā, mā, dā).
                </Text>
              </div>
              <Button type="primary" block icon={<PlayCircleOutlined />} style={{ marginTop: 16, borderRadius: 8, background: "#52c41a" }}>
                Bắt đầu ngay
              </Button>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => startQuiz("mixed")}
              style={{
                borderRadius: 14,
                height: "100%",
                border: "1px solid #adc6ff",
                background: "#f0f5ff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <Tag color="blue" style={{ fontWeight: 600 }}>THỬ THÁCH (15 CÂU)</Tag>
                <Title level={4} style={{ margin: "8px 0 4px 0" }}>🌪️ Hỗn Hợp</Title>
                <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                  Ngẫu nhiên cả âm vị và dấu thanh, thử thách phản xạ tối đa.
                </Text>
              </div>
              <Button type="primary" block icon={<PlayCircleOutlined />} style={{ marginTop: 16, borderRadius: 8 }}>
                Bắt đầu ngay
              </Button>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  if (isGameRunning && currentQ) {
    return (
      <Card style={{ borderRadius: 16, textAlign: "center", padding: "24px 20px", maxWidth: 840, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Tag color="blue" style={{ fontSize: 13, padding: "3px 10px", borderRadius: 12 }}>
            {listeningMode === "tones" ? "🎯 Phân biệt 4 thanh" : listeningMode === "syllables" ? "⚡ Phản xạ âm ghép" : "🌪️ Hỗn hợp"}
          </Tag>

          {!quizChecked ? (
            <Tag color={timeLeft <= 3 ? "error" : "processing"} icon={<ClockCircleOutlined />} style={{ fontSize: 14, fontWeight: "bold", padding: "3px 12px", borderRadius: 12 }}>
              Thời gian suy nghĩ: {timeLeft}s
            </Tag>
          ) : (
            <Tag color="purple" icon={<InfoCircleOutlined />} style={{ fontSize: 14, fontWeight: "bold", padding: "3px 12px", borderRadius: 12 }}>
              Chuyển câu sau: {explanationTimeLeft}s
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
          <div style={{ background: "#f6ffed", padding: "12px 20px", borderRadius: 12, border: "1.5px solid #b7eb8f", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {currentQ.hanzi && (
                <Text strong style={{ fontSize: 36, color: "#1677ff", lineHeight: 1 }}>
                  {currentQ.hanzi}
                </Text>
              )}
              <div style={{ textAlign: "left" }}>
                <div>
                  <Text code style={{ fontSize: 20, color: "#d4380d", fontWeight: 700 }}>
                    {currentQ.target}
                  </Text>
                </div>
                {currentQ.meaning && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      Nghĩa: <strong style={{ color: "#262626" }}>{currentQ.meaning}</strong>
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "16px 0", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          {currentQ.options.map((opt: string) => {
            let isCorrectOpt = false;
            let isWrongSelected = false;

            if (quizChecked) {
              if (opt === currentQ.target) isCorrectOpt = true;
              else if (opt === quizSelected) isWrongSelected = true;
            }

            return (
              <Button
                key={opt}
                size="large"
                danger={isWrongSelected}
                disabled={quizChecked}
                onClick={() => handlePickOption(opt)}
                style={{
                  height: 60,
                  fontSize: 22,
                  fontWeight: 700,
                  borderRadius: 12,
                  background: isCorrectOpt ? "#52c41a" : undefined,
                  borderColor: isCorrectOpt ? "#52c41a" : undefined,
                  color: isCorrectOpt ? "#ffffff" : undefined,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {opt}
              </Button>
            );
          })}
        </div>
      </Card>
    );
  }

  // Kết quả Quiz
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
          <Button type="primary" key="retry" size="large" icon={<ReloadOutlined />} onClick={() => startQuiz(listeningMode)} style={{ borderRadius: 8 }}>
            Luyện tập lại (15 câu mới)
          </Button>,
          <Button key="menu" size="large" onClick={() => { setIsQuizFinished(false); setIsGameRunning(false); }} style={{ borderRadius: 8 }}>
            Chọn chế độ khác
          </Button>,
          <Button key="table" size="large" onClick={() => setActiveTab("table")}>
            Xem Bảng Pinyin
          </Button>,
        ]}
      />
    </Card>
  );
}