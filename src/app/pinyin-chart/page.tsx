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

  // -------------------------------------------------------------
  // HOOK TỰ ĐỘNG XỬ LÝ KHI RỜI TRANG / CHUYỂN TAB / ĐÓNG TRÌNH DUYỆT
  // -------------------------------------------------------------
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
      setIsGameRunning(false);
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

  // Lấy danh sách âm tiết hợp lệ từ data
  const getAllValidSyllables = (): string[] => {
    const syllables: string[] = [];
    data.rows.forEach((row: any) => {
      Object.keys(row).forEach((key) => {
        if (key !== "group" && key !== "initial") {
          const val = row[key];
          if (typeof val === "string" && val.trim()) {
            syllables.push(val.trim());
          }
        }
      });
    });
    return Array.from(new Set(syllables));
  };

  const startQuiz = async (mode: ListeningMode = "mixed") => {
    // Reset tất cả state
    clearAllTimers();
    setListeningMode(mode);
    setLoading(true);
    setIsQuizFinished(false);
    setIsGameRunning(false); // Tạm thời tắt game để reset

    try {
      let questions: QuestionItem[] = [];

      // Thử gọi API
      try {
        const res = await fetch(`https://tiengtrung-7hto.onrender.com/api/dictionary/pinyin-drills?mode=mixed`);
        const resData = await res.json();

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
        }
      } catch (apiError) {
        console.log("API không hoạt động, sử dụng fallback:", apiError);
      }

      // Nếu API không trả về câu hỏi, dùng fallback
      if (!questions || questions.length === 0) {
        questions = buildRandomQuestionsFallback();
      }

      // Đảm bảo có đủ câu hỏi
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
      
      // BẮT ĐẦU GAME - ĐẢM BẢO currentQ có giá trị
      setIsGameRunning(true);
      setIsQuizFinished(false);

      // Phát âm câu hỏi đầu tiên sau khi game đã chạy
      if (questions.length > 0 && questions[0].base) {
        setTimeout(() => {
          if (isGameRunning) {
            playAudioTwiceWith2sInterval(questions[0].base, questions[0].tone);
          }
        }, 500);
      }

    } catch (error) {
      console.error("Lỗi khi tạo câu hỏi:", error);
      message.error("Không thể tạo câu hỏi. Vui lòng thử lại!");
      setIsGameRunning(false);
    } finally {
      setLoading(false);
    }
  };

  const buildRandomQuestionsFallback = (): QuestionItem[] => {
    const pool = getAllValidSyllables();
    
    // Nếu không có dữ liệu, dùng danh sách mặc định
    if (pool.length === 0) {
      console.warn("Không có dữ liệu âm tiết, sử dụng danh sách mặc định");
      const defaultPool = ["ba", "ma", "da", "na", "la", "ga", "ka", "ha", "ji", "qi", "xi", "zhi", "chi", "shi", "ri", "zi", "ci", "si", "yi", "wu", "yu", "ye", "yue", "yuan", "yin", "yun", "ying"];
      defaultPool.forEach(s => pool.push(s));
    }

    const generated: QuestionItem[] = [];

    // ✅ MỞ RỘNG: Nhóm âm dễ nhầm
    const confusingGroups: Record<string, string[]> = {
      z: ["c", "s", "zh"],
      c: ["z", "s", "ch"],
      s: ["z", "c", "sh"],
      zh: ["ch", "sh", "z"],
      ch: ["zh", "sh", "c"],
      sh: ["zh", "ch", "s"],
      b: ["p", "m", "f"],
      p: ["b", "f", "m"],
      m: ["b", "p", "n"],
      f: ["b", "p", "h"],
      d: ["t", "n", "l"],
      t: ["d", "l", "n"],
      n: ["d", "t", "l"],
      l: ["d", "t", "n"],
      g: ["k", "h"],
      k: ["g", "h"],
      h: ["g", "k", "f"],
      j: ["q", "x", "zh"],
      q: ["j", "x", "ch"],
      x: ["j", "q", "sh"],
      r: ["l", "n", "y"],
      y: ["w", "r", "l"],
      w: ["y", "r", "m"],
      a: ["ai", "an", "ang", "ao"],
      o: ["ou", "ong", "uo"],
      e: ["ei", "en", "eng", "er"],
      i: ["ia", "ian", "iang", "iao", "ie", "in", "ing", "iong", "iu"],
      u: ["ua", "uai", "uan", "uang", "ui", "un", "uo", "ong"],
      ü: ["üan", "üe", "ün", "iong"],
      an: ["ang", "en", "ian", "uan"],
      ang: ["an", "eng", "iang", "uang"],
      en: ["eng", "an", "in", "un"],
      eng: ["en", "ang", "ing", "ong"],
      in: ["ing", "en", "ian"],
      ing: ["in", "eng", "iang"],
      un: ["ong", "en", "uan"],
      ong: ["un", "eng", "iong"],
      ai: ["ei", "an", "ao"],
      ei: ["ai", "en", "ui"],
      ao: ["ou", "an", "iao"],
      ou: ["ao", "un", "iu"],
      ia: ["ian", "iang", "ie", "iao"],
      ie: ["ia", "ian", "üe"],
      ua: ["uan", "uang", "uo"],
      uo: ["ua", "uan", "ou"],
      üe: ["ie", "üan", "ün"],
      iao: ["iao", "iu", "ian"],
      iu: ["iu", "iao", "iou"],
      ui: ["ui", "ei", "un"],
      uai: ["uai", "uan", "uang"],
      ian: ["ian", "iang", "in", "uan"],
      iang: ["iang", "ian", "uang", "ing"],
      uan: ["uan", "uang", "un", "ian"],
      uang: ["uang", "uan", "iang"],
      üan: ["üan", "üe", "ün", "uan"],
      ün: ["ün", "üan", "in", "un"],
      iong: ["iong", "ong", "ing"],
    };

    const similarSyllables: Record<string, string[]> = {
      "shi": ["si", "chi", "zhi", "xi"],
      "si": ["shi", "ci", "zi", "xi"],
      "chi": ["shi", "qi", "zhi", "ci"],
      "zi": ["zhi", "ci", "si"],
      "ci": ["si", "chi", "zi"],
      "zhi": ["shi", "chi", "zi"],
      "ji": ["qi", "xi", "zhi"],
      "qi": ["ji", "xi", "chi"],
      "xi": ["ji", "qi", "shi"],
      "ju": ["qu", "xu", "zhu"],
      "qu": ["ju", "xu", "chu"],
      "xu": ["ju", "qu", "shu"],
      "ban": ["ben", "bin", "bang"],
      "ben": ["ban", "bin", "beng"],
      "bin": ["ban", "ben", "bing"],
      "bang": ["beng", "bing", "ban"],
      "beng": ["bang", "bing", "ben"],
      "bing": ["bin", "bang", "beng"],
      "dan": ["dang", "den", "deng"],
      "dang": ["dan", "deng", "dong"],
      "deng": ["dang", "dong", "den"],
      "dong": ["deng", "dang", "dun"],
      "tian": ["tiao", "tie", "ting"],
      "tiao": ["tian", "tie", "ting"],
      "tie": ["tian", "tiao", "ting"],
      "ting": ["tian", "tiao", "tie"],
      "guan": ["guang", "gun", "guai"],
      "guang": ["guan", "guai", "gun"],
      "guai": ["guan", "guang", "gua"],
      "gun": ["guan", "guang"],
    };

    const getInitial = (syllable: string): string => {
      const match = syllable.match(/^([bpmfdtnlgkhjqxzcsryw]+)/);
      return match ? match[0] : "";
    };

    const getFinal = (syllable: string): string => {
      const initial = getInitial(syllable);
      return syllable.replace(initial, "");
    };

    const getValidTones = (syllable: string): number[] => {
      const tones: number[] = [];
      for (let t = 1; t <= 4; t++) {
        const hanzi = getHanziForTone(syllable, t);
        if (hanzi && hanzi !== "—" && hanzi !== "——") {
          tones.push(t);
        }
      }
      return tones;
    };

    // Tạo câu hỏi
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      let baseTarget = pool[Math.floor(Math.random() * pool.length)] || "ba";
      let attempts = 0;
      while (attempts < 20) {
        const validTones = getValidTones(baseTarget);
        if (validTones.length >= 2) break;
        baseTarget = pool[Math.floor(Math.random() * pool.length)] || "ba";
        attempts++;
      }

      const validTones = getValidTones(baseTarget);
      const chosenTone = validTones.length > 0
        ? validTones[Math.floor(Math.random() * validTones.length)]
        : Math.floor(Math.random() * 4) + 1;

      const targetWithTone = applyToneToSyllable(baseTarget, chosenTone);
      const distractorSet = new Set<string>();

      // Các bẫy
      const otherTones = [1, 2, 3, 4].filter((t) => t !== chosenTone);
      for (const ot of otherTones) {
        const hanzi = getHanziForTone(baseTarget, ot);
        if (hanzi && hanzi !== "—" && hanzi !== "——") {
          distractorSet.add(applyToneToSyllable(baseTarget, ot));
        }
      }

      const initial = getInitial(baseTarget);
      const confuseInitials = confusingGroups[initial] || [];
      for (const ci of confuseInitials) {
        const confusedBase = baseTarget.replace(initial, ci);
        if (pool.includes(confusedBase)) {
          const hanzi = getHanziForTone(confusedBase, chosenTone);
          if (hanzi && hanzi !== "—" && hanzi !== "——") {
            distractorSet.add(applyToneToSyllable(confusedBase, chosenTone));
          }
        }
      }

      const finalPart = getFinal(baseTarget);
      const confuseFinals = confusingGroups[finalPart] || [];
      for (const cf of confuseFinals) {
        const confusedBase = initial + cf;
        if (pool.includes(confusedBase)) {
          const hanzi = getHanziForTone(confusedBase, chosenTone);
          if (hanzi && hanzi !== "—" && hanzi !== "——") {
            distractorSet.add(applyToneToSyllable(confusedBase, chosenTone));
          }
        }
      }

      const similar = similarSyllables[baseTarget] || [];
      for (const sim of similar) {
        if (pool.includes(sim)) {
          const hanzi = getHanziForTone(sim, chosenTone);
          if (hanzi && hanzi !== "—" && hanzi !== "——") {
            distractorSet.add(applyToneToSyllable(sim, chosenTone));
          }
        }
      }

      const oppositeTones: Record<number, number> = { 1: 4, 2: 3, 3: 2, 4: 1 };
      const oppTone = oppositeTones[chosenTone];
      if (oppTone) {
        const oppHanzi = getHanziForTone(baseTarget, oppTone);
        if (oppHanzi && oppHanzi !== "—" && oppHanzi !== "——") {
          distractorSet.add(applyToneToSyllable(baseTarget, oppTone));
        }
      }

      const remainingPool = pool.filter((s) => s !== baseTarget);
      let fallbackAttempts = 0;
      while (distractorSet.size < 3 && remainingPool.length > 0 && fallbackAttempts < 30) {
        const randBase = remainingPool[Math.floor(Math.random() * remainingPool.length)];
        const hanzi = getHanziForTone(randBase, chosenTone);
        if (hanzi && hanzi !== "—" && hanzi !== "——") {
          const candidate = applyToneToSyllable(randBase, chosenTone);
          if (!distractorSet.has(candidate)) {
            distractorSet.add(candidate);
          }
        }
        fallbackAttempts++;
      }

      const optionsArray = [targetWithTone, ...Array.from(distractorSet)];
      while (optionsArray.length < 4) {
        const randomBase = pool[Math.floor(Math.random() * pool.length)] || "ba";
        const hanzi = getHanziForTone(randomBase, chosenTone);
        if (hanzi && hanzi !== "—" && hanzi !== "——") {
          const candidate = applyToneToSyllable(randomBase, chosenTone);
          if (!optionsArray.includes(candidate)) {
            optionsArray.push(candidate);
          }
        } else {
          const fallback = pool[Math.floor(Math.random() * pool.length)] || "ma";
          const candidate = applyToneToSyllable(fallback, chosenTone);
          if (!optionsArray.includes(candidate)) {
            optionsArray.push(candidate);
          }
        }
      }

      const options = optionsArray.sort(() => 0.5 - Math.random());
      const hanzi = getHanziForTone(baseTarget, chosenTone);

      generated.push({
        target: targetWithTone,
        base: baseTarget,
        tone: chosenTone,
        options,
        hanzi: hanzi || undefined,
        meaning: hanzi ? `Từ vựng Hán ngữ` : undefined,
      });
    }

    return generated;
  };

  const currentQ = questionList[quizIndex];

  // Timers Effect: Đếm ngược thời gian suy nghĩ
  useEffect(() => {
    if (!isGameRunning || quizChecked || isQuizFinished || !currentQ) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!quizChecked && currentQ) {
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
      if (questionList[nextIdx] && questionList[nextIdx].base) {
        setTimeout(() => playAudioTwiceWith2sInterval(questionList[nextIdx].base, questionList[nextIdx].tone), 300);
      }
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