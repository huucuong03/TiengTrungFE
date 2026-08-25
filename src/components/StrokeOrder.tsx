"use client";

import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { Button, Typography, Select } from "antd";
import { PlayCircleOutlined, ClearOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface StrokeOrderProps {
  character: string;
}

export default function StrokeOrder({ character }: StrokeOrderProps) {
  const guideRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const [cellCount, setCellCount] = useState<number>(4);

  useEffect(() => {
    if (!guideRef.current || !character) return;

    guideRef.current.innerHTML = "";

    try {
      const writer = HanziWriter.create(guideRef.current, character, {
        width: 120,
        height: 120,
        padding: 8,
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 200,
        strokeColor: "#1677ff",
        outlineColor: "#e2e8f0",
        grid: {
          showGrid: true,
          gridColor: "#ffccc7",
        },
      } as any); // Thêm as any để tránh lỗi type check trên Vercel

      writerRef.current = writer;
      writer.animateCharacter();
    } catch (e) {
      console.error("HanziWriter error:", e);
    }

    return () => {
      writerRef.current = null;
    };
  }, [character]);

  const handleReplayGuide = () => {
    writerRef.current?.animateCharacter();
  };

  return (
    <div className="stroke-wrapper">
      <div className="stroke-layout">
        {/* Cột trái: Hướng dẫn nét */}
        <div className="guide-panel">
          <div className="guide-header">
            <Title level={5} style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>
              🎥 Thứ tự nét chuẩn
            </Title>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Xem mẫu để ghi nhớ
            </Text>
          </div>

          <div ref={guideRef} className="guide-canvas" />

          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={handleReplayGuide}
            style={{ marginTop: 8, borderRadius: 6 }}
          >
            Xem lại mẫu
          </Button>
        </div>

        {/* Cột phải: Luyện viết bút lông mảnh */}
        <div className="practice-panel">
          <div className="practice-header">
            <div>
              <Title level={5} style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>
                ✍️ Tự do luyện viết
              </Title>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Đồ theo nét mờ → Tự nhớ viết vào các ô sau
              </Text>
            </div>
            <Select
              size="small"
              value={cellCount}
              onChange={setCellCount}
              options={[
                { value: 2, label: "2 ô" },
                { value: 4, label: "4 ô" },
                { value: 6, label: "6 ô" },
                { value: 8, label: "8 ô" },
              ]}
              style={{ width: 70 }}
            />
          </div>

          <div className="practice-grid">
            {Array.from({ length: cellCount }).map((_, index) => (
              <FreeDrawCell
                key={`${character}-${index}`}
                character={character}
                size={84}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .stroke-wrapper {
          padding: 4px 0;
        }
        .stroke-layout {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .guide-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #fafafa;
          padding: 12px 10px;
          border-radius: 12px;
          border: 1px solid #f0f0f0;
          flex-shrink: 0;
        }
        .guide-header {
          text-align: center;
          margin-bottom: 6px;
        }
        .guide-canvas {
          width: 120px;
          height: 120px;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .practice-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .practice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
        }
        .practice-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        @media (max-width: 576px) {
          .stroke-layout {
            flex-direction: column;
            align-items: stretch;
          }
          .guide-panel {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
          }
          .guide-canvas {
            width: 90px;
            height: 90px;
          }
        }
      `}</style>
    </div>
  );
}

/* ================================================= */
/* Component Bút lông Thư pháp Mảnh (Fine Calligraphy Brush) */
/* ================================================= */

interface Point {
  x: number;
  y: number;
  time: number;
  width: number;
}

interface FreeDrawCellProps {
  character: string;
  size: number;
  index: number;
}

function FreeDrawCell({ character, size, index }: FreeDrawCellProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);

  const getGuideOpacity = (idx: number) => {
    if (idx === 0) return 0.28;
    if (idx === 1) return 0.12;
    return 0;
  };

  const guideOpacity = getGuideOpacity(index);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    isDrawingRef.current = true;

    // Khởi bút thanh mảnh (2.2px)
    const startPoint: Point = { x, y, time: Date.now(), width: 2.2 };
    pointsRef.current = [startPoint];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Chấm nhẹ điểm đầu bút lông
    ctx.fillStyle = "#1677ff";
    ctx.beginPath();
    ctx.arc(x, y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = pointsRef.current;
    const prevPoint = points[points.length - 1];
    const now = Date.now();

    const dist = Math.hypot(x - prevPoint.x, y - prevPoint.y);
    if (dist < 1.0) return;

    const timeDiff = Math.max(now - prevPoint.time, 1);
    const velocity = dist / timeDiff;

    // Căn chỉnh ngòi bút lông mảnh: Tối thiểu 0.8px, tối đa 3.6px
    let targetWidth = Math.max(0.8, Math.min(3.6, 3.4 - velocity * 1.2));

    const angle = Math.atan2(y - prevPoint.y, x - prevPoint.x);
    const angleFactor = Math.abs(Math.sin(angle - Math.PI / 4));
    targetWidth = targetWidth * (0.85 + angleFactor * 0.3);

    const strokeWidth = prevPoint.width * 0.6 + targetWidth * 0.4;

    const currentPoint: Point = { x, y, time: now, width: strokeWidth };
    points.push(currentPoint);

    drawBrushSegment(ctx, prevPoint, currentPoint);
  };

  const drawBrushSegment = (
    ctx: CanvasRenderingContext2D,
    p1: Point,
    p2: Point
  ) => {
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const perp = angle + Math.PI / 2;

    const r1 = p1.width / 2;
    const r2 = p2.width / 2;

    const p1_left = { x: p1.x + Math.cos(perp) * r1, y: p1.y + Math.sin(perp) * r1 };
    const p1_right = { x: p1.x - Math.cos(perp) * r1, y: p1.y - Math.sin(perp) * r1 };
    const p2_left = { x: p2.x + Math.cos(perp) * r2, y: p2.y + Math.sin(perp) * r2 };
    const p2_right = { x: p2.x - Math.cos(perp) * r2, y: p2.y - Math.sin(perp) * r2 };

    ctx.save();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(p1_left.x, p1_left.y);
    ctx.lineTo(p2_left.x, p2_left.y);
    ctx.lineTo(p2_right.x, p2_right.y);
    ctx.lineTo(p1_right.x, p1_right.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p2.x, p2.y, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const points = pointsRef.current;
    if (points.length >= 3) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const last = points[points.length - 1];
      const prev = points[points.length - 2];
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x);

      const tipX = last.x + Math.cos(angle) * (last.width * 0.7);
      const tipY = last.y + Math.sin(angle) * (last.width * 0.7);

      const tipPoint: Point = { x: tipX, y: tipY, time: Date.now(), width: 0.3 };
      drawBrushSegment(ctx, last, tipPoint);
    }

    pointsRef.current = [];
  };

  const clearCell = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pointsRef.current = [];
  };

  return (
    <div className="cell-wrapper">
      <div className="cell-container" style={{ width: size, height: size }}>
        {/* Khung lưới mễ tự */}
        <svg width={size} height={size} className="grid-overlay">
          <line
            x1="0"
            y1={size / 2}
            x2={size}
            y2={size / 2}
            stroke="#ff8f73"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
          <line
            x1={size / 2}
            y1="0"
            x2={size / 2}
            y2={size}
            stroke="#ff8f73"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
          <line
            x1="0"
            y1="0"
            x2={size}
            y2={size}
            stroke="#ffdcd6"
            strokeWidth="0.6"
            strokeDasharray="3 3"
          />
          <line
            x1={size}
            y1="0"
            x2="0"
            y2={size}
            stroke="#ffdcd6"
            strokeWidth="0.6"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Chữ mờ Khải thư */}
        {guideOpacity > 0 && (
          <div
            className="guide-text"
            style={{
              fontSize: size * 0.72,
              color: `rgba(22, 119, 255, ${guideOpacity})`,
            }}
          >
            {character}
          </div>
        )}

        {/* Canvas luyện viết */}
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="draw-canvas"
        />
      </div>

      <Button
        type="text"
        size="small"
        icon={<ClearOutlined />}
        onClick={clearCell}
        className="clear-btn"
      >
        Xóa {index + 1}
      </Button>

      <style jsx>{`
        .cell-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .cell-container {
          position: relative;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          overflow: hidden;
          touch-action: none;
          user-select: none;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .grid-overlay {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
        }
        .guide-text {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "KaiTi", "STKaiti", "BiauKai", "楷体", "DFKai-SB", serif;
          pointer-events: none;
          line-height: 1;
        }
        .draw-canvas {
          position: absolute;
          top: 0;
          left: 0;
          cursor: crosshair;
        }
        .clear-btn {
          color: #94a3b8;
          font-size: 11px;
          height: 20px;
          padding: 0 4px;
        }
        .clear-btn:hover {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}