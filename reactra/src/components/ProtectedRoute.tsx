"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";

export default function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!allowedRoles.includes(user.role)) {
        router.push("/");
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-16 text-center text-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
