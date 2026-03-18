import "./globals.css";

export const metadata = {
  title: "ICONICS",
  description: "Fraternidade ICONICS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}