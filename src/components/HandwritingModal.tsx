"use client";

import { useEffect, useRef, useState } from "react";
import { Modal, Button, Space, Typography, Spin, Tooltip } from "antd";
import {
  EditOutlined,
  ClearOutlined,
  UndoOutlined,
  CheckOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface HandwritingModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCharacter: (text: string) => void;
}

export default function HandwritingModal({
  open,
  onClose,
  onSelectCharacter,
}: HandwritingModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Lưu strokes theo chuẩn: [ [ [x1, x2...], [y1, y2...], [t1, t2...] ], ... ]
  const [strokes, setStrokes] = useState<number[][][]>([]);
  const currentStrokeRef = useRef<{ x: number[]; y: number[]; t: number[] }>({
    x: [],
    y: [],
    t: [],
  });

  const [candidates, setCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [composedText, setComposedText] = useState<string>("");
  const startTimeRef = useRef<number>(Date.now());

  const CANVAS_SIZE = 280;

  // Vẽ lại toàn bộ nét vẽ
  const redrawCanvas = (allStrokes: number[][][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = "#1677ff";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    allStrokes.forEach((stroke) => {
      const xs = stroke[0];
      const ys = stroke[1];
      if (!xs || xs.length === 0) return;

      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0]);
      for (let i = 1; i < xs.length; i++) {
        ctx.lineTo(xs[i], ys[i]);
      }
      ctx.stroke();
    });
  };

  const resetCanvasOnly = () => {
    setStrokes([]);
    setCandidates([]);
    currentStrokeRef.current = { x: [], y: [], t: [] };
    redrawCanvas([]);
  };

  useEffect(() => {
    if (open) {
      setComposedText("");
      startTimeRef.current = Date.now();
      setTimeout(resetCanvasOnly, 60);
    }
  }, [open]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.round(clientX - rect.left),
      y: Math.round(clientY - rect.top),
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const t = Date.now() - startTimeRef.current;

    setIsDrawing(true);
    currentStrokeRef.current = { x: [x], y: [y], t: [t] };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#1677ff";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const t = Date.now() - startTimeRef.current;

    currentStrokeRef.current.x.push(x);
    currentStrokeRef.current.y.push(y);
    currentStrokeRef.current.t.push(t);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const { x, y, t } = currentStrokeRef.current;
    if (x.length > 0) {
      const newStroke = [x, y, t];
      const updatedStrokes = [...strokes, newStroke];
      setStrokes(updatedStrokes);
      recognizeHandwriting(updatedStrokes);
    }
  };

  // Gửi request chuẩn Ink đến Google API
  const recognizeHandwriting = async (allStrokes: number[][][]) => {
    if (allStrokes.length === 0) {
      setCandidates([]);
      return;
    }
    setLoading(true);

    const payload = {
      app_version: 0.4,
      api_level: "537.36",
      device: "Chrome/120.0.0.0",
      input_type: "0",
      options: "enable_pre_space",
      requests: [
        {
          writing_guide: {
            writing_area_width: CANVAS_SIZE,
            writing_area_height: CANVAS_SIZE,
          },
          pre_context: "",
          max_num_results: 10,
          max_completions: 0,
          language: "zh_CN",
          ink: allStrokes,
        },
      ],
    };

    try {
      const res = await fetch(
        "https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data[0] === "SUCCESS" && data[1]?.[0]?.[1]) {
        setCandidates(data[1][0][1]);
      }
    } catch (err) {
      console.error("Lỗi kết nối Google IME:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    redrawCanvas(newStrokes);
    if (newStrokes.length > 0) {
      recognizeHandwriting(newStrokes);
    } else {
      setCandidates([]);
    }
  };

  // Bấm chọn 1 chữ: Nối vào chuỗi và xoá Canvas để vẽ chữ kế tiếp
  const handlePickCandidate = (char: string) => {
    setComposedText((prev) => prev + char);
    resetCanvasOnly();
  };

  const handleDeleteLastChar = () => {
    setComposedText((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (!composedText.trim()) return;
    if (typeof onSelectCharacter === "function") {
      onSelectCharacter(composedText.trim());
    }
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <EditOutlined style={{ color: "#1677ff" }} />
          <span>✍️ Vẽ tay nhận diện chữ Hán & Ghép từ</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
      destroyOnHidden
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Khối hiển thị từ / câu đang ghép */}
        <div
          style={{
            background: "#f0f5ff",
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid #adc6ff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              Từ / Câu đang ghép:
            </Text>
            <Text strong style={{ fontSize: 22, color: "#1677ff", letterSpacing: 2 }}>
              {composedText || <span style={{ color: "#bfbfbf", fontSize: 14 }}>Chưa có chữ nào</span>}
            </Text>
          </div>
          <Space>
            <Tooltip title="Xoá chữ cuối">
              <Button
                size="small"
                disabled={!composedText}
                icon={<DeleteOutlined />}
                onClick={handleDeleteLastChar}
              />
            </Tooltip>
            <Tooltip title="Xoá sạch">
              <Button
                size="small"
                danger
                disabled={!composedText}
                icon={<ClearOutlined />}
                onClick={() => setComposedText("")}
              />
            </Tooltip>
          </Space>
        </div>

        {/* Khung Canvas vẽ có ô Mễ */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              position: "relative",
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              border: "2px solid #91caff",
              borderRadius: 12,
              background: "#ffffff",
              overflow: "hidden",
              touchAction: "none",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            <svg
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
            >
              <line
                x1="0"
                y1={CANVAS_SIZE / 2}
                x2={CANVAS_SIZE}
                y2={CANVAS_SIZE / 2}
                stroke="#ffd8bf"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1={CANVAS_SIZE / 2}
                y1="0"
                x2={CANVAS_SIZE / 2}
                y2={CANVAS_SIZE}
                stroke="#ffd8bf"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1="0"
                y1="0"
                x2={CANVAS_SIZE}
                y2={CANVAS_SIZE}
                stroke="#ffe7ba"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1={CANVAS_SIZE}
                y1="0"
                x2="0"
                y2={CANVAS_SIZE}
                stroke="#ffe7ba"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </svg>

            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ cursor: "crosshair", position: "relative", zIndex: 2 }}
            />
          </div>
        </div>

        {/* Nút thao tác Canvas */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <Button icon={<UndoOutlined />} onClick={handleUndo} disabled={strokes.length === 0}>
            Hoàn tác nét
          </Button>
          <Button icon={<ClearOutlined />} danger onClick={resetCanvasOnly} disabled={strokes.length === 0}>
            Xóa ô vẽ
          </Button>
        </div>

        {/* Danh sách chữ gợi ý nhận diện */}
        <div
          style={{
            background: "#f5f5f5",
            padding: "10px 12px",
            borderRadius: 8,
            minHeight: 64,
            display: "flex",
            alignItems: "center",
          }}
        >
          {loading ? (
            <div style={{ width: "100%", textAlign: "center" }}>
              <Spin size="small" /> <Text type="secondary" style={{ fontSize: 12 }}>Đang nhận diện...</Text>
            </div>
          ) : candidates.length > 0 ? (
            <Space wrap size={8} style={{ width: "100%", justifyContent: "center" }}>
              {candidates.map((char, index) => (
                <Button
                  key={index}
                  type={index === 0 ? "primary" : "default"}
                  style={{
                    fontSize: 20,
                    height: 42,
                    minWidth: 42,
                    padding: "0 10px",
                    fontWeight: "bold",
                  }}
                  onClick={() => handlePickCandidate(char)}
                >
                  {char}
                </Button>
              ))}
            </Space>
          ) : (
            <Text type="secondary" style={{ width: "100%", textAlign: "center", fontSize: 13 }}>
              Vẽ nét chữ Hán vào ô trên để hiển thị gợi ý
            </Text>
          )}
        </div>

        {/* Nút xác nhận tìm kiếm */}
        <Button
          type="primary"
          size="large"
          icon={<CheckOutlined />}
          disabled={!composedText.trim() && candidates.length === 0}
          onClick={() => {
            if (composedText.trim()) {
              handleConfirm();
            } else if (candidates.length > 0) {
              if (typeof onSelectCharacter === "function") {
                onSelectCharacter(candidates[0]);
              }
              onClose();
            }
          }}
          style={{ width: "100%", height: 44, borderRadius: 8, fontWeight: 600 }}
        >
          {composedText.trim()
            ? `Xác nhận tra cứu ("${composedText}")`
            : candidates.length > 0
              ? `Chọn chữ gợi ý ("${candidates[0]}")`
              : "Vui lòng vẽ chữ"}
        </Button>
      </div>
    </Modal>
  );
}