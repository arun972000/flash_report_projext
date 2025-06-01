export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="container admin-panel">
{children}
      </div>
    </>
  );
}
