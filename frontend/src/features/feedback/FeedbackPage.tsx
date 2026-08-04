/**
 * Feedback Page - Submit and analyze feedback
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { Loading } from '@/components/Loading';
import type { ApiResponse, Feedback, AnalyzeSentimentResponse } from '@/api/types';
import { FadeIn } from '@/components/Motion/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/Motion/StaggerContainer';
import { AnimatedCounter } from '@/components/Motion/AnimatedCounter';
import { TiltCard } from '@/components/Motion/TiltCard';
import { MagneticButton } from '@/components/Motion/MagneticButton';
import { StudentFeedbackForm } from './StudentFeedbackForm';
import { useAuth } from '@/features/auth/AuthProvider';
import { 
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  MinusCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export const FeedbackPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const [feedbackText, setFeedbackText] = useState('');
  const [result, setResult] = useState<{ sentiment: string; score: number } | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: role === 'student' ? ['feedbacks','me'] : ['feedbacks'],
    queryFn: async () => {
      if (role === 'student') {
        // Get student_id from profile to avoid id mismatch
        const prof = await axiosClient.get<ApiResponse<any>>(API_ENDPOINTS.PROFILE);
        const sid = prof.data?.data?.student_id as number | undefined;
        if (!sid) {
          const resp = await axiosClient.get<ApiResponse<Feedback[]>>(API_ENDPOINTS.FEEDBACK);
          return resp.data.data;
        }
        const response = await axiosClient.get<ApiResponse<Feedback[]>>(API_ENDPOINTS.FEEDBACK_STUDENT(sid));
        return response.data.data;
      }
      const response = await axiosClient.get<ApiResponse<Feedback[]>>(API_ENDPOINTS.FEEDBACK);
      return response.data.data;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await axiosClient.post<ApiResponse<AnalyzeSentimentResponse>>(
        API_ENDPOINTS.ANALYZE_SENTIMENT,
        { text }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      setResult({ sentiment: data.sentiment, score: data.score });
    },
  });

  const handleAnalyze = () => {
    if (feedbackText.trim()) {
      analyzeMutation.mutate(feedbackText);
    }
  };

  if (isLoading) return <Loading message="Loading feedback..." />;

  const sentimentCounts = {
    positive: feedbacks?.filter((f) => f.sentiment === 'positive').length || 0,
    neutral: feedbacks?.filter((f) => f.sentiment === 'neutral').length || 0,
    negative: feedbacks?.filter((f) => f.sentiment === 'negative').length || 0,
  };

  return (
    <FadeIn className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Feedback Analyzer</h1>
            <p className="text-gray-300 text-lg mt-1">Rule-based sentiment analysis</p>
          </div>
        </div>

        {/* Sentiment Stats */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <FaceSmileIcon className="w-10 h-10 text-green-400" />
                <div>
                  <p className="text-sm text-gray-300">Positive</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={sentimentCounts.positive} /></p>
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <MinusCircleIcon className="w-10 h-10 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300">Neutral</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={sentimentCounts.neutral} /></p>
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <FaceFrownIcon className="w-10 h-10 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-300">Negative</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={sentimentCounts.negative} /></p>
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Submit Student Feedback Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Submit Feedback</h2>
          {!showSubmitForm && (
            <button
              onClick={() => setShowSubmitForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium hover:shadow-lg transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              New Feedback
            </button>
          )}
        </div>
        {showSubmitForm && (
          <StudentFeedbackForm 
            onSuccess={() => {
              setShowSubmitForm(false);
              queryClient.invalidateQueries({ queryKey: role === 'student' ? ['feedbacks','me'] : ['feedbacks'] });
            }}
            onCancel={() => setShowSubmitForm(false)}
          />
        )}
      </div>

      {/* Analyze Feedback Card */}
      <TiltCard>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint-500 to-cyan-500 flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Test Sentiment Analyzer</h2>
              <p className="text-gray-600 dark:text-slate-400">Analyze text without saving to database</p>
            </div>
          </div>

          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Enter student feedback to analyze sentiment... (e.g., 'The professor explained concepts very clearly and I understood everything.')"
            className="w-full min-h-[150px] rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-none transition-all resize-none dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
          />

          <MagneticButton
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !feedbackText.trim()}
            className="mt-6 px-8 py-4 rounded-xl bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-mint-500/30 disabled:opacity-60 transition-all"
          >
            {analyzeMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                Analyze Sentiment
              </span>
            )}
          </MagneticButton>

          {result && (
            <div className={`mt-6 p-6 rounded-xl border-2 ${
              result.sentiment === 'positive' 
                ? 'bg-gradient-to-br from-green-50 to-teal-50 border-green-200 dark:bg-slate-800 dark:border-green-700 dark:bg-none' 
                : result.sentiment === 'negative' 
                ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 dark:bg-slate-800 dark:border-orange-700 dark:bg-none' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:bg-none'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {result.sentiment === 'positive' && <FaceSmileIcon className="w-8 h-8 text-green-600" />}
                {result.sentiment === 'negative' && <FaceFrownIcon className="w-8 h-8 text-orange-600" />}
                {result.sentiment === 'neutral' && <MinusCircleIcon className="w-8 h-8 text-gray-600" />}
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Analysis Result</p>
                  <p className="text-2xl font-bold capitalize text-gray-900 dark:text-slate-100">{result.sentiment}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-slate-400">Confidence Score:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-slate-100">{result.score.toFixed(2)}</span>
                <div className="flex-1 bg-gray-200 dark:bg-slate-700/70 rounded-full h-2 ml-2">
                  <div 
                    className={`h-2 rounded-full ${
                      result.sentiment === 'positive'
                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.35)]'
                        : result.sentiment === 'negative'
                        ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.35)]'
                        : 'bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.35)]'
                    }`}
                    style={{ width: `${Math.abs(result.score) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </TiltCard>

      {/* Recent Feedback */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">{role === 'student' ? 'Your Faculty Feedback' : 'Recent Feedback'} ({feedbacks?.length || 0})</h2>
        
        {!feedbacks || feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg dark:text-slate-400">No feedback submitted yet</p>
          </div>
        ) : (
          <StaggerContainer className="space-y-4">
            {feedbacks.slice(0, 10).map((feedback) => (
              <StaggerItem key={feedback.feedback_id}>
                <TiltCard>
                  <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
                    <p className="text-sm text-gray-800 leading-relaxed mb-3 dark:text-slate-200">{feedback.feedback_text}</p>
                      {feedback.course_id && (
                        <div className="text-xs text-gray-500 mb-2 dark:text-slate-400">Course: <span className="font-medium">{feedback.course?.course_code || ''} {feedback.course?.course_name || ''}</span></div>
                      )}
                    {feedback.sentiment && (
                      <div className="flex items-center gap-2">
                        {feedback.sentiment === 'positive' && <FaceSmileIcon className="w-5 h-5 text-green-600" />}
                        {feedback.sentiment === 'negative' && <FaceFrownIcon className="w-5 h-5 text-orange-600" />}
                        {feedback.sentiment === 'neutral' && <MinusCircleIcon className="w-5 h-5 text-gray-600" />}
                        <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                          feedback.sentiment === 'positive' 
                            ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' 
                            : feedback.sentiment === 'negative' 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {feedback.sentiment}
                        </span>
                      </div>
                    )}
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </FadeIn>
  );
};
