import React from 'react';
// One bus drawn in SVG (300 x 120 units). c1 = body, c2 = stripe.
const Bus = ({ x = 0, y = 0, s = 1, c1, c2 }) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect width="300" height="100" rx="18" fill={c1} />
  <rect x="0" y="62" width="300" height="26" fill={c2} />
  {[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={16 + i * 38} y="14" width="30" height="32" rx="7" fill="#dff4ff" />)}
  <path d="M252 14h30a10 10 0 0 1 10 10v28h-40z" fill="#bfe9ff" />
  <text x="22" y="81" fontSize="17" fontWeight="800" fill="#fff" fontFamily="Sora,sans-serif" letterSpacing="2">GAD TRAVELS</text>
  <circle cx="291" cy="72" r="5" fill="#ffe27a" /><rect x="0" y="52" width="6" height="8" rx="2" fill="#ff5a5a" />
  {[68, 232].map(cx => <g key={cx}><circle cx={cx} cy="100" r="21" fill="#1b1b2f" /><circle cx={cx} cy="100" r="9" fill="#d5dcec" /></g>)}
</g>;

export const MiniBus = ({ layout }) => <svg viewBox="0 0 300 125" width="110" aria-hidden="true" className="minibus">
  {layout === 'sleeper' ? <Bus c1="#6c3df4" c2="#ff3d81" /> : <Bus c1="#12c2a9" c2="#2563eb" />}</svg>;

export function BusScene() {
  return <div className="scene"><svg viewBox="0 0 1200 340" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Illustration of GAD Travels buses on the road">
    <defs><radialGradient id="sun"><stop offset="0" stopColor="#fff3b0" /><stop offset="1" stopColor="#ffb347" /></radialGradient></defs>
    <circle cx="930" cy="150" r="92" fill="url(#sun)" opacity=".95" />
    <path d="M0 240 Q200 150 420 235 T820 225 T1200 215 V270 H0z" fill="#3b1a8f" opacity=".45" />
    {[[40, 90], [110, 140], [175, 110], [650, 100], [720, 150], [790, 120], [1040, 130], [1110, 95]].map(([x, h], i) =>
      <rect key={i} x={x} y={262 - h} width="48" height={h} fill="#2a1070" opacity=".5" />)}
    <rect y="255" width="1200" height="90" fill="#26223f" /><rect y="255" width="1200" height="6" fill="#ffc233" />
    <path d="M0 300H1200" stroke="#fff" strokeWidth="4" strokeDasharray="38 30" opacity=".75" />
    <Bus x={90} y={163} c1="#ff3d81" c2="#ff8a3d" />
    <Bus x={560} y={180} s={0.86} c1="#12c2a9" c2="#2563eb" />
    <g className="drive"><Bus x={0} y={172} s={0.92} c1="#ffc233" c2="#6c3df4" /></g>
  </svg></div>;
}
