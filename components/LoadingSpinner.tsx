// src/components/LoadingSpinner.tsx
import React from 'react';
import ReactLoading from 'react-loading'; // Cần cài đặt: npm install react-loading

const LoadingSpinner: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <ReactLoading type="spin" color="#007bff" height={50} width={50} />
  </div>
);

export default LoadingSpinner;
