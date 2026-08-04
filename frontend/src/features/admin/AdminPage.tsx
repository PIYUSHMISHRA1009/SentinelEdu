/**
 * Admin Page - academic catalogue management
 */

import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { Loading } from '@/components/Loading';
import type { ApiResponse, Course, Faculty } from '@/api/types';
import { FadeIn } from '@/components/Motion/FadeIn';
import { AnimatedCounter } from '@/components/Motion/AnimatedCounter';
import { StaggerContainer, StaggerItem } from '@/components/Motion/StaggerContainer';
import { AcademicCapIcon, BookOpenIcon, DocumentArrowUpIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { AddCourseForm } from './AddCourseForm';
import { AddFacultyForm } from './AddFacultyForm';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastProvider';

interface ImportFeedback {
  inserted: number;
  errors: Array<{ row: number; message: string }>;
}

export const AdminPage: React.FC = () => {
  const { role } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportFeedback | null>(null);

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<Course[]>>(API_ENDPOINTS.COURSES);
      return response.data.data;
    },
  });

  const { data: faculty, isLoading: facultyLoading } = useQuery({
    queryKey: ['faculty'],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<Faculty[]>>(API_ENDPOINTS.FACULTY);
      return response.data.data;
    },
  });

  const totalCredits = useMemo(
    () => (courses || []).reduce((sum, course) => sum + (course.credits || 0), 0),
    [courses],
  );
  const departments = useMemo(
    () => new Set((courses || []).map((course) => course.department).filter(Boolean)).size,
    [courses],
  );
  const facultyDepartments = useMemo(
    () => new Set((faculty || []).map((member) => member.department).filter(Boolean)).size,
    [faculty],
  );

  if (coursesLoading || facultyLoading) {
    return <Loading message="Loading admin data..." />;
  }

  const canManageCatalog = role === 'it' || role === 'academic_head';

  const handleCsvUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await axiosClient.post<ApiResponse<ImportFeedback>>(API_ENDPOINTS.IMPORT_CSV, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setImportResult(data);
        addToast(
          `Import complete: ${data.inserted} records inserted, ${data.errors.length} issues detected.`,
          data.errors.length ? 'warning' : 'success',
        );
        queryClient.invalidateQueries({ queryKey: ['students'] });
      } else {
        addToast(res.data.message || 'Import failed', 'error');
        setImportResult(null);
      }
    } catch (err: any) {
      addToast(err.message || 'Import failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <FadeIn className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Academic Administration</h1>
            <p className="mt-3 max-w-2xl text-sm text-primary-100/90">
              Govern course offerings, faculty profiles, and bulk student imports with a cohesive, role-aware toolkit.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Total Courses" value={courses?.length || 0} icon={BookOpenIcon} />
            <StatCard label="Faculty" value={faculty?.length || 0} icon={UserGroupIcon} />
            <StatCard label="Departments" value={departments || facultyDepartments || 0} icon={AcademicCapIcon} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Course Catalogue</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Review course metadata and keep credit loads in sync across departments.
                </p>
              </div>
              {canManageCatalog && !showAddCourse ? (
                <button
                  type="button"
                  onClick={() => setShowAddCourse(true)}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                >
                  Add Course
                </button>
              ) : null}
            </div>
            {showAddCourse ? (
              <div className="mt-6">
                <AddCourseForm onSuccess={() => setShowAddCourse(false)} onCancel={() => setShowAddCourse(false)} />
              </div>
            ) : null}

            {!courses || courses.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">No courses found yet.</p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Course Name</th>
                      <th className="px-4 py-3 text-left">Department</th>
                      <th className="px-4 py-3 text-left">Credits</th>
                      <th className="px-4 py-3 text-left">Semester</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                    {courses.map((course) => (
                      <tr key={course.course_id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-700/20 dark:text-primary-200">
                            {course.course_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{course.course_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{course.department}</td>
                        <td className="px-4 py-3 text-lg font-bold text-primary-600 dark:text-primary-300">{course.credits}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{course.semester ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Faculty Directory</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Highlight faculty presence and maintain department ownership.
                </p>
              </div>
              {canManageCatalog && !showAddFaculty ? (
                <button
                  type="button"
                  onClick={() => setShowAddFaculty(true)}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                >
                  Add Faculty
                </button>
              ) : null}
            </div>

            {showAddFaculty ? (
              <div className="mt-6">
                <AddFacultyForm onSuccess={() => setShowAddFaculty(false)} onCancel={() => setShowAddFaculty(false)} />
              </div>
            ) : null}

            {!faculty || faculty.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">No faculty members available yet.</p>
            ) : (
              <StaggerContainer className="mt-6 grid gap-4 md:grid-cols-2">
                {faculty.map((member) => (
                  <StaggerItem key={member.faculty_id}>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{member.email}</p>
                        </div>
                        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-700/20 dark:text-primary-200">
                          {formatRole(member.role)}
                        </span>
                      </div>
                      {member.department ? (
                        <p className="mt-3 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{member.department}</p>
                      ) : null}
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary-100 p-3 text-primary-600 dark:bg-primary-700/20 dark:text-primary-200">
                <AcademicCapIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Credit Snapshot</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Aggregate credits across the current course list.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50 px-5 py-6 text-center dark:border-primary-700/40 dark:bg-primary-700/10">
              <div className="text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-200">Total Credits</div>
              <div className="mt-2 text-4xl font-bold text-primary-700 dark:text-primary-100">
                <AnimatedCounter value={totalCredits} />
              </div>
              {courses?.length ? (
                <p className="mt-2 text-xs text-primary-600 dark:text-primary-200">
                  Average per course: {(totalCredits / courses.length).toFixed(1)} credits
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary-100 p-3 text-primary-600 dark:bg-primary-700/20 dark:text-primary-200">
                <DocumentArrowUpIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">CSV Import</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Bulk upload student records formatted to InsightFlow standards.
                </p>
              </div>
            </div>

            <label
              htmlFor="csv-upload"
              className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-primary-400 hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-600 dark:hover:bg-primary-900/20"
            >
              <DocumentArrowUpIcon className="h-12 w-12 text-slate-400" />
              <span className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Drop CSV or browse files</span>
              <span className="mt-1 text-xs text-slate-500 dark:text-slate-300">Accepted format: .csv (UTF-8)</span>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  await handleCsvUpload(file);
                  event.currentTarget.value = '';
                }}
              />
            </label>

            {uploading ? (
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div className="h-2 w-3/4 rounded-full bg-primary-500 animate-pulse" />
                </div>
                <p className="mt-2 text-xs text-slate-500">Uploading and processing</p>
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <p className="font-semibold text-slate-700 dark:text-slate-100">CSV Guidelines</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                <li>Header row required: roll_number, first_name, last_name, department, email.</li>
                <li>Ensure roll numbers stay unique and departments match the catalogue.</li>
                <li>CSV should be UTF-8 encoded and use commas as delimiters.</li>
              </ul>
            </div>

            {importResult ? (
              <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-700 dark:border-primary-700/40 dark:bg-primary-700/10 dark:text-primary-200">
                <p>
                  Inserted <strong>{importResult.inserted}</strong> records with{' '}
                  <strong>{importResult.errors.length}</strong> validation issue{importResult.errors.length === 1 ? '' : 's'}.
                </p>
                {importResult.errors.length ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold">View sample errors</summary>
                    <ul className="mt-2 space-y-1 text-xs">
                      {importResult.errors.slice(0, 8).map((error, index) => (
                        <li key={`${error.row}-${index}`}>Row {error.row}: {error.message}</li>
                      ))}
                      {importResult.errors.length > 8 ? <li>and {importResult.errors.length - 8} more</li> : null}
                    </ul>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </FadeIn>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ComponentType<{ className?: string }> }> = ({
  label,
  value,
  icon: Icon,
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-primary-400/40 bg-primary-600/30 px-4 py-3 text-white shadow-inner">
    <div className="rounded-lg bg-white/20 p-2">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-100">{label}</p>
      <p className="text-2xl font-bold text-white">
        <AnimatedCounter value={value} />
      </p>
    </div>
  </div>
);

const formatRole = (role?: string) => {
  if (!role) return '';
  switch (role.toLowerCase()) {
    case 'academic_head':
      return 'Academic Head';
    case 'faculty':
      return 'Faculty';
    case 'it':
      return 'IT';
    default:
      return role;
  }
};
