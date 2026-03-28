import React, { useState } from "react";
import { useRegisterMutation } from "../api/authApi";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

// Import reusable UI components
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
// import Button from "../components/ui/Button";
import { setUser } from "../features/auth/authSlice";
import { Button } from "@mui/material";
import { AppRegistrationRounded, Login, LoginRounded } from "@mui/icons-material";
import toast from "react-hot-toast";
import RaabtaLogo from "../components/ui/TaabtaLogo";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await register({ name, email, password, number }).unwrap();
      dispatch(setUser(res.user));
      toast.success("Welcome to the Raabta family!");
      navigate("/chat");
    } catch (err) {
      toast.error(err.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <RaabtaLogo className="w-12 h-12 mb-2" />
          <h2 className="text-3xl font-extrabold text-gray-900">Join Raabta</h2>
          <p className="text-gray-500 text-sm">Start your journey with us today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border-none bg-gray-50 shadow-inner"
          />
          <Input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border-none bg-gray-50 shadow-inner"
          />
          <Input
            type="number"
            placeholder="Phone Number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border-none bg-gray-50 shadow-inner"
          />
          <Input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border-none bg-gray-50 shadow-inner"
          />

          <Button 
            variant="contained" 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-all normal-case text-lg font-semibold"
          >
            {isLoading ? "Setting up profile..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already a member?{" "}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
