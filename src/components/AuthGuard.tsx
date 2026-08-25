"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { message, Spin } from "antd";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  // Khai báo API_URL trỏ thẳng tới Backend trên Render
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tiengtrung-7hto.onrender.com";

  useEffect(() => {
    // Không chặn trang đăng nhập
    if (pathname === "/login") {
      setChecking(false);
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    // Gắn API_URL vào trước /api/auth/me để gọi chính xác lên Backend
    fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          message.error(
            data.detail || "Phiên đăng nhập đã hết hạn hoặc được mở ở thiết bị khác"
          );
          localStorage.removeItem("access_token");
          localStorage.removeItem("username");
          router.replace("/login");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, [pathname, router]);

  if (checking && pathname !== "/login") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}