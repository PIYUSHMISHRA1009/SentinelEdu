/**
 * Student Feedback Submission Form
 * Allows students to submit feedback about courses
 */

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, Student } from '@/api/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastProvider';

interface StudentFeedbackFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// (Removed unused Course interface)

export const StudentFeedbackForm: React.FC<StudentFeedbackFormProps> = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    feedbackText: '',
    submittedBy: (user as any)?.faculty_id || (role === 'faculty' || role === 'academic_head' || role === 'it' ? user?.id : undefined)
  });

  // Ensure studentId is set from /profile to avoid mismatch
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any>>(API_ENDPOINTS.PROFILE);
      return res.data.data;
    },
    enabled: role === 'student',
  });

  useEffect(() => {
    if (role === 'student' && profileData?.student_id) {
  setFormData(prev => ({ ...prev, studentId: String(profileData.student_id), submittedBy: undefined }));
    }
  }, [role, profileData]);

  // Fetch all students for selection
  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<{ students: Student[] }>>(
        `${API_ENDPOINTS.STUDENTS}?page=0&size=1000`
      );
      return response.data.data.students;
    },
  });

  // Fetch student's enrollments (for course selection) when role=student or a student is selected by staff
  const selectedStudentId = formData.studentId ? parseInt(formData.studentId) : undefined;
  const { data: enrollments } = useQuery({
    queryKey: ['student-detail', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const res = await axiosClient.get<ApiResponse<any>>(API_ENDPOINTS.STUDENT_DETAIL(selectedStudentId));
      return res.data.data?.enrollments || [];
    },
    enabled: !!selectedStudentId,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { studentId: number; courseId?: number; feedbackText: string; submittedBy?: number }) => {
      const payload: any = {
        studentId: data.studentId,
        courseId: data.courseId,
        feedbackText: data.feedbackText,
      };
      if (typeof data.submittedBy === 'number' && data.submittedBy > 0) {
        payload.submittedBy = data.submittedBy;
      }
      const response = await axiosClient.post<ApiResponse<{ feedback_id: number; sentiment: string }>>(
        API_ENDPOINTS.FEEDBACK,
        payload
      );
      return response.data;
    },
    onSuccess: (resp) => {
  queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
  queryClient.invalidateQueries({ queryKey: ['feedbacks','me'] });
      if (formData.studentId) {
        const sid = parseInt(formData.studentId);
        queryClient.invalidateQueries({ queryKey: ['student', String(sid)] });
        queryClient.invalidateQueries({ queryKey: ['student', sid] });
      }
      setFormData({
        studentId: role === 'student' ? String(profileData?.student_id || '') : '',
        courseId: '',
        feedbackText: '',
        submittedBy: role === 'faculty' || role === 'academic_head' || role === 'it' ? ((user as any)?.faculty_id || user?.id) : undefined
      });
      if (resp?.data?.sentiment) {
        addToast(`Feedback submitted. Detected sentiment: ${resp.data.sentiment}`, 'success');
      } else {
        addToast('Feedback submitted successfully.', 'success');
      }
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      studentId: parseInt(formData.studentId),
      courseId: formData.courseId ? parseInt(formData.courseId) : undefined,
      feedbackText: formData.feedbackText,
      submittedBy: formData.submittedBy
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Submit Student Feedback</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student Selection */}
        {role === 'student' ? (
          <input type="hidden" value={formData.studentId || String(user?.id || '')} />
        ) : (
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Select Student *
            </label>
            <select
              id="studentId"
              value={formData.studentId}
              onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value, courseId: '' }))}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
            >
              <option value="">Choose a student...</option>
              {studentsData?.map((student) => (
                <option key={student.student_id} value={student.student_id}>
                  {student.roll_number} - {student.name} ({student.department})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Course Selection (required for students; optional for staff for now) */}
        <div>
          <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
            {role === 'student' ? 'Select Course *' : 'Select Course (optional)'}
          </label>
          <select
            id="courseId"
            value={formData.courseId}
            onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
            required={role === 'student'}
            disabled={!selectedStudentId}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            <option value="">{selectedStudentId ? 'Choose a course...' : 'Select a student first'}</option>
            {enrollments?.map((enr: any) => (
              <option key={enr.enrollment_id} value={enr.course_id}>
                {enr.course?.course_code || 'COURSE'} - {enr.course?.course_name || `Course ${enr.course_id}`}
              </option>
            ))}
          </select>
          {role === 'student' && (
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">You can only submit feedback for your enrolled courses.</p>
          )}
        </div>

        {/* Feedback Text */}
        <div>
          <label htmlFor="feedbackText" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
            Feedback *
          </label>
          <textarea
            id="feedbackText"
            value={formData.feedbackText}
            onChange={(e) => setFormData(prev => ({ ...prev, feedbackText: e.target.value }))}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
            placeholder="Enter detailed feedback about the student's performance, behavior, or any concerns..."
          />
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-slate-700 rounded-lg border border-blue-200 dark:border-slate-600">
          <p className="text-sm text-blue-800 dark:text-slate-100">
            💡 <strong>Note:</strong> The feedback is automatically analyzed to estimate sentiment (Positive/Neutral/Negative). This uses simple rules or a database function if configured; it is not a full ML model.
          </p>
        </div>

        {/* Error Message */}
        {submitMutation.isError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {submitMutation.error instanceof Error ? submitMutation.error.message : 'Failed to submit feedback'}
          </div>
        )}

        {/* Success Message */}
        {submitMutation.isSuccess && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
            Feedback submitted and analyzed successfully!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="flex-1 bg-mint-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 dark:border-slate-600 rounded-lg font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
