"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Button,
  Input,
  Typography,
  Space,
  Table,
  Modal,
  Tag,
  Empty,
  message,
  Popconfirm,
  Spin,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  AudioOutlined,
  BookOutlined,
  DeleteOutlined,
  RightOutlined,
  LeftOutlined,
  SearchOutlined,
  CheckOutlined,
} from "@ant-design/icons";

import StrokeOrder from "@/components/StrokeOrder";
import PronunciationTrainer from "@/components/PronunciationTrainer";
import HandwritingModal from "@/components/HandwritingModal";

const { Title, Text } = Typography;

interface NotebookWord {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hanviet?: string;
  notes?: string;
  proficiency: number;
  created_at: string;
  last_practiced?: string;
}

interface LookedUpPreview {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

const API_BASE = "https://tiengtrung-7hto.onrender.com/api/notebook";

export default function PracticePage() {
  const [words, setWords] = useState<NotebookWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // State tìm kiếm từ vựng đã học
  const [searchText, setSearchText] = useState("");

  // State cho Modal thêm từ
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHandwritingOpen, setIsHandwritingOpen] = useState(false);
  const [inputChar, setInputChar] = useState("");
  const [lastSearchedChar, setLastSearchedChar] = useState(""); 
  const [searchingMeaning, setSearchingMeaning] = useState(false);
  const [previewWord, setPreviewWord] = useState<LookedUpPreview | null>(null);
  const [savingWord, setSavingWord] = useState(false);

