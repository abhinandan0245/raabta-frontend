// src/routes/PublicRoute.jsx
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);

  // Agar user logged in hai to chat page pe bhejo
  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return children;
};

export default PublicRoute;