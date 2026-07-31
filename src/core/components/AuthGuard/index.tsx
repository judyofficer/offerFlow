import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const AuthGuard: React.FC = () => {
  const { user, isGuest } = useAuthStore();

  // If the user is neither logged in nor a guest, redirect to Auth page
  if (!user && !isGuest) {
    return <Navigate to="/auth" replace />;
  }

  // Otherwise, allow access to the protected routes
  return <Outlet />;
};

export default AuthGuard;