  // Helper lấy token đăng nhập
  const getAuthHeader = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Tải danh sách từ từ Database
  const fetchWords = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/words`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setWords(data);
      } else if (res.status === 401) {
        message.error("Phiên đăng nhập hết hạn!");
      }
    } catch {
      message.error("Lỗi khi tải sổ từ vựng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  // Lọc danh sách từ vựng theo từ khóa tìm kiếm (Hán tự, Pinyin, Nghĩa)
  const filteredWords = words.filter((w) => {
    const keyword = searchText.toLowerCase().trim();
    return (
      w.hanzi.toLowerCase().includes(keyword) ||
      w.pinyin.toLowerCase().includes(keyword) ||
      w.meaning.toLowerCase().includes(keyword)
    );
  });

  // 2. Tra cứu trực tiếp từ bảng Dictionary trong DB / AI
  const handleLookupChar = async (charToLookup: string) => {
    const trimmed = charToLookup.trim();

    if (!trimmed) {
      message.warning("Vui lòng nhập hoặc vẽ chữ Hán cần tra");
      return;
    }

    if (trimmed === lastSearchedChar && previewWord !== null) {
      return;
    }

    if (searchingMeaning) return;

    setSearchingMeaning(true);
    setPreviewWord(null);

    try {
      const res = await fetch(
        "https://tiengtrung-7hto.onrender.com/api/dictionary/quick-ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word: trimmed,
            source: "auto",
          }),
        }
      );

      const resData = await res.json();

      if (!res.ok || !resData.data) {
        message.warning(resData.detail || "Không tìm thấy từ này");
        setLastSearchedChar("");
        return;
      }

      const d = resData.data;

      setPreviewWord({
        hanzi: d.hanzi || trimmed,
        pinyin: d.pinyin || "",
        meaning: d.meaning || "",
      });
      setLastSearchedChar(trimmed);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi kết nối đến dịch vụ từ điển");
      setLastSearchedChar("");
    } finally {
      setSearchingMeaning(false);
    }
  };

  // 3. Xác nhận lưu từ vào Database
  const handleConfirmSave = async () => {
    if (!previewWord) return;

    setSavingWord(true);

    try {
      const res = await fetch(`${API_BASE}/words`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(previewWord),
      });

      const resData = await res.json();

      if (res.ok) {
        message.success(`Đã thêm "${previewWord.hanzi}" vào Sổ luyện tập!`);

        setIsAddModalOpen(false);
        setInputChar("");
        setLastSearchedChar("");
        setPreviewWord(null);

        fetchWords();
      } else {
        message.warning(resData.detail || "Từ này đã có trong sổ");
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu vào database");
    } finally {
      setSavingWord(false);
    }
  };

  // 4. Xóa từ khỏi Database
  const handleDeleteWord = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/words/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
        },
      });
      if (res.ok) {
        message.success("Đã xóa từ khỏi sổ");
        const updated = words.filter((w) => w.id !== id);
        setWords(updated);
        if (currentIndex >= updated.length) {
          setCurrentIndex(Math.max(0, updated.length - 1));
        }
      }
    } catch {
      message.error("Lỗi xóa từ");
    }
  };

  // 5. Ghi nhận tiến độ luyện tập
  const handleRecordProgress = async (id: number) => {
    try {
      await fetch(`${API_BASE}/words/${id}/practice`, {
        method: "PATCH",
        headers: {
          ...getAuthHeader(),
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const currentWord = filteredWords[currentIndex] || filteredWords[0];

  const columns = [
    {
      title: "Chữ Hán",
      dataIndex: "hanzi",
      key: "hanzi",
      render: (text: string) => (
        <Text strong style={{ fontSize: 20, color: "#1677ff" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Pinyin",
      dataIndex: "pinyin",
      key: "pinyin",
      render: (text: string) => <Text code style={{ color: "#d4380d" }}>{text}</Text>,
    },
    {
      title: "Nghĩa tiếng Việt",
      dataIndex: "meaning",
      key: "meaning",
    },
    {
      title: "Độ thành thạo",
      dataIndex: "proficiency",
      key: "proficiency",
      render: (val: number) => (
        <Tag color={val >= 70 ? "green" : val >= 40 ? "blue" : "orange"}>{val}%</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: NotebookWord) => (
        <Popconfirm title="Xóa từ này khỏi database?" onConfirm={() => handleDeleteWord(record.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  function renderWriteTab() {
    if (filteredWords.length === 0 || !currentWord) {
      return <Empty description="Không tìm thấy từ vựng phù hợp trong sổ!" />;
    }

    return (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Button
            icon={<LeftOutlined />}
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
          >
            Từ trước
          </Button>
          <Text strong>
            Từ {currentIndex + 1} / {filteredWords.length}
          </Text>
          <Button
            icon={<RightOutlined />}
            disabled={currentIndex === filteredWords.length - 1}
            onClick={() => setCurrentIndex((prev) => prev + 1)}
          >
            Từ kế tiếp
          </Button>
        </div>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Space size="large" wrap>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#1677ff" }}>
              {currentWord.hanzi}
            </Text>
            <Text code style={{ fontSize: 20, color: "#d4380d" }}>
              {currentWord.pinyin}
            </Text>
            <Tag color="cyan" style={{ fontSize: 14, padding: "2px 8px" }}>
              {currentWord.meaning}
            </Tag>
          </Space>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from(currentWord.hanzi).map((char, idx) => (
            <Card key={`${char}-${idx}`} size="small" style={{ background: "#fafafa" }}>
              <StrokeOrder character={char} />
            </Card>
          ))}
        </div>
      </Card>
    );
  }

  function renderSpeakTab() {
    if (filteredWords.length === 0 || !currentWord) {
      return <Empty description="Không tìm thấy từ vựng phù hợp để luyện phát âm" />;
    }

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Button
            icon={<LeftOutlined />}
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
          >
            Từ trước
          </Button>
          <Text strong>
            Từ {currentIndex + 1} / {filteredWords.length}
          </Text>
          <Button
            icon={<RightOutlined />}
            disabled={currentIndex === filteredWords.length - 1}
            onClick={() => setCurrentIndex((prev) => prev + 1)}
          >
            Từ kế tiếp
          </Button>
        </div>

        <PronunciationTrainer
          key={currentWord.id}
          hanzi={currentWord.hanzi}
          pinyin={currentWord.pinyin}
          meaning={currentWord.meaning}
          onPass={() => {
            handleRecordProgress(currentWord.id);
            if (currentIndex < filteredWords.length - 1) {
              setTimeout(() => setCurrentIndex((prev) => prev + 1), 1200);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 16px" }}>
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <BookOutlined /> Sổ Từ & Trung Tâm Luyện Tập
            </Title>
            <Text type="secondary">
              Lưu trữ từ vựng trên Database, luyện viết nét bút lông và kiểm tra phát âm qua giọng đọc
            </Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setInputChar("");
              setLastSearchedChar("");
              setPreviewWord(null);
              setIsAddModalOpen(true);
            }}
          >
            Thêm từ mới (Vẽ tay / Tra nghĩa)
          </Button>
        </div>

        {/* Ô tìm kiếm tổng quan cho các từ đã học */}
        <Card size="small">
          <Input
            placeholder="Tìm kiếm từ vựng đã học theo Chữ Hán, Pinyin hoặc Nghĩa tiếng Việt..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentIndex(0); // Reset lại index khi tìm kiếm
            }}
            allowClear
            size="large"
          />
        </Card>

        {loading ? (
          <Card style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>Đang tải danh sách từ vựng...</div>
          </Card>
        ) : (
          <Tabs
            defaultActiveKey="write"
            items={[
              {
                key: "write",
                label: (
                  <span>
                    <EditOutlined /> Luyện viết chữ ({filteredWords.length})
                  </span>
                ),
                children: renderWriteTab(),
              },
              {
                key: "speak",
                label: (
                  <span>
                    <AudioOutlined /> Luyện phát âm & Pinyin
                  </span>
                ),
                children: renderSpeakTab(),
              },
              {
                key: "manage",
                label: (
                  <span>
                    <BookOutlined /> Quản lý danh sách ({filteredWords.length})
                  </span>
                ),
                children: (
                  <Table
                    columns={columns}
                    dataSource={filteredWords}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                    locale={{ emptyText: <Empty description="Không tìm thấy từ vựng phù hợp" /> }}
                  />
                ),
              },
            ]}
          />
        )}
      </Space>

      {/* Modal Thêm từ */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: "#1677ff" }} />
            <span>Thêm từ mới vào Sổ học tập</span>
          </Space>
        }
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Space orientation="vertical" size="middle" style={{ width: "100%", marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Nhập chữ Hán hoặc bấm biểu tượng bút vẽ để vẽ tay chữ bạn muốn học:
          </Text>

          <div style={{ display: "flex", gap: 8 }}>
            <Input
              size="large"
              placeholder="Nhập hoặc vẽ chữ Hán (Ví dụ: 苹果, 学习, 得到)..."
              value={inputChar}
              onChange={(e) => setInputChar(e.target.value)}
              onPressEnter={() => {
                if (!searchingMeaning) handleLookupChar(inputChar);
              }}
              disabled={searchingMeaning}
              style={{ flex: 1 }}
            />
            <Tooltip title="Vẽ tay nhận diện chữ Hán">
              <Button
                size="large"
                disabled={searchingMeaning}
                icon={<EditOutlined style={{ fontSize: 18, color: "#1677ff" }} />}
                onClick={() => {
                  if (!searchingMeaning) setIsHandwritingOpen(true);
                }}
              />
            </Tooltip>
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              loading={searchingMeaning}
              disabled={searchingMeaning}
              onClick={() => {
                if (!searchingMeaning) handleLookupChar(inputChar);
              }}
            >
              Tra nghĩa
            </Button>
          </div>

          {searchingMeaning ? (
            <Card size="small" style={{ textAlign: "center", padding: "20px 0" }}>
              <Spin size="small" />
              <div style={{ marginTop: 8, fontSize: 12 }}>Đang tra cứu...</div>
            </Card>
          ) : previewWord ? (
            <Card size="small" style={{ background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <Text style={{ fontSize: 34, lineHeight: 1, fontWeight: "bold", color: "#1677ff" }}>
                  {previewWord.hanzi}
                </Text>
                <Text style={{ fontSize: 16, color: "#d4380d", whiteSpace: "nowrap" }}>
                  {previewWord.pinyin}
                </Text>
              </div>
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Nghĩa tiếng Việt: </Text>
                <Text strong style={{ fontSize: 14 }}>{previewWord.meaning}</Text>
              </div>
            </Card>
          ) : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <Button onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled={!previewWord}
              loading={savingWord}
              onClick={handleConfirmSave}
            >
              Xác nhận thêm vào sổ
            </Button>
          </div>
        </Space>
      </Modal>

      {/* Modal Bảng vẽ tay nhận diện nét chữ */}
      <HandwritingModal
        open={isHandwritingOpen}
        onClose={() => setIsHandwritingOpen(false)}
        onSelectCharacter={async (charText) => {
          setIsHandwritingOpen(false);
          setInputChar(charText);
          await handleLookupChar(charText);
          setIsAddModalOpen(true);
        }}
      />
    </div>
  );
}