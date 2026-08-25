"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Typography,
  Tag,
  Spin,
  Button,
  Space,
  Empty,
  Row,
  Col,
  Tooltip,
  Divider,
} from "antd";
import {
  AudioOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  EditOutlined,
  SoundOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  ReadOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";

import StrokeOrder from "@/components/StrokeOrder";

const { Title, Text, Paragraph } = Typography;

/* =========================================================
 * TYPES
 * ========================================================= */

interface WordDetail {
  word: string;
  pinyin?: string;
  meaning?: string;
}

interface ExampleDetail {
  character: string;
  pinyin?: string;
  meaning?: string;
}

interface ComponentDetail {
  character: string;
  pinyin?: string;
  meaning?: string;
  radical_belong?: string;
  strokes?: number;
}

interface RadicalDetail {
  character: string;
  pinyin?: string;
  meaning?: string;
  strokes?: number;
  components?: (string | ComponentDetail)[];
  analysis?: string;
  examples?: (string | ExampleDetail)[];
  combinations?: string[];
  words?: (string | WordDetail)[];
}

/* =========================================================
 * HELPERS
 * ========================================================= */

function parseCombinationString(itemStr: string) {
  if (!itemStr || !itemStr.includes("=")) {
    return {
      componentsList: itemStr ? [itemStr.trim()] : [],
      resultChar: "",
      pinyin: "",
      meaning: "",
    };
  }

  const [leftPart, ...rightParts] = itemStr.split("=");

  const componentsList = leftPart
    .split("+")
    .map((item) => item.trim())
    .filter(Boolean);

  const rightPart = rightParts.join("=").trim();

  const match = rightPart.match(
    /^(.+?)(?:\s*\(([^:()]+)(?::\s*(.*?))?\))?$/
  );

  let resultChar = rightPart;
  let pinyin = "";
  let meaning = "";

  if (match) {
    resultChar = match[1]?.trim() || "";
    pinyin = match[2]?.trim() || "";
    meaning = match[3]?.trim() || "";
  }

  return {
    componentsList,
    resultChar,
    pinyin,
    meaning,
  };
}

/* =========================================================
 * MAIN PAGE
 * ========================================================= */

export default function RadicalDetailPage() {
  const params = useParams();
  const router = useRouter();

  const radical = decodeURIComponent(String(params.id));

  const [data, setData] = useState<RadicalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // States quản lý đóng / mở rộng nội dung
  const [expandCombinations, setExpandCombinations] = useState(false);
  const [expandComponents, setExpandComponents] = useState(false);
  const [expandExamples, setExpandExamples] = useState(false);

  /* =======================================================
   * LOAD DATA
   * ======================================================= */

  useEffect(() => {
    loadDetail();
    // Reset trạng thái thu gọn khi đổi bộ thủ
    setExpandCombinations(false);
    setExpandComponents(false);
    setExpandExamples(false);
  }, [radical]);

  async function loadDetail() {
    try {
      setLoading(true);

      const response = await fetch(
        `https://tiengtrung-7hto.onrender.com/api/radicals/${encodeURIComponent(radical)}`
      );

      if (!response.ok) {
        throw new Error(`API ${response.status}`);
      }

      const result = await response.json();
      const detail = result?.data ?? result;

      setData(detail);
    } catch (error) {
      console.error("Không lấy được chi tiết bộ thủ:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
   * SPEECH
   * ======================================================= */

  function speak(text: string) {
    if (!text || typeof window === "undefined") return;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "zh-CN";
    speech.rate = 0.8;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  }

  /* =======================================================
   * LOADING & EMPTY
   * ======================================================= */

  if (loading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8fa",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/radicals")}
        >
          Quay lại bộ thủ
        </Button>

        <div style={{ marginTop: 60 }}>
          <Empty description="Không tìm thấy dữ liệu bộ thủ" />
        </div>
      </div>
    );
  }

  const components = data.components ?? [];
  const examples = data.examples ?? [];
  const combinations = data.combinations ?? [];
  const words = data.words ?? [];

  // Phân trang danh sách hiển thị
  const visibleCombinations = expandCombinations ? combinations : combinations.slice(0, 4);
  const visibleComponents = expandComponents ? components : components.slice(0, 8);
  const visibleExamples = expandExamples ? examples : examples.slice(0, 12);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f7f9",
        paddingBottom: 60,
      }}
    >
      <div
        style={{
          maxWidth: 1450,
          margin: "0 auto",
          padding: "24px 20px",
        }}
      >
        {/* BACK BUTTON */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/radicals")}
          style={{
            paddingLeft: 0,
            marginBottom: 18,
            color: "#595959",
          }}
        >
          Quay lại danh sách bộ thủ
        </Button>

        {/* HERO CARD */}
        <Card
          bordered={false}
          style={{
            borderRadius: 18,
            marginBottom: 24,
            overflow: "hidden",
            boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
          }}
          styles={{ body: { padding: 0 } }}
        >
          <Row>
            <Col xs={24} md={8} lg={7}>
              <div
                style={{
                  minHeight: 280,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%)",
                  borderRight: "1px solid #f0f0f0",
                  padding: 30,
                }}
              >
                <div
                  style={{
                    fontSize: 150,
                    lineHeight: 1,
                    fontWeight: 500,
                    color: "#1f1f1f",
                  }}
                >
                  {data.character}
                </div>

                <Button
                  type="primary"
                  ghost
                  icon={<AudioOutlined />}
                  onClick={() => speak(data.character)}
                  style={{
                    marginTop: 20,
                    borderRadius: 20,
                  }}
                >
                  Phát âm
                </Button>
              </div>
            </Col>

            <Col xs={24} md={16} lg={17}>
              <div
                style={{
                  padding: "34px 36px",
                  height: "100%",
                }}
              >
                <Text
                  type="secondary"
                  style={{
                    fontSize: 14,
                    letterSpacing: 0.5,
                  }}
                >
                  BỘ THỦ CHỮ HÁN
                </Text>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 16,
                    flexWrap: "wrap",
                    marginTop: 4,
                  }}
                >
                  <Title
                    level={1}
                    style={{
                      margin: 0,
                      fontSize: 42,
                    }}
                  >
                    {data.character}
                  </Title>

                  {data.pinyin && (
                    <Text
                      strong
                      style={{
                        fontSize: 25,
                        color: "#1677ff",
                      }}
                    >
                      {data.pinyin}
                    </Text>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 18,
                    color: "#434343",
                  }}
                >
                  {data.meaning || "Bộ thủ chữ Hán"}
                </div>

                <Space
                  wrap
                  size={[8, 8]}
                  style={{
                    marginTop: 20,
                  }}
                >
                  {data.strokes !== undefined && (
                    <Tag
                      color="blue"
                      style={{
                        borderRadius: 16,
                        padding: "5px 12px",
                        fontSize: 13,
                      }}
                    >
                      {data.strokes} nét
                    </Tag>
                  )}

                  {data.meaning && (
                    <Tag
                      color="green"
                      style={{
                        borderRadius: 16,
                        padding: "5px 12px",
                        fontSize: 13,
                      }}
                    >
                      {data.meaning}
                    </Tag>
                  )}

                  <Tag
                    color="purple"
                    style={{
                      borderRadius: 16,
                      padding: "5px 12px",
                      fontSize: 13,
                    }}
                  >
                    Bộ thủ
                  </Tag>
                </Space>

                <Divider style={{ margin: "24px 0" }} />

                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 13,
                    }}
                  >
                    Tóm tắt
                  </Text>

                  <Paragraph
                    style={{
                      marginTop: 6,
                      marginBottom: 0,
                      maxWidth: 800,
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "#595959",
                    }}
                    ellipsis={{ rows: 3 }}
                  >
                    {data.analysis ||
                      data.meaning ||
                      "Chưa có thông tin phân tích cho bộ thủ này."}
                  </Paragraph>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* MAIN LAYOUT */}
        <Row gutter={[24, 24]} align="top">
          {/* CỘT TRÁI */}
          <Col xs={24} lg={15}>
            <Space
              orientation="vertical"
              size={24}
              style={{ width: "100%" }}
            >

              {/* TẬP VIẾT */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 3px 14px rgba(0,0,0,0.04)",
                }}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <EditOutlined style={{ color: "#722ed1" }} />
                    <span>Hướng dẫn & luyện viết</span>
                  </div>
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "10px 0 20px",
                  }}
                >
                  <StrokeOrder character={data.character} />
                </div>
              </Card>

              {/* TỪ VỰNG LIÊN QUAN */}
              {words.length > 0 && (
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 3px 14px rgba(0,0,0,0.04)",
                  }}
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <ReadOutlined style={{ color: "#fa8c16" }} />
                      <span>Từ vựng liên quan</span>
                      <Tag
                        color="orange"
                        style={{
                          marginLeft: "auto",
                          borderRadius: 12,
                        }}
                      >
                        {words.length}
                      </Tag>
                    </div>
                  }
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {words.map((item, idx) => {
                      const word =
                        typeof item === "string" ? item : item.word;
                      const pinyin =
                        typeof item === "string" ? "" : item.pinyin;
                      const meaning =
                        typeof item === "string" ? "" : item.meaning;

                      return (
                        <div
                          key={`${word}-${idx}`}
                          onClick={() => speak(word)}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 10,
                            border: "1px solid #f0f0f0",
                            background: "#fafafa",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Text strong style={{ fontSize: 17 }}>
                              {word}
                            </Text>
                            {pinyin && (
                              <Text
                                style={{
                                  color: "#1677ff",
                                  fontSize: 13,
                                }}
                              >
                                {pinyin}
                              </Text>
                            )}
                            <SoundOutlined
                              style={{
                                marginLeft: "auto",
                                color: "#8c8c8c",
                                fontSize: 12,
                              }}
                            />
                          </div>

                          {meaning && (
                            <Text
                              type="secondary"
                              style={{
                                display: "block",
                                marginTop: 4,
                                fontSize: 13,
                              }}
                            >
                              {meaning}
                            </Text>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </Space>
          </Col>

          {/* CỘT PHẢI */}
          <Col xs={24} lg={9}>
            <Space
              orientation="vertical"
              size={24}
              style={{ width: "100%" }}
            >
              {/* 1. CHỮ CÓ THỂ KẾT HỢP (ẨN BỚT / MỞ RỘNG) */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 3px 14px rgba(0,0,0,0.04)",
                }}
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <BookOutlined style={{ color: "#1677ff" }} />
                    <span>Chữ có thể kết hợp</span>
                    <Tag
                      color="cyan"
                      style={{
                        marginLeft: "auto",
                        borderRadius: 12,
                      }}
                    >
                      {combinations.length}
                    </Tag>
                  </div>
                }
              >
                {combinations.length > 0 ? (
                  <>
                    <Space
                      orientation="vertical"
                      size={10}
                      style={{ width: "100%" }}
                    >
                      {visibleCombinations.map((item, idx) => {
                        const {
                          componentsList,
                          resultChar,
                          pinyin,
                          meaning,
                        } = parseCombinationString(item);

                        return (
                          <div
                            key={idx}
                            style={{
                              padding: "12px",
                              borderRadius: 10,
                              background: "#fafafa",
                              border: "1px solid #f0f0f0",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                flexWrap: "wrap",
                              }}
                            >
                              {componentsList.map((comp, cIdx) => (
                                <span
                                  key={cIdx}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <span
                                    onClick={() => speak(comp)}
                                    style={{
                                      minWidth: 30,
                                      padding: "3px 7px",
                                      textAlign: "center",
                                      borderRadius: 5,
                                      background:
                                        comp === data.character
                                          ? "#e6f4ff"
                                          : "#f0f0f0",
                                      border:
                                        comp === data.character
                                          ? "1px solid #91caff"
                                          : "1px solid #e5e5e5",
                                      color:
                                        comp === data.character
                                          ? "#0958d9"
                                          : "#262626",
                                      fontSize: 16,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {comp}
                                  </span>

                                  {cIdx < componentsList.length - 1 && (
                                    <PlusOutlined
                                      style={{
                                        fontSize: 9,
                                        color: "#bfbfbf",
                                      }}
                                    />
                                  )}
                                </span>
                              ))}

                              <ArrowRightOutlined
                                style={{
                                  fontSize: 11,
                                  color: "#8c8c8c",
                                  margin: "0 3px",
                                }}
                              />

                              {resultChar && (
                                <div
                                  onClick={() => speak(resultChar)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    background: "#e6f4ff",
                                    border: "1px solid #91caff",
                                    cursor: "pointer",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 19,
                                      fontWeight: 700,
                                      color: "#0958d9",
                                    }}
                                  >
                                    {resultChar}
                                  </span>

                                  {pinyin && (
                                    <span
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#1677ff",
                                      }}
                                    >
                                      {pinyin}
                                    </span>
                                  )}

                                  <SoundOutlined
                                    style={{
                                      fontSize: 11,
                                      color: "#1677ff",
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {meaning && (
                              <div
                                style={{
                                  marginTop: 8,
                                  paddingTop: 8,
                                  borderTop: "1px dashed #e8e8e8",
                                }}
                              >
                                <Text
                                  type="secondary"
                                  style={{ fontSize: 12 }}
                                >
                                  {meaning}
                                </Text>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Space>

                    {/* NÚT THU GỌN / MỞ RỘNG */}
                    {combinations.length > 4 && (
                      <Button
                        type="dashed"
                        block
                        icon={expandCombinations ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => setExpandCombinations(!expandCombinations)}
                        style={{ marginTop: 12, borderRadius: 8 }}
                      >
                        {expandCombinations
                          ? "Thu gọn"
                          : `Xem thêm ${combinations.length - 4} công thức`}
                      </Button>
                    )}
                  </>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có dữ liệu chữ kết hợp"
                  />
                )}
              </Card>

              {/* 2. THÀNH PHẦN ĐI KÈM (ẨN BỚT / MỞ RỘNG) */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 3px 14px rgba(0,0,0,0.04)",
                }}
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AppstoreOutlined style={{ color: "#722ed1" }} />
                    <span>Thành phần đi kèm</span>
                    <Tag
                      color="purple"
                      style={{
                        marginLeft: "auto",
                        borderRadius: 12,
                      }}
                    >
                      {components.length}
                    </Tag>
                  </div>
                }
              >
                {components.length > 0 ? (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(110px, 1fr))",
                        gap: 9,
                      }}
                    >
                      {visibleComponents.map((item, idx) => {
                        const char =
                          typeof item === "string"
                            ? item
                            : item.character;
                        const pinyin =
                          typeof item === "string" ? "" : item.pinyin;
                        const meaning =
                          typeof item === "string" ? "" : item.meaning;
                        const belong =
                          typeof item === "string"
                            ? `Bộ ${char}`
                            : item.radical_belong || `Bộ ${char}`;

                        return (
                          <Tooltip
                            key={`${char}-${idx}`}
                            title={
                              <div>
                                <div>
                                  <b>{char}</b> {pinyin && `(${pinyin})`}
                                </div>
                                <div>{belong}</div>
                                {meaning && <div>Nghĩa: {meaning}</div>}
                                <div
                                  style={{
                                    marginTop: 4,
                                    color: "#a5b4fc",
                                  }}
                                >
                                  Click để xem chi tiết
                                </div>
                              </div>
                            }
                          >
                            <div
                              onClick={() =>
                                router.push(
                                  `/radicals/${encodeURIComponent(char)}`
                                )
                              }
                              style={{
                                padding: "10px",
                                minHeight: 76,
                                borderRadius: 9,
                                background: "#faf5ff",
                                border: "1px solid #e9d5ff",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                                e.currentTarget.style.borderColor =
                                  "#a855f7";
                                e.currentTarget.style.boxShadow =
                                  "0 4px 10px rgba(114,46,209,0.12)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                                e.currentTarget.style.borderColor =
                                  "#e9d5ff";
                                e.currentTarget.style.boxShadow =
                                  "none";
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 23,
                                    fontWeight: 700,
                                    color: "#6b21a8",
                                  }}
                                >
                                  {char}
                                </span>

                                <SoundOutlined
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speak(char);
                                  }}
                                  style={{
                                    fontSize: 12,
                                    color: "#a855f7",
                                  }}
                                />
                              </div>

                              {pinyin && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#1677ff",
                                    marginTop: 2,
                                  }}
                                >
                                  {pinyin}
                                </div>
                              )}

                              <div
                                style={{
                                  marginTop: 3,
                                  fontSize: 10,
                                  color: "#9333ea",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {belong}
                              </div>
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>

                    {/* NÚT THU GỌN / MỞ RỘNG */}
                    {components.length > 8 && (
                      <Button
                        type="dashed"
                        block
                        icon={expandComponents ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => setExpandComponents(!expandComponents)}
                        style={{ marginTop: 12, borderRadius: 8 }}
                      >
                        {expandComponents
                          ? "Thu gọn"
                          : `Xem thêm ${components.length - 8} thành phần`}
                      </Button>
                    )}
                  </>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có thành phần đi kèm"
                  />
                )}
              </Card>

              {/* 3. CHỮ THƯỜNG GẶP (ẨN BỚT / MỞ RỘNG) */}
              {examples.length > 0 && (
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 3px 14px rgba(0,0,0,0.04)",
                  }}
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span>🀄</span>
                      <span>Chữ thường gặp</span>
                      <Tag
                        color="blue"
                        style={{
                          marginLeft: "auto",
                          borderRadius: 12,
                        }}
                      >
                        {examples.length}
                      </Tag>
                    </div>
                  }
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(82px, 1fr))",
                      gap: 9,
                    }}
                  >
                    {visibleExamples.map((item, idx) => {
                      const char =
                        typeof item === "string"
                          ? item
                          : item.character;
                      const pinyin =
                        typeof item === "string" ? "" : item.pinyin;
                      const meaning =
                        typeof item === "string" ? "" : item.meaning;

                      return (
                        <Tooltip
                          key={`${char}-${idx}`}
                          title={meaning || char}
                        >
                          <div
                            onClick={() => speak(char)}
                            style={{
                              textAlign: "center",
                              padding: "9px 4px",
                              borderRadius: 9,
                              background: "#fafafa",
                              border: "1px solid #f0f0f0",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 27,
                                lineHeight: 1.2,
                                fontWeight: 500,
                              }}
                            >
                              {char}
                            </div>

                            {pinyin && (
                              <div
                                style={{
                                  marginTop: 3,
                                  fontSize: 11,
                                  color: "#1677ff",
                                  fontWeight: 500,
                                }}
                              >
                                {pinyin}
                              </div>
                            )}

                            {meaning && (
                              <div
                                style={{
                                  marginTop: 2,
                                  fontSize: 10,
                                  color: "#8c8c8c",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  padding: "0 3px",
                                }}
                              >
                                {meaning}
                              </div>
                            )}
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>

                  {/* NÚT THU GỌN / MỞ RỘNG */}
                  {examples.length > 12 && (
                    <Button
                      type="dashed"
                      block
                      icon={expandExamples ? <UpOutlined /> : <DownOutlined />}
                      onClick={() => setExpandExamples(!expandExamples)}
                      style={{ marginTop: 12, borderRadius: 8 }}
                    >
                      {expandExamples
                        ? "Thu gọn"
                        : `Xem thêm ${examples.length - 12} chữ thường gặp`}
                    </Button>
                  )}
                </Card>
              )}
            </Space>
          </Col>
        </Row>

        {/* FOOTER NAVIGATION */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 35,
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/radicals")}
          >
            Xem tất cả bộ thủ
          </Button>
        </div>
      </div>
    </div>
  );
}