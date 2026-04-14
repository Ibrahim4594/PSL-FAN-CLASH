'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Shield, Trophy, Heart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { BorderBeam } from '@/components/ui/border-beam';
import { BlurFade } from '@/components/ui/blur-fade';

const cardHover = {
  rest: { borderColor: 'rgba(255,255,255,0.08)', y: 0 },
  hover: { borderColor: 'rgba(255,255,255,0.25)', y: -2 },
};

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export function PlatformFeatures() {
  return (
    <section
      style={{
        background: '#0a0a0a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '120px 0',
      }}
    >
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 24px' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <BlurFade delay={0.1} inView>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: '20px',
            }}>
              Platform
            </p>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <h2 className="font-['Clash_Display',sans-serif]" style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              textAlign: 'center',
            }}>
              Built for Fans.<br />Powered by Web3.
            </h2>
          </BlurFade>
        </div>

        {/* Bento grid */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'relative',
            zIndex: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '12px',
          }}>
            {/* Card 1: Staking split */}
            <BlurFade delay={0.3} inView className="col-span-full lg:col-span-2">
            <motion.div initial="rest" whileHover="hover" variants={cardHover} transition={spring} style={{ height: '100%' }}>
            <Card className="relative flex overflow-hidden h-full" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
              transition: 'border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <CardContent className="relative m-auto size-fit pt-6">
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  height: '96px',
                  width: '224px',
                  alignItems: 'center',
                }}>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', color: 'rgba(255,255,255,0.06)' }} viewBox="0 0 254 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M112.891 97.7022C140.366 97.0802 171.004 94.6715 201.087 87.5116C210.43 85.2881 219.615 82.6412 228.284 78.2473C232.198 76.3179 235.905 73.9942 239.348 71.3124C241.85 69.2557 243.954 66.7571 245.555 63.9408C249.34 57.3235 248.281 50.5341 242.498 45.6109C239.033 42.7237 235.228 40.2703 231.169 38.3054C219.443 32.7209 207.141 28.4382 194.482 25.534C184.013 23.1927 173.358 21.7755 162.64 21.2989C161.376 21.3512 160.113 21.181 158.908 20.796C158.034 20.399 156.857 19.1682 156.962 18.4535C157.115 17.8927 157.381 17.3689 157.743 16.9139C158.104 16.4588 158.555 16.0821 159.067 15.8066C160.14 15.4683 161.274 15.3733 162.389 15.5286C179.805 15.3566 196.626 18.8373 212.998 24.462C220.978 27.2494 228.798 30.4747 236.423 34.1232C240.476 36.1159 244.202 38.7131 247.474 41.8258C254.342 48.2578 255.745 56.9397 251.841 65.4892C249.793 69.8582 246.736 73.6777 242.921 76.6327C236.224 82.0192 228.522 85.4602 220.502 88.2924C205.017 93.7847 188.964 96.9081 172.738 99.2109C153.442 101.949 133.993 103.478 114.506 103.79C91.1468 104.161 67.9334 102.97 45.1169 97.5831C36.0094 95.5616 27.2626 92.1655 19.1771 87.5116C13.839 84.5746 9.1557 80.5802 5.41318 75.7725C-0.54238 67.7259 -1.13794 59.1763 3.25594 50.2827C5.82447 45.3918 9.29572 41.0315 13.4863 37.4319C24.2989 27.5721 37.0438 20.9681 50.5431 15.7272C68.1451 8.8849 86.4883 5.1395 105.175 2.83669C129.045 0.0992292 153.151 0.134761 177.013 2.94256C197.672 5.23215 218.04 9.01724 237.588 16.3889C240.089 17.3418 242.498 18.5197 244.933 19.6446C246.627 20.4387 247.725 21.6695 246.997 23.615C246.455 25.1105 244.814 25.5605 242.63 24.5811C230.322 18.9961 217.233 16.1904 204.117 13.4376C188.761 10.3438 173.2 8.36665 157.558 7.52174C129.914 5.70776 102.154 8.06792 75.2124 14.5228C60.6177 17.8788 46.5758 23.2977 33.5102 30.6161C26.6595 34.3329 20.4123 39.0673 14.9818 44.658C12.9433 46.8071 11.1336 49.1622 9.58207 51.6855C4.87056 59.5336 5.61172 67.2494 11.9246 73.7608C15.2064 77.0494 18.8775 79.925 22.8564 82.3236C31.6176 87.7101 41.3848 90.5291 51.3902 92.5804C70.6068 96.5773 90.0219 97.7419 112.891 97.7022Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span style={{
                    display: 'block',
                    margin: '0 auto',
                    width: 'fit-content',
                    fontSize: '48px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                  }}>82%</span>
                </div>
                <h3 style={{
                  marginTop: '24px',
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                }}>Winners Earn</h3>
                <p style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '8px',
                }}>15% to charity. 3% platform.</p>
              </CardContent>
              <BorderBeam size={180} duration={10} colorFrom="rgba(255,255,255,0.5)" colorTo="rgba(255,59,48,0.3)" />
            </Card>
            </motion.div>
            </BlurFade>

            {/* Card 2: Smart Contract Security */}
            <BlurFade delay={0.4} inView className="col-span-full sm:col-span-3 lg:col-span-2">
            <motion.div initial="rest" whileHover="hover" variants={cardHover} transition={spring} style={{ height: '100%' }}>
            <Card className="relative overflow-hidden h-full" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
              transition: 'border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <CardContent className="pt-6">
                <div style={{
                  position: 'relative',
                  margin: '0 auto',
                  display: 'flex',
                  width: '128px',
                  height: '128px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: '-8px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }} />
                  <Shield style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.6)' }} strokeWidth={1} />
                </div>
                <div style={{ position: 'relative', zIndex: 10, marginTop: '24px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600 }}>OpenZeppelin Secured</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '8px', lineHeight: 1.6 }}>
                    Battle-tested smart contracts with audited patterns. ReentrancyGuard, Ownable, and Pausable built in.
                  </p>
                </div>
              </CardContent>
            </Card>
            </motion.div>
            </BlurFade>

            {/* Card 3: WireFluid Chain */}
            <BlurFade delay={0.5} inView className="col-span-full sm:col-span-3 lg:col-span-2">
            <motion.div initial="rest" whileHover="hover" variants={cardHover} transition={spring} style={{ height: '100%' }}>
            <Card className="relative overflow-hidden h-full" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
            }}>
              <CardContent className="pt-6">
                <div style={{ padding: '24px 24px 0' }}>
                  {/* Simple staking flow visualization */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '20px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    <Zap style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.4)' }} />
                    <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{ width: '60%', height: '100%', background: '#f7f8f8' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Chain 92533</span>
                  </div>
                </div>
                <div style={{ position: 'relative', zIndex: 10, marginTop: '24px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600 }}>WireFluid Testnet</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '8px', lineHeight: 1.6 }}>
                    EVM-compatible with low gas fees. MetaMask auto-connect with one-click chain switching.
                  </p>
                </div>
              </CardContent>
            </Card>
            </motion.div>
            </BlurFade>

            {/* Card 4: Leaderboard - wide */}
            <BlurFade delay={0.6} inView className="col-span-full lg:col-span-3">
            <motion.div initial="rest" whileHover="hover" variants={cardHover} transition={spring} style={{ height: '100%' }}>
            <Card className="relative overflow-hidden h-full" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
            }}>
              <CardContent className="bento-internal-2col" style={{ display: 'grid', paddingTop: '24px', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }} />
                    <Trophy style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.6)' }} strokeWidth={1} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Season Leaderboard</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '8px', lineHeight: 1.6 }}>
                      Track fan engagement across all 44 matches. On-chain rankings updated in real-time.
                    </p>
                  </div>
                </div>
                {/* Mini leaderboard preview */}
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  padding: '24px',
                }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  {[
                    { rank: '01', name: '0x7a3f...b2c1', pts: '2,450' },
                    { rank: '02', name: '0x9e1d...f4a8', pts: '1,820' },
                    { rank: '03', name: '0x3c5b...e7d2', pts: '1,340' },
                  ].map((entry) => (
                    <div key={entry.rank} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', width: '24px' }}>{entry.rank}</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{entry.name}</span>
                      <span style={{ color: '#f7f8f8' }}>{entry.pts}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </motion.div>
            </BlurFade>

            {/* Card 5: Charity DAO - wide */}
            <BlurFade delay={0.7} inView className="col-span-full lg:col-span-3">
            <motion.div initial="rest" whileHover="hover" variants={cardHover} transition={spring} style={{ height: '100%' }}>
            <Card className="relative overflow-hidden h-full" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
            }}>
              <CardContent className="bento-internal-2col" style={{ display: 'grid', paddingTop: '24px', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }} />
                    <Heart style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.6)' }} strokeWidth={1} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Charity DAO Voting</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '8px', lineHeight: 1.6 }}>
                      Winners vote on which charity receives the 15% pool. Stake-weighted governance with 48hr windows.
                    </p>
                  </div>
                </div>
                {/* Charity voting preview */}
                <div style={{
                  position: 'relative',
                  marginTop: '24px',
                }}>
                  <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '24px',
                    paddingTop: '16px',
                  }}>
                    {[
                      { name: 'Edhi Foundation', pct: 42 },
                      { name: 'Shaukat Khanum', pct: 35 },
                      { name: 'The Citizens Foundation', pct: 23 },
                    ].map((charity) => (
                      <div key={charity.name}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          marginBottom: '6px',
                        }}>
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{charity.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}>{charity.pct}%</span>
                        </div>
                        <div style={{
                          height: '4px',
                          borderRadius: '2px',
                          background: 'rgba(255,255,255,0.08)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${charity.pct}%`,
                            height: '100%',
                            background: '#f7f8f8',
                            borderRadius: '2px',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
            </BlurFade>
          </div>
        </div>
      </div>
    </section>
  );
}
