// // Alag se component bana kar use karein ya seedhe Navbar mein daalein
// function RaabtaLogo({ className = "w-8 h-8" }) {
//   return (
//     <div className={`relative ${className}`}>
//       {/* Do overlapping rings connecting element signifying 'Raabta' */}
//       <div className="absolute inset-0 border-4 border-blue-600 rounded-full opacity-60"></div>
//       <div className="absolute inset-0 border-4 border-blue-600 rounded-full scale-105 translate-x-1.5 opacity-80"></div>
      
//       {/* Central filled part, reinforcing connection */}
//       <div className="absolute inset-2 bg-blue-600 rounded-full shadow-lg"></div>
//     </div>
//   );
// }

import React from 'react';

const RaabtaLogo = ({ className = "w-8 h-8" }) => {
  return (
    <div className={`relative ${className} flex-shrink-0`} aria-label="Raabta Logo">
      {/* Pehla Ring (Connection Base) */}
      <div className="absolute inset-0 border-[3px] border-blue-600 rounded-full opacity-40"></div>
      
      {/* Doosra Ring (Overlapping for 'Raabta' feel) */}
      <div className="absolute inset-0 border-[3px] border-blue-600 rounded-full scale-110 translate-x-1 opacity-70"></div>
      
      {/* Center Point (The Core Connection) */}
      <div className="absolute inset-[6px] bg-blue-600 rounded-full shadow-md animate-pulse-slow">
        {/* Subtle inner shine */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/30 rounded-full"></div>
      </div>
    </div>
  );
};

export default RaabtaLogo;