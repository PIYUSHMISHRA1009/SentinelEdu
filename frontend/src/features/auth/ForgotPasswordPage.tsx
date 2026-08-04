/**
 * Forgot Password page component
 * Allows users to request password reset
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FadeIn } from '@/components/Motion/FadeIn';
import { AnimatedGradient } from '@/components/Motion/AnimatedGradient';
import { GlassCard } from '@/components/Motion/GlassCard';
import { MagneticButton } from '@/components/Motion/MagneticButton';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Simulate API call (in demo mode, email would be validated here)
      console.log('Password reset requested for:', data.email);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccessMessage(
        'If an account exists with this email, you will receive password reset instructions. Please contact IT support for assistance.'
      );
    } catch (error) {
      setErrorMessage('Failed to send reset instructions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedGradient />
      
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <FadeIn className="w-full max-w-md mx-auto relative z-10">
        <GlassCard className="p-8">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-gray-400 hover:text-mint-400 transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Login
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-mint-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <EnvelopeIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
            <p className="text-gray-400">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-mint-500/10 border border-mint-500/30 rounded-lg">
              <p className="text-mint-400 text-sm">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-navy-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 transition-all"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <MagneticButton
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-mint-500/30 disabled:opacity-60 transition-all"
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </MagneticButton>
          </form>

          <div className="mt-8 p-4 bg-navy-800/30 rounded-lg border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-2">
              <strong className="text-white">Demo Note:</strong> Password reset is not available in demo mode.
            </p>
            <p className="text-xs text-gray-500">
              Please contact IT support or use the demo credentials on the login page.
            </p>
          </div>
        </GlassCard>
      </FadeIn>
    </div>
  );
};
