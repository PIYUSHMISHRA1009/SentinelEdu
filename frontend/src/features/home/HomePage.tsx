/**
 * Homepage - Hero section with feature showcase
 * Inspired by modern SaaS landing pages
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { FadeIn } from '@/components/Motion/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/Motion/StaggerContainer';
import { TiltCard } from '@/components/Motion/TiltCard';
import { MagneticButton } from '@/components/Motion/MagneticButton';
import { AnimatedGradient } from '@/components/Motion/AnimatedGradient';
import { ScrollReveal } from '@/components/Motion/ScrollReveal';
import { 
  AcademicCapIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  UserGroupIcon,
  BellAlertIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      title: 'Student Analytics',
      description: 'Track performance, attendance, and engagement across all courses and semesters.',
      icon: ChartBarIcon,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Risk Detection',
      description: 'Early warning system flags students at risk before it\'s too late.',
      icon: ExclamationTriangleIcon,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'Interventions',
      description: 'Create targeted intervention plans and track their effectiveness over time.',
      icon: UserGroupIcon,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Sentiment Analysis',
      description: 'Understand student feedback with NLP-powered sentiment detection.',
      icon: DocumentTextIcon,
      gradient: 'from-green-500 to-teal-500',
    },
    {
      title: 'Real-time Alerts',
      description: 'Get instant notifications when students need support or intervention.',
      icon: BellAlertIcon,
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'GPA & Attendance',
      description: 'Monitor academic trends and identify patterns across cohorts.',
      icon: AcademicCapIcon,
      gradient: 'from-cyan-500 to-blue-500',
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
        <AnimatedGradient />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <FadeIn>
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
                The all-in-one platform<br />
                for <span className="bg-gradient-to-r from-mint-400 to-cyan-400 bg-clip-text text-transparent">student success</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Build a better learning environment with analytics, risk detection, and interventions — all under your own brand.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <MagneticButton
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  Get started
                </MagneticButton>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-4 rounded-lg bg-white/10 backdrop-blur-sm text-white font-semibold text-lg hover:bg-white/20 transition-all"
                >
                  View Demo
                </button>
              </div>
            </div>
          </FadeIn>

          {/* Process Steps */}
          <StaggerContainer className="mt-24 grid grid-cols-1 md:grid-cols-4 gap-8">
            {['Collect', 'Analyze', 'Intervene', 'Improve'].map((step, idx) => (
              <StaggerItem key={step}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-bold text-lg mb-4">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step}</h3>
                  <p className="text-gray-400 text-sm">
                    {idx === 0 && 'Gather data from courses, attendance, and feedback.'}
                    {idx === 1 && 'Analytics detect at-risk students.'}
                    {idx === 2 && 'Create targeted support plans.'}
                    {idx === 3 && 'Track outcomes and refine strategies.'}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Powerful features for<br />student success teams
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to identify, support, and track at-risk students in one platform.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <TiltCard className="h-full">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-8 hover:shadow-2xl transition-all h-full">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>

                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform`}></div>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-navy-900 to-navy-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to improve student outcomes?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join hundreds of institutions using InsightFlow EDU to support their students.
            </p>
            <MagneticButton
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Start free trial
            </MagneticButton>
            <p className="mt-6 text-sm text-gray-400">
              Not sure if InsightFlow EDU is right for you?{' '}
              <Link to="/contact" className="text-mint-400 hover:text-mint-300 font-medium">
                Talk to our team
              </Link>
              .
            </p>
          </ScrollReveal>
        </div>
      </section>

      <footer className="bg-navy-950 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-400">
            <p>© {currentYear} InsightFlow EDU. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/contact" className="hover:text-mint-300">Contact Us</Link>
              <Link to="/terms" className="hover:text-mint-300">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-mint-300">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
