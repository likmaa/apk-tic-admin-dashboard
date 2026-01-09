import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import PendingDriversPage from '@/pages/PendingDriversPage'
import { useAuth } from '@/hooks/useAuth'
import DashboardOverview from '@/pages/DashboardOverview'
import PricingConfigPage from '@/pages/PricingConfigPage'
import CommissionSettingsPage from '@/pages/CommissionSettingsPage'
import FinancePage from '@/pages/FinancePage'
import FleetManagementPage from '@/pages/FleetManagementPage'
import PassengersDBPage from '@/pages/PassengersDBPage'
import PassengersDetailsPage from '@/pages/PassengersDetailsPage'
import NotificationsPage from '@/pages/NotificationsPage'
import AccountsModerationPage from '@/pages/AccountsModerationPage'
import DeveloperToolsPage from '@/pages/DeveloperToolsPage'
import AppLayout from '@/components/AppLayout'
import UsersManagementPage from '@/pages/UsersManagementPage'
import OnlineDriversPage from '@/pages/OnlineDriversPage'
import DriversStatsPage from '@/pages/DriversStatsPage'
import ActiveRidesPage from '@/pages/ActiveRidesPage'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-600">Chargement du tableau de bord...</p>
      </div>
    </div>
  )
}

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, hydrated } = useAuth()
  if (!hydrated) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function HomeRedirect() {
  const { user, hydrated } = useAuth()
  if (!hydrated) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin' || user.role === 'developer') return <Navigate to="/overview" replace />
  // Fallback for other roles if they ever log into this dashboard
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/drivers/pending"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <PendingDriversPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/overview"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <DashboardOverview />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/pricing"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <PricingConfigPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <FinancePage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/fleet"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <FleetManagementPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/passengers"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <PassengersDBPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/passengers/:id"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <PassengersDetailsPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <UsersManagementPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/drivers/online"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <OnlineDriversPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/drivers/stats"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <DriversStatsPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/rides/active"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <ActiveRidesPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <NotificationsPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <PrivateRoute roles={["admin", "developer"]}>
            <AppLayout>
              <AccountsModerationPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dev/commission"
        element={
          <PrivateRoute roles={["developer"]}>
            <AppLayout>
              <CommissionSettingsPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dev/tools"
        element={
          <PrivateRoute roles={["developer"]}>
            <AppLayout>
              <DeveloperToolsPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
