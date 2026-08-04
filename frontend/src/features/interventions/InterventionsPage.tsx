/**
 * Interventions Page - Manage interventions
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { Loading } from '@/components/Loading';
import type { ApiResponse, Intervention } from '@/api/types';
import { FadeIn } from '@/components/Motion/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/Motion/StaggerContainer';
import { AnimatedCounter } from '@/components/Motion/AnimatedCounter';
import { TiltCard } from '@/components/Motion/TiltCard';
import { AddInterventionForm } from './AddInterventionForm';
import { 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

// Extended shape sometimes returned by backend joins/flattened fields
type ExtendedIntervention = Intervention & {
  student_name?: string;
  faculty_name?: string;
  student?: { name?: string };
  faculty?: { name?: string };
};

export const InterventionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const { data: interventions, isLoading } = useQuery({
    queryKey: ['interventions'],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<Intervention[]>>(API_ENDPOINTS.INTERVENTIONS);
      return response.data.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Intervention['status'] }) => {
      const res = await axiosClient.patch<ApiResponse<Record<string, unknown>>>(`${API_ENDPOINTS.INTERVENTIONS}/${id}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interventions'] })
  });

  if (isLoading) return <Loading message="Loading interventions..." />;

  const completedCount = interventions?.filter(i => i.status === 'completed').length || 0;
  const inProgressCount = interventions?.filter(i => i.status === 'in_progress').length || 0;
  const pendingCount = interventions?.filter(i => i.status === 'pending').length || 0;

  return (
    <FadeIn className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <ClipboardDocumentListIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Interventions</h1>
            <p className="text-gray-300 text-lg mt-1">Track and manage student support actions</p>
          </div>
        </div>

        {/* Stats Row */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <ClipboardDocumentListIcon className="w-10 h-10 text-mint-400" />
                <div>
                  <p className="text-sm text-gray-300">Total</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={interventions?.length || 0} /></p>
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-10 h-10 text-green-400" />
                <div>
                  <p className="text-sm text-gray-300">Completed</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={completedCount} /></p>
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-10 h-10 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-300">In Progress</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={inProgressCount} /></p>
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <PlusCircleIcon className="w-10 h-10 text-cyan-400" />
                <div>
                  <p className="text-sm text-gray-300">Pending</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={pendingCount} /></p>
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Interventions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Recent Interventions</h2>
          {!showAdd && (
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium hover:shadow-lg transition-all">
              + Add Intervention
            </button>
          )}
        </div>

        {showAdd && (
          <div className="mb-6">
            <AddInterventionForm onSuccess={() => setShowAdd(false)} onCancel={() => setShowAdd(false)} />
          </div>
        )}
        
        {!interventions || interventions.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-3 dark:text-slate-600" />
            <p className="text-gray-500 text-lg dark:text-slate-300">No interventions recorded</p>
            <p className="text-sm text-gray-400 mt-2 dark:text-slate-400">Start tracking support actions for at-risk students</p>
          </div>
        ) : (
          <StaggerContainer className="space-y-4">
            {interventions.map((intervention) => (
              <StaggerItem key={intervention.intervention_id}>
                <TiltCard>
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-lg transition-all dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                            {intervention.intervention_type}
                          </span>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            intervention.status === 'completed' 
                              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' 
                              : intervention.status === 'in_progress' 
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
                              : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-100'
                          }`}>
                            {intervention.status === 'completed' && '✓'}
                            {intervention.status === 'in_progress' && '⏱'}
                            {intervention.status === 'pending' && '⏸'}
                            {' '}
                            {intervention.status.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-sm text-gray-800 leading-relaxed mb-3 dark:text-slate-200">{intervention.notes}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                          <span>📅 Created: {new Date(intervention.created_on).toLocaleDateString()}</span>
                          <span>🕐 {new Date(intervention.created_on).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-xs text-gray-600 dark:text-slate-300">
                          <span className="font-medium">Student:</span> {(intervention as ExtendedIntervention).student_name || (intervention as ExtendedIntervention).student?.name || intervention.student_id}
                          <span className="mx-2">•</span>
                          <span className="font-medium">Faculty:</span> {(intervention as ExtendedIntervention).faculty_name || (intervention as ExtendedIntervention).faculty?.name || intervention.faculty_id}
                        </div>
                        {intervention.status !== 'completed' && (
                          <div className="flex gap-2">
                            {intervention.status === 'pending' && (
                              <button onClick={() => updateStatus.mutate({ id: intervention.intervention_id, status: 'in_progress' })} className="px-3 py-1 rounded-md border text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Mark In Progress</button>
                            )}
                            <button onClick={() => updateStatus.mutate({ id: intervention.intervention_id, status: 'completed' })} className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700">Mark Completed</button>
                          </div>
                        )}
                        {intervention.status === 'completed' && (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg">
                            <CheckCircleIcon className="w-7 h-7 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
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
