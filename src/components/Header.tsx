"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, Typography, Space, Button, message } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("username");
      if (storedUser) {
        setUsername(storedUser);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    message.success("Đã đăng xuất thành công");
    router.replace("/login");
  };

  return (
    <AntHeader
      style={{
        background: "#fff",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <Text strong style={{ fontSize: 16 }}>
        Hệ thống học tiếng Trung
      </Text>

      <Space size="middle">
        {username && (
          <Space style={{ color: "#333", fontSize: 14 }}>
            <UserOutlined style={{ color: "#1677ff" }} />
            <Text strong>{username}</Text>
          </Space>
        )}

        <Button
          type="text"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          Đăng xuất
        </Button>
      </Space>
    </AntHeader>
  );
}