"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, Spin, message, Typography } from "antd";
import { BulbOutlined, TrophyOutlined, CustomerServiceOutlined } from "@ant-design/icons";

import { PinyinDataState, QuestionItem, ListeningMode, QuizHistoryItem } from "./types";
import { applyToneToSyllable, getHanziForTone, getPronunciationText, playAudio } from "./pinyinUtils";
import PinyinTable from "./PinyinTable";
import PinyinQuiz from "./PinyinQuiz";

const { Title, Text } = Typography;

const TOTAL_QUESTIONS = 20;
const THINKING_TIME_LIMIT = 13;
const EXPLANATION_TIME = 3;

export default function PinyinChartPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PinyinDataState>({
    basic_finals: [],
    nasal_finals: [],
    special_red_syllables: [],
    rows: [],
  });

  const [activeTab, setActiveTab] = useState<string>("table");
  const [finalMode, setFinalMode] = useState<"basic" | "nasal">("basic");
  const [selectedTone, setSelectedTone] = useState<number>(1);

  // Quiz States
  const [listeningMode, setListeningMode] = useState<ListeningMode>("mixed");
  const [questionList, setQuestionList] = useState<QuestionItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string>("");
  const [quizChecked, setQuizChecked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(THINKING_TIME_LIMIT);
  const [explanationTimeLeft, setExplanationTimeLeft] = useState<number>(EXPLANATION_TIME);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [isGameRunning, setIsGameRunning] = useState(false);

  const audioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const explanationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Xóa sạch tất cả bộ đếm giờ và dừng đọc âm thanh
  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (explanationTimerRef.current) clearInterval(explanationTimerRef.current);
    if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGameRunning && !isQuizFinished) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isGameRunning && !isQuizFinished) {
        clearAllTimers();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearAllTimers();
    };
  }, [isGameRunning, isQuizFinished]);

  useEffect(() => {
    fetch("/data/pinyin_chart.json")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải file JSON");
        return res.json();
      })
      .then((jsonData) => {
        setData({
          basic_finals: jsonData.basic_finals || [],
          nasal_finals: jsonData.nasal_finals || [],
          special_red_syllables: jsonData.special_red_syllables || [],
          rows: jsonData.rows || [],
        });
      })
      .catch((err) => {
        console.error(err);
        message.error("Lỗi khi đọc file public/data/pinyin_chart.json");
      })
      .finally(() => setLoading(false));
  }, []);

  const playSound = (text: string, tone?: number) => {
    if (!text) return;
    const clean = text.trim().toLowerCase();

    const hasToneMark = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(clean);
    if (hasToneMark) {
      playAudio(clean);
      return;
    }

    const activeTone = (tone !== undefined && tone >= 1 && tone <= 4) ? tone : (selectedTone >= 1 && selectedTone <= 4 ? selectedTone : 1);

    const pronunciation = getPronunciationText(clean, activeTone);
    if (pronunciation && pronunciation.text && pronunciation.text !== "——") {
      playAudio(pronunciation.text);
    }
  };

  const playAudioTwiceWith2sInterval = (base: string, tone: number) => {
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
      audioTimeoutRef.current = null;
    }

    playSound(base, tone);
    audioTimeoutRef.current = setTimeout(() => {
      playSound(base, tone);
      audioTimeoutRef.current = null;
    }, 2500);
  };

  // Hàm tạo câu hỏi mẫu đơn giản để test
  const generateSampleQuestions = (): QuestionItem[] => {
    const sampleData = [
      { base: "ma", tone: 1, target: "mā", hanzi: "妈", meaning: "Mẹ" },
      { base: "ma", tone: 2, target: "má", hanzi: "麻", meaning: "Cây gai" },
      { base: "ma", tone: 3, target: "mǎ", hanzi: "马", meaning: "Con ngựa" },
      { base: "ma", tone: 4, target: "mà", hanzi: "骂", meaning: "Mắng" },
      { base: "ba", tone: 1, target: "bā", hanzi: "八", meaning: "Tám" },
      { base: "ba", tone: 2, target: "bá", hanzi: "拔", meaning: "Nhổ" },
      { base: "ba", tone: 3, target: "bǎ", hanzi: "把", meaning: "Cầm" },
      { base: "ba", tone: 4, target: "bà", hanzi: "爸", meaning: "Bố" },
      { base: "da", tone: 1, target: "dā", hanzi: "搭", meaning: "Dựng" },
      { base: "da", tone: 2, target: "dá", hanzi: "答", meaning: "Trả lời" },
      { base: "da", tone: 3, target: "dǎ", hanzi: "打", meaning: "Đánh" },
      { base: "da", tone: 4, target: "dà", hanzi: "大", meaning: "Lớn" },
      { base: "na", tone: 1, target: "nā", hanzi: "那", meaning: "Kia" },
      { base: "na", tone: 2, target: "ná", hanzi: "拿", meaning: "Cầm" },
      { base: "na", tone: 3, target: "nǎ", hanzi: "哪", meaning: "Nào" },
      { base: "na", tone: 4, target: "nà", hanzi: "那", meaning: "Đó" },
      { base: "la", tone: 1, target: "lā", hanzi: "拉", meaning: "Kéo" },
      { base: "la", tone: 2, target: "lá", hanzi: "剌", meaning: "Châm" },
      { base: "la", tone: 3, target: "lǎ", hanzi: "喇", meaning: "Kèn" },
      { base: "la", tone: 4, target: "là", hanzi: "辣", meaning: "Cay" },
    ];

    const questions: QuestionItem[] = [];
    const shuffled = [...sampleData].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(TOTAL_QUESTIONS, shuffled.length); i++) {
      const item = shuffled[i];
      const options = [item.target];
      
      // Thêm 3 đáp án nhiễu
      const others = sampleData.filter(d => d.target !== item.target).sort(() => 0.5 - Math.random());
      for (let j = 0; j < 3 && j < others.length; j++) {
        options.push(others[j].target);
      }
      
      questions.push({
        id: i,
        target: item.target,
        base: item.base,
        tone: item.tone,
        options: options.sort(() => 0.5 - Math.random()),
        hanzi: item.hanzi,
        meaning: item.meaning,
      });
    }
    
    return questions;
  };

  const startQuiz = async (mode: ListeningMode = "mixed") => {
    console.log("🚀 Bắt đầu quiz với mode:", mode);
    
    // Reset tất cả state
    clearAllTimers();
    setListeningMode(mode);
    setIsQuizFinished(false);
    setIsGameRunning(false);
    setLoading(true);

    try {
      let questions: QuestionItem[] = [];

      // Thử gọi API
      try {
        console.log("📡 Đang gọi API...");
        const res = await fetch(`https://tiengtrung-7hto.onrender.com/api/dictionary/pinyin-drills?mode=mixed`);
        const resData = await res.json();
        console.log("📡 API response:", resData);

        if (res.ok && resData.success && resData.questions?.length > 0) {
          questions = resData.questions.map((q: any) => ({
            id: Number(q.id),
            target: String(q.target_pinyin || ""),
            base: String(q.base_pinyin || ""),
            tone: Number(q.tone || 1),
            options: (q.options || []).map(String),
            hanzi: q.hanzi ? String(q.hanzi) : getHanziForTone(String(q.base_pinyin), Number(q.tone)),
            meaning: q.meaning ? String(q.meaning) : undefined,
          }));
          console.log("✅ API trả về", questions.length, "câu hỏi");
        }
      } catch (apiError) {
        console.log("⚠️ API không hoạt động, sử dụng fallback:", apiError);
      }

      // Nếu API không trả về câu hỏi, dùng mẫu
      if (!questions || questions.length === 0) {
        console.log("📝 Tạo câu hỏi mẫu...");
        questions = generateSampleQuestions();
        console.log("✅ Đã tạo", questions.length, "câu hỏi mẫu");
      }

      // Đảm bảo có câu hỏi
      if (!questions || questions.length === 0) {
        throw new Error("Không thể tạo câu hỏi");
      }

      // Cập nhật state
      setQuestionList(questions);
      setQuizIndex(0);
      setCorrectCount(0);
      setQuizHistory([]);
      setQuizSelected("");
      setQuizChecked(false);
      setTimeLeft(THINKING_TIME_LIMIT);
      setExplanationTimeLeft(EXPLANATION_TIME);
      
      // BẮT ĐẦU GAME
      console.log("🎮 Bắt đầu game với", questions.length, "câu hỏi");
      setIsGameRunning(true);

      // Phát âm câu hỏi đầu tiên
      if (questions.length > 0 && questions[0].base) {
        setTimeout(() => {
          console.log("🔊 Phát âm câu hỏi 1:", questions[0].base, questions[0].tone);
          playAudioTwiceWith2sInterval(questions[0].base, questions[0].tone);
        }, 500);
      }

    } catch (error) {
      console.error("❌ Lỗi khi tạo câu hỏi:", error);
      message.error("Không thể tạo câu hỏi. Vui lòng thử lại!");
      setIsGameRunning(false);
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questionList[quizIndex];

  // Timers Effect: Đếm ngược thời gian suy nghĩ
  useEffect(() => {
    if (!isGameRunning || quizChecked || isQuizFinished || !currentQ) return;
    
    console.log("⏰ Bắt đầu timer cho câu", quizIndex + 1);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!quizChecked && currentQ) {
            console.log("⏰ Hết giờ!");
            setQuizChecked(true);
            setQuizSelected("Hết giờ");
            setQuizHistory((prevHistory) => [
              ...prevHistory,
              { target: currentQ.target, selected: `Hết giờ (${THINKING_TIME_LIMIT}s)`, isCorrect: false, hanzi: currentQ.hanzi, meaning: currentQ.meaning },
            ]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isGameRunning, quizIndex, quizChecked, isQuizFinished, currentQ]);

  // Timers Effect: Đếm ngược thời gian giải thích
  useEffect(() => {
    if (!isGameRunning || !quizChecked || isQuizFinished) return;
    
    console.log("📖 Bắt đầu giải thích");
    setExplanationTimeLeft(EXPLANATION_TIME);
    explanationTimerRef.current = setInterval(() => {
      setExplanationTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(explanationTimerRef.current!);
          advanceToNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => { if (explanationTimerRef.current) clearInterval(explanationTimerRef.current); };
  }, [isGameRunning, quizChecked, isQuizFinished]);

  const handlePickOption = (selectedOption: string) => {
    if (quizChecked || !currentQ) return;
    if (timerRef.current) clearInterval(timerRef.current);

    console.log("🎯 Chọn đáp án:", selectedOption);
    setQuizChecked(true);
    setQuizSelected(selectedOption);
    const isCorrect = selectedOption === currentQ.target;
    if (isCorrect) setCorrectCount((prev) => prev + 1);

    setQuizHistory((prev) => [
      ...prev,
      { target: currentQ.target, selected: selectedOption, isCorrect, hanzi: currentQ.hanzi, meaning: currentQ.meaning },
    ]);
  };

  const advanceToNextQuestion = () => {
    if (quizIndex < questionList.length - 1) {
      const nextIdx = quizIndex + 1;
      console.log("➡️ Chuyển sang câu", nextIdx + 1);
      setQuizIndex(nextIdx);
      setQuizSelected("");
      setQuizChecked(false);
      setTimeLeft(THINKING_TIME_LIMIT);
      if (questionList[nextIdx] && questionList[nextIdx].base) {
        setTimeout(() => {
          console.log("🔊 Phát âm câu", nextIdx + 1, ":", questionList[nextIdx].base, questionList[nextIdx].tone);
          playAudioTwiceWith2sInterval(questionList[nextIdx].base, questionList[nextIdx].tone);
        }, 300);
      }
    } else {
      console.log("🏁 Kết thúc quiz!");
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    clearAllTimers();
    setIsQuizFinished(true);
    setIsGameRunning(false);
  };

  const handleEarlyExit = () => {
    clearAllTimers();
    if (quizHistory.length === 0) {
      setIsGameRunning(false);
      return;
    }
    finishQuiz();
  };

  // Debug: Log state changes
  useEffect(() => {
    console.log("📊 State:", {
      isGameRunning,
      isQuizFinished,
      questionCount: questionList.length,
      currentQ: currentQ?.target,
      quizIndex,
    });
  }, [isGameRunning, isQuizFinished, questionList, currentQ, quizIndex]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
          <CustomerServiceOutlined style={{ color: "#1677ff", marginRight: 8 }} />
          Bảng Ngữ Âm Pinyin & Đấu Trường Luyện Nghe
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          {`Luyện nghe ${TOTAL_QUESTIONS} câu từ vựng hỗn hợp: Tự động đọc 2 lần (cách 2.5s), ${THINKING_TIME_LIMIT}s suy nghĩ và dừng ${EXPLANATION_TIME}s phân tích đáp án chi tiết.`}
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        type="card"
        items={[
          {
            key: "table",
            label: <span><BulbOutlined /> Bảng Ngữ Âm Tương Tác</span>,
            children: (
              <PinyinTable
                data={data}
                finalMode={finalMode}
                setFinalMode={setFinalMode}
                selectedTone={selectedTone}
                setSelectedTone={setSelectedTone}
                playSound={playSound}
              />
            ),
          },
          {
            key: "quiz",
            label: (
              <span>
                <TrophyOutlined /> Đấu Trường Phản Xạ ({TOTAL_QUESTIONS} Câu • {THINKING_TIME_LIMIT}s)
              </span>
            ),
            children: (
              <PinyinQuiz
                listeningMode={listeningMode}
                isGameRunning={isGameRunning}
                isQuizFinished={isQuizFinished}
                currentQ={currentQ}
                quizIndex={quizIndex}
                totalQuestions={TOTAL_QUESTIONS}
                timeLeft={timeLeft}
                explanationTimeLeft={explanationTimeLeft}
                quizChecked={quizChecked}
                quizSelected={quizSelected}
                correctCount={correctCount}
                quizHistory={quizHistory}
                startQuiz={startQuiz}
                playAudioTwice={playAudioTwiceWith2sInterval}
                handlePickOption={handlePickOption}
                handleEarlyExit={handleEarlyExit}
                setIsQuizFinished={setIsQuizFinished}
                setIsGameRunning={setIsGameRunning}
                setActiveTab={setActiveTab}
              />
            ),
          },
        ]}
      />
    </div>
  );
}