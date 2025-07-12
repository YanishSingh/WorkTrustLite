/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useLocation } from 'react-router-dom';

const Payment: React.FC<{ status?: string }> = ({ status }) => {
  const location = useLocation();

  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      {status === 'success' && (
        <>
          <h2 className="text-2xl font-bold text-green-700 mb-4">Payment Successful!</h2>
          <p>Thank you for your payment. Your invoice has been marked as paid.</p>
        </>
      )}
      {status === 'cancelled' && (
        <>
          <h2 className="text-2xl font-bold text-red-700 mb-4">Payment Cancelled</h2>
          <p>Your payment was not completed. You can try again from your invoice dashboard.</p>
        </>
      )}
    </div>
  );
};

export default Payment;
