'use client'

import Link from 'next/link'
import { useAuth } from '@/components/contexts/AuthProvider'

export default function Home() {
  const { user, role: userRole } = useAuth()

  // Determine Get Started link based on auth state
  const getStartedHref = user
    ? userRole === 'customer'
      ? '/customer/request'
      : '/admin/dashboard'
    : '/login'

  const getStartedLabel = user
    ? userRole === 'customer'
      ? 'Service Request'
      : 'Dashboard'
    : 'Get Started'

  return (
    <main>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #0077C8 0%, #005FA3 100%)',
        padding: '40px 20px 50px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: '0 0 16px 0',
            lineHeight: 1.2,
          }}>
            Technical Support System
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'rgba(255,255,255,0.9)',
            margin: '0 auto 40px',
            maxWidth: '600px',
            lineHeight: 1.6,
          }}>
            Streamline your technical service requests with Boccard Indonesia.
            Expert support, real-time tracking, and seamless communication.
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link
              href={getStartedHref}
              style={{
                background: '#FFFFFF',
                color: '#0077C8',
                padding: '14px 32px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '16px',
                textDecoration: 'none',
                transition: 'transform 0.2s ease',
              }}
            >
              {getStartedLabel}
            </Link>
            <Link
              href="/track-request"
              style={{
                background: 'transparent',
                color: '#FFFFFF',
                padding: '14px 32px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '16px',
                textDecoration: 'none',
                border: '2px solid rgba(255,255,255,0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              Track Request
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: '40px 20px',
        background: '#F8FAFC',
      }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#0F172A',
              margin: '0 0 12px 0',
            }}>
              How It Works
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#64748B',
              margin: 0,
            }}>
              Simple steps to get the technical support you need
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
          }}>
            {[
              {
                step: '01',
                title: 'Sign In',
                desc: 'Log in with your registered account to access your personalized dashboard.',
                icon: '👤',
              },
              {
                step: '02',
                title: 'Submit Request',
                desc: 'Fill out the service request form with your site location and problem details.',
                icon: '📝',
              },
              {
                step: '03',
                title: 'Review & Approve',
                desc: 'Our engineering team reviews your request and schedules the visit.',
                icon: '✓',
              },
              {
                step: '04',
                title: 'Service Completed',
                desc: 'Technician completes the work and you confirm satisfaction.',
                icon: '🔧',
              },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  background: '#FFFFFF',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  fontSize: '48px',
                  fontWeight: 800,
                  color: '#EAF3FB',
                  lineHeight: 1,
                }}>
                  {item.step}
                </div>
                <div style={{
                  fontSize: '40px',
                  marginBottom: '16px',
                }}>
                  {item.icon}
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#0F172A',
                  margin: '0 0 8px 0',
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#64748B',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '40px 20px',
        background: '#FFFFFF',
      }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#0F172A',
              margin: '0 0 12px 0',
            }}>
              Why Choose Boccard
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#64748B',
              margin: 0,
            }}>
              Industry-leading technical support with a commitment to excellence
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
          }}>
            {[
              {
                title: 'Expert Technicians',
                desc: 'Our team consists of certified professionals with years of experience in industrial automation and technical support.',
                icon: '👨‍🔧',
              },
              {
                title: 'Real-Time Tracking',
                desc: 'Track your service requests in real-time from submission to completion with full transparency.',
                icon: '📊',
              },
              {
                title: 'Flexible Support',
                desc: 'Choose between on-site visits or remote support based on your specific needs and urgency.',
                icon: '🌐',
              },
              {
                title: 'Quota Management',
                desc: 'Easily manage your support hours with our transparent quota system and usage tracking.',
                icon: '⏱️',
              },
              {
                title: 'Secure Platform',
                desc: 'Enterprise-grade security ensures your data and communications are always protected.',
                icon: '🔒',
              },
              {
                title: 'Quick Response',
                desc: 'Fast response times with dedicated support channels for urgent technical issues.',
                icon: '⚡',
              },
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '24px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                }}
              >
                <div style={{
                  fontSize: '32px',
                  flexShrink: 0,
                }}>
                  {feature.icon}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#0F172A',
                    margin: '0 0 8px 0',
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748B',
                    margin: 0,
                    lineHeight: 1.6,
                  }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '40px 20px',
        background: '#0F172A',
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: '0 0 12px 0',
          }}>
            Ready to Get Started?
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 32px 0',
            lineHeight: 1.6,
          }}>
            Sign in to your account to submit service requests and track their progress.
          </p>
          <Link
            href="/login"
            style={{
              background: '#0077C8',
              color: '#FFFFFF',
              padding: '14px 32px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Sign In to Your Account
          </Link>
        </div>
      </section>
    </main>
  )
}
