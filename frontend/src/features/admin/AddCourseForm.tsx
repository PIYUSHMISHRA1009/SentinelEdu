import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/api/types';

const schema = z.object({
  course_code: z.string().min(2, 'Course code is required'),
  course_name: z.string().min(2, 'Course name is required'),
  department: z.string().min(2, 'Department is required'),
  credits: z.coerce.number().int().min(1, 'Credits must be at least 1'),
  semester: z.coerce.number().int().min(1).max(8).optional().or(z.literal(NaN)),
});

type FormValues = z.infer<typeof schema>;

export const AddCourseForm: React.FC<{ onSuccess?: () => void; onCancel?: () => void } > = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { credits: 3 },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        courseCode: values.course_code.trim(),
        courseName: values.course_name.trim(),
        department: values.department.trim(),
        credits: Number(values.credits),
        semester: Number.isNaN(values.semester as any) ? undefined : Number(values.semester),
      };
      const res = await axiosClient.post<ApiResponse<Record<string, unknown>>>(API_ENDPOINTS.COURSES, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      reset();
      alert('Course added successfully.');
      onSuccess?.();
    }
  });

  const onSubmit = (data: FormValues) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Course Code</label>
          <input className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" placeholder="CS101" {...register('course_code')} />
          {errors.course_code && <p className="text-sm text-red-500 mt-1">{errors.course_code.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Course Name</label>
          <input className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" placeholder="Introduction to CS" {...register('course_name')} />
          {errors.course_name && <p className="text-sm text-red-500 mt-1">{errors.course_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Department</label>
          <input className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" placeholder="Computer Science" {...register('department')} />
          {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Credits</label>
          <input type="number" className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" {...register('credits')} />
          {errors.credits && <p className="text-sm text-red-500 mt-1">{errors.credits.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Semester (optional)</label>
          <input type="number" className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" {...register('semester')} />
          {errors.semester && <p className="text-sm text-red-500 mt-1">{errors.semester.message}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium disabled:opacity-60">
          {isSubmitting ? 'Saving…' : 'Save Course'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
        )}
      </div>
    </form>
  );
};
