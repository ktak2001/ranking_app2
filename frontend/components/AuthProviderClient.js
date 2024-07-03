"use client"

import { AuthProvider } from "@/app/lib/auth.js";

export default function AuthProviderClient({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
