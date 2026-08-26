"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Typography,
  Button,
  Spin,
  Progress,
  Row,
  Col,
  Statistic,
  Result,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface RadicalQuestion {
  id: number;
  radical: string;    // Chữ Hán của bộ thủ (VD: 木, 水, 手)
  meaning: string;    // Nghĩa Hán Việt hoặc Tiếng Việt (VD: Mộc, Thủy, Thủ)
  options: string[];  // Danh sách 4 đáp án đã xáo trộn
}

// Thuật toán xáo trộn mảng ngẫu nhiên (Fisher-Yates Shuffle)
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function PracticeRadicalsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<RadicalQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    fetchRadicalsFromBE();
  }, []);

  // Lấy dữ liệu trực tiếp từ Backend
  const fetchRadicalsFromBE = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("https://tiengtrung-7hto.onrender.com/api/radicals", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const result = await res.json();
        
        let rawList: any[] = [];
        if (Array.isArray(result)) {
          rawList = result;
        } else if (Array.isArray(result.data)) {
          rawList = result.data;
        } else if (result.data && Array.isArray(result.data.data)) {
          rawList = result.data.data;
        }

        const normalizedList = rawList
          .map(normalizeRadical)
          .filter((item) => item.radical && item.meaning);

        if (normalizedList.length > 0) {
          const quizQuestions = buildQuestions(normalizedList);
          setQuestions(quizQuestions);
        } else {
          message.warning("Dữ liệu từ máy chủ rỗng. Đang dùng dữ liệu dự phòng.");
          setQuestions(buildQuestions(getFallbackRadicals()));
        }
      } else {
        message.error("Không thể kết nối đến máy chủ. Đang dùng dữ liệu dự phòng.");
        setQuestions(buildQuestions(getFallbackRadicals()));
      }
    } catch (error) {
      console.error("Lỗi fetch bộ thủ từ BE:", error);
      setQuestions(buildQuestions(getFallbackRadicals()));
    } finally {
      setLoading(false);
    }
  };

  // Chuẩn hóa dữ liệu tên field từ BE
  const normalizeRadical = (item: any) => {
    const radical =
      item.character ||
      item.radical ||
      item.chinese ||
      item.word ||
      item.symbol ||
      "";

    const meaning =
      item.meaning ||
      item.hanviet ||
      item.pinyin ||
      item.vietnamese ||
      item.name ||
      "";

    return { radical, meaning };
  };

  // Tạo bộ câu hỏi ngẫu nhiên
  const buildQuestions = (radicals: { radical: string; meaning: string }[]): RadicalQuestion[] => {
    const shuffledRadicals = shuffleArray(radicals);
    const selectedRadicals = shuffledRadicals.slice(0, 15);

    return selectedRadicals.map((item, index) => {
      const otherMeanings = radicals
        .filter((r) => r.radical !== item.radical && r.meaning)
        .map((r) => r.meaning);

      const uniqueDistractors = Array.from(new Set(shuffleArray(otherMeanings))).slice(0, 3);
      const options = shuffleArray([item.meaning, ...uniqueDistractors]);

      return {
        id: index + 1,
        radical: item.radical,
        meaning: item.meaning,
        options: options,
      };
    });
  };

  const getFallbackRadicals = () => [
    { radical: "木", meaning: "Mộc" },
    { radical: "水", meaning: "Thủy" },
    { radical: "火", meaning: "Hỏa" },
    { radical: "金", meaning: "Kim" },
    { radical: "土", meaning: "Thổ" },
    { radical: "人", meaning: "Nhân" },
    { radical: "心", meaning: "Tâm" },
    { radical: "口", meaning: "Khẩu" },
    { radical: "目", meaning: "Mục" },
    { radical: "手", meaning: "Thủ" },
    { radical: "日", meaning: "Nhật" },
    { radical: "月", meaning: "Nguyệt" },
    { radical: "女", meaning: "Nữ" },
    { radical: "子", meaning: "Tử" },
    { radical: "山", meaning: "Sơn" },
  ];

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const masteryPercentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const handleSelectOption = (option: string) => {
    if (isCorrect !== null) return;
    setSelectedOption(option);

    const correct = option === currentQuestion.meaning;
    setIsCorrect(correct);
    setTotalAnswered((prev) => prev + 1);

    if (correct) {
      setScore((prev) => prev + 20);
      setCorrectCount((prev) => prev + 1);
      message.success("✅ Chính xác! +20 điểm");
    } else {
      message.error(`❌ Sai rồi! Đáp án đúng là: ${currentQuestion.meaning}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setScore(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    setIsFinished(false);
    fetchRadicalsFromBE();
  };

  // Chuyển hướng sang trang chi tiết /radicals/[name]
  const handleViewDetail = (name: string) => {
    router.push(`/radicals/${encodeURIComponent(name)}`);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spin size="large" tip="Đang kết nối BE và tải bộ thủ ngẫu nhiên..." />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card style={{ textAlign: "center", padding: 40, borderRadius: 16 }}>
        <Title level={3}>📚 Chưa nhận được bộ thủ từ Backend</Title>
        <Text type="secondary">Vui lòng kiểm tra lại kết nối mạng hoặc Token đăng nhập.</Text>
        <br />
        <Button type="primary" onClick={handleRestart} style={{ marginTop: 16 }}>
          Tải lại dữ liệu
        </Button>
      </Card>
    );
  }

  if (isFinished) {
    const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>
        <Result
          status={finalScore >= 70 ? "success" : "info"}
          title={
            <span style={{ fontWeight: 800 }}>
              {finalScore >= 80
                ? "🎉 Hoàn thành xuất sắc!"
                : finalScore >= 60
                ? "👍 Bạn làm khá tốt!"
                : "💪 Hãy cố gắng luyện tập thêm nhé!"}
            </span>
          }
          subTitle={
            <div style={{ fontSize: 16, marginTop: 8 }}>
              Điểm số: <strong style={{ color: "#fa8c16", fontSize: 24 }}>{score}</strong> điểm
              <br />
              Đúng {correctCount} / {totalQuestions} câu
            </div>
          }
          extra={[
            <Button type="primary" key="retry" size="large" icon={<ReloadOutlined />} onClick={handleRestart}>
              Tải bài tập mới
            </Button>,
            <Button key="back" size="large" onClick={() => router.push("/radicals")}>
              Quay lại danh sách
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px" }}>
      <Title level={2} style={{ textAlign: "center", fontWeight: 800 }}>
        🧩 Ôn Luyện Bộ Thủ Hán Tự
      </Title>
      <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
        Chọn ý nghĩa / Hán Việt đúng cho bộ thủ dưới đây
      </Text>

      {/* Thông số bài làm */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, textAlign: "center" }}>
            <Statistic title="Câu hỏi" value={`${currentIndex + 1}/${totalQuestions}`} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, textAlign: "center" }}>
            <Statistic title="Điểm" value={score} prefix={<TrophyOutlined style={{ color: "#faad14" }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, textAlign: "center" }}>
            <Statistic title="Số câu đúng" value={correctCount} prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, textAlign: "center" }}>
            <Statistic title="Tỷ lệ đúng" value={masteryPercentage} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Progress percent={Math.round(progress)} showInfo={false} strokeColor="#1677ff" />

      {/* Thẻ câu hỏi chính */}
      <Card style={{ borderRadius: 16, marginTop: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          {/* Hiển thị Bộ Thủ */}
          <div style={{ fontSize: 110, fontWeight: 700, color: "#1677ff", lineHeight: 1.1 }}>
            {currentQuestion.radical}
          </div>
        </div>

        {/* Các nút chọn đáp án */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          {currentQuestion.options.map((option) => {
            let isCorrectOption = false;
            let isWrongSelected = false;

            if (isCorrect !== null) {
              if (option === currentQuestion.meaning) isCorrectOption = true;
              if (option === selectedOption && option !== currentQuestion.meaning) isWrongSelected = true;
            }

            return (
              <Button
                key={option}
                size="large"
                disabled={isCorrect !== null}
                onClick={() => handleSelectOption(option)}
                style={{
                  height: 56,
                  fontSize: 18,
                  fontWeight: 700,
                  borderRadius: 12,
                  background: isCorrectOption ? "#52c41a" : isWrongSelected ? "#ff4d4f" : "#f5f5f5",
                  borderColor: isCorrectOption ? "#52c41a" : isWrongSelected ? "#ff4d4f" : "#d9d9d9",
                  color: isCorrectOption || isWrongSelected ? "#ffffff" : "#262626",
                }}
              >
                {option}
                {isCorrectOption && <CheckCircleOutlined style={{ marginLeft: 8 }} />}
                {isWrongSelected && <CloseCircleOutlined style={{ marginLeft: 8 }} />}
              </Button>
            );
          })}
        </div>

        {/* Thông báo kết quả câu hỏi + Nút Xem Chi Tiết */}
        {isCorrect !== null && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: isCorrect ? "#f6ffed" : "#fff2f0",
                border: `1px solid ${isCorrect ? "#b7eb8f" : "#ffccc7"}`,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 16 }}>
                {isCorrect ? (
                  <span style={{ color: "#52c41a" }}>
                    ✅ Chính xác! Bộ <strong>{currentQuestion.radical}</strong> có nghĩa là: <strong>{currentQuestion.meaning}</strong>
                  </span>
                ) : (
                  <span style={{ color: "#ff4d4f" }}>
                    ❌ Tiếc quá! Đáp án đúng phải là: <strong>{currentQuestion.meaning}</strong>
                  </span>
                )}
              </Text>
            </div>

            {/* Các nút điều hướng sau khi trả lời */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <Button
                size="large"
                icon={<InfoCircleOutlined />}
                onClick={() => handleViewDetail(currentQuestion.radical)}
                style={{ borderRadius: 10, height: 48, fontWeight: 600 }}
              >
                Chi tiết bộ thủ
              </Button>

              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={handleNext}
                style={{ borderRadius: 10, height: 48, fontWeight: 700 }}
              >
                {currentIndex < totalQuestions - 1 ? "Câu tiếp theo" : "Xem kết quả chung cuộc"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Nút hành động bổ sung */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Button type="link" onClick={handleRestart} icon={<ReloadOutlined />}>
          Tải lại bộ câu hỏi ngẫu nhiên mới từ BE
        </Button>
      </div>
    </div>
  );
}