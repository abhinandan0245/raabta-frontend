// src/utils/helpers.js
import { store } from "../app/store";

// Format date for messages/notifications
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(); // "12/2/2025, 12:30 PM"
};

// Check if user is logged in

export const isAuthenticated = () => {
  const state = store.getState();
  return !!state.auth.user;
};



// Get token
// export const getToken = () => {
//     return localStorage.getItem("token");
// };


// Cookie helper function
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Get token from cookies
const token = getCookie('connectoToken') || getCookie('connectoToken') || getCookie('jwt');
const userId = getCookie('userId') || getCookie('user_id') || getCookie('uid');

console.log("Cookies check:", {
  token: token ? "Exists ✓" : "Missing ✗",
  userId: userId || "Missing ✗",
  allCookies: document.cookie
});