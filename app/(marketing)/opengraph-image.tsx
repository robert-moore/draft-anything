import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'Draft Anything - Create rankings and settle debates with friends'
export const size = {
  width: 1200,
  height: 630,
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
          background: '#0F0F0F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: 60,
        }}
      >
        {/* Multi-layered background effects */}
        {/* Primary gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at top right, rgba(100, 181, 166, 0.15) 0%, transparent 40%), radial-gradient(ellipse at bottom left, rgba(100, 181, 166, 0.1) 0%, transparent 40%)',
          }}
        />

        {/* Grid patterns */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(to right, rgba(100, 181, 166, 0.5) 2px, transparent 2px), linear-gradient(to bottom, rgba(100, 181, 166, 0.5) 2px, transparent 2px)`,
            backgroundSize: '48px 48px',
            opacity: 0.2,
          }}
        />
        
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
            backgroundSize: '12px 12px',
          }}
        />

        {/* Brutalist border */}
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 30,
            right: 30,
            bottom: 30,
            border: '3px solid rgba(100, 181, 166, 0.5)',
          }}
        />

        {/* Content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
            padding: '60px 50px',
          }}
        >
          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 100,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 24,
              textAlign: 'center',
              color: '#E5E5E5',
            }}
          >
            <span>Draft</span>
            <span
              style={{
                color: primaryColor,
                marginLeft: 28,
                position: 'relative',
              }}
            >
              Anything
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: 0,
                  right: 0,
                  height: 8,
                  background: 'rgba(100, 181, 166, 0.4)',
                }}
              />
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 30,
              color: '#999',
              fontWeight: 500,
              marginBottom: 50,
              textAlign: 'center',
              maxWidth: 800,
              letterSpacing: '-0.01em',
            }}
          >
            Create rankings and settle debates with friends
          </div>

          {/* Example ranking cards */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
              maxWidth: 700,
            }}
          >
            {[
              { rank: '1', name: 'Avengers: Endgame', score: '92%', active: true },
              { rank: '2', name: 'Iron Man', score: '81%', active: false },
              { rank: '3', name: 'Black Panther', score: '70%', active: false },
            ].map((item) => (
              <div
                key={item.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  padding: '24px 32px',
                  border: '2px solid',
                  borderColor: item.active ? primaryColor : '#333',
                  background: item.active ? 'rgba(100, 181, 166, 0.08)' : '#1A1A1A',
                  position: 'relative',
                  transform: item.active ? 'translateX(8px)' : 'translateX(0)',
                  boxShadow: item.active ? '4px 4px 0px 0px rgba(100, 181, 166, 0.3)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    border: '2px solid',
                    borderColor: item.active ? primaryColor : '#484848',
                    background: item.active ? 'rgba(100, 181, 166, 0.2)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 700,
                    color: item.active ? primaryColor : '#999',
                  }}
                >
                  {item.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 600,
                      color: item.active ? '#E5E5E5' : '#999',
                      marginBottom: 4,
                    }}
                  >
                    {item.name}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: item.active ? primaryColor : '#666',
                    fontFamily: 'monospace',
                  }}
                >
                  {item.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: 45,
            right: 45,
            fontSize: 18,
            fontWeight: 600,
            color: primaryColor,
            opacity: 0.6,
            letterSpacing: '0.1em',
          }}
        >
          DRAFTANYTHING.IO
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}