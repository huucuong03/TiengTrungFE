"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Form, Input, Button, Tabs, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<string>("login");
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tiengtrung-7hto.onrender.com";

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Đăng nhập thất bại");

      // Lưu token và username vào LocalStorage
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("username", data.username);

      // --- KIỂM TRA NGAY TOKEN ĐÃ LƯU ---
      console.log("Token đã được lưu vào localStorage:", localStorage.getItem("access_token"));

      message.success("Đăng nhập thành công!");
      router.push("/");
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Đăng ký thất bại");

      message.success("Đăng ký thành công! Hãy chuyển sang Đăng nhập.");
      setTab("login");
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card style={{ width: 400, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>Học Tiếng Trung Tương Tác</Title>
          <Text type="secondary">Mỗi tài khoản chỉ được sử dụng trên 1 thiết bị</Text>
        </div>

        <Tabs
          activeKey={tab}
          onChange={setTab}
          centered
          items={[
            {
              key: "login",
              label: "Đăng Nhập",
              children: (
                <Form layout="vertical" onFinish={handleLogin}>
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                    Đăng Nhập
                  </Button>
                </Form>
              ),
            },
            {
              key: "register",
              label: "Đăng Ký",
              children: (
                <Form layout="vertical" onFinish={handleRegister}>
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                    Tạo Tài Khoản
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}