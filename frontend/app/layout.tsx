import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Providers } from "@/components/providers"
import { Separator } from "@/components/ui/separator"

export const dynamic = "force-dynamic"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dashboard Operativo",
  description: "Sistema de visualización y análisis de datos operativos de control de horarios",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 flex flex-col min-h-screen">
              {/* Header */}
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex-1" />
                <ThemeToggle />
              </header>

              {/* Main Content */}
              <div className="flex-1 p-6">{children}</div>
            </main>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}
