import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, Faculty, Student, CreateInterventionRequest } from '@/api/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastProvider';

const schema = z.object({
  student_id: z.coerce.number().int().min(1, 'Select a student'),
  faculty_id: z.coerce.number().int().min(1, 'Select a faculty'),
  intervention_type: z.enum(['counseling','academic_support','mentoring','disciplinary','other']),
  notes: z.string().min(5, 'Please add a brief note'),
});

type FormValues = z.infer<typeof schema>;

export const AddInterventionForm: React.FC<{ onSuccess?: () => void; onCancel?: () => void; studentId?: number }> = ({ onSuccess, onCancel, studentId }) => {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: studentId ? { student_id: studentId } as Partial<FormValues> : undefined,
  });

  // Pre-fill faculty_id for faculty role
  useEffect(() => {
    if (role === 'faculty' && user?.id) {
      reset((prev) => ({ ...(prev || {}), faculty_id: (user as any).faculty_id || user.id } as any));
    }
  }, [role, user, reset]);

  const { data: students } = useQuery({
    queryKey: ['students','for-interventions'],
    queryFn: async () => {
      // Get first 100 students for selection
      const res = await axiosClient.get<ApiResponse<{ students: Student[] }>>(`${API_ENDPOINTS.STUDENTS}?page=0&size=100`);
      // some endpoints wrap as {students, total, ...}
      const data = res.data.data as any;
      return (data.students ?? data) as Student[];
    }
  });

  const { data: faculty } = useQuery({
    queryKey: ['faculty'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<Faculty[]>>(API_ENDPOINTS.FACULTY);
      return res.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: CreateInterventionRequest = {
        studentId: values.student_id,
        facultyId: values.faculty_id,
        interventionType: values.intervention_type,
        notes: values.notes.trim(),
      };
      const res = await axiosClient.post<ApiResponse<Record<string, unknown>>>(API_ENDPOINTS.INTERVENTIONS, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: ['student', String(studentId)] });
        queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      }
      reset();
      addToast('Intervention created successfully.', 'success');
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create intervention';
      addToast(message, 'error');
    }
  });

  const onSubmit = (data: FormValues) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Student</label>
          {studentId ? (
            <input readOnly className="mt-1 w-full rounded-lg border-gray-200 bg-gray-50 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" value={(students?.find(s => s.student_id === studentId)?.name) ?? `Student #${studentId}`} />
          ) : (
            <select className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" {...register('student_id')}>
              <option value="">Select a student</option>
              {students?.map(s => (
                <option key={s.student_id} value={s.student_id}>{s.name} ({s.roll_number})</option>
              ))}
            </select>
          )}
          {errors.student_id && <p className="text-sm text-red-500 mt-1">{errors.student_id.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Faculty</label>
          <select className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" {...register('faculty_id')}>
            <option value="">Select a faculty</option>
            {faculty?.map(f => (
              <option key={f.faculty_id} value={f.faculty_id}>{f.name} ({f.department})</option>
            ))}
          </select>
          {errors.faculty_id && <p className="text-sm text-red-500 mt-1">{errors.faculty_id.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Type</label>
          <select className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" {...register('intervention_type')}>
            <option value="">Select type</option>
            <option value="counseling">Counseling</option>
            <option value="academic_support">Academic Support</option>
            <option value="mentoring">Mentoring</option>
            <option value="disciplinary">Disciplinary</option>
            <option value="other">Other</option>
          </select>
          {errors.intervention_type && <p className="text-sm text-red-500 mt-1">{errors.intervention_type.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Notes</label>
          <textarea rows={3} className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" placeholder="Add context and action plan" {...register('notes')} />
          {errors.notes && <p className="text-sm text-red-500 mt-1">{errors.notes.message}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium disabled:opacity-60">
          {isSubmitting ? 'Saving…' : 'Create Intervention'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
        )}
      </div>
    </form>
  );
};
