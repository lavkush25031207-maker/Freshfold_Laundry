const paths = {
  arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  external: <><path d="M15 3h6v6" /><path d="m10 14 11-11" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
  hanger: <><path d="M12 7a2 2 0 1 0-2-2" /><path d="m4 18 8-7 8 7" /><path d="M4 18h16" /></>,
  iron: <><path d="M6 9h8a6 6 0 0 1 6 6H4a6 6 0 0 1 2-6Z" /><path d="M8 9V6h5" /><path d="M5 18h14" /></>,
  logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  package: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
  refresh: <><path d="M20 6v5h-5" /><path d="M4 18v-5h5" /><path d="M18.5 9A7 7 0 0 0 6 6.5L4 11" /><path d="M5.5 15A7 7 0 0 0 18 17.5l2-4.5" /></>,
  sparkle: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" /><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" /></>,
  truck: <><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  washer: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M4 7h16" /><circle cx="12" cy="14" r="5" /><path d="M7 4.5h.01M10 4.5h.01" /></>,
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.8 }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
