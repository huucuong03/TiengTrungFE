"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  Typography,
  Table,
  Button,
  Tag,
  Tabs,
  Space,
  Radio,
  Progress,
  Result,
  message,
  Spin,
  Row,
  Col,
  Popconfirm,
} from "antd";
import {
  SoundOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  BulbOutlined,
  TrophyOutlined,
  CustomerServiceOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const TOTAL_QUESTIONS = 15;
const THINKING_TIME_LIMIT = 13; // 13s suy nghĩ
const EXPLANATION_TIME = 5;     // Dừng 5s giải thích đáp án

interface PinyinDataState {
  basic_finals: string[];
  nasal_finals: string[];
  special_red_syllables: string[];
  rows: any[];
}

interface QuestionItem {
  id?: number;
  target: string;
  base: string;
  tone: number;
  options: string[];
  hanzi?: string;
  meaning?: string;
}

const PINYIN_SOUND_MAPPING: Record<string, string> = {
  b: "波", p: "坡", m: "摸", f: "佛", d: "得", t: "特", n: "讷", l: "勒",
  g: "哥", k: "科", h: "喝", j: "鸡", q: "七", x: "西",
  zh: "知", ch: "吃", sh: "诗", r: "日", z: "资", c: "疵", s: "思",
  y: "衣", w: "乌",

  a: "啊", o: "喔", e: "鹅", i: "衣", u: "乌", ü: "迂", v: "迂",
  ai: "哀", ei: "诶", ao: "熬", ou: "欧", ia: "鸭", ie: "椰",
  ua: "蛙", uo: "窝", üe: "约", ve: "约", iao: "腰", iu: "优",
  uai: "歪", ui: "微", an: "安", en: "恩", in: "因", un: "温",
  ün: "晕", vn: "晕", ang: "昂", eng: "鞥", ing: "鹰", ong: "轰",
  ian: "烟", uan: "弯", üan: "冤", van: "冤", iang: "央", uang: "汪", iong: "雍",
};

const TONE_MARKS: Record<string, string[]> = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  o: ["ō", "ó", "ǒ", "ò"],
  i: ["ī", "í", "ǐ", "ì"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
  v: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

const TONE_HANZI_MAPPING: Record<string, string[]> = {
  a: ["啊", "啊", "啊", "啊"],
  o: ["喔", "哦", "ǒ", "ò"],
  e: ["婀", "鹅", "恶", "饿"],
  i: ["衣", "移", "椅", "意"],
  u: ["屋", "无", "五", "物"],
  ü: ["迂", "鱼", "雨", "玉"],
  v: ["迂", "鱼", "雨", "玉"],
  ai: ["哀", "癌", "矮", "爱"],
  ei: ["诶", "éi", "ěi", "èi"],
  ao: ["熬", "敖", "袄", "傲"],
  ou: ["欧", "ou", "偶", "藕"],
  an: ["安", "án", "ǎn", "暗"],
  en: ["恩", "én", "ěn", "èn"],
  ang: ["昂", "áng", "ǎng", "àng"],
  eng: ["鞥", "éng", "ěng", "èng"],
};

function applyToneToSyllable(syllable: string, tone: number): string {
  if (!syllable || tone < 1 || tone > 4) return syllable;
  const toneIdx = tone - 1;
  const str = syllable.toLowerCase();

  if (str.includes("a")) return str.replace("a", TONE_MARKS["a"][toneIdx]);
  if (str.includes("e")) return str.replace("e", TONE_MARKS["e"][toneIdx]);
  if (str.includes("ou")) return str.replace("o", TONE_MARKS["o"][toneIdx]);

  for (let i = str.length - 1; i >= 0; i--) {
    const char = str[i];
    if (TONE_MARKS[char]) {
      return str.slice(0, i) + TONE_MARKS[char][toneIdx] + str.slice(i + 1);
    }
  }
  return syllable;
}

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
  const [selectedTone, setSelectedTone] = useState<number>(0);

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
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const playSound = (text: string, tone: number = selectedTone) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    synth.cancel(); // Dừng các âm đang phát trước đó

    const clean = text.trim().toLowerCase();
    let textToSpeak = clean;

    if (tone > 0 && TONE_HANZI_MAPPING[clean] && TONE_HANZI_MAPPING[clean][tone - 1]) {
      textToSpeak = TONE_HANZI_MAPPING[clean][tone - 1];
    } else if (tone === 0 && PINYIN_SOUND_MAPPING[clean]) {
      textToSpeak = PINYIN_SOUND_MAPPING[clean];
    } else if (tone > 0) {
      textToSpeak = applyToneToSyllable(clean, tone);
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "zh-CN"; // Đặt chuẩn tiếng Trung Phổ Thông (Mandarin)
    utterance.rate = 0.8;   // Chỉnh tốc độ đọc chậm rãi (0.8) giúp nghe cực kỳ rõ thanh điệu 1, 2, 3, 4

    // Ép buộc trình duyệt tìm giọng tiếng Trung chuẩn nếu có sẵn trên thiết bị
    const voices = synth.getVoices();
    const zhVoice = voices.find(
      (v) => v.lang === "zh-CN" || v.lang === "zh_CN" || v.lang.toLowerCase().includes("zh")
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    synth.speak(utterance);
  };
  // Phát âm 2 lần cách nhau đúng 2 giây (2000ms)
  const playAudioTwiceWith2sInterval = (base: string, tone: number) => {
    playSound(base, tone);
    setTimeout(() => {
      playSound(base, tone);
    }, 3000);
  };

  const allValidSyllables = useMemo(() => {
    if (!data.rows || data.rows.length === 0) return [];
    const list: string[] = [];
    data.rows.forEach((row: any) => {
      Object.keys(row).forEach((k) => {
        if (k !== "group" && k !== "initial") {
          const val = row[k];
          if (val && typeof val === "string" && val.trim()) {
            list.push(val.trim());
          }
        }
      });
    });
    return Array.from(new Set(list));
  }, [data.rows]);

  /* ---------------- STATE BÀI TẬP 15 CÂU 15S & 7S GIẢI NGHĨA ---------------- */
  type ListeningMode = "tones" | "syllables" | "mixed";
  const [listeningMode, setListeningMode] = useState<ListeningMode>("tones");
  const [questionList, setQuestionList] = useState<QuestionItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string>("");
  const [quizChecked, setQuizChecked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(THINKING_TIME_LIMIT);
  const [explanationTimeLeft, setExplanationTimeLeft] = useState<number>(EXPLANATION_TIME);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [quizHistory, setQuizHistory] = useState<
    Array<{ target: string; selected: string; isCorrect: boolean; hanzi?: string; meaning?: string }>
  >([]);
  const [isGameRunning, setIsGameRunning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const explanationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (explanationTimerRef.current) {
      clearInterval(explanationTimerRef.current);
      explanationTimerRef.current = null;
    }
  };

  const buildRandomQuestionsFallback = (mode: ListeningMode): QuestionItem[] => {
    if (allValidSyllables.length < 4) return [];
    const shuffledPool = [...allValidSyllables].sort(() => 0.5 - Math.random());
    const generated: QuestionItem[] = [];

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const baseTarget = shuffledPool[i % shuffledPool.length];
      const randomTone = Math.floor(Math.random() * 4) + 1;
      const targetWithTone = applyToneToSyllable(baseTarget, randomTone);

      let options: string[] = [];
      if (mode === "tones") {
        options = [1, 2, 3, 4].map((t) => applyToneToSyllable(baseTarget, t));
      } else if (mode === "syllables") {
        const distractors = allValidSyllables.filter((s) => s !== baseTarget);
        const sampled = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [baseTarget, ...sampled]
          .map((s) => applyToneToSyllable(s, randomTone))
          .sort(() => 0.5 - Math.random());
      } else {
        const distractors = allValidSyllables.filter((s) => s !== baseTarget);
        const sampled = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [
          targetWithTone,
          ...sampled.map((s) => applyToneToSyllable(s, Math.floor(Math.random() * 4) + 1)),
        ].sort(() => 0.5 - Math.random());
      }

      generated.push({
        target: targetWithTone,
        base: baseTarget,
        tone: randomTone,
        options,
      });
    }

    return generated;
  };

  const startQuiz = async (mode: ListeningMode = listeningMode) => {
    clearAllTimers();
    setListeningMode(mode);
    setLoading(true);

    try {
      const res = await fetch(`https://tiengtrung-7hto.onrender.com/api/dictionary/pinyin-drills?mode=${mode}`);
      const resData = await res.json();

      let questions: QuestionItem[] = [];
      if (res.ok && resData.success && resData.questions && resData.questions.length > 0) {
        questions = resData.questions.map((q: any) => ({
          id: q.id,
          target: q.target_pinyin,
          base: q.base_pinyin,
          tone: q.tone,
          options: q.options,
          hanzi: q.hanzi,
          meaning: q.meaning,
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
        playAudioTwiceWith2sInterval(questions[0].base, questions[0].tone);
      }
    } catch {
      const fallbackQuestions = buildRandomQuestionsFallback(mode);
      setQuestionList(fallbackQuestions);
      setQuizIndex(0);
      setCorrectCount(0);
      setQuizHistory([]);
      setQuizSelected("");
      setQuizChecked(false);
      setTimeLeft(THINKING_TIME_LIMIT);
      setExplanationTimeLeft(EXPLANATION_TIME);
      setIsQuizFinished(false);
      setIsGameRunning(true);

      if (fallbackQuestions.length > 0) {
        playAudioTwiceWith2sInterval(fallbackQuestions[0].base, fallbackQuestions[0].tone);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questionList[quizIndex];

  // 1. Đồng hồ 15s suy nghĩ
  useEffect(() => {
    if (!isGameRunning || quizChecked || isQuizFinished) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeoutTrigger();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameRunning, quizIndex, quizChecked, isQuizFinished]);

  // 2. Đồng hồ 7s dừng giải thích đáp án
  useEffect(() => {
    if (!isGameRunning || !quizChecked || isQuizFinished) {
      if (explanationTimerRef.current) clearInterval(explanationTimerRef.current);
      return;
    }

    setExplanationTimeLeft(EXPLANATION_TIME);

    explanationTimerRef.current = setInterval(() => {
      setExplanationTimeLeft((prev) => {
        if (prev <= 1) {
          if (explanationTimerRef.current) clearInterval(explanationTimerRef.current);
          advanceToNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (explanationTimerRef.current) clearInterval(explanationTimerRef.current);
    };
  }, [isGameRunning, quizChecked, isQuizFinished]);

  // Hết 15s -> Kích hoạt trạng thái giải thích 7s
  const handleTimeoutTrigger = () => {
    if (quizChecked || !currentQ) return;
    setQuizChecked(true);
    setQuizSelected("Hết giờ");

    setQuizHistory((prev) => [
      ...prev,
      {
        target: currentQ.target,
        selected: "Hết giờ (15s)",
        isCorrect: false,
        hanzi: currentQ.hanzi,
        meaning: currentQ.meaning,
      },
    ]);
  };

  // Chọn đáp án -> Khóa bảng và kích hoạt giai đoạn 7s giải thích
  const handlePickOptionAndExplain = (selectedOption: string) => {
    if (quizChecked || !currentQ) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setQuizChecked(true);
    setQuizSelected(selectedOption);

    const isCorrect = selectedOption === currentQ.target;
    if (isCorrect) setCorrectCount((prev) => prev + 1);

    setQuizHistory((prev) => [
      ...prev,
      {
        target: currentQ.target,
        selected: selectedOption,
        isCorrect,
        hanzi: currentQ.hanzi,
        meaning: currentQ.meaning,
      },
    ]);
  };

  // Chuyển sang câu kế tiếp sau khi hết 7s
  const advanceToNextQuestion = () => {
    if (quizIndex < questionList.length - 1) {
      const nextIdx = quizIndex + 1;
      setQuizIndex(nextIdx);
      setQuizSelected("");
      setQuizChecked(false);
      setTimeLeft(THINKING_TIME_LIMIT);
      playAudioTwiceWith2sInterval(questionList[nextIdx].base, questionList[nextIdx].tone);
    } else {
      finishQuiz();
    }
  };

  const submitListeningLog = async (finalScore: number, finalCorrect: number, totalQ: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    try {
      await fetch("https://tiengtrung-7hto.onrender.com/api/notebook/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score: finalScore,
          correct_count: finalCorrect,
          total_words: totalQ,
          game_mode: `listening_${listeningMode}`,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const finishQuiz = () => {
    clearAllTimers();
    const attemptedCount = quizHistory.length || 1;
    const finalScore = Math.round((correctCount / attemptedCount) * 100);

    submitListeningLog(finalScore, correctCount, attemptedCount);
    setIsQuizFinished(true);
    setIsGameRunning(false);
  };

  const handleEarlyExit = () => {
    clearAllTimers();
    const attemptedCount = quizHistory.length;
    if (attemptedCount === 0) {
      setIsGameRunning(false);
      return;
    }
    finishQuiz();
  };

  /* ---------------- ROWSPAN THEO NHÓM ÂM ---------------- */
  const groupRowSpans = useMemo(() => {
    if (!data.rows || data.rows.length === 0) return [];
    const spans: number[] = [];
    let i = 0;
    while (i < data.rows.length) {
      const currentGroup = data.rows[i].group;
      let count = 0;
      for (let j = i; j < data.rows.length; j++) {
        if (data.rows[j].group === currentGroup) count++;
        else break;
      }
      spans.push(count);
      for (let k = 1; k < count; k++) spans.push(0);
      i += count;
    }
    return spans;
  }, [data.rows]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  const activeFinals: string[] =
    finalMode === "basic" ? (data.basic_finals || []) : (data.nasal_finals || []);

  const columns: any = [
    {
      title: <span style={{ fontWeight: 700, color: "#595959" }}>NGỮ ÂM</span>,
      dataIndex: "group",
      key: "group",
      align: "center",
      fixed: "left",
      width: 110,
      onCell: (_: any, index: number) => ({
        rowSpan: groupRowSpans[index] ?? 1,
      }),
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: "#595959", fontSize: 13 }}>
          {text}
        </span>
      ),
    },
    {
      title: <span style={{ fontWeight: 700, color: "#1677ff" }}>Thanh mẫu</span>,
      dataIndex: "initial",
      key: "initial",
      align: "center",
      fixed: "left",
      width: 80,
      render: (text: string) => (
        <div
          onClick={() => playSound(text, 0)}
          title={`Bấm để nghe Thanh mẫu "${text}"`}
          style={{
            cursor: "pointer",
            fontWeight: 800,
            fontSize: 16,
            color: "#1677ff",
          }}
        >
          {text}
        </div>
      ),
    },
    ...activeFinals.map((final: string) => {
      let key = final;
      if (final === "ü") key = "v";
      if (final === "üe") key = "ve";
      if (final === "ün") key = "vn";
      if (final === "üan") key = "van";

      const displayFinal = selectedTone > 0 ? applyToneToSyllable(final, selectedTone) : final;

      return {
        title: (
          <div
            onClick={() => playSound(final, selectedTone)}
            title={`Bấm để nghe Vận mẫu "${displayFinal}"`}
            style={{
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 14,
              color: "#d4380d",
              background: "#fff1f0",
              padding: "4px 0",
              borderRadius: 6,
              transition: "all 0.2s",
              userSelect: "none",
            }}
          >
            {displayFinal}
          </div>
        ),
        dataIndex: key,
        key: key,
        align: "center",
        width: 62,
        render: (value: string) => {
          if (!value) return <span style={{ color: "#e8e8e8" }}>—</span>;
          const isRed = data.special_red_syllables.includes(value);
          const displayValue = selectedTone > 0 ? applyToneToSyllable(value, selectedTone) : value;

          return (
            <Button
              type="text"
              onClick={() => playSound(value, selectedTone)}
              title={`Nghe âm: ${displayValue}`}
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: isRed ? "#cf1322" : "#262626",
                padding: "0 2px",
                height: 28,
              }}
            >
              {displayValue}
            </Button>
          );
        },
      };
    }),
  ];

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
          <CustomerServiceOutlined style={{ color: "#1677ff", marginRight: 8 }} />
          Bảng Ngữ Âm Pinyin & Đấu Trường Luyện Nghe
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          Luyện nghe 15 câu: Tự động đọc 2 lần (cách 2s), 15s suy nghĩ và dừng 7s phân tích đáp án chi tiết.
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
            label: (
              <span>
                <BulbOutlined /> Bảng Ngữ Âm Tương Tác
              </span>
            ),
            children: (
              <Card style={{ borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                    marginBottom: 16,
                    padding: "12px 16px",
                    background: "#f9fafb",
                    borderRadius: 12,
                  }}
                >
                  <Space wrap size="middle">
                    <Text strong style={{ color: "#4b5563" }}>Vận mẫu:</Text>
                    <Radio.Group
                      value={finalMode}
                      onChange={(e) => setFinalMode(e.target.value)}
                      buttonStyle="solid"
                    >
                      <Radio.Button value="basic">
                        1. Đơn & Kép ({data.basic_finals.length})
                      </Radio.Button>
                      <Radio.Button value="nasal">
                        2. Vận Mẫu Mũi ({data.nasal_finals.length})
                      </Radio.Button>
                    </Radio.Group>
                  </Space>

                  <Space wrap size="middle">
                    <Text strong style={{ color: "#1677ff" }}>Thanh điệu (Tone):</Text>
                    <Radio.Group
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      buttonStyle="solid"
                    >
                      <Radio.Button value={0}>Gốc (Không dấu)</Radio.Button>
                      <Radio.Button value={1}>Thanh 1 ( ā )</Radio.Button>
                      <Radio.Button value={2}>Thanh 2 ( á )</Radio.Button>
                      <Radio.Button value={3}>Thanh 3 ( ǎ )</Radio.Button>
                      <Radio.Button value={4}>Thanh 4 ( à )</Radio.Button>
                    </Radio.Group>
                  </Space>
                </div>

                <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Tag color="orange">Ô cam trên đầu: Bấm để nghe Vận mẫu theo thanh</Tag>
                  <Tag color="blue">Cột xanh: Bấm nghe Thanh mẫu</Tag>
                  <Tag color="red">Chữ màu đỏ: Âm biến điệu (j, q, x, y + ü)</Tag>
                </div>

                <Table
                  columns={columns}
                  dataSource={data.rows}
                  rowKey="initial"
                  pagination={false}
                  bordered
                  size="small"
                  scroll={{ x: "max-content" }}
                />
              </Card>
            ),
          },
          {
            key: "quiz",
            label: (
              <span>
                <TrophyOutlined /> Đấu Trường Phản Xạ (15 Câu • 15s)
              </span>
            ),
            children: (
              <div style={{ maxWidth: 840, margin: "0 auto" }}>
                {!isGameRunning && !isQuizFinished ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <Card
                      style={{
                        borderRadius: 16,
                        textAlign: "center",
                        background: "linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)",
                        border: "1px solid #adc6ff",
                      }}
                    >
                      <CustomerServiceOutlined style={{ fontSize: 44, color: "#1677ff", marginBottom: 12 }} />
                      <Title level={3} style={{ margin: "0 0 8px 0", fontWeight: 800 }}>
                        Luyện Phản Xạ Nghe 15s & Giải Nghĩa 7s
                      </Title>
                      <Paragraph type="secondary" style={{ fontSize: 15, maxWidth: 580, margin: "0 auto" }}>
                        Mỗi câu máy tự động đọc <strong>2 lần (cách 2 giây)</strong>. Bạn có <strong>15 giây suy nghĩ</strong>, chọn đáp án xong hệ thống sẽ <strong>dừng 7 giây giải thích</strong> mặt chữ và nghĩa trước khi chuyển câu!
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
                          <Button
                            type="primary"
                            block
                            icon={<PlayCircleOutlined />}
                            style={{ marginTop: 16, borderRadius: 8, background: "#fa8c16" }}
                          >
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
                          <Button
                            type="primary"
                            block
                            icon={<PlayCircleOutlined />}
                            style={{ marginTop: 16, borderRadius: 8, background: "#52c41a" }}
                          >
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
                          <Button
                            type="primary"
                            block
                            icon={<PlayCircleOutlined />}
                            style={{ marginTop: 16, borderRadius: 8 }}
                          >
                            Bắt đầu ngay
                          </Button>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                ) : isGameRunning && currentQ ? (
                  <Card style={{ borderRadius: 16, textAlign: "center", padding: "24px 20px" }}>
                    {/* Top Bar: Chế độ, Đếm ngược & Nút kết thúc sớm */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <Tag color="blue" style={{ fontSize: 13, padding: "3px 10px", borderRadius: 12 }}>
                        {listeningMode === "tones"
                          ? "🎯 Phân biệt 4 thanh"
                          : listeningMode === "syllables"
                          ? "⚡ Phản xạ âm ghép"
                          : "🌪️ Hỗn hợp"}
                      </Tag>

                      {/* Hiển thị thời gian: 15s suy nghĩ HOẶC 7s giải thích */}
                      {!quizChecked ? (
                        <Tag
                          color={timeLeft <= 3 ? "error" : "processing"}
                          icon={<ClockCircleOutlined />}
                          style={{ fontSize: 14, fontWeight: "bold", padding: "3px 12px", borderRadius: 12 }}
                        >
                          Thời gian suy nghĩ: {timeLeft}s
                        </Tag>
                      ) : (
                        <Tag
                          color="purple"
                          icon={<InfoCircleOutlined />}
                          style={{ fontSize: 14, fontWeight: "bold", padding: "3px 12px", borderRadius: 12 }}
                        >
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

                    {/* Thanh tiến độ câu hỏi */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Tiến độ bài thi</Text>
                        <Text strong style={{ fontSize: 12 }}>Câu {quizIndex + 1} / {TOTAL_QUESTIONS}</Text>
                      </div>
                      <Progress
                        percent={Math.round(((quizIndex + 1) / TOTAL_QUESTIONS) * 100)}
                        showInfo={false}
                        strokeColor="#1677ff"
                      />
                    </div>

                    {/* Nút Loa Phát Âm (Đọc 2 lần cách 2s) */}
                    <div style={{ margin: "20px 0" }}>
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<SoundOutlined style={{ fontSize: 36 }} />}
                        onClick={() => playAudioTwiceWith2sInterval(currentQ.base, currentQ.tone)}
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

                    {/* KHỐI GIẢI THÍCH CHI TIẾT (XUẤT HIỆN TRONG 7 GIÂY) */}
                    {quizChecked && (
                      <div
                        style={{
                          background: "#f6ffed",
                          padding: "12px 20px",
                          borderRadius: 12,
                          border: "1.5px solid #b7eb8f",
                          marginBottom: 20,
                          animation: "fadeIn 0.3s ease-in-out",
                        }}
                      >
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

                    {/* Danh Sách 4 Lựa Chọn */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        margin: "16px 0",
                        maxWidth: 480,
                        marginLeft: "auto",
                        marginRight: "auto",
                      }}
                    >
                      {currentQ.options.map((opt) => {
                        let isCorrectOpt = false;
                        let isWrongSelected = false;

                        if (quizChecked) {
                          if (opt === currentQ.target) {
                            isCorrectOpt = true;
                          } else if (opt === quizSelected) {
                            isWrongSelected = true;
                          }
                        }

                        return (
                          <Button
                            key={opt}
                            size="large"
                            danger={isWrongSelected}
                            disabled={quizChecked}
                            onClick={() => handlePickOptionAndExplain(opt)}
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
                ) : (
                  /* ================= MÀN HÌNH TỔNG KẾT BÀI THI ================= */
                  <Card style={{ borderRadius: 16, padding: "24px 16px" }}>
                    <Result
                      status={
                        quizHistory.length > 0 && correctCount / quizHistory.length >= 0.7
                          ? "success"
                          : "info"
                      }
                      title={
                        <span style={{ fontWeight: 800 }}>
                          {quizHistory.length === 0
                            ? "Đã hủy phiên luyện tập"
                            : correctCount / quizHistory.length >= 0.8
                            ? "🎉 Xuất Sắc! Phản Xạ Thính Giác Tiếng Trung Cực Nhạy!"
                            : correctCount / quizHistory.length >= 0.5
                            ? "👍 Khá Tốt! Cần Luyện Thêm Một Chút!"
                            : "💪 Cần Ôn Lại Bảng Ngữ Âm!"}
                        </span>
                      }
                      subTitle={
                        quizHistory.length > 0 ? (
                          <div style={{ fontSize: 16, marginTop: 8 }}>
                            Điểm số:{" "}
                            <strong style={{ color: "#fa8c16", fontSize: 22 }}>
                              {Math.round((correctCount / quizHistory.length) * 100)} / 100
                            </strong>{" "}
                            (Đúng {correctCount}/{quizHistory.length} câu đã làm)
                          </div>
                        ) : null
                      }
                      extra={[
                        <Button
                          type="primary"
                          key="retry"
                          size="large"
                          icon={<ReloadOutlined />}
                          onClick={() => startQuiz(listeningMode)}
                          style={{ borderRadius: 8 }}
                        >
                          Luyện tập lại (15 câu mới)
                        </Button>,
                        <Button
                          key="menu"
                          size="large"
                          onClick={() => {
                            setIsQuizFinished(false);
                            setIsGameRunning(false);
                          }}
                          style={{ borderRadius: 8 }}
                        >
                          Chọn chế độ khác
                        </Button>,
                        <Button key="table" size="large" onClick={() => setActiveTab("table")}>
                          Xem Bảng Pinyin
                        </Button>,
                      ]}
                    />

                    {quizHistory.length > 0 && (
                      <div style={{ marginTop: 24, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                        <Text strong style={{ fontSize: 15, display: "block", marginBottom: 12 }}>
                          Chi tiết kết quả ({quizHistory.length} câu):
                        </Text>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                          {quizHistory.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: item.isCorrect ? "#f6ffed" : "#fff2f0",
                                border: `1px solid ${item.isCorrect ? "#b7eb8f" : "#ffccc7"}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Space size={6}>
                                {item.isCorrect ? (
                                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                                ) : (
                                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                                )}
                                <div>
                                  <Text strong style={{ fontSize: 15 }}>{item.target}</Text>
                                  {item.hanzi && (
                                    <Text type="secondary" style={{ marginLeft: 6, fontSize: 13 }}>
                                      ({item.hanzi})
                                    </Text>
                                  )}
                                </div>
                              </Space>
                              {!item.isCorrect && (
                                <Text delete type="secondary" style={{ fontSize: 13 }}>
                                  {item.selected}
                                </Text>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}