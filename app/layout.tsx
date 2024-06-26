import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./[lang]/globals.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wydatki",
  description: "Wydatki",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl-PL">
      <body className={inter.className}>
      <ToastContainer />
        {children}
      </body>
    </html>
  );
}
