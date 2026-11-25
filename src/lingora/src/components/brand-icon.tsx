import { Image } from 'expo-image';

const pirate = require('../../assets/images/grammarbay-mark.png');

export function BrandIcon({ size = 36 }: { size?: number }) {
  return <Image source={pirate} style={{ width: size, height: size }} accessible={false} />;
}
