"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Button, Typography, Tag, Space, Progress, message, Input, Row, Col, Divider } from "antd";
import {
  SoundOutlined,
  CheckOutlined,
  CloseOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface CharacterGameQuestion {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  strokes: number;
  radical: string;
  examples: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GameCharacterPracticeProps {
  sessionData?: any;
  onFinishGame?: (score: number, correct: number) => void;
  playAudio: (text: string) => void;
  updateScoreAndCorrect?: (points: number, isCorrect: boolean) => void;
}

// Dữ liệu mẫu
const SAMPLE_CHARACTERS: CharacterGameQuestion[] = [
  { id: 'c1', character: '我', pinyin: 'wǒ', meaning: 'tôi', strokes: 7, radical: '戈', examples: ['我们', '我的', '自我'], difficulty: 'easy' },
  { id: 'c2', character: '你', pinyin: 'nǐ', meaning: 'bạn', strokes: 7, radical: '亻', examples: ['你好', '你们', '你的'], difficulty: 'easy' },
  { id: 'c3', character: '好', pinyin: 'hǎo', meaning: 'tốt, đẹp', strokes: 6, radical: '女', examples: ['很好', '好的', '好吃'], difficulty: 'easy' },
  { id: 'c4', character: '学', pinyin: 'xué', meaning: 'học', strokes: 8, radical: '子', examples: ['学习', '学校', '学生'], difficulty: 'medium' },
  { id: 'c5', character: '生', pinyin: 'shēng', meaning: 'sinh, sống', strokes: 5, radical: '生', examples: ['学生', '生活', '生日'], difficulty: 'medium' },
  { id: 'c6', character: '中', pinyin: 'zhōng', meaning: 'trung, giữa', strokes: 4, radical: '丨', examples: ['中国', '中文', '中间'], difficulty: 'easy' },
  { id: 'c7', character: '国', pinyin: 'guó', meaning: 'nước', strokes: 8, radical: '囗', examples: ['中国', '国家', '外国'], difficulty: 'medium' },
  { id: 'c8', character: '爱', pinyin: 'ài', meaning: 'yêu', strokes: 10, radical: '爫', examples: ['爱人', '爱好', '爱情'], difficulty: 'hard' },
];

export default function GameCharacterPractice({
  sessionData,
  onFinishGame,
  playAudio,
  updateScoreAndCorrect,
}: GameCharacterPracticeProps) {
  const [questions, setQuestions] = useState<CharacterGameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const inputRef = useRef<any>(null);

  useEffect(() => {
    // Lấy từ sessionData hoặc dùng mẫu
    if (sessionData?.game5_writing) {
      const converted = sessionData.game5_writing.map((item: any, idx: number) => ({
        id: `c-${idx}`,
        character: item.char,
        pinyin: item.pinyin,
        meaning: item.meaning || '',
        strokes: item.char.length * 2 + 2,
        radical: '?',
        examples: [item.full_hanzi],
        difficulty: 'medium' as const,
      }));
      setQuestions(converted);
    } else {
      setQuestions(SAMPLE_CHARACTERS);
    }
  }, [sessionData]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const handleSubmit = () => {
    if (!userInput.trim() || isChecked) return;

    const isCorrectInput = userInput.trim() === currentQuestion?.character;
    setIsChecked(true);
    setIsCorrect(isCorrectInput);

    if (isCorrectInput) {
      const points = 20 - attempts * 3;
      const finalPoints = Math.max(points, 5);
      setScore((prev) => prev + finalPoints);
      setCorrectCount((prev) => prev + 1);
      if (updateScoreAndCorrect) {
        updateScoreAndCorrect(finalPoints, true);
      }
      message.success(`✅ Đúng! +${finalPoints} điểm`);
    } else {
      setAttempts((prev) => prev + 1);
      if (updateScoreAndCorrect) {
        updateScoreAndCorrect(0, false);
      }
      message.error(`❌ Sai! Đáp án: ${currentQuestion?.character}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput('');
      setIsChecked(false);
      setIsCorrect(false);
      setShowAnswer(false);
      setAttempts(0);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      if (onFinishGame) {
        onFinishGame(score, correctCount);
      }
      message.success(`🎉 Hoàn thành! Điểm: ${score}`);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setUserInput('');
    setIsChecked(false);
    setIsCorrect(false);
    setShowAnswer(false);
    setAttempts(0);
    setScore(0);
    setCorrectCount(0);
  };

  if (!currentQuestion || totalQuestions === 0) {
    return (
      <Card style={{ textAlign: 'center', padding: 40 }}>
        <Text>Không có dữ liệu</Text>
        <Button onClick={handleReset}>Làm mới</Button>
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Space>
          <Tag color="blue" style={{ fontSize: 13, padding: '3px 10px', borderRadius: 12 }}>
            ✍️ Chữ {currentIndex + 1}/{totalQuestions}
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

      {/* Thông tin chữ */}
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 8 }}>
          Pinyin: <Tag color="blue" style={{ fontSize: 16 }}>{currentQuestion.pinyin}</Tag>
        </div>
        <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 8 }}>
          Nghĩa: <strong>{currentQuestion.meaning}</strong>
        </div>
        <div style={{ fontSize: 13, color: '#8c8c8c' }}>
          Số nét: {currentQuestion.strokes} | Bộ thủ: {currentQuestion.radical}
        </div>
        <Button
          type="primary"
          shape="circle"
          icon={<SoundOutlined style={{ fontSize: 20 }} />}
          onClick={() => playAudio(currentQuestion.pinyin)}
          style={{ marginTop: 12, width: 48, height: 48 }}
        />
      </div>

      {/* Hiển thị chữ nếu đã xem đáp án */}
      {showAnswer && (
        <div style={{ textAlign: 'center', padding: '16px', background: '#f6ffed', borderRadius: 12, border: '1px solid #b7eb8f', marginBottom: 16 }}>
          <Text style={{ fontSize: 64, color: '#52c41a' }}>{currentQuestion.character}</Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">Ví dụ: </Text>
            {currentQuestion.examples.map((ex, idx) => (
              <Tag key={idx} color="cyan" style={{ fontSize: 14, padding: '2px 10px', cursor: 'pointer' }} onClick={() => playAudio(ex)}>
                {ex}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* Ô nhập */}
      <div style={{ marginBottom: 16 }}>
        <Text strong>✍️ Viết chữ Hán:</Text>
        <Input
          ref={inputRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Nhập chữ Hán..."
          size="large"
          style={{
            fontSize: 32,
            textAlign: 'center',
            marginTop: 8,
            height: 72,
            borderColor: isChecked ? (isCorrect ? '#52c41a' : '#ff4d4f') : undefined,
          }}
          disabled={isChecked}
          onPressEnter={handleSubmit}
          autoFocus
        />
        {isChecked && (
          <div style={{ marginTop: 8, textAlign: 'center', fontSize: 16 }}>
            {isCorrect ? (
              <Text style={{ color: '#52c41a' }}>✅ Đúng rồi!</Text>
            ) : (
              <Text style={{ color: '#ff4d4f' }}>❌ Sai rồi! Đáp án: <strong>{currentQuestion.character}</strong></Text>
            )}
          </div>
        )}
      </div>

      {/* Nút hành động */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        {!isChecked && (
          <Button type="primary" size="large" onClick={handleSubmit} disabled={!userInput.trim()}>
            Kiểm tra
          </Button>
        )}
        <Button icon={<EyeOutlined />} onClick={() => setShowAnswer(!showAnswer)}>
          {showAnswer ? 'Ẩn đáp án' : 'Xem đáp án'}
        </Button>
        {isChecked && (
          <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={handleNext}>
            {currentIndex < totalQuestions - 1 ? 'Chữ tiếp theo' : 'Hoàn thành'}
          </Button>
        )}
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          Làm lại
        </Button>
      </div>

      {/* Thông tin thêm */}
      {currentQuestion.examples.length > 0 && !showAnswer && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Từ ghép: </Text>
          {currentQuestion.examples.map((ex, idx) => (
            <Tag key={idx} color="default" style={{ fontSize: 13, cursor: 'pointer' }} onClick={() => playAudio(ex)}>
              {ex}
            </Tag>
          ))}
        </div>
      )}
    </Card>
  );
}