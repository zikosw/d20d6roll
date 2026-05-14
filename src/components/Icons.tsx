import { SVGProps } from 'react';

export function D20Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 25 L50 45 L90 25 M50 45 L50 95 M10 75 L50 45 L90 75" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

export function D6Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
      />
    </svg>
  );
}
