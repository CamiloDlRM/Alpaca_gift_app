export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' };
  const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };
  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size]} rounded-full bg-[#F5C518] flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-1/2 h-1/2" aria-hidden="true">
          <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className={`font-bold text-gray-900 ${textSizes[size]}`}>WealthGift</span>
    </div>
  );
}
