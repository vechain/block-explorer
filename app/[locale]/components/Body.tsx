'use client'

import { Rubik } from 'next/font/google'
const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  weight: ['400', '500', '600'],
})

export const Body = ({ children }: { children: React.ReactNode }) => {
  return <body className={rubik.variable}>{children}</body>
}
