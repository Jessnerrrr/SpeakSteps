import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = {
  color?: string;
  size?: number;
};

export function MenuIcon({ color = '#1E293B', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M4 12h16M4 17h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function BellIcon({ color = '#0284C7', size = 24, alert = true }: IconProps & { alert?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C10.9 2 10 2.9 10 4c0 .3.05.6.14.88C7.68 5.86 6 8.23 6 11v5l-2 2v1h16v-1l-2-2v-5c0-2.77-1.68-5.14-4.14-6.12.09-.28.14-.58.14-.88 0-1.1-.9-2-2-2Z"
        fill={color}
      />
      <Path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Z" fill={color} />
      {alert && <Circle cx={18} cy={5} r={3.5} fill="#EF4444" />}
    </Svg>
  );
}

export function HomeIcon({ color = '#63778A', size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 3 2 12h3v8a1 1 0 0 0 1 1h4v-6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v6h4a1 1 0 0 0 1-1v-8h3L12 3Z" />
    </Svg>
  );
}

export function StudentsIcon({ color = '#63778A', size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" />
    </Svg>
  );
}

export function ActivitiesIcon({ color = '#63778A', size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3.5" fill={color} />
      <Path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5v1H3v-1Z" fill={color} />
      <Path
        d="M17.5 9.5a3.5 3.5 0 0 1 0 5M20 7.5a6.5 6.5 0 0 1 0 9"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function ReviewsIcon({ color = '#0284C7', size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5 6 20.9l1.3-6.7-5-4.7 6.8-.8L12 2.5Z" />
    </Svg>
  );
}

export function ClipboardIcon({ color = '#0369A1', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="5" width="12" height="14.5" rx="2" stroke={color} strokeWidth={1.8} />
      <Path d="M9 5.2h6V7H9V5.2Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M9 11.2h6M9 14.2h4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function PersonPlusIcon({ color = '#2F7D3F', size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth={1.8} />
      <Path
        d="M3.8 19c.8-3.1 2.9-4.6 5.2-4.6s4.4 1.5 5.2 4.6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M18 9v6M15 12h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function PeopleIcon({ color = '#2F7D3F', size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8.2" r="2.5" stroke={color} strokeWidth={1.8} />
      <Circle cx="16" cy="9" r="2" stroke={color} strokeWidth={1.8} />
      <Path d="M3.8 18.6c.7-2.6 2.5-3.9 4.6-3.9s3.9 1.3 4.6 3.9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M14.2 14.8c1.3-.5 2.6-.4 3.6.3 1 .8 1.6 2 1.9 3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function PersonIcon({ color = '#1E293B', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.2} stroke={color} strokeWidth={1.8} />
      <Path d="M5.5 19.2c.9-3.2 3.2-4.8 6.5-4.8s5.6 1.6 6.5 4.8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function GearIcon({ color = '#1E293B', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon({ color = '#8B9AAB', size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6.5 15 12l-6 5.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SearchIcon({ color = '#8B9AAB', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6.2} stroke={color} strokeWidth={1.8} />
      <Path d="M15.8 15.8 20 20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function FilterIcon({ color = '#1E293B', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M7 12h10M10 17h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function PencilIcon({ color = '#8B9AAB', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20h4l10.2-10.2a2 2 0 0 0 0-2.8l-.2-.2a2 2 0 0 0-2.8 0L5 17v3Z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Path d="M13.2 6.8l4 4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function TrashIcon({ color = '#8B9AAB', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 7h14" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M7 7l.8 12.2A1.5 1.5 0 0 0 9.3 20.5h5.4a1.5 1.5 0 0 0 1.5-1.3L17 7" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ color = '#1E293B', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6.5 9 12l6 5.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
