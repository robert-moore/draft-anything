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
          background: '#fafafa',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(to right, #0000000A 1px, transparent 1px), linear-gradient(to bottom, #0000000A 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Primary color gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(230, 132, 100, 0.03) 0%, transparent 50%, rgba(230, 132, 100, 0.08) 100%)',
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
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                border: '4px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                fontWeight: 800,
                background: '#E68464',
                color: 'white',
              }}
            >
              DA
            </div>
          </div>

          {/* Main text */}
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: 20,
            }}
          >
            Draft{' '}
            <span
              style={{
                color: '#E68464',
                marginLeft: 20,
              }}
            >
              Anything
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: '#666',
              fontWeight: 500,
              marginBottom: 60,
            }}
          >
            Create rankings and settle debates with friends
          </div>

          {/* Example items */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 20,
            }}
          >
            {['Pizza Places', 'Marvel Movies', 'Travel Spots'].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '16px 32px',
                  border: '2px solid #000',
                  fontSize: 24,
                  fontWeight: 600,
                  background: i === 1 ? '#E68464' : 'white',
                  color: i === 1 ? 'white' : '#000',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#E68464',
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  )
}