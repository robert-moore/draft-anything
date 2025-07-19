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
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
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
        {/* Brutalist border */}
        <div
          style={{
            position: 'absolute',
            inset: 40,
            border: '4px solid #000',
          }}
        />

        {/* Grid background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(to right, #E6846412 2px, transparent 2px), linear-gradient(to bottom, #E6846412 2px, transparent 2px)`,
            backgroundSize: '60px 60px',
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
          }}
        >
          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 110,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: 32,
              textAlign: 'center',
            }}
          >
            <span>Draft</span>
            <span
              style={{
                color: '#E68464',
                marginLeft: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              Anything
              <div
                style={{
                  width: '100%',
                  height: 8,
                  background: '#E68464',
                  marginTop: -10,
                  opacity: 0.3,
                }}
              />
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: '#666',
              fontWeight: 500,
              marginBottom: 80,
              textAlign: 'center',
              maxWidth: 800,
            }}
          >
            Create rankings and settle debates with friends
          </div>

          {/* Example drafts */}
          <div
            style={{
              display: 'flex',
              gap: 32,
              alignItems: 'center',
            }}
          >
            {[
              { emoji: '🍕', text: 'Pizza Places' },
              { emoji: '🎬', text: 'Movies' },
              { emoji: '🎮', text: 'Video Games' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    border: '3px solid',
                    borderColor: i === 1 ? '#E68464' : '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48,
                    background: i === 1 ? '#E6846410' : 'white',
                  }}
                >
                  {item.emoji}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: i === 1 ? '#E68464' : '#000',
                  }}
                >
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent bars */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            right: 40,
            height: 4,
            background: '#000',
            display: 'flex',
            gap: 4,
          }}
        >
          <div style={{ flex: 1, background: '#E68464' }} />
          <div style={{ flex: 1, background: '#000' }} />
          <div style={{ flex: 1, background: '#E68464' }} />
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}