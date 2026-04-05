import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Nav } from '../../components/layout/Nav';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';

interface KYCQuestion {
  id: string;
  question: string;
  options: string[];
}

export default function KYCQuestions() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<KYCQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchQuestions = useCallback(async () => {
    if (!claimToken) return;
    try {
      const res = await apiClient.get<KYCQuestion[]>(`/kyc/questions/${claimToken}`);
      setQuestions(res.data);
    } catch {
      setError('Failed to load verification questions.');
    } finally {
      setLoading(false);
    }
  }, [claimToken]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Submit all answers
      setSubmitting(true);
      setError('');
      try {
        await apiClient.post('/kyc/verify-answers', { claimToken, answers });
        navigate(`/claim/${claimToken}/kyc/success`);
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axiosErr = err as { response?: { data?: { error?: string } } };
          setError(axiosErr.response?.data?.error || 'Verification failed.');
        } else {
          setError('Verification failed. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
            <span className="sr-only">Loading</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {['Personal Info', 'Verify SSN', 'Questions', 'Done'].map((step, i) => (
            <div key={step} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= 2 ? 'bg-[#F5C518]' : 'bg-gray-200'}`} />
              <div className={`text-xs mt-1 ${i === 2 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{step}</div>
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Identity Questions</h1>
        <p className="text-gray-500 mb-8">
          Question {currentIndex + 1} of {questions.length}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6" role="alert">{error}</div>
        )}

        {currentQuestion && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{currentQuestion.question}</h2>
            <div className="space-y-3 mb-8" role="radiogroup" aria-label={currentQuestion.question}>
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }))}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === option
                      ? 'border-[#F5C518] bg-yellow-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                  role="radio"
                  aria-checked={selectedAnswer === option}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === option ? 'border-[#F5C518]' : 'border-gray-300'
                    }`}>
                      {selectedAnswer === option && <div className="w-2.5 h-2.5 rounded-full bg-[#F5C518]" />}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={handleNext}
              loading={submitting}
              className="w-full"
              disabled={!selectedAnswer}
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Submit Answers'}
            </Button>
          </Card>
        )}

        {questions.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No questions available.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
