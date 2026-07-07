"use client";

import React from "react";
import { useUber, RideInfo } from "@/contexts/UberContext";

const UberRideToast: React.FC = () => {
  const { rideInfo, showToast, hideToast } = useUber();

  if (!showToast || !rideInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50">
      <h3 className="text-lg font-bold">New Uber Ride</h3>
      <p>Category: {rideInfo.category}</p>
      <p>Price: {rideInfo.price}</p>
      <p>Distance: {rideInfo.distance}</p>
      <p>ETA: {rideInfo.eta}</p>
      <button onClick={hideToast} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md">
        Close
      </button>
    </div>
  );
};

export default UberRideToast;