import React from 'react';

/*
  BrandMark — FOT Student Hub emblem.
  Renders the shared logo image from public/logo.jpeg and preserves the
  existing props API for backward compatibility.
*/
const BrandMark = ({ size = 44, radius = 'rounded-xl', shadow = '', variant = 'gold' }) => {
  return (
    <img
      src="/logo.jpeg"
      alt="FOT Student Hub"
      className={`block ${radius} ${shadow}`}
      style={{ width: size, height: 'auto', objectFit: 'contain' }}
    />
  );
};

export default BrandMark;
