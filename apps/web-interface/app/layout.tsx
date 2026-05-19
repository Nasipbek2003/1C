import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Панель оператора - Магазин одежды',
  description: 'Система управления клиентскими коммуникациями',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
