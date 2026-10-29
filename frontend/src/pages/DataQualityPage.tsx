import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { PageHeader } from '../components/academic/PageHeader';
import { MetricCard } from '../components/academic/MetricCard';

export default function DataQualityPage() {
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['dataQualityReport'],
    queryFn: () => api.getDataQualityReport(),
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-20 bg-stone-200/60 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-stone-200/60 rounded-lg" />
          <div className="h-32 bg-stone-200/60 rounded-lg" />
          <div className="h-32 bg-stone-200/60 rounded-lg" />
          <div className="h-32 bg-stone-200/60 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg max-w-xl mx-auto text-rose-950 font-sans text-sm">
          <h3 className="font-serif text-lg font-bold">Data Quality Audit Unavailable</h3>
          <p className="mt-1 text-xs text-rose-800">
            We couldn't retrieve the system data quality report. Please verify backend connection and authorization.
          </p>
        </div>
      </div>
    );
  }

  const summary = report?.summary || {};
  const categories = report?.categories || [];

  const totalChecked = summary.total_records_checked || 0;
  const validRecords = summary.valid_records || 0;
  const issuesFound = summary.issues_found || 0;
  const qualityRate = totalChecked > 0 ? ((validRecords / totalChecked) * 100).toFixed(1) : '100.0';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Editorial Header */}
      <PageHeader
        eyebrow="DATA GOVERNANCE // SYSTEM HEALTH AUDIT"
        title="Institutional Data Quality Audit"
        subtitle="Automated data integrity checks evaluating missing records, invalid grade scores, orphan enrollments, and referential database constraints."
        dateStr={summary.check_timestamp ? new Date(summary.check_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined}
      />

      {/* Numbered Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          index="01"
          label="RECORDS AUDITED"
          value={totalChecked.toLocaleString()}
          sublabel="Total grade, attendance, and enrollment rows checked"
          accentColor="slate"
        />
        <MetricCard
          index="02"
          label="VALIDATED DATA ROWS"
          value={validRecords.toLocaleString()}
          sublabel="Records passing all automated validation checks"
          accentColor="emerald"
        />
        <MetricCard
          index="03"
          label="INTEGRITY EXCEPTIONS"
          value={issuesFound}
          sublabel="Identified missing values, duplicates, or orphan rows"
          accentColor="crimson"
        />
        <MetricCard
          index="04"
          label="DATA HEALTH SCORE"
          value={`${qualityRate}%`}
          sublabel="Overall database data integrity percentage"
          accentColor="indigo"
        />
      </div>

      {/* Audit Categories Breakdown Table */}
      <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
          <h3 className="font-serif text-xl font-medium text-slate-900">
            Validation Check Breakdown
          </h3>
          <span className="font-mono text-xs text-slate-400">
            {categories.length} AUDIT RULES EVALUATED
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="p-6 text-center bg-stone-50 rounded border border-stone-200 font-mono text-xs text-emerald-800">
            ✓ All automated validation rules passed cleanly with 0 exceptions.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat: any, idx: number) => {
              const hasIssues = cat.issue_count > 0;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all ${
                    hasIssues
                      ? 'bg-rose-50/40 border-rose-200/80'
                      : 'bg-stone-50/60 border-stone-200/80'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          hasIssues ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}
                      />
                      <h4 className="font-serif font-medium text-base text-slate-950">
                        {cat.category}
                      </h4>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded uppercase ${
                        hasIssues
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {cat.issue_count} {cat.issue_count === 1 ? 'Issue' : 'Issues'}
                    </span>
                  </div>

                  {hasIssues && cat.details && cat.details.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-rose-200/60">
                      <span className="font-mono text-[10px] text-rose-800 uppercase font-semibold tracking-wider block mb-1.5">
                        Exception Log Details
                      </span>
                      <ul className="space-y-1 text-xs font-mono text-slate-700 bg-white/80 p-3 rounded border border-rose-200/60">
                        {cat.details.map((dt: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-700 font-bold">•</span>
                            <span>{dt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
