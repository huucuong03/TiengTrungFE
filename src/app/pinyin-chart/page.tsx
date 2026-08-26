"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, Spin, message, Typography } from "antd";
import { BulbOutlined, TrophyOutlined, CustomerServiceOutlined } from "@ant-design/icons";

import { PinyinDataState, QuestionItem, ListeningMode, QuizHistoryItem } from "./types";
import { applyToneToSyllable, getHanziForTone, getPronunciationText, playAudio } from "./pinyinUtils";
import { TONE_HANZI_MAPPING } from "./pinyinData"; // ✅ THÊM DÒNG NÀY
import PinyinTable from "./PinyinTable";
import PinyinQuiz from "./PinyinQuiz";

const { Title, Text } = Typography;

const TOTAL_QUESTIONS = 15;
const THINKING_TIME_LIMIT = 13;
const EXPLANATION_TIME = 5;

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
  const [listeningMode, setListeningMode] = useState<ListeningMode>("tones");
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
    
    // 1. Nếu text truyền vào ĐÃ CÓ DẤU (ví dụ: bā, bái, bǎi, bài) -> Đọc thẳng luôn, KHÔNG BAO GIỜ bị loạn vị trí nữa!
    const hasToneMark = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(clean);
    if (hasToneMark) {
      playAudio(clean);
      return;
    }
    
    // 2. Nếu text chưa có dấu (dùng cho trường hợp khác) thì mới tính theo tone
    const activeTone = (tone !== undefined && tone >= 1 && tone <= 4) ? tone : (selectedTone >= 1 && selectedTone <= 4 ? selectedTone : 1);
    
    const pronunciation = getPronunciationText(clean, activeTone);
    if (pronunciation && pronunciation.text && pronunciation.text !== "—") {
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

  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (explanationTimerRef.current) clearInterval(explanationTimerRef.current);
    if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const allValidSyllables = data.rows.flatMap((row: any) =>
    Object.keys(row)
      .filter((k) => k !== "group" && k !== "initial")
      .map((k) => row[k])
      .filter((val) => typeof val === "string" && val.trim())
  );

  const startQuiz = async (mode: ListeningMode) => {
    clearAllTimers();
    setListeningMode(mode);
    setLoading(true);

    try {
      const res = await fetch(`https://tiengtrung-7hto.onrender.com/api/dictionary/pinyin-drills?mode=${mode}`);
      const resData = await res.json();
      let questions: QuestionItem[] = [];

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
      } else {
        questions = buildRandomQuestionsFallback(mode);
      }

      setQuestionList(questions);
      setQuizIndex(0);
      setCorrectCount(0);
      setQuizHistory([]);
      setQuizSelected("");
      setQuizChecked(false);
      setTimeLeft(THINKING_TIME_LIMIT);
      setExplanationTimeLeft(EXPLANATION_TIME);
      setIsQuizFinished(false);
      setIsGameRunning(true);

      if (questions.length > 0) {
        setTimeout(() => playAudioTwiceWith2sInterval(questions[0].base, questions[0].tone), 300);
      }
    } finally {
      setLoading(false);
    }
  };

  const buildRandomQuestionsFallback = (mode: ListeningMode): QuestionItem[] => {
    const pool: string[] = Array.from(new Set(allValidSyllables));
    const generated: QuestionItem[] = [];

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const baseTarget: string = pool[i % pool.length];
      const randomTone = Math.floor(Math.random() * 4) + 1;
      const targetWithTone = applyToneToSyllable(baseTarget, randomTone);
      let options: string[] = [];

      if (mode === "tones") {
        options = [1, 2, 3, 4].map((t) => applyToneToSyllable(baseTarget, t));
      } else {
        const distractors = pool.filter((s) => s !== baseTarget).sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [targetWithTone, ...distractors.map((s) => applyToneToSyllable(s, randomTone))].sort(() => 0.5 - Math.random());
      }

      const hanzi = getHanziForTone(baseTarget, randomTone);
      generated.push({
        target: targetWithTone,
        base: baseTarget,
        tone: randomTone,
        options,
        hanzi,
        meaning: hanzi ? `Chữ ${hanzi}` : undefined,
      });
    }
    return generated;
  };

  const currentQ = questionList[quizIndex];

  // Timers Effect
  useEffect(() => {
    if (!isGameRunning || quizChecked || isQuizFinished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeoutTrigger();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isGameRunning, quizIndex, quizChecked, isQuizFinished]);

  useEffect(() => {
    if (!isGameRunning || !quizChecked || isQuizFinished) return;
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

  const handleTimeoutTrigger = () => {
    if (quizChecked || !currentQ) return;
    setQuizChecked(true);
    setQuizSelected("Hết giờ");
    setQuizHistory((prev) => [
      ...prev,
      { target: currentQ.target, selected: "Hết giờ (13s)", isCorrect: false, hanzi: currentQ.hanzi, meaning: currentQ.meaning },
    ]);
  };

  const handlePickOption = (selectedOption: string) => {
    if (quizChecked || !currentQ) return;
    if (timerRef.current) clearInterval(timerRef.current);

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
      setQuizIndex(nextIdx);
      setQuizSelected("");
      setQuizChecked(false);
      setTimeLeft(THINKING_TIME_LIMIT);
      setTimeout(() => playAudioTwiceWith2sInterval(questionList[nextIdx].base, questionList[nextIdx].tone), 300);
    } else {
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
          Luyện nghe 15 câu: Tự động đọc 2 lần (cách 2s), 13s suy nghĩ và dừng 5s phân tích đáp án chi tiết.
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
            label: <span><TrophyOutlined /> Đấu Trường Phản Xạ (15 Câu • 13s)</span>,
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