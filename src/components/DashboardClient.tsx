'use client';

import React from 'react';
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import SyncOverlay from './dashboard/components/SyncOverlay';
import DashboardSidebar from './dashboard/layout/DashboardSidebar';
import DashboardHeader from './dashboard/layout/DashboardHeader';
import GlobalView from './dashboard/views/GlobalView';
import BranchView from './dashboard/views/BranchView';

export default function DashboardClient({ 
  cinemas, 
  globalMetrics, 
  branchAggregates 
}: { 
  cinemas: any[], 
  globalMetrics: { totalReviews: number, avgRating: number },
  branchAggregates: any[]
}) {
  const state = useDashboardData(cinemas, globalMetrics, branchAggregates);

  if (!state.mounted) return null;

  return (
    <>
      <SyncOverlay state={state} />

      <div className="flex min-h-screen bg-background text-primary transition-colors duration-500">
        <DashboardSidebar state={state} />

        <main className="flex-1 p-4 md:p-6 lg:p-10 flex flex-col gap-8 md:gap-10 min-w-0">
          <DashboardHeader state={state} />

          {state.viewMode === 'global' ? (
            <GlobalView state={state} />
          ) : (
            <BranchView state={state} />
          )}
        </main>
      </div>
    </>
  );
}
