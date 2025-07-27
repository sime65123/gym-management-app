import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  fallback: ["system-ui", "Arial", "sans-serif"]
})

// Configuration des métadonnées et du favicon
const siteConfig = {
  name: "GYM ZONE",
  title: "GYM ZONE - Votre Salle de Sport Moderne",
  description: "Rejoignez GYM ZONE, la meilleure salle de sport de Yaounde avec des équipements modernes et des coachs professionnels.",
  url: "https://gymzone.ci",
  logo: "/lg1.jpg",
  ogImage: "/og-image.jpg",
  links: {
    twitter: "https://twitter.com/gymzone",
    github: "https://github.com/yourusername/gym-zone",
  },
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://gymzon.netlify.app'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#000000',
      },
    ],
  },
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["salle de sport", "fitness", "musculation", "coaching", "Côte d'Ivoire", "Abidjan"],
  authors: [
    {
      name: "GYM ZONE",
      url: siteConfig.url,
    },
  ],
  creator: "GYM ZONE",
  openGraph: {
    type: "website",
    locale: "fr_CI",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@gymzone",
  },

  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
