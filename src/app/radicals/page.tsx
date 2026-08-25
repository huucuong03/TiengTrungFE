"use client";

import { useEffect, useState } from "react";
import { Card, Input, Spin, Typography, Empty } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

interface Radical {
  character: string;
  pinyin?: string;
  meaning?: string;
  strokes?: number;
  components?: string[];
  analysis?: string;
}

interface RadicalResponse {
  success: boolean;
  total: number;
  data: Radical[];
}

export default function RadicalDictionary() {
  const router = useRouter();

  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRadicals();
  }, []);

  async function loadRadicals() {
    try {
      setLoading(true);

      const response = await fetch(
        "https://tiengtrung-7hto.onrender.com/api/radicals"
      );

      if (!response.ok) {
        throw new Error(`API ${response.status}`);
      }

      const result: RadicalResponse =
        await response.json();

      console.log("RADICAL API:", result);

      if (Array.isArray(result.data)) {
        setRadicals(result.data);
      } else {
        setRadicals([]);
      }
    } catch (error) {
      console.error(
        "Không lấy được danh sách bộ thủ:",
        error
      );

      setRadicals([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = radicals.filter((item) => {
    const keyword = search
      .toLowerCase()
      .trim();

    if (!keyword) {
      return true;
    }

    return (
      item.character.includes(keyword) ||
      item.pinyin
        ?.toLowerCase()
        .includes(keyword) ||
      item.meaning
        ?.toLowerCase()
        .includes(keyword) ||
      item.analysis
        ?.toLowerCase()
        .includes(keyword)
    );
  });

  function openRadical(character: string) {
    router.push(
      `/radicals/${encodeURIComponent(character)}`
    );
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: 400,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1600,
        margin: "0 auto",
        padding: "32px 20px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <Title
          level={2}
          style={{
            marginBottom: 6,
          }}
        >
          📚 Từ điển bộ thủ
        </Title>

        <Text type="secondary">
          {radicals.length} bộ thủ tiếng Trung
        </Text>
      </div>

      {/* SEARCH */}
      <Input
        size="large"
        prefix={<SearchOutlined />}
        placeholder="Tìm bộ thủ, pinyin hoặc nghĩa..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        allowClear
        style={{
          maxWidth: 600,
          marginBottom: 28,
        }}
      />

      {/* RESULT */}
      {filtered.length === 0 ? (
        <Empty
          description="Không tìm thấy bộ thủ"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((item) => (
            <Card
              key={item.character}
              hoverable
              onClick={() =>
                openRadical(item.character)
              }
              styles={{
                body: {
                  padding: "16px 10px",
                },
              }}
            >
              {/* CHARACTER */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: 48,
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                {item.character}
              </div>

              {/* PINYIN */}
              {item.pinyin && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {item.pinyin}
                </div>
              )}

              {/* MEANING */}
              {item.meaning && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 5,
                    fontSize: 12,
                    color: "#666",
                    minHeight: 32,
                  }}
                >
                  {item.meaning}
                </div>
              )}

              {/* STROKES */}
              {item.strokes !== undefined && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 6,
                    fontSize: 11,
                    color: "#999",
                  }}
                >
                  {item.strokes} nét
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}