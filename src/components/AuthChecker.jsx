// components/AuthChecker.jsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetProfileQuery } from "../api/authApi";
import { setUser, logout } from "../features/auth/authSlice";

export const AuthChecker = ({ children }) => {
  const dispatch = useDispatch();
  const { data, error, isLoading } = useGetProfileQuery();

  useEffect(() => {
    if (data?.user) {
      dispatch(setUser(data.user));
    }

    if (error?.status === 401) {
      dispatch(logout());
    }
  }, [data, error, dispatch]);

  if (isLoading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return children;
};