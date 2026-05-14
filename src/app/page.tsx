"use client"

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import DashboardLayout from './(dashboard)/layout';
import Dashboard from './(dashboard)/page';

export default function Home() {
  return (
    <AuthProvider>
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
    </AuthProvider>
  );
}