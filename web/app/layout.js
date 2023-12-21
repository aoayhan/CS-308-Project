import { Inter } from 'next/font/google'
import './globals.css'

import Header from '../components/header/header';
import Footer from '@/components/footer/footer';
const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SUpotify',
  description: 'Login Page of SUpotify',
}
//Login page text  will be changed by a js object. 2.11.2023
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body >
        <main>
          <Header/>
          {children}
          <Footer/>
        </main>
        
      </body>
    </html>
  )
}