import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'Draft Anything'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Image generation
export default async function Image() {
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
        {/* Multi-layered background like marketing page */}
        {/* Primary color gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(230, 132, 100, 0.03) 0%, transparent 50%, rgba(230, 132, 100, 0.08) 100%)',
          }}
        />
        
        {/* Enhanced grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(to right, rgba(230, 132, 100, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(230, 132, 100, 0.3) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            opacity: 0.4,
          }}
        />
        
        {/* Secondary grid for depth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
            backgroundSize: '8px 8px',
          }}
        />

        {/* Brutalist accent border */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: '2px solid rgba(230, 132, 100, 0.3)',
            pointerEvents: 'none',
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
            padding: '80px 60px',
          }}
        >

          {/* Main text */}
          <div
            style={{
              display: 'flex',
              fontSize: 100,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: 20,
              color: '#E5E5E5',
            }}
          >
            Draft{' '}
            <span
              style={{
                color: '#E68464',
                marginLeft: 20,
                position: 'relative',
              }}
            >
              Anything
              {/* Underline accent */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: 'rgba(230, 132, 100, 0.3)',
                }}
              />
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: '#999',
              fontWeight: 500,
              marginBottom: 60,
              letterSpacing: '-0.01em',
            }}
          >
            Create rankings and settle debates with friends
          </div>

          {/* Example items in brutalist style */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 0,
            }}
          >
            {[
              { num: '1', text: 'Pizza Palace', selected: true },
              { num: '2', text: 'Burger Haven', selected: false },
              { num: '3', text: 'Sushi Central', selected: false },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '20px 32px',
                  border: '2px solid',
                  borderColor: item.selected ? '#E68464' : '#484848',
                  background: item.selected ? 'rgba(230, 132, 100, 0.1)' : '#1A1A1A',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: '2px solid',
                    borderColor: item.selected ? '#E68464' : '#484848',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    color: item.selected ? '#E68464' : '#999',
                    background: item.selected ? 'rgba(230, 132, 100, 0.2)' : 'transparent',
                  }}
                >
                  {item.num}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: item.selected ? '#E5E5E5' : '#999',
                  }}
                >
                  {item.text}
                </div>
                {item.selected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: 4,
                      background: '#E68464',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Corner accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '0 0 100px 100px',
            borderColor: 'transparent transparent rgba(230, 132, 100, 0.2) transparent',
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  )
}