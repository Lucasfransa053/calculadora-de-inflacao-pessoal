import React from 'react';
import { Image } from 'react-native';

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/icon.png')}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}
    />
  );
}
