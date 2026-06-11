import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AppLayout from "./pages/app/AppLayout";
import AppHome from "./pages/app/Home";
import Record from "./pages/app/Record";
import { MessagesList, MessageDetail } from "./pages/app/Messages";
import Onboarding from "./pages/app/Onboarding";
import {
  BusinessLayout,
  BusinessDashboard,
  BusinessMessageDetail,
  BusinessSettings,
} from "./pages/business/Business";

function RequireUser({ children }: { children: React.ReactElement }) {
  const { user, isUser } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isUser) return <Navigate to="/business/dashboard" replace />;
  return children;
}

function RequireBusiness({ children }: { children: React.ReactElement }) {
  const { user, isBusiness } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isBusiness) return <Navigate to="/app/home" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/app" element={<RequireUser><AppLayout /></RequireUser>}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<AppHome />} />
        <Route path="record" element={<Record />} />
        <Route path="messages" element={<MessagesList />} />
        <Route path="messages/:id" element={<MessageDetail />} />
        <Route path="onboarding" element={<Onboarding />} />
      </Route>
      <Route path="/business" element={<RequireBusiness><BusinessLayout /></RequireBusiness>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<BusinessDashboard />} />
        <Route path="messages/:id" element={<BusinessMessageDetail />} />
        <Route path="settings" element={<BusinessSettings />} />
      </Route>
      <Route
        path="/"
        element={
          user
            ? user.role === "business"
              ? <Navigate to="/business/dashboard" replace />
              : <Navigate to="/app/home" replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
