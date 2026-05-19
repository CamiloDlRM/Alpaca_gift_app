import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Nav } from '../../components/layout/Nav';

export default function KYCSuccess() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />
      <div className="max-w-lg mx-auto px-4 py-16 text-center relative">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-12">
          {['Personal Info', 'Verify SSN', 'Questions', 'Done'].map((step, i) => (
            <div key={step} className="flex-1">
              <div className="h-1.5 rounded-full bg-[#F5C518]" />
              <div className={`text-xs mt-1 ${i === 3 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-gray-500'}`}>{step}</div>
            </div>
          ))}
        </div>

        {/* Sparkles */}
        <div className="relative inline-block mb-8">
          {[
            { top: '-10px', left: '-20px', delay: '0s', size: 'w-3 h-3' },
            { top: '-15px', right: '-15px', delay: '0.3s', size: 'w-2 h-2' },
            { bottom: '5px', left: '-25px', delay: '0.6s', size: 'w-2 h-2' },
            { bottom: '-5px', right: '-20px', delay: '0.9s', size: 'w-3 h-3' },
            { top: '50%', left: '-35px', delay: '0.15s', size: 'w-1.5 h-1.5' },
            { top: '30%', right: '-30px', delay: '0.45s', size: 'w-2 h-2' },
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos.size} bg-[#F5C518] rounded-full sparkle`}
              style={{
                top: pos.top,
                left: pos.left,
                right: pos.right,
                bottom: pos.bottom,
                animationDelay: pos.delay,
              } as React.CSSProperties}
              aria-hidden="true"
            />
          ))}
          <div className="w-24 h-24 bg-positive/10 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Identity Verified!</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-sm mx-auto">
          Your identity has been successfully verified. Just one more step to claim your gift.
        </p>

        <Button
          onClick={() => navigate(`/claim/${claimToken}/agreement`)}
          size="lg"
          className="w-full max-w-xs mx-auto"
        >
          Continue to Agreement
        </Button>
      </div>
    </div>
  );
}
