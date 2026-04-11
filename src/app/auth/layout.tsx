"use client";

export default function AuthLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md lg:p-8">
        <div className="mx-auto">{children}</div>
      </div>
    </div>
  );
}
