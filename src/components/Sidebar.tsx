"use client";

import {
  BookOutlined,
  TranslationOutlined,
  EditOutlined,
  HomeOutlined,
  FontSizeOutlined,
  ReadOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { Layout, Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";

const { Sider } = Layout;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Sider
      width={250}
      theme="light"
      breakpoint="lg"
      collapsedWidth="0"
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          fontSize: 20,
          fontWeight: 700,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        🇨🇳 Chinese Learn
      </div>

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        onClick={({ key }) => router.push(key)}
        items={[
          {
            key: "/",
            icon: <HomeOutlined />,
            label: "Trang chủ",
          },

          {
            key: "learning",
            icon: <BookOutlined />,
            label: "Học tiếng Trung",
            children: [
              {
                key: "/radicals",
                icon: <ReadOutlined />,
                label: "Bộ thủ",
              },
              {
                key: "/words",
                icon: <BookOutlined />,
                label: "Từ vựng",
              },
              {
                key: "/translate-text",
                label: "Dịch đoạn văn",
              },
            ],
          },

          {
            key: "translate",
            icon: <TranslationOutlined />,
            label: "Dịch",
            children: [
              
            ],
          },

          {
            key: "practice",
            icon: <EditOutlined />,
            label: "Luyện tập",
            children: [
              {
                key: "/practice",
                label: "Luyện chữ",
              },
              {
                key: "/practice-radicals",
                icon: <ExperimentOutlined />,
                label: "Luyện bộ thủ",
              },
              {
                key: "/quiz",
                icon: <ExperimentOutlined />,
                label: "Trò chơi luyện tập",
              },
              {
                key: "/pinyin-chart",
                icon: <ExperimentOutlined />,
                label: "Luyện phát âm",
              },
            ],
          },
        ]}
      />
    </Sider>
  );
}