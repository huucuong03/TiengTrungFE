"use client";

import { useMemo } from "react";
import { Card, Typography, Table, Button, Radio, Space, Tag } from "antd";
import { BulbOutlined } from "@ant-design/icons";
import { PinyinDataState } from "./types";
import { applyToneToSyllable } from "./pinyinUtils";

const { Text } = Typography;

interface PinyinTableProps {
  data: PinyinDataState;
  finalMode: "basic" | "nasal";
  setFinalMode: (mode: "basic" | "nasal") => void;
  selectedTone: number;
  setSelectedTone: (tone: number) => void;
  playSound: (text: string, tone?: number) => void;
}

export default function PinyinTable({
  data,
  finalMode,
  setFinalMode,
  selectedTone,
  setSelectedTone,
  playSound,
}: PinyinTableProps) {
  const activeFinals: string[] =
    finalMode === "basic" ? data.basic_finals || [] : data.nasal_finals || [];

  const groupRowSpans = useMemo(() => {
    if (!data.rows || data.rows.length === 0) return [];
    const spans: number[] = [];
    let i = 0;
    while (i < data.rows.length) {
      const currentGroup = data.rows[i].group;
      let count = 0;
      for (let j = i; j < data.rows.length; j++) {
        if (data.rows[j].group === currentGroup) count++;
        else break;
      }
      spans.push(count);
      for (let k = 1; k < count; k++) spans.push(0);
      i += count;
    }
    return spans;
  }, [data.rows]);

  const columns: any[] = [
    {
      title: <span style={{ fontWeight: 700, color: "#595959" }}>NGỮ ÂM</span>,
      dataIndex: "group",
      key: "group",
      align: "center",
      fixed: "left",
      width: 110,
      onCell: (_: any, index: number) => ({
        rowSpan: groupRowSpans[index] ?? 1,
      }),
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: "#595959", fontSize: 13 }}>
          {text}
        </span>
      ),
    },
    {
      title: <span style={{ fontWeight: 700, color: "#1677ff" }}>Thanh mẫu</span>,
      dataIndex: "initial",
      key: "initial",
      align: "center",
      fixed: "left",
      width: 80,
      render: (text: string) => (
        <div
          onClick={() => playSound(text, 1)}
          title={`Bấm để nghe Thanh mẫu "${text}"`}
          style={{ cursor: "pointer", fontWeight: 800, fontSize: 16, color: "#1677ff" }}
        >
          {text}
        </div>
      ),
    },
    ...activeFinals.map((final: string) => {
      let key = final;
      if (final === "ü") key = "v";
      if (final === "üe") key = "ve";
      if (final === "ün") key = "vn";
      if (final === "üan") key = "van";

      const displayFinal =
        selectedTone > 0 ? applyToneToSyllable(final, selectedTone) : final;

      return {
        title: (
          <div
            onClick={() => playSound(final, selectedTone)}
            title={`Bấm để nghe Vận mẫu "${displayFinal}"`}
            style={{
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 14,
              color: "#d4380d",
              background: "#fff1f0",
              padding: "4px 0",
              borderRadius: 6,
              userSelect: "none",
            }}
          >
            {displayFinal}
          </div>
        ),
        dataIndex: key,
        key,
        align: "center",
        width: 62,
        render: (value: string) => {
          if (!value) return <span style={{ color: "#e8e8e8" }}>—</span>;
          const isRed = data.special_red_syllables.includes(value);
          const displayValue =
            selectedTone > 0 ? applyToneToSyllable(value, selectedTone) : value;

          return (
            <Button
              type="text"
              onClick={() => playSound(value, selectedTone)}
              title={`Nghe âm: ${displayValue}`}
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: isRed ? "#cf1322" : "#262626",
                padding: "0 2px",
                height: 28,
              }}
            >
              {displayValue}
            </Button>
          );
        },
      };
    }),
  ];

  return (
    <Card style={{ borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 16,
          padding: "12px 16px",
          background: "#f9fafb",
          borderRadius: 12,
        }}
      >
        <Space wrap size="middle">
          <Text strong style={{ color: "#4b5563" }}>Vận mẫu:</Text>
          <Radio.Group
            value={finalMode}
            onChange={(e) => setFinalMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="basic">
              1. Đơn & Kép ({data.basic_finals.length})
            </Radio.Button>
            <Radio.Button value="nasal">
              2. Vận Mẫu Mũi ({data.nasal_finals.length})
            </Radio.Button>
          </Radio.Group>
        </Space>

        <Space wrap size="middle">
          <Text strong style={{ color: "#1677ff" }}>Thanh điệu (Tone):</Text>
          <Radio.Group
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value={1}>Thanh 1 ( ā )</Radio.Button>
            <Radio.Button value={2}>Thanh 2 ( á )</Radio.Button>
            <Radio.Button value={3}>Thanh 3 ( ǎ )</Radio.Button>
            <Radio.Button value={4}>Thanh 4 ( à )</Radio.Button>
          </Radio.Group>
        </Space>
      </div>

      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tag color="orange">Ô cam trên đầu: Bấm để nghe Vận mẫu theo thanh</Tag>
        <Tag color="blue">Cột xanh: Bấm nghe Thanh mẫu</Tag>
        <Tag color="red">Chữ màu đỏ: Âm biến điệu (j, q, x, y + ü)</Tag>
      </div>

      <Table
        columns={columns}
        dataSource={data.rows}
        rowKey="initial"
        pagination={false}
        bordered
        size="small"
        scroll={{ x: "max-content" }}
      />
    </Card>
  );
}