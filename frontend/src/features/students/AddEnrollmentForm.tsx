import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, Course, CreateEnrollmentRequest } from '@/api/types';
import { useToast } from '@/components/ToastProvider';

const schema = z.object({
  courseId: z.coerce.number().int().min(1, 'Select a course'),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  gpa: z.coerce.number().min(0).max(4).optional(),
  grade: z.string().max(2).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  studentId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddEnrollmentForm: React.FC<Props> = ({ studentId, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<Course[]>>(API_ENDPOINTS.COURSES);
      return res.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: CreateEnrollmentRequest = {
        courseId: values.courseId,
        semester: values.semester,
        gpa: values.gpa,
        grade: values.grade,
      };
      const res = await axiosClient.post<ApiResponse<Record<string, unknown>>>(API_ENDPOINTS.STUDENT_ENROLLMENTS(studentId), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', String(studentId)] });
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      queryClient.invalidateQueries({ queryKey: ['risk-flags'] });
      queryClient.invalidateQueries({ queryKey: ['risk-summary'] });
      addToast('Course added for student.', 'success');
      reset();
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to add course';
      addToast(message, 'error');
    }
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Course</label>
        <select {...register('courseId')} className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500">
          <option value="">Select a course</option>
          {courses?.map((course) => (
            <option key={course.course_id} value={course.course_id}>
              {course.course_code} - {course.course_name}
            </option>
          ))}
        </select>
        {errors.courseId && <p className="text-sm text-red-600 mt-1">{errors.courseId.message}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Semester</label>
          <input type="number" {...register('semester')} placeholder="Course semester" className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500" />
          {errors.semester && <p className="text-sm text-red-600 mt-1">{errors.semester.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">GPA</label>
          <input type="number" step="0.01" {...register('gpa')} placeholder="Optional" className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500" />
          {errors.gpa && <p className="text-sm text-red-600 mt-1">{errors.gpa.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Grade</label>
          <input type="text" {...register('grade')} placeholder="Optional" className="mt-1 w-full rounded-lg border-gray-300 focus:border-mint-500 focus:ring-mint-500" />
          {errors.grade && <p className="text-sm text-red-600 mt-1">{errors.grade.message}</p>}
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting || mutation.isPending} className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium disabled:opacity-60">
          {mutation.isPending ? 'Adding…' : 'Add Course'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Cancel</button>
        )}
      </div>
    </form>
  );
};
