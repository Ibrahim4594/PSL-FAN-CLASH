"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useLocale } from "@/lib/locale-context"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
}

export function NavBar({ items, className, leftElement, rightElement }: NavBarProps) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const { locale, toggle: toggleLocale } = useLocale()

  useEffect(() => {
    // Set active tab based on current pathname
    const match = items.find((item) => item.url === pathname)
    if (match) setActiveTab(match.name)
    else if (pathname === "/") setActiveTab(items[0]?.name || "")
  }, [pathname, items])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-6 sm:bottom-auto sm:top-0 left-1/2 -translate-x-1/2 z-50 sm:pt-4",
        className,
      )}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '4px',
          borderRadius: '9999px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: 'calc(100vw - 32px)',
          overflow: 'hidden',
        }}
      >
        {leftElement && (
          <div style={{ marginRight: '4px', display: 'flex', alignItems: 'center' }}>
            {leftElement}
          </div>
        )}

        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              style={{
                position: 'relative',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                padding: isMobile ? '8px 12px' : '8px 20px',
                borderRadius: '9999px',
                color: isActive ? '#f7f8f8' : 'rgba(255,255,255,0.4)',
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'color 0.2s ease',
              }}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="tubelight"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '9999px',
                    zIndex: -1,
                  }}
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  {/* Tubelight glow bar */}
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '32px',
                    height: '3px',
                    background: '#FF3B30',
                    borderRadius: '9999px 9999px 0 0',
                  }}>
                    <div style={{
                      position: 'absolute',
                      width: '48px',
                      height: '12px',
                      background: 'rgba(255,59,48,0.2)',
                      borderRadius: '9999px',
                      filter: 'blur(8px)',
                      top: '-4px',
                      left: '-8px',
                    }} />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}

        {/* EN/UR Toggle */}
        <button
          onClick={toggleLocale}
          style={{
            padding: '6px 10px', borderRadius: '9999px', border: 'none',
            background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
            color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em',
            transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), background 200ms cubic-bezier(0.23,1,0.32,1)',
            minHeight: 32,
          }}
        >
          {locale === 'en' ? 'اردو' : 'EN'}
        </button>

        {/* Right element (Connect Wallet) — hidden on mobile to prevent overflow */}
        {rightElement && (
          <div className="hidden sm:block" style={{ marginLeft: '4px' }}>
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}
