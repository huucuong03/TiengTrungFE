"use client";

import { useState } from "react";
import {
  Card,
  Input,
  Typography,
  Button,
  Radio,
  Space,
  Row,
  Col,
  Tag,
  message,
  Tooltip,
  Spin,
} from "antd";

import {
  SwapOutlined,
  SoundOutlined,
  CopyOutlined,
  ClearOutlined,
  TranslationOutlined,
  SendOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

type Language = "auto" | "zh" | "vi";

export default function TranslatePage() {
  // =========================================================
  // STATE
  // =========================================================

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  // Ngôn ngữ người dùng chọn
  const [sourceLang, setSourceLang] =
    useState<Language>("auto");

  // Ngôn ngữ đích
  const [targetLang, setTargetLang] =
    useState<"zh" | "vi">("vi");

  // Ngôn ngữ thực tế sau khi backend nhận diện
  const [detectedSourceLang, setDetectedSourceLang] =
    useState<"zh" | "vi" | null>(null);

  const [loading, setLoading] = useState(false);

  // =========================================================
  // PHÁT ÂM
  // =========================================================

  const handleSpeak = (
    text: string,
    lang: "zh" | "vi"
  ) => {
    if (!text.trim()) return;

    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(text);

      utterance.lang =
        lang === "zh"
          ? "zh-CN"
          : "vi-VN";

      utterance.rate = 0.9;

      window.speechSynthesis.speak(utterance);
    } else {
      message.warning(
        "Trình duyệt không hỗ trợ phát âm"
      );
    }
  };

  // =========================================================
  // SAO CHÉP
  // =========================================================

  const handleCopy = async (text: string) => {
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);

      message.success(
        "Đã sao chép vào bộ nhớ tạm"
      );
    } catch {
      message.error(
        "Không thể sao chép văn bản"
      );
    }
  };

  // =========================================================
  // XÓA
  // =========================================================

  const handleClear = () => {
    setSourceText("");
    setTranslatedText("");
    setDetectedSourceLang(null);
  };

  // =========================================================
  // ĐỔI CHIỀU DỊCH
  // =========================================================

  const handleSwapLanguages = () => {
    // Nếu chưa có nội dung
    if (!sourceText && !translatedText) {
      if (sourceLang === "zh") {
        setSourceLang("vi");
        setTargetLang("zh");
      } else {
        setSourceLang("zh");
        setTargetLang("vi");
      }

      return;
    }

    // Hoán đổi nội dung
    if (translatedText) {
      const oldSource = sourceText;

      setSourceText(translatedText);
      setTranslatedText(oldSource);
    }

    // Hoán đổi ngôn ngữ
    if (sourceLang === "zh") {
      setSourceLang("vi");
      setTargetLang("zh");
      setDetectedSourceLang("vi");
    } else {
      setSourceLang("zh");
      setTargetLang("vi");
      setDetectedSourceLang("zh");
    }
  };

  // =========================================================
  // CHỌN NGÔN NGỮ NGUỒN
  // =========================================================

  const handleSourceChange = (
    value: Language
  ) => {
    setSourceLang(value);
    setTranslatedText("");

    if (value === "zh") {
      setTargetLang("vi");
      setDetectedSourceLang("zh");
      return;
    }

    if (value === "vi") {
      setTargetLang("zh");
      setDetectedSourceLang("vi");
      return;
    }

    // Auto
    setDetectedSourceLang(null);
    setTargetLang("vi");
  };

  // =========================================================
  // DỊCH
  // =========================================================

  async function handleTranslate() {
    const trimmed = sourceText.trim();

    if (!trimmed) {
      message.warning(
        "Vui lòng nhập văn bản cần dịch"
      );
      return;
    }

    setLoading(true);
    setTranslatedText("");

    try {
      const response = await fetch(
        "https://tiengtrung-7hto.onrender.com/api/translate/text",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: trimmed,
            source: sourceLang,
            target: targetLang,
          }),
        }
      );

      const resData = await response.json();

      if (
        response.ok &&
        resData.success
      ) {
        // Bản dịch
        setTranslatedText(
          resData.translation || ""
        );

        // Ngôn ngữ nguồn thực tế
        if (
          resData.source_lang === "zh" ||
          resData.source_lang === "vi"
        ) {
          setDetectedSourceLang(
            resData.source_lang
          );
        }

        // Ngôn ngữ đích
        if (
          resData.target_lang === "zh" ||
          resData.target_lang === "vi"
        ) {
          setTargetLang(
            resData.target_lang
          );
        }
      } else {
        message.error(
          resData.detail ||
            "Không thể dịch đoạn văn bản này"
        );
      }
    } catch (error) {
      console.error(
        "Lỗi kết nối:",
        error
      );

      message.error(
        "Không thể kết nối đến máy chủ dịch thuật"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // NGÔN NGỮ HIỆN TẠI
  // =========================================================

  const actualSourceLang =
    detectedSourceLang ||
    (sourceLang === "auto"
      ? "vi"
      : sourceLang);

  const sourceLabel =
    actualSourceLang === "zh"
      ? "Tiếng Trung"
      : "Tiếng Việt";

  const targetLabel =
    targetLang === "zh"
      ? "Tiếng Trung"
      : "Tiếng Việt";

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        maxWidth: 1600,
        margin: "0 auto",
        padding: "24px 16px",
      }}
    >
      <Space
        orientation="vertical"
        size="middle"
        style={{
          width: "100%",
        }}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div>
          <Title
            level={2}
            style={{
              marginBottom: 4,
            }}
          >
            <TranslationOutlined />{" "}
            Dịch Đoạn Văn Bản
          </Title>

          <Text type="secondary">
            Dịch câu, hội thoại và đoạn văn
            tự nhiên song ngữ Trung - Việt
            chuẩn ngữ cảnh
          </Text>
        </div>

        {/* =====================================================
            THANH ĐIỀU KHIỂN
        ===================================================== */}

        <Card
          variant="borderless"
          style={{
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {/* LEFT CONTROL */}

            <Space
              size="middle"
              wrap
            >
              <Radio.Group
                value={sourceLang}
                onChange={(e) =>
                  handleSourceChange(
                    e.target.value
                  )
                }
                buttonStyle="solid"
              >
                <Radio.Button value="auto">
                  Tự động nhận diện
                </Radio.Button>

                <Radio.Button value="zh">
                  Tiếng Trung
                </Radio.Button>

                <Radio.Button value="vi">
                  Tiếng Việt
                </Radio.Button>
              </Radio.Group>

              <Button
                icon={<SwapOutlined />}
                onClick={
                  handleSwapLanguages
                }
              >
                Đổi chiều
              </Button>

              <Tag
                color="blue"
                style={{
                  fontSize: 13,
                  padding: "2px 10px",
                }}
              >
                {sourceLang === "auto"
                  ? `Đã nhận diện: ${sourceLabel}`
                  : `Nguồn: ${sourceLabel}`}
              </Tag>

              <Tag
                color="green"
                style={{
                  fontSize: 13,
                  padding: "2px 10px",
                }}
              >
                Đích: {targetLabel}
              </Tag>
            </Space>

            {/* TRANSLATE BUTTON */}

            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              loading={loading}
              onClick={handleTranslate}
              style={{
                minWidth: 130,
              }}
            >
              Dịch văn bản
            </Button>
          </div>
        </Card>

        {/* =====================================================
            2 CỘT
        ===================================================== */}

        <Row gutter={[16, 16]}>
          {/* ===================================================
              VĂN BẢN GỐC
          =================================================== */}

          <Col
            xs={24}
            md={12}
          >
            <Card
              title={
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  Văn bản gốc{" "}
                  {sourceText
                    ? `(${sourceText.length} ký tự)`
                    : ""}
                </span>
              }
              extra={
                <Space>
                  {/* CLEAR */}

                  <Tooltip title="Xóa nội dung">
                    <Button
                      type="text"
                      icon={
                        <ClearOutlined />
                      }
                      onClick={
                        handleClear
                      }
                      disabled={
                        !sourceText &&
                        !translatedText
                      }
                    />
                  </Tooltip>

                  {/* SPEAK */}

                  <Tooltip title="Phát âm">
                    <Button
                      type="text"
                      icon={
                        <SoundOutlined
                          style={{
                            color:
                              "#1677ff",
                          }}
                        />
                      }
                      onClick={() =>
                        handleSpeak(
                          sourceText,
                          actualSourceLang
                        )
                      }
                      disabled={
                        !sourceText
                      }
                    />
                  </Tooltip>

                  {/* COPY */}

                  <Tooltip title="Sao chép">
                    <Button
                      type="text"
                      icon={
                        <CopyOutlined />
                      }
                      onClick={() =>
                        handleCopy(
                          sourceText
                        )
                      }
                      disabled={
                        !sourceText
                      }
                    />
                  </Tooltip>
                </Space>
              }
            >
              <TextArea
                rows={12}
                placeholder="Nhập đoạn văn bản tiếng Trung hoặc tiếng Việt cần dịch..."
                value={sourceText}
                onChange={(e) => {
                  setSourceText(
                    e.target.value
                  );

                  // Nội dung thay đổi
                  // thì bản dịch cũ không còn chính xác
                  setTranslatedText("");

                  if (
                    sourceLang ===
                    "auto"
                  ) {
                    setDetectedSourceLang(
                      null
                    );
                  }
                }}
                onPressEnter={(e) => {
                  if (
                    e.ctrlKey ||
                    e.metaKey
                  ) {
                    e.preventDefault();

                    handleTranslate();
                  }
                }}
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  resize: "vertical",
                  border: "none",
                  boxShadow: "none",
                  padding: 0,
                }}
              />

              <div
                style={{
                  marginTop: 8,
                  textAlign: "right",
                }}
              >
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                  }}
                >
                  Ctrl + Enter để dịch
                </Text>
              </div>
            </Card>
          </Col>

          {/* ===================================================
              BẢN DỊCH
          =================================================== */}

          <Col
            xs={24}
            md={12}
          >
            <Card
              title={
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  Bản dịch
                  {translatedText
                    ? ` → ${targetLabel}`
                    : ""}
                </span>
              }
              style={{
                background:
                  "#fafafa",
                height: "100%",
                minHeight: 350,
              }}
              extra={
                <Space>
                  {/* SPEAK */}

                  <Tooltip title="Phát âm bản dịch">
                    <Button
                      type="text"
                      icon={
                        <SoundOutlined
                          style={{
                            color:
                              "#1677ff",
                          }}
                        />
                      }
                      onClick={() =>
                        handleSpeak(
                          translatedText,
                          targetLang
                        )
                      }
                      disabled={
                        !translatedText
                      }
                    />
                  </Tooltip>

                  {/* COPY */}

                  <Tooltip title="Sao chép bản dịch">
                    <Button
                      type="text"
                      icon={
                        <CopyOutlined />
                      }
                      onClick={() =>
                        handleCopy(
                          translatedText
                        )
                      }
                      disabled={
                        !translatedText
                      }
                    />
                  </Tooltip>
                </Space>
              }
            >
              {/* LOADING */}

              {loading ? (
                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "80px 0",
                  }}
                >
                  <Spin
                    size="large"
                    description="Đang dịch văn bản..."
                  />
                </div>
              ) : translatedText ? (
                /* RESULT */

                <div
                  style={{
                    fontSize: 16,
                    lineHeight: 1.8,
                    color: "#1f1f1f",
                    whiteSpace:
                      "pre-wrap",
                    minHeight: 250,
                  }}
                >
                  {translatedText}
                </div>
              ) : (
                /* EMPTY */

                <div
                  style={{
                    color:
                      "#bfbfbf",
                    fontSize: 15,
                    fontStyle:
                      "italic",
                    marginTop: 8,
                  }}
                >
                  Bản dịch sẽ hiển thị
                  ở đây sau khi bấm
                  "Dịch văn bản"...
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
}