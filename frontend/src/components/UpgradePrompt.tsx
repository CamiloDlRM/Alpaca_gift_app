import { useNavigate } from 'react-router-dom';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface UpgradePromptProps {
  feature: string;
  /** Plan tier required to access the feature. Affects the description copy. */
  requiredPlan?: 'PRO' | 'PRO_PLUS';
}

/**
 * Full-page centered upgrade prompt shown when a user's plan does not include
 * the requested feature. Designed to be rendered inside a page's <main>.
 */
export function UpgradePrompt({ feature, requiredPlan = 'PRO' }: UpgradePromptProps) {
  const navigate = useNavigate();
  const planCopy =
    requiredPlan === 'PRO_PLUS'
      ? 'This feature is available exclusively on the Visionary plan.'
      : 'This feature is available on the Future Builder and Visionary plans.';

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F5C518]/15 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#F5C518]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upgrade to unlock {feature}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{planCopy}</p>
        <Button className="w-full" onClick={() => navigate('/pricing')}>View plans</Button>
      </Card>
    </div>
  );
}
