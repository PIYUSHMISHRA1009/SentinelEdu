/**
 * Students List Page
 * Shows paginated, searchable list of all students
 */

import React, { useEffect, useState } from 'react';
import { FadeIn } from '@/components/Motion/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/Motion/StaggerContainer';
import { TiltCard } from '@/components/Motion/TiltCard';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { Loading } from '@/components/Loading';
import type { ApiResponse, StudentsListResponse } from '@/api/types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const StudentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounce search input and enforce min length to avoid single-letter queries
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = search.trim();
      // Only set search term if length >= 2, otherwise clear it
      setDebouncedSearch(trimmed.length >= 2 ? trimmed : '');
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['students', debouncedSearch, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      // Backend expects 0-based page index and 'size' for page size
      params.append('page', Math.max(0, page - 1).toString());
      params.append('size', limit.toString());

      const response = await axiosClient.get<ApiResponse<StudentsListResponse>>(
        `${API_ENDPOINTS.STUDENTS}?${params.toString()}`
      );
      return response.data.data;
    },
  });

  if (isLoading) return <Loading message="Loading students..." />;
  if (error) return <div className="text-danger-600">Error loading students</div>;

  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <FadeIn className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Students</h1>
          <p className="text-gray-300 text-lg">View and manage student records</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500 text-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
        </div>

        {/* Student Cards Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.students?.map((student) => (
            <StaggerItem key={student.student_id}>
              <TiltCard className="h-full">
                <div
                  onClick={() => navigate(`/students/${student.student_id}`)}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all cursor-pointer h-full dark:bg-slate-900 dark:border-slate-800 dark:shadow-none"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 dark:text-slate-100">
                        {student.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{student.roll_number}</p>
                    </div>
                    {student.risk_flag ? (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                        At Risk
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white">
                        Good
                      </span>
                    )}
                  </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">Department</span>
                  <span className="font-medium text-gray-900 dark:text-slate-100">{student.department}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">GPA</span>
                  <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{student.avg_gpa.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">Attendance</span>
                  <span className="font-bold text-lg text-purple-600 dark:text-purple-400">{student.avg_attendance.toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button className="w-full py-2 text-sm font-medium text-mint-600 hover:text-mint-700 transition dark:text-mint-400 dark:hover:text-mint-300">
                  View Profile →
                </button>
              </div>
            </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Pagination */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-slate-300">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data?.total || 0)} of {data?.total || 0} students
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};
