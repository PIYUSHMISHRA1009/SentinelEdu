/**
 * Add Student Form Component
 * Form for IT/Academic Head to add new students
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/api/types';

interface AddStudentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddStudentForm: React.FC<AddStudentFormProps> = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    email: '',
    department: '',
    semester: 1,
    contactNumber: ''
  });
  const [creds, setCreds] = useState<{ username: string; password: string } | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axiosClient.post<ApiResponse<any>>(
        API_ENDPOINTS.STUDENTS,
        data
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create student');
      }
      return response.data;
    },
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setFormData({
        rollNumber: '',
        name: '',
        email: '',
        department: '',
        semester: 1,
        contactNumber: ''
      });
      if (resp?.data?.student_username && resp?.data?.student_password) {
        setCreds({ username: resp.data.student_username, password: resp.data.student_password });
      } else {
        setCreds(null);
      }
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      rollNumber: formData.rollNumber.trim(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      department: formData.department.trim(),
      semester: formData.semester,
      contactNumber: formData.contactNumber.trim(),
    };
    createMutation.mutate(payload);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' ? parseInt(value) : value
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Student</h2>
      
  <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Roll Number */}
          <div>
            <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Roll Number *
            </label>
            <input
              type="text"
              id="rollNumber"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              required
              pattern="[A-Za-z0-9_-]{3,20}"
              title="3-20 characters. Letters, numbers, underscore, and hyphen allowed."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
              placeholder="e.g., CS2021001"
            />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
              placeholder="Enter full name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
              placeholder="student@university.edu"
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
              Department *
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
            >
              <option value="">Select Department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
              <option value="Electrical">Electrical</option>
            </select>
          </div>

          {/* Semester */}
          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
              Semester *
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Contact Number */}
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number
            </label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              pattern="\+?[0-9]{7,15}"
              title="Enter 7-15 digits. Prefix with + for country code."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
              placeholder="+1234567890"
            />
          </div>
        </div>

        {/* Error Message */}
        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create student'}
          </div>
        )}

        {/* Success Message & Credentials */}
        {createMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg space-y-2">
            <div className="font-medium">Student added successfully.</div>
            {creds && (
              <div className="mt-2 p-3 bg-white/60 border border-green-200 rounded">
                <div className="text-sm font-medium">Generated Credentials</div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase text-gray-500">Username:</span>
                    <code className="px-2 py-1 bg-gray-100 rounded text-gray-800">{creds.username}</code>
                    <button type="button" className="text-xs text-cyan-700 hover:underline" onClick={()=> navigator.clipboard.writeText(creds.username)}>Copy</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase text-gray-500">Password:</span>
                    <code className="px-2 py-1 bg-gray-100 rounded text-gray-800">{creds.password}</code>
                    <button type="button" className="text-xs text-cyan-700 hover:underline" onClick={()=> navigator.clipboard.writeText(creds.password)}>Copy</button>
                  </div>
                </div>
                <div className="text-[10px] text-gray-600 mt-2">Please share securely with the student and prompt them to change the password after first login.</div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 bg-mint-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? 'Adding...' : 'Add Student'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
