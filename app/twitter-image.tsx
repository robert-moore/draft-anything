import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'Draft Anything'
export const size = {
  width: 1200,
  height: 600,
}
export const contentType = 'image/png'

// Image generation
export default async function Image() {
  // Sage mint color
  const primaryColor = '#64B5A6'
  
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: '#121212',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Enhanced grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(100, 181, 166, 0.05) 0%, transparent 40%, rgba(100, 181, 166, 0.1) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(to right, rgba(100, 181, 166, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(100, 181, 166, 0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            opacity: 0.3,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            padding: '60px',
          }}
        >
          {/* Main text */}
          <div
            style={{
              display: 'flex',
              fontSize: 90,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: 24,
              lineHeight: 1,
              color: '#E5E5E5',
            }}
          >
            Draft{' '}
            <span
              style={{
                color: primaryColor,
                marginLeft: 20,
                position: 'relative',
              }}
            >
              Anything
              <div
                style={{
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  right: 0,
                  height: 6,
                  background: 'rgba(100, 181, 166, 0.4)',
                }}
              />
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 28,
              color: '#999',
              fontWeight: 500,
              marginBottom: 50,
              maxWidth: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Create rankings and settle debates with friends
          </div>

          {/* Visual flow with brutalist cards */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'center',
            }}
          >
            {[
              { step: 'Create', icon: '✏️' },
              { step: 'Draft', icon: '🎯' },
              { step: 'Share', icon: '🏆' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                }}
              >
                <div
                  style={{
                    padding: '24px 32px',
                    border: '2px solid',
                    borderColor: i === 1 ? primaryColor : '#484848',
                    background: i === 1 ? 'rgba(100, 181, 166, 0.1)' : '#1A1A1A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 32 }}>{item.icon}</span>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      color: i === 1 ? primaryColor : '#999',
                    }}
                  >
                    {item.step}
                  </div>
                </div>
                {i < 2 && (
                  <div
                    style={{
                      fontSize: 28,
                      color: '#484848',
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom border accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, transparent 0%, ${primaryColor} 50%, transparent 100%)`,
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  )
}