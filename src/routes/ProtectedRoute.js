// components/ProtectedRoute.js
import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles = [], allowedEntities = [] }) => {
  // Try to get from Redux store
  const { isAuthenticated, role, entity } = useSelector((state) => state.auth);

  // Fallback to localStorage if Redux state is unavailable
  const localUser = JSON.parse(localStorage.getItem("user"));

  const userRole = role || localUser?.role;
  const userEntity = entity || localUser?.entity;
  const isLoggedIn = isAuthenticated || !!localUser;

  // Not logged in, redirect to login page
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // // Role not allowed
  // if (allowedRoles.length && !allowedRoles.includes(userRole)) {
  //   return <Navigate to="/unauthorized" replace />;
  // }

  // Entity not allowed
  // if (allowedEntities.length && !allowedEntities.includes(userEntity)) {
  //   return <Navigate to="/unauthorized" replace />;
  // }

  return <Outlet />;
};

export default ProtectedRoute;
