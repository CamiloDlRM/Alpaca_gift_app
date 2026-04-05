import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import apiClient from '../api/client';

export default function Agreement() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [agreed, setAgreed] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  useEffect(() => {
    const result = getCanvasContext();
    if (!result) return;
    const { canvas, ctx } = result;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#0d0d0d';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [getCanvasContext]);

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const result = getCanvasContext();
    if (!result) return;
    const { ctx } = result;
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const result = getCanvasContext();
    if (!result) return;
    const { ctx } = result;
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const result = getCanvasContext();
    if (!result) return;
    const { canvas, ctx } = result;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSigned(false);
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSigned || !agreed) return;
    setLoading(true);
    setError('');
    try {
      const signatureBase64 = canvas.toDataURL('image/png');
      await apiClient.post('/agreements/sign', {
        claimToken,
        signatureBase64,
        agreed: true,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Failed to submit agreement.');
      } else {
        setError('Failed to submit agreement. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Brokerage Agreement</h1>
        <p className="text-gray-500 mb-8">Review and sign the agreement to receive your investment gift.</p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6" role="alert">{error}</div>
        )}

        {/* Agreement text */}
        <Card className="p-6 mb-6">
          <div className="h-64 overflow-y-auto pr-4 text-sm text-gray-600 leading-relaxed space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Customer Account Agreement</h3>
            <p>
              This Customer Account Agreement ("Agreement") sets forth the terms and conditions under which
              WealthGift and its clearing partner will maintain one or more brokerage accounts on your behalf.
            </p>
            <h4 className="font-semibold text-gray-900">1. Account Opening</h4>
            <p>
              By signing this Agreement, you authorize WealthGift to open a brokerage account in your name.
              You represent that all information provided during the identity verification process is accurate
              and complete. You agree to notify us promptly of any changes to your personal information.
            </p>
            <h4 className="font-semibold text-gray-900">2. Investment Risks</h4>
            <p>
              You understand that investing in securities involves risk, including the possible loss of principal.
              Exchange-traded funds (ETFs) are subject to market risk and may decline in value. Past performance
              does not guarantee future results. The value of your investment may fluctuate and you may receive
              more or less than your original investment when you redeem your shares.
            </p>
            <h4 className="font-semibold text-gray-900">3. Gift Acceptance</h4>
            <p>
              By accepting this gift, you agree to receive the specified ETF shares into your brokerage account.
              The gift amount will be used to purchase fractional or whole shares of the designated ETF at the
              current market price at the time of execution.
            </p>
            <h4 className="font-semibold text-gray-900">4. Account Management</h4>
            <p>
              Your account will be managed according to the terms of this Agreement. You may view your holdings,
              performance, and account details through the WealthGift platform. Withdrawals and transfers are
              subject to applicable rules and regulations.
            </p>
            <h4 className="font-semibold text-gray-900">5. SIPC Protection</h4>
            <p>
              Your account is protected by the Securities Investor Protection Corporation (SIPC) up to $500,000,
              including a $250,000 limit for cash. SIPC does not protect against the decline in value of your securities.
            </p>
            <h4 className="font-semibold text-gray-900">6. Regulatory Disclosures</h4>
            <p>
              Brokerage services are provided by our clearing partner, a registered broker-dealer and member of
              FINRA and SIPC. WealthGift is not a registered broker-dealer. Securities in your account are held
              by our clearing partner. This is not investment advice.
            </p>
          </div>
        </Card>

        {/* Download stub */}
        <div className="mb-6">
          <button className="text-sm text-[#F5C518] font-semibold hover:underline flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Agreement (PDF)
          </button>
        </div>

        {/* Terms checkbox */}
        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-[#F5C518] focus:ring-[#F5C518]"
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the Customer Account Agreement, the terms and conditions,
              and acknowledge the investment risks described above.
            </span>
          </label>
        </div>

        {/* Signature pad */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Your Signature</label>
            <button
              type="button"
              onClick={clearSignature}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ height: '160px' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              aria-label="Signature pad - draw your signature here"
            />
          </div>
          {!hasSigned && (
            <p className="text-xs text-gray-400 mt-2 text-center">Draw your signature above</p>
          )}
        </Card>

        <Button
          onClick={handleSubmit}
          loading={loading}
          className="w-full"
          size="lg"
          disabled={!agreed || !hasSigned}
        >
          Sign and Submit
        </Button>
      </div>
    </div>
  );
}
