"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, Button, Typography, Tag, Space, Progress, message, Input, Badge } from "antd";
import {
  SoundOutlined,
  CheckOutlined,
  CloseOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  BulbOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface SentenceGameWord {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  position: number;
  isBlank?: boolean;
}

interface SentenceGameQuestion {
  id: string;
  fullSentence: string;
  fullPinyin: string;
  meaning: string;
  words: SentenceGameWord[];
  blankIndex: number;
  blankWord: SentenceGameWord;
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GameSentencePracticeProps {
  sessionData?: any;
  onFinishGame?: (score: number, correct: number) => void;
  playAudio: (text: string) => void;
  updateScoreAndCorrect?: (points: number, isCorrect: boolean) => void;
}

// Dữ liệu câu mẫu
const SAMPLE_SENTENCES: SentenceGameQuestion[] = [
  {
    id: 's1',
    fullSentence: '今天天气很好',
    fullPinyin: 'jīntiān tiānqì hěn hǎo',
    meaning: 'Hôm nay thời tiết rất đẹp',
    words: [
      { id: 'w1', hanzi: '今天', pinyin: 'jīntiān', meaning: 'hôm nay', position: 0 },
      { id: 'w2', hanzi: '天气', pinyin: 'tiānqì', meaning: 'thời tiết', position: 1 },
      { id: 'w3', hanzi: '很', pinyin: 'hěn', meaning: 'rất', position: 2 },
      { id: 'w4', hanzi: '好', pinyin: 'hǎo', meaning: 'tốt, đẹp', position: 3 },
    ],
    blankIndex: 1,
    blankWord: { id: 'w2', hanzi: '天气', pinyin: 'tiānqì', meaning: 'thời tiết', position: 1 },
    options: ['天气', '今天', '很好', '好的'],
    difficulty: 'easy',
  },
  {
    id: 's2',
    fullSentence: '我在学校学习中文',
    fullPinyin: 'wǒ zài xuéxiào xuéxí zhōngwén',
    meaning: 'Tôi học tiếng Trung ở trường',
    words: [
      { id: 'w5', hanzi: '我', pinyin: 'wǒ', meaning: 'tôi', position: 0 },
      { id: 'w6', hanzi: '在', pinyin: 'zài', meaning: 'ở', position: 1 },
      { id: 'w7', hanzi: '学校', pinyin: 'xuéxiào', meaning: 'trường học', position: 2 },
      { id: 'w8', hanzi: '学习', pinyin: 'xuéxí', meaning: 'học tập', position: 3 },
      { id: 'w9', hanzi: '中文', pinyin: 'zhōngwén', meaning: 'tiếng Trung', position: 4 },
    ],
    blankIndex: 2,
    blankWord: { id: 'w7', hanzi: '学校', pinyin: 'xuéxiào', meaning: 'trường học', position: 2 },
    options: ['学校', '学习', '中文', '我在'],
    difficulty: 'easy',
  },
  {
    id: 's3',
    fullSentence: '我喜欢吃中国菜',
    fullPinyin: 'wǒ xǐhuān chī zhōngguó cài',
    meaning: 'Tôi thích ăn đồ ăn Trung Quốc',
    words: [
      { id: 'w10', hanzi: '我', pinyin: 'wǒ', meaning: 'tôi', position: 0 },
      { id: 'w11', hanzi: '喜欢', pinyin: 'xǐhuān', meaning: 'thích', position: 1 },
      { id: 'w12', hanzi: '吃', pinyin: 'chī', meaning: 'ăn', position: 2 },
      { id: 'w13', hanzi: '中国', pinyin: 'zhōngguó', meaning: 'Trung Quốc', position: 3 },
      { id: 'w14', hanzi: '菜', pinyin: 'cài', meaning: 'món ăn', position: 4 },
    ],
    blankIndex: 3,
    blankWord: { id: 'w13', hanzi: '中国', pinyin: 'zhōngguó', meaning: 'Trung Quốc', position: 3 },
    options: ['中国', '喜欢', '吃菜', '我'],
    difficulty: 'medium',
  },
  {
    id: 's4',
    fullSentence: '他每天早上去公园跑步',
    fullPinyin: 'tā měitiān zǎoshang qù gōngyuán pǎobù',
    meaning: 'Anh ấy mỗi ngày sáng đi công viên chạy bộ',
    words: [
      { id: 'w15', hanzi: '他', pinyin: 'tā', meaning: 'anh ấy', position: 0 },
      { id: 'w16', hanzi: '每天', pinyin: 'měitiān', meaning: 'mỗi ngày', position: 1 },
      { id: 'w17', hanzi: '早上', pinyin: 'zǎoshang', meaning: 'buổi sáng', position: 2 },
      { id: 'w18', hanzi: '去', pinyin: 'qù', meaning: 'đi', position: 3 },
      { id: 'w19', hanzi: '公园', pinyin: 'gōngyuán', meaning: 'công viên', position: 4 },
      { id: 'w20', hanzi: '跑步', pinyin: 'pǎobù', meaning: 'chạy bộ', position: 5 },
    ],
    blankIndex: 4,
    blankWord: { id: 'w19', hanzi: '公园', pinyin: 'gōngyuán', meaning: 'công viên', position: 4 },
    options: ['公园', '早上', '跑步', '每天'],
    difficulty: 'medium',
  },
  {
    id: 's5',
    fullSentence: '这个苹果很好吃',
    fullPinyin: 'zhège píngguǒ hěn hǎo chī',
    meaning: 'Quả táo này rất ngon',
    words: [
      { id: 'w21', hanzi: '这个', pinyin: 'zhège', meaning: 'cái này', position: 0 },
      { id: 'w22', hanzi: '苹果', pinyin: 'píngguǒ', meaning: 'quả táo', position: 1 },
      { id: 'w23', hanzi: '很', pinyin: 'hěn', meaning: 'rất', position: 2 },
      { id: 'w24', hanzi: '好吃', pinyin: 'hǎo chī', meaning: 'ngon', position: 3 },
    ],
    blankIndex: 1,
    blankWord: { id: 'w22', hanzi: '苹果', pinyin: 'píngguǒ', meaning: 'quả táo', position: 1 },
    options: ['苹果', '这个', '好吃', '很好'],
    difficulty: 'easy',
  },
];

export default function GameSentencePractice({
  sessionData,
  onFinishGame,
  playAudio,
  updateScoreAndCorrect,
}: GameSentencePracticeProps) {
  const [questions, setQuestions] = useState<SentenceGameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Lấy câu từ sessionData hoặc dùng mẫu
    if (sessionData?.game4_sentence) {
      const converted = sessionData.game4_sentence.map((item: any, idx: number) => {
        const words = item.correct_sequence.map((w: any, i: number) => ({
          id: `w-${idx}-${i}`,
          hanzi: w.zh,
          pinyin: w.py,
          meaning: '',
          position: i,
        }));
        const blankIndex = Math.floor(Math.random() * words.length);
        const blankWord = words[blankIndex];
        const options = [
          blankWord.hanzi,
          ...words.filter((_: any, i: number) => i !== blankIndex)
            .slice(0, 3)
            .map((w: any) => w.hanzi),
        ].sort(() => 0.5 - Math.random());

        return {
          id: `s-${idx}`,
          fullSentence: item.full_sentence,
          fullPinyin: item.full_pinyin,
          meaning: item.vi || 'Câu tiếng Trung',
          words,
          blankIndex,
          blankWord,
          options: options.slice(0, 4),
          difficulty: 'medium' as const,
        };
      });
      setQuestions(converted);
    } else {
      setQuestions(SAMPLE_SENTENCES);
    }
  }, [sessionData]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  // Tạo câu hiển thị với ô trống
  const displaySentence = useMemo(() => {
    if (!currentQuestion) return [];
    return currentQuestion.words.map((word, index) => {
      if (index === currentQuestion.blankIndex) {
        return { ...word, isBlank: true };
      }
      return word;
    });
  }, [currentQuestion]);

  const handleSelectOption = (option: string) => {
    if (isChecked) return;
    setSelectedOption(option);
    setIsChecked(true);

    const correct = option === currentQuestion?.blankWord.hanzi;
    setIsCorrect(correct);

    if (correct) {
      const points = 20 - attempts * 5;
      const finalPoints = Math.max(points, 5);
      setScore((prev) => prev + finalPoints);
      setCorrectCount((prev) => prev + 1);
      if (updateScoreAndCorrect) {
        updateScoreAndCorrect(finalPoints, true);
      }
      message.success(`✅ Chính xác! +${finalPoints} điểm`);
    } else {
      setAttempts((prev) => prev + 1);
      if (updateScoreAndCorrect) {
        updateScoreAndCorrect(0, false);
      }
      message.error(`❌ Sai rồi! Đáp án đúng là: ${currentQuestion?.blankWord.hanzi}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsChecked(false);
      setIsCorrect(false);
      setShowHint(false);
      setAttempts(0);
    } else {
      if (onFinishGame) {
        onFinishGame(score, correctCount);
      }
      message.success(`🎉 Hoàn thành! Điểm: ${score}`);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);
    setShowHint(false);
    setAttempts(0);
    setScore(0);
    setCorrectCount(0);
  };

  if (!currentQuestion || totalQuestions === 0) {
    return (
      <Card style={{ textAlign: 'center', padding: 40 }}>
        <Text>Không có câu hỏi nào</Text>
        <Button onClick={handleReset}>Làm mới</Button>
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Space>
          <Tag color="blue" style={{ fontSize: 13, padding: '3px 10px', borderRadius: 12 }}>
            📝 Câu {currentIndex + 1}/{totalQuestions}
          </Tag>
          <Tag color={currentQuestion.difficulty === 'easy' ? 'green' : currentQuestion.difficulty === 'medium' ? 'orange' : 'red'}>
            {currentQuestion.difficulty === 'easy' ? 'Dễ' : currentQuestion.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
          </Tag>
        </Space>
        <Space>
          <Tag color="gold">⭐ {score}đ</Tag>
          <Tag color="green">✅ {correctCount}</Tag>
        </Space>
      </div>

      <Progress percent={Math.round(progress)} showInfo={false} strokeColor="#1677ff" />

      {/* Nghĩa câu */}
      <div style={{ textAlign: 'center', margin: '16px 0', padding: '12px', background: '#f0f5ff', borderRadius: 12 }}>
        <Text type="secondary" style={{ fontSize: 14 }}>
          📖 Nghĩa: <strong>{currentQuestion.meaning}</strong>
        </Text>
        <Button
          type="text"
          icon={<SoundOutlined />}
          onClick={() => playAudio(currentQuestion.fullSentence)}
          size="small"
          style={{ marginLeft: 8 }}
        >
          Nghe
        </Button>
      </div>

      {/* Câu với ô trống */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        padding: '20px 16px',
        background: '#fafafa',
        borderRadius: 16,
        minHeight: 80,
        border: '1px solid #f0f0f0',
        marginBottom: 20,
      }}>
        {displaySentence.map((word, index) => {
          if (word.isBlank) {
            return (
              <div
                key={`blank-${index}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 60,
                  minHeight: 44,
                  padding: '4px 12px',
                  background: isChecked ? (isCorrect ? '#f6ffed' : '#fff2f0') : '#fffbe6',
                  border: `2px dashed ${isChecked ? (isCorrect ? '#52c41a' : '#ff4d4f') : '#faad14'}`,
                  borderRadius: 8,
                  fontSize: 20,
                  fontWeight: 700,
                  color: isChecked ? (isCorrect ? '#52c41a' : '#ff4d4f') : '#d48806',
                }}
              >
                {isChecked ? (isCorrect ? '✅' : '❌') : '___'}
                {isChecked && !isCorrect && (
                  <span style={{ fontSize: 16, marginLeft: 8, color: '#52c41a' }}>
                    {currentQuestion.blankWord.hanzi}
                  </span>
                )}
              </div>
            );
          }
          return (
            <span
              key={word.id}
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: '#262626',
                padding: '4px 4px',
              }}
            >
              {word.hanzi}
              <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 2 }}>
                ({word.pinyin})
              </span>
            </span>
          );
        })}
      </div>

      {/* Pinyin đầy đủ */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 14 }}>
          🔤 Pinyin: <Text code>{currentQuestion.fullPinyin}</Text>
        </Text>
      </div>

      {/* Gợi ý */}
      {showHint && !isChecked && (
        <div style={{ background: '#fffbe6', padding: '12px 16px', borderRadius: 12, border: '1px solid #ffe58f', marginBottom: 16 }}>
          <Text type="secondary">
            💡 Gợi ý: <strong>{currentQuestion.blankWord.meaning}</strong>
          </Text>
        </div>
      )}

      {/* Lựa chọn */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {currentQuestion.options.map((option) => {
          let isSelected = selectedOption === option;
          let isCorrectOption = isChecked && option === currentQuestion.blankWord.hanzi;
          let isWrongOption = isChecked && isSelected && option !== currentQuestion.blankWord.hanzi;

          return (
            <Button
              key={option}
              size="large"
              disabled={isChecked}
              onClick={() => handleSelectOption(option)}
              style={{
                height: 52,
                fontSize: 18,
                fontWeight: 700,
                borderRadius: 12,
                background: isCorrectOption ? '#52c41a' : isWrongOption ? '#ff4d4f' : '#ffffff',
                borderColor: isCorrectOption ? '#52c41a' : isWrongOption ? '#ff4d4f' : '#d9d9d9',
                color: isCorrectOption || isWrongOption ? '#ffffff' : '#262626',
              }}
            >
              {option}
              {isCorrectOption && <CheckOutlined style={{ marginLeft: 8 }} />}
              {isWrongOption && <CloseOutlined style={{ marginLeft: 8 }} />}
            </Button>
          );
        })}
      </div>

      {/* Hành động */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        {!isChecked && (
          <Button icon={<BulbOutlined />} onClick={() => setShowHint(!showHint)}>
            {showHint ? 'Ẩn gợi ý' : 'Gợi ý'}
          </Button>
        )}
        {isChecked && (
          <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={handleNext}>
            {currentIndex < totalQuestions - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
          </Button>
        )}
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          Làm lại
        </Button>
        <Button onClick={() => playAudio(currentQuestion.fullSentence)} icon={<SoundOutlined />}>
          Nghe cả câu
        </Button>
      </div>
    </Card>
  );
}