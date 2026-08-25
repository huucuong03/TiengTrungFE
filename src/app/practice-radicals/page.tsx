"use client";

import {
  Card,
  Typography,
  Button,
  Space,
} from "antd";
import { useState } from "react";

const { Title, Text } = Typography;

const questions = [
  {
    radical: "木",
    answer: "Mộc",
    options: [
      "Mộc",
      "Thủy",
      "Hỏa",
      "Kim",
    ],
  },
  {
    radical: "水",
    answer: "Thủy",
    options: [
      "Mộc",
      "Thủy",
      "Hỏa",
      "Kim",
    ],
  },
  {
    radical: "火",
    answer: "Hỏa",
    options: [
      "Mộc",
      "Thủy",
      "Hỏa",
      "Kim",
    ],
  },
];

export default function PracticeRadicalsPage() {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] =
    useState<boolean | null>(null);

  const question = questions[index];

  function answer(option: string) {
    setCorrect(
      option === question.answer
    );
  }

  function next() {
    setCorrect(null);
    setIndex(
      (index + 1) % questions.length
    );
  }

  return (
    <div>
      <Title>🧩 Luyện bộ thủ</Title>

      <Card>
        <Text>
          Bộ thủ {index + 1}/
          {questions.length}
        </Text>

        <div
          style={{
            fontSize: 140,
            textAlign: "center",
            margin: "30px 0",
          }}
        >
          {question.radical}
        </div>

        <Space wrap>
          {question.options.map(
            (option) => (
              <Button
                key={option}
                size="large"
                onClick={() =>
                  answer(option)
                }
              >
                {option}
              </Button>
            )
          )}
        </Space>

        {correct !== null && (
          <Card
            style={{
              marginTop: 24,
            }}
          >
            {correct
              ? "✅ Chính xác!"
              : `❌ Sai. Đáp án: ${question.answer}`}
          </Card>
        )}

        {correct !== null && (
          <Button
            type="primary"
            style={{
              marginTop: 16,
            }}
            onClick={next}
          >
            Câu tiếp theo
          </Button>
        )}
      </Card>
    </div>
  );
}