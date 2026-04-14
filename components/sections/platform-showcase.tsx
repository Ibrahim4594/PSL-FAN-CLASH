"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const showcaseSlides = [
  {
    id: 1,
    title: "Match Staking",
    description: "Pick your team, set your stake amount, and lock WIRE into the match vault before the deadline.",
    src: "/screenshots/fixed-3-matches.png",
    alt: "Match staking interface",
  },
  {
    id: 2,
    title: "Live Matches",
    description: "Track all 44 PSL matches with real-time pool sizes, countdown timers, and match status.",
    src: "/screenshots/fixed-3-matches.png",
    alt: "Matches grid overview",
  },
  {
    id: 3,
    title: "Leaderboard",
    description: "On-chain fan rankings updated after every match. Track your season performance.",
    src: "/screenshots/fixed-4-stats.png",
    alt: "Season leaderboard",
  },
  {
    id: 4,
    title: "Charity Vote",
    description: "Winners vote on which charity receives the 15% pool. Stake-weighted governance.",
    src: "/screenshots/fixed-5-charity.png",
    alt: "Charity voting dashboard",
  },
  {
    id: 5,
    title: "Profile",
    description: "Your wallet, staking history, earnings, and charity contributions — all in one place.",
    src: "/screenshots/fixed-8-footer.png",
    alt: "User profile page",
  },
]

export function PlatformShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState<number>(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-advance slides
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev === showcaseSlides.length - 1 ? 0 : prev + 1))
    }, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (!sectionRef.current) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        once: true,
      },
    })

    tl.fromTo(
      headingRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
    )
      .fromTo(
        textRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
        "-=0.3"
      )
      .fromTo(
        sliderRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
        "-=0.2"
      )

    return () => {
      tl.kill()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    // Reset auto-advance timer
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev === showcaseSlides.length - 1 ? 0 : prev + 1))
    }, 5000)
  }

  return (
    <section
      ref={sectionRef}
      style={{
        background: '#0a0a0a',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingTop: '96px',
        paddingBottom: '96px',
        overflow: 'hidden',
      }}
    >
      <div className="sc">
        {/* Header */}
        <p
          className="tc"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '16px',
          }}
        >
          Platform Tour
        </p>
        <h2
          ref={headingRef}
          className="tc font-['Clash_Display',sans-serif]"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          See It In Action
        </h2>
        <p
          ref={textRef}
          className="tc mc"
          style={{
            maxWidth: '560px',
            fontSize: '16px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.7,
            marginBottom: '48px',
            textAlign: 'center',
          }}
        >
          From staking to charity voting — every feature designed for speed, clarity, and on-chain transparency.
        </p>
      </div>

      {/* Carousel */}
      <div
        ref={sliderRef}
        style={{
          position: 'relative',
          height: '60vh',
          minHeight: '400px',
          maxHeight: '600px',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {showcaseSlides.map((slide, index) => {
            const position = index - currentSlide
            const isActive = position === 0
            const zIndex = isActive ? 30 : 20 - Math.abs(position)
            const scale = isActive ? 1 : 0.88
            const translateX = position * 85
            const opacity = Math.abs(position) > 1 ? 0 : isActive ? 1 : 0.5

            return (
              <div
                key={slide.id}
                style={{
                  position: 'absolute',
                  transform: `translateX(${translateX}%) scale(${scale})`,
                  zIndex,
                  opacity,
                  transition: 'transform 300ms cubic-bezier(0.23,1,0.32,1), opacity 300ms cubic-bezier(0.23,1,0.32,1)',
                  border: isActive
                    ? '1px solid rgba(255,255,255,0.2)'
                    : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: isActive ? 'default' : 'pointer',
                }}
                onClick={() => !isActive && goToSlide(index)}
              >
                <div style={{
                  position: 'relative',
                  aspectRatio: '16/9',
                  width: '65vw',
                  maxWidth: '900px',
                }}>
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority={slide.id === 1}
                  />
                  {/* Dark overlay on inactive slides */}
                  {!isActive && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                    }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tab buttons + description */}
      <div className="sc" style={{ marginTop: '32px' }}>
        {/* Active slide description */}
        <p
          className="tc mc"
          style={{
            maxWidth: '480px',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.7,
            marginBottom: '24px',
            textAlign: 'center',
            minHeight: '42px',
          }}
        >
          {showcaseSlides[currentSlide].description}
        </p>

        {/* Tab navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0',
          flexWrap: 'wrap',
        }}>
          {showcaseSlides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              style={{
                padding: '12px 16px',
                minHeight: '48px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: currentSlide === index ? 700 : 400,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: currentSlide === index ? '#f7f8f8' : 'rgba(255,255,255,0.3)',
                background: 'transparent',
                border: 'none',
                borderBottom: currentSlide === index
                  ? '2px solid #FF3B30'
                  : '2px solid transparent',
                cursor: 'pointer',
                transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
              }}
            >
              {slide.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
