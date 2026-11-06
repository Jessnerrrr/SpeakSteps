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

export function BellIcon({ color = '#1E293B', size = 22, alert = false }: IconProps & { alert?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9.1a6 6 0 0 1 12 0c0 4.1.9 5.5 1.7 6.3.3.3.1.9-.4.9H4.7c-.5 0-.7-.6-.4-.9C5.1 14.6 6 13.2 6 9.1Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M9.8 18.5a2.2 2.2 0 0 0 4.4 0" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      {alert ? <Circle cx={17.4} cy={4.6} r={2.35} fill="#F04438" /> : null}
    </Svg>
  );
}

export function HomeIcon({ color = '#8B9AAB', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.2 11.2 12 4.4l7.8 6.8V20a1 1 0 0 1-1 1h-4.6v-5.6H9.8V21H5.2a1 1 0 0 1-1-1v-8.8Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StudentsIcon({ color = '#8B9AAB', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="9" r="2.3" stroke={color} strokeWidth={1.7} />
      <Circle cx="16" cy="10" r="1.8" stroke={color} strokeWidth={1.7} />
      <Path
        d="M4.6 18.2c.6-2.5 2.4-3.8 4.4-3.8s3.8 1.3 4.4 3.8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Path d="M13.4 14.7c1.4-.2 2.9.5 3.6 2.3" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function ActivitiesIcon({ color = '#8B9AAB', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12h3.2l2.1-5.2 3.4 10.2 2.2-5H21"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReviewsIcon({ color = '#8B9AAB', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.7 14.2 8.7l5.4.5-4.1 3.5 1.2 5.3L12 15.4 7.3 18l1.2-5.3-4.1-3.5 5.4-.5L12 3.7Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
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
