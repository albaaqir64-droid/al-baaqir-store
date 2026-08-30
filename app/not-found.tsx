import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf8f4] text-center px-5">
      <h2 className="text-[60px] serif italic mb-4">404</h2>
      <p className="text-[13px] uppercase tracking-[0.2em] text-brand-dark/60 mb-8">Page not found</p>
      <Link href="/" className="luxury-button uppercase text-[12px]">
        Return Home
      </Link>
    </div>
  )
}
