'use client';

import { AuthProvider } from '@/app/lib/auth.js';

export function Providers({ children }) {
  // console.log("env in providers", process.env)
  return (
      <AuthProvider>{children}</AuthProvider>
  );
}