import type { Metadata } from "next";

// Routes in this group are publicly accessible.
// The reservation flow belongs to the same installable client app as the account
// pages, so it links the same manifest (see `(client-portal)/layout.tsx`).
export const metadata: Metadata = {
  manifest: "/manifest-client.json",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}