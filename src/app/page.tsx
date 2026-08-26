"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Col,
  Row,
  Typography,
  Button,
  Statistic,
  Space,
  Spin,
  Progress,
} from "antd";
import {
  BookOutlined,
  TranslationOutlined,
  ReadOutlined,
  TrophyOutlined,
  CustomerServiceOutlined,
  AppstoreOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

interface UserStats {
  totalWords: number;
  masteredWords: number;
  totalScore: number;
  quizzesTaken: number;
  hanziMastered: number;
  pinyinMastered: number;
  meaningMastered: number;
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [stats, setStats] = useState<UserStats>({
    totalWords: 0,
    masteredWords: 0,
    totalScore: 0,
    quizzesTaken: 0,
    hanziMastered: 0,
    pinyinMastered: 0,
    meaningMastered: 0,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("https://tiengtrung-7hto.onrender.com/api/notebook/words", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetch("https://tiengtrung-7hto.onrender.com/api/notebook/quiz/daily-stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([wordsData, statsData]) => {
        const words = Array.isArray(wordsData) ? wordsData : wordsData?.items || [];
        
        const totalWords = words.length;
        const masteredWords = words.filter(
          (w: any) => (w.proficiency || 0) >= 80
        ).length;

        // ✅ Lấy 3 kỹ năng từ stats
        const hanziMastered = statsData?.mastery?.hanzi_mastered || 0;
        const pinyinMastered = statsData?.mastery?.pinyin_mastered || 0;
        const meaningMastered = statsData?.mastery?.meaning_mastered || 0;

        const totalScore = statsData?.all_time?.avg_score 
          ? statsData.all_time.avg_score * (statsData.all_time.total_completed || 0) 
          : 0;
        const quizzesTaken = statsData?.all_time?.total_completed || 0;

        setStats({
          totalWords,
          masteredWords,
          totalScore: Math.round(totalScore),
          quizzesTaken,
          hanziMastered,
          pinyinMastered,
          meaningMastered,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const features = [
    {
      title: "Bảng Ngữ Âm Pinyin",
      description: "Ghép âm, luyện phát âm chuẩn 4 thanh điệu cùng âm vị bản xứ.",
      icon: <CustomerServiceOutlined style={{ color: "#1677ff" }} />,
      path: "/pinyin-chart",
      tag: "Căn bản",
    },
    {
      title: "Tra Cứu & Chiết Tự",
      description: "Tra nghĩa 2 chiều, phân tích từng bộ phận và mẹo nhớ chữ Hán qua AI.",
      icon: <BookOutlined style={{ color: "#52c41a" }} />,
      path: "/words",
      tag: "Tra cứu",
    },
    {
      title: "Sổ Từ & Luyện Quiz",
      description: "Quản lý từ vựng cá nhân và làm bài kiểm tra ôn tập củng cố trí nhớ.",
      icon: <ReadOutlined style={{ color: "#fa8c16" }} />,
      path: "/practice",
      tag: "Cá nhân",
    },
    {
      title: "Dịch Đoạn Văn",
      description: "Dịch văn bản tiếng Trung với pinyin và giải nghĩa ngữ pháp từng câu.",
      icon: <TranslationOutlined style={{ color: "#722ed1" }} />,
      path: "/translate-text",
      tag: "Dịch thuật",
    },
    {
      title: "214 Bộ Thủ Hán Tự",
      description: "Học nguồn gốc, ý nghĩa và cách kết hợp của các bộ thủ thông dụng.",
      icon: <AppstoreOutlined style={{ color: "#13c2c2" }} />,
      path: "/radicals",
      tag: "Kiến thức",
    },
  ];

  const masteryPercentage =
    stats.totalWords > 0
      ? Math.round((stats.masteredWords / stats.totalWords) * 100)
      : 0;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Tiêu đề chào mừng */}
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
          🇨🇳 Xin chào{username ? `, ${username}` : ""}!
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 15, marginTop: 4 }}>
          Chào mừng bạn quay lại hệ thống học tiếng Trung tương tác.
        </Paragraph>
      </div>

      {/* Bảng thống kê học tập */}
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 32,
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <FireOutlined style={{ fontSize: 20, color: "#fa541c" }} />
          <Text strong style={{ fontSize: 16 }}>Tiến độ học tập của bạn</Text>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Spin />
          </div>
        ) : (
          <>
            {/* Hàng 1: 4 chỉ số chính */}
            <Row gutter={[24, 24]}>
              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ background: "#f0f5ff", borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: "#595959" }}>Từ đã lưu</Text>}
                    value={stats.totalWords}
                    suffix="từ"
                    prefix={<BookOutlined style={{ color: "#1677ff" }} />}
                    valueStyle={{ fontWeight: 800, color: "#1677ff" }}
                  />
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ background: "#fffbe6", borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: "#595959" }}>Tổng điểm</Text>}
                    value={stats.totalScore}
                    prefix={<TrophyOutlined style={{ color: "#faad14" }} />}
                    valueStyle={{ fontWeight: 800, color: "#d48806" }}
                  />
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ background: "#f9f0ff", borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: "#595959" }}>Lượt làm Quiz</Text>}
                    value={stats.quizzesTaken}
                    suffix="lượt"
                    prefix={<ReadOutlined style={{ color: "#722ed1" }} />}
                    valueStyle={{ fontWeight: 800, color: "#722ed1" }}
                  />
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ background: "#f6ffed", borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: "#595959" }}>Từ thành thạo</Text>}
                    value={stats.masteredWords}
                    suffix="từ"
                    prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                    valueStyle={{ fontWeight: 800, color: "#52c41a" }}
                  />
                </Card>
              </Col>
            </Row>

            {/* ✅ Hàng 2: 3 kỹ năng thành thạo */}
            <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
              <Col xs={24} sm={8}>
                <Card bordered={false} style={{ background: "#f0f5ff", borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: "#1d39c4" }}>🀄 Nhận diện chữ</Text>}
                    value={stats.hanziMastered}
                    suffix="từ"
                    valueStyle={{ fontWeight: 800, color: "#2f54eb" }}
                  />
                  <Progress 
                    percent={stats.totalWords > 0 ? Math.round((stats.hanziMastered / stats.totalWords) * 100) : 0} 
                    size="small" 
                    strokeColor="#1677ff"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card bordered={false} style={{ background: "#f6ffed", borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: "#389e0d" }}>🔤 Phát âm</Text>}
                    value={stats.pinyinMastered}
                    suffix="từ"
                    valueStyle={{ fontWeight: 800, color: "#52c41a" }}
                  />
                  <Progress 
                    percent={stats.totalWords > 0 ? Math.round((stats.pinyinMastered / stats.totalWords) * 100) : 0} 
                    size="small" 
                    strokeColor="#52c41a"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card bordered={false} style={{ background: "#fffbe6", borderRadius: 12 }}>
                  <Statistic
                    title={<Text style={{ color: "#d46b08" }}>📖 Hiểu nghĩa</Text>}
                    value={stats.meaningMastered}
                    suffix="từ"
                    valueStyle={{ fontWeight: 800, color: "#fa8c16" }}
                  />
                  <Progress 
                    percent={stats.totalWords > 0 ? Math.round((stats.meaningMastered / stats.totalWords) * 100) : 0} 
                    size="small" 
                    strokeColor="#faad14"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Tỷ lệ ghi nhớ */}
            <Row style={{ marginTop: 16 }}>
              <Col xs={24}>
                <div
                  style={{
                    background: "#fafafa",
                    padding: "16px 20px",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <Text strong>Tỷ lệ ghi nhớ từ vựng:</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {stats.masteredWords}/{stats.totalWords} từ đạt độ thành thạo cao
                    </Text>
                  </div>
                  <div style={{ width: 240 }}>
                    <Progress percent={masteryPercentage} status="active" />
                  </div>
                </div>
              </Col>
            </Row>
          </>
        )}
      </Card>

      {/* Danh sách các tính năng */}
      <Title level={4} style={{ marginBottom: 16 }}>
        Bắt đầu học tập
      </Title>

      <Row gutter={[20, 20]}>
        {features.map((item) => (
          <Col xs={24} sm={12} lg={8} key={item.path}>
            <Card
              hoverable
              style={{
                height: "100%",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              onClick={() => router.push(item.path)}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 32 }}>{item.icon}</div>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "#f0f0f0",
                      color: "#595959",
                      fontWeight: 600,
                    }}
                  >
                    {item.tag}
                  </span>
                </div>

                <Title level={4} style={{ marginBottom: 8, fontSize: 18 }}>
                  {item.title}
                </Title>

                <Paragraph type="secondary" style={{ minHeight: 44, fontSize: 14 }}>
                  {item.description}
                </Paragraph>
              </div>

              <Button
                type="link"
                style={{ padding: 0, display: "flex", alignItems: "center", gap: 6 }}
              >
                Vào học ngay <ArrowRightOutlined />
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}