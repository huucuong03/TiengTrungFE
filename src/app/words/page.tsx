"use client";

import { useState } from "react";
import {
  Card,
  Input,
  Typography,
  Empty,
  Tag,
  Space,
  Divider,
  Spin,
  Radio,
  Button,
  message,
  Tooltip,
  List,
} from "antd";

import {
  SearchOutlined,
  BookOutlined,
  SoundOutlined,
  CopyOutlined,
  ApartmentOutlined,
  BulbOutlined,
  BranchesOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";

import StrokeOrder from "@/components/StrokeOrder";
import HandwritingModal from "@/components/HandwritingModal";

const { Title, Text, Paragraph } = Typography;

// ======================================================
// TYPES
// ======================================================

interface ComponentItem {
  part: string;
  meaning: string;
}

interface RadicalDetail {
  char: string;
  radical: string;
  stroke_count?: number;
  components?: ComponentItem[];
  mnemonic?: string;
}

interface SynonymItem {
  zh: string;
  py: string;
  hv?: string;
  ctx: string;
}

interface ExampleItem {
  zh: string;
  py: string;
  vi: string;
}

interface WordData {
  hanzi: string;
  original: string;
  translated: string;
  meaning?: string;
  pinyin?: string;
  hanviet?: string;
  word_type?: string;
  explanation?: string;
  synonyms?: SynonymItem[];
  radicals?: RadicalDetail[];
  examples?: ExampleItem[];
}

// ======================================================
// PAGE
// ======================================================

export default function WordsPage() {
  const [keyword, setKeyword] = useState("");
  const [lastSearchedKeyword, setLastSearchedKeyword] = useState(""); // Lưu lại từ khóa vừa tra thành công
  const [direction, setDirection] = useState<"auto" | "zh" | "vi">("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WordData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isHandwritingOpen, setIsHandwritingOpen] = useState(false);
  const [savingNotebook, setSavingNotebook] = useState(false);

  // ====================================================
  // HELPERS
  // ====================================================

  const isChineseChar = (str: string) => {
    return /[\u4e00-\u9fff]/.test(str);
  };

  const getChineseCharacters = (data: WordData) => {
    return Array.from(data.hanzi || "").filter((char) => isChineseChar(char));
  };

  const displayHanzi = result?.hanzi || "";
  const displayMeaning = result?.meaning || result?.translated || "";

  // ====================================================
  // PHÁT ÂM (Edge-TTS Backend + Web Speech Fallback)
  // ====================================================

  const playAudio = (text: string) => {
    if (typeof window === "undefined") return;

    try {
      const audioUrl = `https://tiengtrung-7hto.onrender.com/api/tts/speak?text=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "zh-CN";
          utterance.rate = 0.85;
          window.speechSynthesis.speak(utterance);
        }
      });
    } catch {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // ====================================================
  // COPY
  // ====================================================

  const copyToClipboard = async (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        message.success(`Đã sao chép: ${text}`);
      } catch {
        message.error("Không thể sao chép");
      }
    }
  };

  // ====================================================
  // SEARCH
  // ====================================================

  async function performSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      message.warning("Vui lòng nhập từ cần tra cứu");
      return;
    }

    // CHẶN: Nếu từ khóa mới trùng với từ đã tra trước đó và đã có kết quả thì bỏ qua luôn
    if (trimmed === lastSearchedKeyword && result !== null) {
      return;
    }

    if (loading) return;

    setLoading(true);
    setHasSearched(true);
    setResult(null);

    try {
      const response = await fetch("https://tiengtrung-7hto.onrender.com/api/dictionary/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: trimmed,
          source: direction,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success && resData.data) {
        setResult(resData.data);
        setLastSearchedKeyword(trimmed); // Cập nhật từ khóa vừa tra thành công
      } else {
        message.error(resData.detail || "Không tìm thấy kết quả tra cứu");
        setResult(null);
        setLastSearchedKeyword(""); // Reset nếu lỗi để cho phép thử lại
      }
    } catch (error) {
      console.error("Lỗi tra cứu:", error);
      message.error("Không thể kết nối đến máy chủ tra cứu");
      setResult(null);
      setLastSearchedKeyword("");
    } finally {
      setLoading(false);
    }
  }

  // ====================================================
  // SAVE NOTEBOOK (ĐÃ FIX 401 UNAUTHORIZED)
  // ====================================================

  const handleSaveToNotebook = async () => {
    if (!result || !displayHanzi) {
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      message.error("Vui lòng đăng nhập để lưu từ vào sổ luyện tập!");
      return;
    }

    setSavingNotebook(true);

    try {
      const response = await fetch("https://tiengtrung-7hto.onrender.com/api/notebook/words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hanzi: displayHanzi,
          pinyin: result.pinyin || "",
          meaning: displayMeaning || result.explanation || "",
          hanviet: result.hanviet || "",
        }),
      });

      const resData = await response.json();

      if (response.ok) {
        message.success(`Đã thêm "${displayHanzi}" vào Sổ luyện tập!`);
      } else if (response.status === 401) {
        message.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");
      } else {
        message.warning(resData.detail || "Từ này đã có trong sổ");
      }
    } catch (error) {
      console.error("Lỗi lưu sổ từ:", error);
      message.error("Không thể kết nối máy chủ");
    } finally {
      setSavingNotebook(false);
    }
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", padding: "24px 16px" }}>
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        {/* TITLE */}
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            <BookOutlined /> Tra Cứu Từ Vựng & Chiết Tự Bộ Thủ
          </Title>
          <Text type="secondary">
            Tra cứu từ vựng 2 chiều, âm Hán - Việt, nhận diện chữ viết tay và hướng dẫn viết nét chữ Hán
          </Text>
        </div>

        {/* SEARCH BOX */}
        <Card variant="borderless" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            {/* DIRECTION */}
            <Radio.Group
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="auto">Tự động nhận diện</Radio.Button>
              <Radio.Button value="zh">Trung ➔ Việt</Radio.Button>
              <Radio.Button value="vi">Việt ➔ Trung</Radio.Button>
            </Radio.Group>

           {/* INPUT */}
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              size="large"
              placeholder="Nhập từ: người, bố, 大, 女, 学习..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              // Chặn nhấn Enter liên tục khi đang loading
              onPressEnter={() => {
                if (!loading) performSearch(keyword);
              }}
              disabled={loading}
              allowClear
              style={{ flex: 1 }}
            />

            <Tooltip title="Vẽ tay nhận diện chữ Hán">
              <Button
                size="large"
                disabled={loading}
                icon={<EditOutlined style={{ fontSize: 18, color: "#1677ff" }} />}
                onClick={() => setIsHandwritingOpen(true)}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>

            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              loading={loading}
              disabled={loading}
              onClick={() => {
                if (!loading) performSearch(keyword);
              }}
              style={{ borderRadius: 8 }}
            >
              Tra cứu
            </Button>
          </div>
          </Space>
        </Card>

        {/* HANDWRITING MODAL */}
        <HandwritingModal
          open={isHandwritingOpen}
          onClose={() => setIsHandwritingOpen(false)}
          onSelectCharacter={(char) => {
            const nextKeyword = keyword ? `${keyword}${char}` : char;
            setKeyword(nextKeyword);
            performSearch(nextKeyword);
          }}
        />
      
        {/* LOADING & RESULT */}
        {loading ? (
          <Card style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: "#8c8c8c" }}>Đang phân tích chiết tự và ngữ nghĩa...</div>
          </Card>
        ) : result ? (
          <Card
            title={
              <Space wrap>
                <span style={{ fontWeight: 600 }}>Thông tin từ vựng</span>
                {result.word_type && <Tag color="blue">{result.word_type}</Tag>}
                {result.hanviet && (
                  <Tag color="purple">
                    Hán-Việt: <strong>{result.hanviet}</strong>
                  </Tag>
                )}
              </Space>
            }
          >
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              {/* HEADER WORD */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 20,
                }}
              >
                <div>
                  <Text
                    style={{
                      fontSize: 64,
                      fontWeight: 700,
                      color: "#1677ff",
                      lineHeight: 1,
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    {displayHanzi}
                  </Text>

                  {result.pinyin && (
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: 500,
                        color: "#d4380d",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      {result.pinyin}
                    </Text>
                  )}

                  {result.hanviet && (
                    <Tag color="purple" style={{ fontSize: 14 }}>
                      Hán-Việt: <strong>{result.hanviet}</strong>
                    </Tag>
                  )}

                  <div style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 17 }}>
                      <strong>Nghĩa:</strong> {displayMeaning}
                    </Text>
                  </div>

                  {result.word_type && (
                    <div style={{ marginTop: 7 }}>
                      <Tag color="blue">{result.word_type}</Tag>
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <Space wrap>
                  <Button
                    type="primary"
                    ghost
                    icon={<PlusCircleOutlined />}
                    loading={savingNotebook}
                    onClick={handleSaveToNotebook}
                    style={{ borderRadius: 6 }}
                  >
                    Lưu vào Sổ luyện tập
                  </Button>

                  <Tooltip title="Phát âm tiếng Trung">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<SoundOutlined style={{ fontSize: 20, color: "#1677ff" }} />}
                      onClick={() => playAudio(displayHanzi)}
                    />
                  </Tooltip>

                  <Tooltip title="Sao chép chữ Hán">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<CopyOutlined style={{ fontSize: 18 }} />}
                      onClick={() => copyToClipboard(displayHanzi)}
                    />
                  </Tooltip>
                </Space>
              </div>

              {/* STROKE ORDER */}
              {getChineseCharacters(result).length > 0 && (
                <div>
                  <Divider style={{ margin: "18px 0" }} />
                  <Text strong style={{ fontSize: 16 }}>
                    <EditOutlined /> Hướng dẫn viết chữ Hán ({getChineseCharacters(result).length} chữ)
                  </Text>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
                    {getChineseCharacters(result).map((char, index) => (
                      <Card
                        key={`${char}-${index}`}
                        size="small"
                        style={{
                          background: "#ffffff",
                          borderRadius: 8,
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <StrokeOrder character={char} />
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* EXPLANATION */}
              {result.explanation && (
                <div>
                  <Divider style={{ margin: "14px 0" }} />
                  <Paragraph style={{ fontSize: 15, margin: 0, color: "#262626" }}>
                    <strong style={{ color: "#1677ff" }}>Giải nghĩa:</strong> {result.explanation}
                  </Paragraph>
                </div>
              )}

              {/* SYNONYMS */}
              {result.synonyms && result.synonyms.length > 0 && (
                <div>
                  <Divider style={{ margin: "16px 0" }} />
                  <Text strong style={{ fontSize: 16 }}>
                    <BranchesOutlined /> Từ đồng nghĩa ({result.synonyms.length})
                  </Text>

                  <div
                    style={{
                      marginTop: 12,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {result.synonyms.map((item, idx) => (
                      <Card
                        key={`${item.zh}-${idx}`}
                        size="small"
                        hoverable
                        onClick={() => {
                          setKeyword(item.zh);
                          performSearch(item.zh);
                        }}
                        style={{ borderRadius: 8, cursor: "pointer" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                          <Text strong style={{ fontSize: 22, color: "#1677ff" }}>
                            {item.zh}
                          </Text>
                          <Text style={{ fontSize: 14, color: "#d4380d" }}>
                            {item.py}
                          </Text>
                        </div>
                        {item.hv && (
                          <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
                            {item.hv}
                          </Text>
                        )}
                        {item.ctx && (
                          <Tag color="cyan" style={{ marginTop: 8, marginRight: 0 }}>
                            {item.ctx}
                          </Tag>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* RADICALS */}
              {result.radicals && result.radicals.length > 0 && (
                <div>
                  <Divider style={{ margin: "18px 0" }} />
                  <Text strong style={{ fontSize: 16 }}>
                    <ApartmentOutlined /> Phân tích Bộ thủ & Chiết tự ({result.radicals.length} chữ)
                  </Text>

                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>
                    {result.radicals.map((rad, idx) => (
                      <Card
                        key={`${rad.char}-${idx}`}
                        size="small"
                        style={{
                          background: "#fafafa",
                          borderRadius: 8,
                          border: "1px solid #e8e8e8",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <Text
                              style={{
                                fontSize: 34,
                                fontWeight: "bold",
                                color: "#1677ff",
                                lineHeight: 1,
                              }}
                            >
                              {rad.char}
                            </Text>

                            <Tag color="cyan" style={{ fontSize: 13, padding: "3px 9px" }}>
                              Bộ thủ: <strong>{rad.radical}</strong>
                            </Tag>

                            {rad.stroke_count !== undefined && rad.stroke_count > 0 && (
                              <Tag color="geekblue">{rad.stroke_count} nét</Tag>
                            )}
                          </div>

                          {rad.components && rad.components.length > 0 && (
                            <div
                              style={{
                                background: "#ffffff",
                                padding: "12px",
                                borderRadius: 6,
                                border: "1px solid #f0f0f0",
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: 13, display: "block", marginBottom: 8 }}
                              >
                                🧩 Các bộ phận cấu thành:
                              </Text>

                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {rad.components.map((comp, cIdx) => (
                                  <div
                                    key={cIdx}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      background: "#fff7e6",
                                      border: "1px solid #ffd591",
                                      borderRadius: 6,
                                      padding: "5px 10px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 20,
                                        fontWeight: "bold",
                                        color: "#d46b08",
                                        marginRight: 7,
                                      }}
                                    >
                                      {comp.part}
                                    </span>
                                    <span style={{ fontSize: 13, color: "#595959" }}>
                                      {comp.meaning}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {rad.mnemonic && (
                            <div
                              style={{
                                background: "#fffbe6",
                                padding: "10px 12px",
                                borderRadius: 6,
                                border: "1px dashed #ffe58f",
                              }}
                            >
                              <Text style={{ fontSize: 14, color: "#d46b08" }}>
                                <BulbOutlined /> <strong>Mẹo nhớ:</strong> {rad.mnemonic}
                              </Text>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* EXAMPLES */}
              {result.examples && result.examples.length > 0 && (
                <div>
                  <Divider style={{ margin: "18px 0" }} />
                  <Text strong style={{ fontSize: 16 }}>
                    📝 Câu ví dụ ngữ cảnh
                  </Text>

                  <List
                    style={{ marginTop: 12 }}
                    dataSource={result.examples}
                    renderItem={(item, index) => (
                      <List.Item
                        key={index}
                        style={{
                          padding: "14px",
                          background: "#fcfcfc",
                          borderRadius: 8,
                          marginBottom: 8,
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Space orientation="vertical" size={4} style={{ width: "100%" }}>
                          <Space>
                            <Text strong style={{ fontSize: 17, color: "#1677ff" }}>
                              {item.zh}
                            </Text>
                            <Button
                              type="text"
                              size="small"
                              shape="circle"
                              icon={<SoundOutlined style={{ fontSize: 13, color: "#595959" }} />}
                              onClick={() => playAudio(item.zh)}
                            />
                          </Space>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {item.py}
                          </Text>
                          <Text style={{ fontSize: 14, color: "#262626" }}>
                            {item.vi}
                          </Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </Space>
          </Card>
        ) : (
          <Card>
            <Empty
              description={
                hasSearched
                  ? `Không tìm thấy thông tin cho "${keyword}"`
                  : "Nhập từ vựng tiếng Việt hoặc tiếng Trung để tra cứu"
              }
            />
          </Card>
        )}
      </Space>
    </div>
  );
}