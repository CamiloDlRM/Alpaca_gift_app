import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Nav } from '../../components/layout/Nav';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

export default function KYCPersonal() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [ssnLast4, setSsnLast4] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/kyc/submit', {
        claimToken,
        fullName,
        dob,
        ssnLast4,
        address,
        city,
        state,
        zip,
      });
      navigate(`/claim/${claimToken}/kyc/ssn`);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Failed to submit KYC. Please try again.');
      } else {
        setError('Failed to submit KYC. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {['Personal Info', 'Verify SSN', 'Questions', 'Done'].map((step, i) => (
            <div key={step} className="flex-1">
              <div className={`h-1.5 rounded-full ${i === 0 ? 'bg-[#F5C518]' : 'bg-gray-200'}`} />
              <div className={`text-xs mt-1 ${i === 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{step}</div>
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Identity</h1>
        <p className="text-gray-500 mb-8">We need a few details to set up your brokerage account.</p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6" role="alert">{error}</div>
        )}

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Legal Name"
              placeholder="John Michael Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
            <Input
              label="Last 4 of SSN"
              type="password"
              maxLength={4}
              placeholder="XXXX"
              value={ssnLast4}
              onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
              autoComplete="off"
            />
            <Input
              label="Street Address"
              placeholder="123 Main St"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              autoComplete="street-address"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                placeholder="New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                autoComplete="address-level2"
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">State</label>
                <select
                  className="rounded-lg border border-gray-200 py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent bg-white"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <Input
                label="ZIP Code"
                placeholder="10001"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                required
                autoComplete="postal-code"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Continue
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
