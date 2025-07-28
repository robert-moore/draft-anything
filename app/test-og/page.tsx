export default function TestOGPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">OG Image Test</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Current OG Image:</h2>
          <img
            src="/opengraph-image"
            alt="OG Image Preview"
            className="border border-gray-300 rounded-lg"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <div className="text-sm text-gray-600">
          <p>
            • Add your banner image at: <code>public/images/og-banner.png</code>
          </p>
          <p>• Recommended size: 1120x120px</p>
          <p>• Refresh this page to see changes</p>
        </div>
      </div>
    </div>
  )
}
