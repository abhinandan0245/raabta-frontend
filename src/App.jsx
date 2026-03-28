// App.js में
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; // useSelector import करें
import { AppRoutes } from "./routes/routes";
import { useGetProfileQuery } from "./api/authApi";
import { setUser, logout } from "./features/auth/authSlice";
import toast, { Toaster } from "react-hot-toast";
import { disconnectSocket, initializeSocket } from "./socket/socket";
import { AuthChecker } from "./components/AuthChecker";
import React from "react";

// Cookie helper function
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

function App() {
  const dispatch = useDispatch();
  const { data, error, isLoading } = useGetProfileQuery();
  
  // Get user from Redux store
  const user = useSelector(state => state.auth.user);

 useEffect(() => {
  if (data?.user) {
    dispatch(setUser(data.user));
    toast.success("Logged in successfully");
  }

  if (error?.status === 401) {
    dispatch(logout());
    toast.error("Session expired. Please login again.");
  }
}, [data, error, dispatch]);


  useEffect(() => {
    console.log("App: Attempting socket initialization...");
    
    // Get token from COOKIE (not localStorage)
    const userToken = getCookie('connectoToken');
    const userId = data?.user?._id || user?._id;
    
    console.log("Socket init check:", {
      tokenFromCookie: userToken ? `Exists (${userToken.length} chars)` : "Missing",
      userId: userId || "Missing",
      userFromData: data?.user?._id,
      userFromRedux: user?._id
    });
    
    if (userToken && userId) {
      console.log("✅ Initializing socket with cookie token...");
      
      // Initialize socket connection
      const socket = initializeSocket(userToken, userId);

      
    socket.on("connect", () => {
      toast.success("Connected to live chat");
    });

    socket.on("connect_error", () => {
      toast.error("Real-time connection failed");
    });
      
      // Attach to window for debugging
      window.appSocket = socket;
      
      // Set up global handlers
      window.dispatchNewMessage = (message) => {
        console.log('App: New message received:', message);
      };
      
      // Check connection after 3 seconds
      setTimeout(() => {
        console.log("Socket status after 3s:", {
          connected: socket?.connected,
          id: socket?.id,
          hasSocket: !!socket
        });
        
        if (!socket?.connected) {
          console.error("⚠️ Socket failed to connect!");
        }
      }, 3000);
      
      // Cleanup on unmount
      return () => {
        disconnectSocket();
        delete window.appSocket;
      };
    } else {
      console.warn("⚠️ Cannot initialize socket - missing:", {
        token: !userToken,
        userId: !userId
      });
    }
  }, [data?.user?._id, user?._id]); // Re-run when user data changes

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-xl">
        Loading…
      </div>
    );
  }

  return (
  <React.Fragment>
    <Toaster position="top-center" reverseOrder={false} />
    <AuthChecker>
      <AppRoutes />
    </AuthChecker>
  </React.Fragment>
);
}

export default App;