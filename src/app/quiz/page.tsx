"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Progress,
  Tag,
  Result,
  Spin,
  message,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  ThunderboltOutlined,
  LeftOutlined,
  FireOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  BookOutlined,
  EditOutlined,
  FileTextOutlined,
  FontSizeOutlined,
} from "@ant-design/icons";

import WritingQuizCanvas from "@/components/WritingQuizCanvas";
import Game1Flashcard from "@/components/Game1Flashcard";
import Game2MemoryMatch from "@/components/Game2MemoryMatch";
import Game3MatchColumns from "@/components/Game3MatchColumns";
import Game4SentenceBuilder from "@/components/Game4SentenceBuilder";
import GameVocabularyTower from "@/components/GameVocabularyTower";
import GameSentencePractice from "@/components/GameSentencePractice";
import GameCharacterPractice from "@/components/GameCharacterPractice";

const { Title, Text } = Typography;

type GameMode =
  | "menu"
  | "game1"
  | "game2"
  | "game3"
  | "game4"
  | "game5"
  | "game6"
  | "game7"
  | "game8"
  | "completed";

export default function QuizPage() {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [game4Data, setGame4Data] = useState<any>(null);
  const [loadingGame4, setLoadingGame4] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [gameMode, setGameMode] = useState<GameMode>("menu");
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [g5Index, setG5Index] = useState(0);
  const [g5DoneCurrent, setG5DoneCurrent] = useState(false);

  const fetchStats = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    try {
      const res = await fetch("https://tiengtrung-7hto.onrender.com/api/notebook/quiz/daily-stats", {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSession = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://tiengtrung-7hto.onrender.com/api/notebook/quiz/session", {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessionData(data);
      } else {
        message.warning(data.detail || "Chưa đủ từ vựng để tạo bài tập");
      }
    } catch {
      message.error("Lỗi khi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Hàm fetch riêng cho Game 4
  const fetchGame4Data = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    // Nếu đã có dữ liệu Game 4, không gọi lại
    if (game4Data) return;

    setLoadingGame4(true);
    try {
      const res = await fetch("https://tiengtrung-7hto.onrender.com/api/notebook/quiz/ai-sentences", {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success && data.game4_sentence) {
        setGame4Data(data.game4_sentence);
        // ✅ Sửa lỗi: thêm type cho prev
        setSessionData((prev: any) => ({
          ...prev,
          game4_sentence: data.game4_sentence
        }));
        message.success("✨ Đã tạo câu mới từ AI!");
      } else {
        message.warning("Không thể tạo câu mới, sử dụng câu mẫu");
      }
    } catch (error) {
      console.error("Lỗi tải Game 4:", error);
      message.error("Lỗi khi tạo câu từ AI");
    } finally {
      setLoadingGame4(false);
    }
  };

  // 🆕 Hàm refresh Game 4 (gọi lại API)
  const refreshGame4 = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    setLoadingGame4(true);
    try {
      const res = await fetch("https://tiengtrung-7hto.onrender.com/api/notebook/quiz/ai-sentences", {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success && data.game4_sentence) {
        setGame4Data(data.game4_sentence);
        // ✅ Sửa lỗi: thêm type cho prev
        setSessionData((prev: any) => ({
          ...prev,
          game4_sentence: data.game4_sentence
        }));
        message.success("🔄 Đã tạo câu mới!");
      } else {
        message.warning("Không thể tạo câu mới");
      }
    } catch (error) {
      console.error("Lỗi refresh Game 4:", error);
      message.error("Không thể tạo câu mới");
    } finally {
      setLoadingGame4(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchStats();
  }, []);

  const masteredCount = stats?.mastery?.mastered_words || 0;
  const isGame2Unlocked = masteredCount >= 0;
  const isGame3Unlocked = masteredCount >= 0;
  const isGame4Unlocked = masteredCount >= 0;

  const startGame = async (mode: GameMode) => {
    setGameMode(mode);
    setScore(0);
    setCorrectCount(0);

    if (mode === "game5") {
      setG5Index(0);
      setG5DoneCurrent(false);
    }

    // 🆕 Nếu vào Game 4, gọi API tạo câu
    if (mode === "game4") {
      await fetchGame4Data();
    }
  };

  const submitFinalResult = async (finalScore: number, finalCorrect: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    const wordIds = sessionData?.session_word_ids || [];

    try {
      await fetch("https://tiengtrung-7hto.onrender.com/api/notebook/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          score: finalScore, 
          correct_count: finalCorrect, 
          total_words: wordIds.length || 15, 
          game_mode: gameMode,
          word_ids: wordIds
        }),
      });
      fetchStats();
      message.success("Đã cập nhật điểm thành thạo cho từ vựng!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuitGame = () => {
    message.info("Đã hủy phiên chơi, điểm số không được ghi nhận.");
    setGameMode("menu");
  };

  const playAudio = (text: string) => {
    if (!text) return;
    const audioUrl = `https://tiengtrung-7hto.onrender.com/api/tts/speak?text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    });
  };

  const currentG5Task = sessionData?.game5_writing?.[g5Index];

  const handleWritingSuccess = (usedHint: boolean) => {
    const points = usedHint ? 10 : 20;
    setScore((prev) => prev + points);
    setCorrectCount((prev) => prev + 1);
    setG5DoneCurrent(true);
  };

  const handleNextG5 = () => {
    const totalG5 = sessionData?.game5_writing?.length || 10;
    if (g5Index < totalG5 - 1) {
      setG5Index((prev) => prev + 1);
      setG5DoneCurrent(false);
    } else {
      submitFinalResult(score, correctCount);
      setGameMode("completed");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Card style={{ textAlign: "center", padding: "48px 32px", borderRadius: 16, maxWidth: 450 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, fontWeight: 500, color: "#595959" }}>Đang tải dữ liệu bài tập...</div>
        </Card>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: "0 16px" }}>
        <Card style={{ textAlign: "center", borderRadius: 16, padding: "32px 16px" }}>
          <BookOutlined style={{ fontSize: 48, color: "#1677ff", marginBottom: 16 }} />
          <Title level={4}>Sổ từ vựng chưa đủ từ</Title>
          <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
            Bạn cần có ít nhất 4 từ vựng trong sổ để hệ thống tạo các bộ bài tập tương tác.
          </Text>
          <Button type="primary" size="large" href="/practice" style={{ borderRadius: 8 }}>
            Về Sổ từ vựng để thêm từ
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
      {gameMode === "menu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
              <FireOutlined style={{ color: "#fa541c", marginRight: 8 }} />
              Trung Tâm Luyện Tập & Trò Chơi
            </Title>
            <Text type="secondary" style={{ fontSize: 15, marginTop: 4, display: "block" }}>
              Mỗi phiên chọn 15 từ theo tỷ lệ vàng (60% từ mới/yếu + 40% từ cũ ôn tập)
            </Text>
          </div>

          {stats && (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card style={{ borderRadius: 14, border: "1px solid #d9f7be", background: "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)" }}>
                    <Statistic
                      title={<span style={{ fontWeight: 600, color: "#389e0d" }}>Mục tiêu ngày</span>}
                      value={stats.today.completed_sessions}
                      suffix={`/ 5 lần`}
                      styles={{ content: { color: "#52c41a", fontWeight: 800 } }}
                      prefix={<CheckCircleOutlined />}
                    />
                    <Progress percent={Math.min(100, Math.round((stats.today.completed_sessions / 5) * 100))} strokeColor="#52c41a" style={{ marginTop: 8 }} />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card style={{ borderRadius: 14, border: "1px solid #ffe58f", background: "linear-gradient(135deg, #fffbe6 0%, #ffffff 100%)" }}>
                    <Statistic
                      title={<span style={{ fontWeight: 600, color: "#d46b08" }}>ĐTB Hôm nay</span>}
                      value={stats.today.avg_score}
                      precision={1}
                      suffix="/ 100"
                      styles={{ content: { color: "#fa8c16", fontWeight: 800 } }}
                      prefix={<TrophyOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card style={{ borderRadius: 14, border: "1px solid #d6e4ff", background: "linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)" }}>
                    <Statistic
                      title={<span style={{ fontWeight: 600, color: "#1d39c4" }}>Tổng từ</span>}
                      value={stats?.mastery?.total_words || 0}
                      suffix="từ"
                      styles={{ content: { color: "#2f54eb", fontWeight: 800 } }}
                      prefix={<BookOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={8}>
                  <Card style={{ borderRadius: 14, border: "1px solid #d6e4ff", background: "linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)" }}>
                    <Statistic
                      title={<span style={{ fontWeight: 600, color: "#1d39c4" }}>🀄 Nhận diện chữ</span>}
                      value={stats?.mastery?.hanzi_mastered || 0}
                      suffix="từ"
                      styles={{ content: { color: "#2f54eb", fontWeight: 800 } }}
                    />
                    <Progress
                      percent={stats?.mastery?.total_words > 0 ? Math.round((stats.mastery.hanzi_mastered / stats.mastery.total_words) * 100) : 0}
                      size="small"
                      strokeColor="#1677ff"
                      style={{ marginTop: 8 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card style={{ borderRadius: 14, border: "1px solid #d9f7be", background: "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)" }}>
                    <Statistic
                      title={<span style={{ fontWeight: 600, color: "#389e0d" }}>🔤 Phát âm</span>}
                      value={stats?.mastery?.pinyin_mastered || 0}
                      suffix="từ"
                      styles={{ content: { color: "#52c41a", fontWeight: 800 } }}
                    />
                    <Progress
                      percent={stats?.mastery?.total_words > 0 ? Math.round((stats.mastery.pinyin_mastered / stats.mastery.total_words) * 100) : 0}
                      size="small"
                      strokeColor="#52c41a"
                      style={{ marginTop: 8 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card style={{ borderRadius: 14, border: "1px solid #ffe58f", background: "linear-gradient(135deg, #fffbe6 0%, #ffffff 100%)" }}>
                    <Statistic
                      title={<span style={{ fontWeight: 600, color: "#d46b08" }}>📖 Hiểu nghĩa</span>}
                      value={stats?.mastery?.meaning_mastered || 0}
                      suffix="từ"
                      styles={{ content: { color: "#fa8c16", fontWeight: 800 } }}
                    />
                    <Progress
                      percent={stats?.mastery?.total_words > 0 ? Math.round((stats.mastery.meaning_mastered / stats.mastery.total_words) * 100) : 0}
                      size="small"
                      strokeColor="#faad14"
                      style={{ marginTop: 8 }}
                    />
                  </Card>
                </Col>
              </Row>
            </>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 8 }}>
            {/* Game 1 */}
            <Card hoverable onClick={() => startGame("game1")} style={{ borderRadius: 16, border: "1px solid #bae0ff", background: "linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)" }}>
              <Tag color="blue">TRÒ CHƠI 1</Tag>
              <Title level={4} style={{ margin: "8px 0 4px 0", fontWeight: 700 }}>🎯 Đấu Trường Nhận Diện 3 Cặp</Title>
              <Button type="primary" size="large" block icon={<PlayCircleOutlined />} style={{ marginTop: 16, borderRadius: 8 }}>Bắt đầu chơi</Button>
            </Card>

            {/* Game 2 */}
            <Card hoverable={isGame2Unlocked} onClick={() => startGame("game2")} style={{ borderRadius: 16, border: "1px solid #b7eb8f" }}>
              <Tag color="green">TRÒ CHƠI 2</Tag>
              <Title level={4} style={{ margin: "8px 0 4px 0", fontWeight: 700 }}>🃏 Lật Thẻ Trí Nhớ</Title>
              <Button type="primary" size="large" block icon={<PlayCircleOutlined />} style={{ marginTop: 16, borderRadius: 8, background: "#52c41a" }}>Bắt đầu chơi</Button>
            </Card>

            {/* Game 3 */}
            <Card hoverable={isGame3Unlocked} onClick={() => startGame("game3")} style={{ borderRadius: 16, border: "1px solid #ffd591" }}>
              <Tag color="volcano">TRÒ CHƠI 3</Tag>
              <Title level={4} style={{ margin: "8px 0 4px 0", fontWeight: 700 }}>⚡ Nối 3 Cột</Title>
              <Button type="primary" size="large" block icon={<PlayCircleOutlined />} style={{ marginTop: 16, borderRadius: 8, background: "#fa541c" }}>Bắt đầu chơi</Button>
            </Card>

            {/* Game 4 */}
            <Card hoverable={isGame4Unlocked} onClick={() => startGame("game4")} style={{ borderRadius: 16, border: "1px solid #d3adf7", background: "linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)" }}>
              <Tag color="purple">TRÒ CHƠI 4 • AI</Tag>
              <Title level={4} style={{ margin: "8px 0 4px 0", fontWeight: 700 }}>📝 Sắp Xếp Từ Ghép Câu</Title>
              <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
                🤖 Câu được tạo từ AI dựa trên từ vựng của bạn
              </Text>
              <Button type="primary" size="large" block icon={<PlayCircleOutlined />} style={{ marginTop: 16, borderRadius: 8, background: "#722ed1" }}>
                Bắt đầu chơi
              </Button>
            </Card>

            {/* Game 6 - Tower */}
            <Card hoverable onClick={() => startGame("game6")} style={{ borderRadius: 16, border: "1px solid #ffbb96", background: "linear-gradient(135deg, #fff2e8 0%, #ffffff 100%)" }}>
              <Tag color="orange">TRÒ CHƠI 6 • HÀNH ĐỘNG</Tag>
              <Title level={4} style={{ margin: "8px 0 4px 0", fontWeight: 700 }}>🏰 Tháp Từ Vựng</Title>
              <Button type="primary" size="large" block icon={<PlayCircleOutlined />} style={{ marginTop: 16, borderRadius: 8, background: "#fa541c" }}>Bắt đầu chơi</Button>
            </Card>

            {/* Game 5 - Writing */}
            <Card hoverable onClick={() => startGame("game5")} style={{ borderRadius: 16, border: "1px solid #ffd666", background: "linear-gradient(135deg, #fffbe6 0%, #ffffff 100%)" }}>
              <Tag color="gold">TRÒ CHƠI 5</Tag>
              <Title level={4} style={{ margin: "8px 0 4px 0", fontWeight: 700 }}>✍️ Viết Chữ Hán</Title>
              <Button type="primary" size="large" icon={<EditOutlined />} style={{ marginTop: 16, borderRadius: 8, background: "#faad14", borderColor: "#faad14" }}>Bắt đầu viết</Button>
            </Card>

            {/* Game 7 - Luyện Câu */}
            <Card hoverable onClick={() => startGame("game7")} style={{ borderRadius: 16, border: "1px solid #b7eb8f", background: "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)" }}>
              <Tag color="green">TRÒ CHƠI 7 • MỚI</Tag>
              <Title level={4} style={{ margin: "8px 0 4px 0", fontWeight: 700 }}><FileTextOutlined /> Luyện Câu - Điền Từ</Title>
              <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                Điền từ còn thiếu vào câu tiếng Trung
              </Text>
              <Button type="primary" size="large" block icon={<PlayCircleOutlined />} style={{ marginTop: 16, borderRadius: 8, background: "#52c41a" }}>Bắt đầu</Button>
            </Card>

            {/* Game 8 - Luyện Chữ */}
            <Card hoverable onClick={() => startGame("game8")} style={{ borderRadius: 16, border: "1px solid #ffd591", background: "linear-gradient(135deg, #fff7e6 0%, #ffffff 100%)" }}>
              <Tag color="orange">TRÒ CHƠI 8 • MỚI</Tag>
              <Title level={4} style={{ margin: "8px 0 4px 0", fontWeight: 700 }}><FontSizeOutlined /> Luyện Chữ Hán</Title>
              <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                Viết đúng chữ Hán theo Pinyin và nghĩa
              </Text>
              <Button type="primary" size="large" block icon={<PlayCircleOutlined />} style={{ marginTop: 16, borderRadius: 8, background: "#fa8c16" }}>Bắt đầu</Button>
            </Card>
          </div>
        </div>
      )}

      {gameMode !== "menu" && gameMode !== "completed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "12px 20px", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Button icon={<LeftOutlined />} onClick={handleQuitGame} style={{ borderRadius: 6 }}>
              Bỏ cuộc / Về Menu
            </Button>
            <Tag color="gold" style={{ fontSize: 15, padding: "4px 14px", borderRadius: 20, fontWeight: 700, margin: 0 }}>
              <TrophyOutlined style={{ marginRight: 6 }} /> {score} Điểm
            </Tag>
          </div>

          {/* Game 1 */}
          {gameMode === "game1" && sessionData && (
            <Game1Flashcard
              sessionData={sessionData}
              playAudio={playAudio}
              onFinishGame={(finalScore, finalCorrect) => {
                setScore(finalScore);
                setCorrectCount(finalCorrect);
                submitFinalResult(finalScore, finalCorrect);
                setGameMode("completed");
              }}
              updateScoreAndCorrect={(pts, correct) => {
                setScore((prev) => prev + pts);
                if (correct) setCorrectCount((prev) => prev + 1);
              }}
              currentScore={score}
            />
          )}

          {/* Game 2 */}
          {gameMode === "game2" && sessionData && (
            <Game2MemoryMatch
              sessionData={sessionData}
              playAudio={playAudio}
              onFinishGame={(finalScore, finalCorrect) => {
                setScore(finalScore);
                setCorrectCount(finalCorrect);
                submitFinalResult(finalScore, finalCorrect);
                setGameMode("completed");
              }}
              updateScoreAndCorrect={(pts, correct) => {
                setScore((prev) => prev + pts);
                if (correct) setCorrectCount((prev) => prev + 1);
              }}
            />
          )}

          {/* Game 3 */}
          {gameMode === "game3" && sessionData && (
            <Game3MatchColumns
              sessionData={sessionData}
              playAudio={playAudio}
              onFinishGame={(finalScore, finalCorrect) => {
                setScore(finalScore);
                setCorrectCount(finalCorrect);
                submitFinalResult(finalScore, finalCorrect);
                setGameMode("completed");
              }}
              updateScoreAndCorrect={(pts, correct) => {
                setScore((prev) => prev + pts);
                if (correct) setCorrectCount((prev) => prev + 1);
              }}
            />
          )}

          {/* Game 4 */}
          {gameMode === "game4" && sessionData && (
            <Game4SentenceBuilder
              sessionData={sessionData}
              playAudio={playAudio}
              onFinishGame={(finalScore, finalCorrect) => {
                setScore(finalScore);
                setCorrectCount(finalCorrect);
                submitFinalResult(finalScore, finalCorrect);
                setGameMode("completed");
              }}
              updateScoreAndCorrect={(pts, correct) => {
                setScore((prev) => prev + pts);
                if (correct) setCorrectCount((prev) => prev + 1);
              }}
              refreshGame4={refreshGame4}
              loading={loadingGame4}
            />
          )}

          {/* Game 6 - Tower */}
          {gameMode === "game6" && sessionData && (
            <GameVocabularyTower
              sessionData={sessionData}
              playAudio={playAudio}
              onFinishGame={(finalScore, finalCorrect) => {
                setScore(finalScore);
                setCorrectCount(finalCorrect);
                submitFinalResult(finalScore, finalCorrect);
                setGameMode("completed");
              }}
            />
          )}

          {/* Game 5 - Writing */}
          {gameMode === "game5" && currentG5Task && (
            <Card style={{ borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <Text type="secondary" style={{ fontSize: 13, textTransform: "uppercase" }}>
                  Chữ {g5Index + 1} / {sessionData.game5_writing.length}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Text code style={{ fontSize: 28, color: "#d4380d", fontWeight: 700 }}>
                    {currentG5Task.pinyin}
                  </Text>
                </div>
              </div>
              <WritingQuizCanvas
                key={`write-quiz-${g5Index}-${currentG5Task.char}`}
                character={currentG5Task.char}
                wordId={currentG5Task.word_id}
                onSuccess={handleWritingSuccess}
                onPenalty={(penalty) => {
                  setScore((prev) => Math.max(0, prev - penalty));
                }}
              />
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <Button type="primary" size="large" disabled={!g5DoneCurrent} onClick={handleNextG5}>
                  Chữ tiếp theo
                </Button>
              </div>
            </Card>
          )}

          {/* Game 7 - Luyện Câu */}
          {gameMode === "game7" && (
            <GameSentencePractice
              sessionData={sessionData}
              playAudio={playAudio}
              onFinishGame={(finalScore, finalCorrect) => {
                setScore(finalScore);
                setCorrectCount(finalCorrect);
                submitFinalResult(finalScore, finalCorrect);
                setGameMode("completed");
              }}
              updateScoreAndCorrect={(pts, correct) => {
                setScore((prev) => prev + pts);
                if (correct) setCorrectCount((prev) => prev + 1);
              }}
            />
          )}

          {/* Game 8 - Luyện Chữ */}
          {gameMode === "game8" && (
            <GameCharacterPractice
              sessionData={sessionData}
              playAudio={playAudio}
              onFinishGame={(finalScore, finalCorrect) => {
                setScore(finalScore);
                setCorrectCount(finalCorrect);
                submitFinalResult(finalScore, finalCorrect);
                setGameMode("completed");
              }}
              updateScoreAndCorrect={(pts, correct) => {
                setScore((prev) => prev + pts);
                if (correct) setCorrectCount((prev) => prev + 1);
              }}
            />
          )}
        </div>
      )}

      {gameMode === "completed" && (
        <Card style={{ borderRadius: 16, textAlign: "center", padding: "32px 16px" }}>
          <Result
            status="success"
            title={<span style={{ fontWeight: 800 }}>Hoàn thành xuất sắc phiên luyện tập!</span>}
            subTitle={<div style={{ fontSize: 16, marginTop: 8 }}>Điểm số đạt được: <strong style={{ color: "#fa8c16", fontSize: 20 }}>{score} điểm</strong></div>}
            extra={[
              <Button type="primary" key="menu" size="large" icon={<ReloadOutlined />} onClick={() => {
                fetchSession(); 
                setGameMode("menu");
                setGame4Data(null);
              }} style={{ borderRadius: 8 }}>
                Về Menu chọn bài khác
              </Button>,
              <Button key="practice" size="large" href="/practice" style={{ borderRadius: 8 }}>
                Về Sổ từ vựng
              </Button>,
            ]}
          />
        </Card>
      )}
    </div>
  );
}