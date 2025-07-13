import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          Authentication Error
        </h1>
        <p className="text-white/70 mb-6">
          Sorry, we couldn't sign you in. The authentication link may have expired or been used already.
        </p>
        <Link 
          href="/auth/login"
          className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors backdrop-blur-sm border border-white/20"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}