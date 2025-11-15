import { forwardRef } from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// 创建基础图标组件工厂
const createIcon = (paths: string[]) =>
  forwardRef<SVGSVGElement, IconProps>(({ className, size = 16, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {paths.map((path, i) => <path key={i} d={path} />)}
    </svg>
  ));

// Copy Icon
export const Copy = createIcon([
  '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />',
  '<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />'
]);

// Check Icon
export const Check = createIcon(['<path d="M20 6 9 17l-5-5" />']);

// List Icon
export const List = createIcon([
  '<line x1="8" y1="6" x2="21" y2="6" />',
  '<line x1="8" y1="12" x2="21" y2="12" />',
  '<line x1="8" y1="18" x2="21" y2="18" />',
  '<line x1="3" y1="6" x2="3.01" y2="6" />',
  '<line x1="3" y1="12" x2="3.01" y2="12" />',
  '<line x1="3" y1="18" x2="3.01" y2="18" />'
]);

// Info Icon
export const Info = createIcon([
  '<circle cx="12" cy="12" r="10" />',
  '<path d="M12 16v-4" />',
  '<path d="M12 8h.01" />'
]);

// CheckCircle Icon
export const CheckCircle = createIcon([
  '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />',
  '<path d="m9 11 3 3L22 4" />'
]);

// AlertTriangle Icon
export const AlertTriangle = createIcon([
  '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />',
  '<path d="M12 9v4" />',
  '<path d="m12 17 .01 0" />'
]);

// XCircle Icon
export const XCircle = createIcon([
  '<circle cx="12" cy="12" r="10" />',
  '<path d="m15 9-6 6" />',
  '<path d="m9 9 6 6" />'
]);

// Lightbulb Icon
export const Lightbulb = createIcon([
  '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />',
  '<path d="M9 18h6" />',
  '<path d="M10 22h4" />'
]);

// Zap Icon
export const Zap = createIcon(['<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />']);

// Target Icon
export const Target = createIcon([
  '<circle cx="12" cy="12" r="10" />',
  '<circle cx="12" cy="12" r="6" />',
  '<circle cx="12" cy="12" r="2" />'
]);

// Heart Icon
export const Heart = createIcon([
  '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5Z" />',
  '<path d="M12 5L8 21l4-7 4 7-4-16" />'
]);

// 添加 displayName
Copy.displayName = 'Copy';
Check.displayName = 'Check';
List.displayName = 'List';
Info.displayName = 'Info';
CheckCircle.displayName = 'CheckCircle';
AlertTriangle.displayName = 'AlertTriangle';
XCircle.displayName = 'XCircle';
Lightbulb.displayName = 'Lightbulb';
Zap.displayName = 'Zap';
Target.displayName = 'Target';
Heart.displayName = 'Heart';