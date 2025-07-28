import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'Draft Anything'
export const size = {
  width: 1200,
  height: 630
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
          position: 'relative'
        }}
      >
        {/* Banner section at the top */}
        <div
          style={{
            width: '100%',
            height: '200px',
            background:
              'linear-gradient(135deg, rgba(100, 181, 166, 0.15) 0%, rgba(100, 181, 166, 0.05) 50%, rgba(100, 181, 166, 0.1) 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '2px solid rgba(100, 181, 166, 0.3)'
          }}
        >
          {/* Grid pattern overlay for banner */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(to right, rgba(100, 181, 166, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(100, 181, 166, 0.2) 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
              opacity: 0.6
            }}
          />

          {/* Banner content */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              position: 'relative',
              zIndex: 10
            }}
          >
            {/* Logo/brand area */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 32px',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '2px solid rgba(100, 181, 166, 0.4)',
                borderRadius: '12px'
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: '#E5E5E5',
                  marginBottom: '8px'
                }}
              >
                Draft
              </div>
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: primaryColor,
                  position: 'relative'
                }}
              >
                Anything
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '0',
                    right: '0',
                    height: '3px',
                    background: 'rgba(100, 181, 166, 0.4)'
                  }}
                />
              </div>
            </div>

            {/* Tagline */}
            <div
              style={{
                fontSize: '24px',
                color: '#999',
                fontWeight: 500,
                maxWidth: '400px',
                lineHeight: '1.4'
              }}
            >
              Create rankings and settle debates with friends
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 40px',
            position: 'relative'
          }}
        >
          {/* Background patterns for main area */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(100, 181, 166, 0.03) 0%, transparent 50%, rgba(100, 181, 166, 0.08) 100%)'
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(to right, rgba(100, 181, 166, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(100, 181, 166, 0.3) 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
              opacity: 0.4
            }}
          />

          {/* Example draft items */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginTop: '20px'
            }}
          >
            {[
              { num: '1', text: 'Pizza Palace', selected: true },
              { num: '2', text: 'Burger Haven', selected: false },
              { num: '3', text: 'Sushi Central', selected: false }
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px 32px',
                  border: '2px solid',
                  borderColor: item.selected ? primaryColor : '#484848',
                  background: item.selected
                    ? 'rgba(100, 181, 166, 0.1)'
                    : '#1A1A1A',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '2px solid',
                    borderColor: item.selected ? primaryColor : '#484848',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: item.selected ? primaryColor : '#999',
                    background: item.selected
                      ? 'rgba(100, 181, 166, 0.2)'
                      : 'transparent'
                  }}
                >
                  {item.num}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: item.selected ? '#E5E5E5' : '#999'
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
                      width: '4px',
                      background: primaryColor
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
            borderColor:
              'transparent transparent rgba(100, 181, 166, 0.2) transparent'
          }}
        />
      </div>
    ),
    {
      ...size
    }
  )
}
