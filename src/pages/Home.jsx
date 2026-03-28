import React from "react";
import { MessageCircle, Users, Shield, Zap, Globe, Lock } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import RaabtaLogo from "../components/ui/TaabtaLogo";

export default function Home() {
    const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  // Agar user logged in hai to chat page pe redirect kar do
    useEffect(() => {
    // Agar user logged in hai to chat page pe redirect kar do
    if (user) {
      navigate("/chat", { replace: true });
    }
  }, [user, navigate]);

  // Agar user logged in hai to kuch mat dikhao
  if (user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-50/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
    {/* Naya Logo Component */}
    <RaabtaLogo className="w-9 h-9" />
    <span className="text-2xl font-bold text-gray-900 tracking-tight">Raabta</span>
  </div>
        <div className="flex items-center space-x-4">
          <a href="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
            Login
          </a>
          <a 
            href="/register" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
          >
            Sign Up Free
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
  Sahi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Raabta</span>, <br />
  Sahi Waqt Par
</h1>
            
            <p className="text-xl text-gray-600">
              Experience seamless communication with Raabta. Fast, secure, 
              and beautifully simple messaging for everyone.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
            <a
  href="/register"
  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-800 transition transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
>
  Get Started Free
</a>
              <a
                href="#features"
                className="px-8 py-4 border-2 border-gray-300 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition text-center"
              >
                Learn More
              </a>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>End-to-end encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>10M+ users</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-purple-500" />
                <span>Free forever</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Illustration */}
         {/* Hero Image/Illustration */}
<div className="relative">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full filter blur-3xl opacity-20"></div>
  <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
    <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
      </div>
      <div className="text-xs font-medium text-gray-400 uppercase tracking-widest">New Message</div>
      <div className="w-6 h-6">
        <RaabtaLogo className="w-5 h-5 opacity-50" />
      </div>
    </div>
    
    {/* Chat Messages */}
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <RaabtaLogo className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 max-w-xs shadow-sm">
            <p className="text-gray-800 text-sm">Hey! How's it going?</p>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 ml-1">10:30 AM</span>
        </div>
      </div>
      
      <div className="flex items-start space-x-3 justify-end">
        <div className="flex-1 text-right">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 max-w-xs ml-auto shadow-md">
            <p className="text-sm">Great! Just checking out Raabta</p>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 mr-1">10:31 AM</span>
        </div>
        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
          JD
        </div>
      </div>

      {/* Typing Indicator */}
      <div className="flex items-center space-x-2 pt-2 opacity-70">
        <div className="flex space-x-1 bg-gray-100 p-2 rounded-full px-4">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
        <span className="text-[10px] text-gray-400 italic">Raabta is typing...</span>
      </div>
    </div>
  </div>
</div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Why Choose Raabta?
        </h2>
        <p className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto">
          Everything you need for modern communication in one powerful platform
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Zap className="w-8 h-8 text-yellow-500" />}
            title="Lightning Fast"
            description="Real-time messaging with zero lag. Messages delivered instantly across all devices."
          />
          
          <FeatureCard 
            icon={<Lock className="w-8 h-8 text-green-500" />}
            title="Secure & Private"
            description="End-to-end encryption ensures your conversations stay private and secure."
          />
          
          <FeatureCard 
            icon={<Users className="w-8 h-8 text-blue-500" />}
            title="Group Chats"
            description="Create groups with up to 500 members. Perfect for teams and communities."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to start connecting?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join millions of users who trust Raabta for their daily communication
          </p>
          <a
            href="/register"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl"
          >
            Create Free Account
          </a>
          <p className="text-white/80 mt-4 text-sm">
            No credit card required • Free forever
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-100">
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex flex-col md:flex-row justify-between items-center">
      <div className="flex items-center space-x-3 mb-4 md:mb-0">
        <RaabtaLogo className="w-6 h-6" />
        <span className="text-xl font-bold text-gray-900">Raabta</span>
      </div>
      <div className="flex space-x-8 text-gray-600 font-medium">
        <a href="#" className="hover:text-blue-600 transition">About</a>
        <a href="#" className="hover:text-blue-600 transition">Privacy</a>
        <a href="#" className="hover:text-blue-600 transition">Terms</a>
        <a href="#" className="hover:text-blue-600 transition">Contact</a>
      </div>
    </div>
    <div className="mt-8 text-center text-gray-400 text-sm">
      © {new Date().getFullYear()} Raabta. All rights reserved.
    </div>
  </div>
</footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100">
     <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
  {icon}
</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}