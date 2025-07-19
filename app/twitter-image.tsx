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
            backgroundImage: `linear-gradient(to right, #E6846415 1px, transparent 1px), linear-gradient(to bottom, #E6846415 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
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
          }}
        >
          {/* Main text */}
          <div
            style={{
              display: 'flex',
              fontSize: 100,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: 24,
              lineHeight: 1,
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
              <div
                style={{
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  right: 0,
                  height: 6,
                  background: '#E6846440',
                }}
              />
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 28,
              color: '#666',
              fontWeight: 500,
              marginBottom: 48,
              maxWidth: 800,
            }}
          >
            Create rankings and settle debates with friends
          </div>

          {/* Visual example */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
            }}
          >
            {['1', '2', '3'].map((num, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    border: '2px solid',
                    borderColor: i === 0 ? '#E68464' : '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 700,
                    background: i === 0 ? '#E68464' : 'transparent',
                    color: i === 0 ? 'white' : '#000',
                  }}
                >
                  {num}
                </div>
                {i < 2 && (
                  <div
                    style={{
                      fontSize: 32,
                      color: '#ccc',
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Corner accents */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 200,
            height: 200,
            background: 'linear-gradient(135deg, #E6846410 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 200,
            height: 200,
            background: 'linear-gradient(-45deg, #E6846410 0%, transparent 70%)',
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  )
}