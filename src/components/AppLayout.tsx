"use client";

import { usePathname } from "next/navigation";
import { Layout } from "antd";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AuthGuard from "./AuthGuard";

const { Content } = Layout;

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 1. Nếu là trang đăng nhập: Không render Sidebar & Header
  if (pathname === "/login") {
    return <main>{children}</main>;
  }

  // 2. Các trang còn lại: Bọc bảo vệ AuthGuard và hiển thị Layout chuẩn
  return (
    <AuthGuard>
      <Layout style={{ minHeight: "100vh" }}>
        <Sidebar />

        <Layout>
          <Header />

          <Content
            style={{
              padding: 24,
              background: "#f5f7fa",
              minHeight: "calc(100vh - 64px)",
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}