import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fishway – Jual Beli Ikan Segar",
  description: "Platform jual beli ikan segar terpercaya",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen font-sans">{children}</div>;
}
