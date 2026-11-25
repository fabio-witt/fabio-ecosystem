import { SvgXml } from 'react-native-svg';

/** Neutral person silhouette for people without a profile photo. */
const silhouette = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><linearGradient id="avbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9DEE7"/><stop offset="1" stop-color="#B8C0CE"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#avbg)"/>
<circle cx="50" cy="39" r="18" fill="#F4F6FA"/>
<path d="M14 100 C14 76 31 63 50 63 C69 63 86 76 86 100 Z" fill="#F4F6FA"/>
</svg>`;

export function DefaultAvatar({ size }: { size: number }) {
  return <SvgXml xml={silhouette} width={size} height={size} accessible={false} />;
}
