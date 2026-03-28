import React, { useState } from "react";
import { useLoginMutation } from "../api/authApi";
import { useDispatch } from "react-redux";
import { setUser } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import RaabtaLogo from "../components/ui/TaabtaLogo"; // Logo import karein
import Input from "../components/ui/Input";
import { LoginRounded } from "@mui/icons-material";
import { Button } from "@mui/material";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setUser(res.user));
      toast.success(res.message || "Welcome back to Raabta!");
      navigate("/chat");
    } catch (err) {
      toast.error(err.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <RaabtaLogo className="w-12 h-12 mb-2" />
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Please enter your details to login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-none bg-gray-50 shadow-inner focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-none bg-gray-50 shadow-inner focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-lg transition-all normal-case text-lg font-semibold"
            endIcon={!isLoading && <LoginRounded />}
          >
            {isLoading ? "Authenticating..." : "Login to Raabta"}
          </Button>
        </form>

        <p className="mt-8 text-center text-gray-600">
          New to Raabta?{" "}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;