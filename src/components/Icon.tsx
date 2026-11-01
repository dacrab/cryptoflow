import { Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';

const PATHS = {
  search: () => (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  star: () => (
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
  ),
  arrowUp: () => (
    <>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </>
  ),
  arrowDown: () => (
    <>
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </>
  ),
  refresh: () => (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v6h-6" />
    </>
  ),
  x: () => (
    <>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  chevronRight: () => <path d="m9 18 6-6-6-6" />,
  grid: () => (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  rows: () => (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  check: () => <path d="M20 6 9 17l-5-5" />,
  alert: () => (
    <>
      <path d="M10.3 4.3 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  info: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  external: () => (
    <>
      <path d="M14 4h6v6" />
      <path d="m20 4-9 9" />
      <path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </>
  ),
  link: () => (
    <>
      <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1L10.8 5" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.2-1.1" />
    </>
  ),
  spark: () => (
    <>
      <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />
      <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  class?: string;
  size?: number;
  fill?: boolean;
}

export const Icon: Component<IconProps> = (props) => (
  <svg
    class={props.class}
    width={props.size ?? 16}
    height={props.size ?? 16}
    viewBox="0 0 24 24"
    fill={props.fill ? 'currentColor' : 'none'}
    stroke="currentColor"
    stroke-width={1.8}
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <Dynamic component={PATHS[props.name]} />
  </svg>
);
