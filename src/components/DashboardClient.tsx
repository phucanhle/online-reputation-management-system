'use client';

import React from 'react';
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import SyncOverlay from './dashboard/components/SyncOverlay';
import DashboardSidebar from './dashboard/layout/DashboardSidebar';
import DashboardHeader from './dashboard/layout/DashboardHeader';
import GlobalView from './dashboard/views/GlobalView';
import BranchView from './dashboard/views/BranchView';
import SyncModal from './dashboard/components/SyncModal';
import ActivityDrawer from './dashboard/components/ActivityDrawer';

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
      <SyncModal state={state} />
      <ActivityDrawer state={state} />

      <div className="flex min-h-screen bg-background text-primary transition-colors duration-300">
        <DashboardSidebar state={state} />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top nav bar — Apple glass effect */}
          <div className="sticky top-0 z-30 apple-nav px-6 lg:px-10 flex items-center h-[48px]">
            <DashboardHeader state={state} />
          </div>

          {/* Page content */}
          <div className="flex-1 p-6 lg:p-10 flex flex-col gap-8 bg-[var(--bg-main)]">
            {state.viewMode === 'global' ? (
              <GlobalView state={state} />
            ) : (
              <BranchView state={state} />
            )}
          </div>
        </main>
      </div>
    </>
  );
}
