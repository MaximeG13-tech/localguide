import React from 'react';

interface IconProps {
  className?: string;
}

export const BuildingStorefrontIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.25 3.001v1.138A4.493 4.493 0 0 0 9 4.5A4.5 4.5 0 0 0 4.5 9v1.138a4.493 4.493 0 0 0-1.362 2.112A4.5 4.5 0 0 0 4.5 21h15a4.5 4.5 0 0 0 1.362-8.25A4.493 4.493 0 0 0 19.5 10.138V9A4.5 4.5 0 0 0 15 4.5a4.493 4.493 0 0 0-2.25-1.362V3.001a1.5 1.5 0 0 0-1.5-1.5h-1.5a.75.75 0 0 1 0-1.5H12a3 3 0 0 1 3 3v.376a6.008 6.008 0 0 1 4.125 2.125 5.988 5.988 0 0 1 1.875 4.375C21 16.51 18.31 19.5 15 19.5H9c-3.31 0-6-2.99-6-6.125a5.988 5.988 0 0 1 1.875-4.375A6.008 6.008 0 0 1 9 6.375V6a3 3 0 0 1 3-3h.75a.75.75 0 0 1 0 1.5H12a1.5 1.5 0 0 0-1.5 1.5Z" />
    <path d="M7.5 10.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Zm3.75 0a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Zm3.75 0a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Z" />
  </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 5.162-5.162 16.975 16.975 0 0 0 2.296-8.284 8.968 8.968 0 0 0-1.923-5.344A8.968 8.968 0 0 0 12 2.25a8.968 8.968 0 0 0-7.078 3.58A8.968 8.968 0 0 0 3 11.25a16.975 16.975 0 0 0 2.296 8.284 16.975 16.975 0 0 0 5.162 5.162ZM12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
  </svg>
);

export const DocumentTextIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a.375.375 0 0 1-.375-.375V6.75A3.75 3.75 0 0 0 9 3H5.625ZM12.75 12a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V12Z" clipRule="evenodd" />
    <path d="M14.25 6.75a2.25 2.25 0 0 0-2.25-2.25H5.625a.375.375 0 0 0-.375.375v17.25c0 .207.168.375.375.375h12.75a.375.375 0 0 0 .375-.375V12.75a2.25 2.25 0 0 0-2.25-2.25h-1.875a1.875 1.875 0 0 1-1.875-1.875V6.75Z" />
  </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M4.5 3.75A.75.75 0 0 1 5.25 3h13.5a.75.75 0 0 1 .75.75v16.5a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V3.75ZM8.25 9a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z" clipRule="evenodd" />
  </svg>
);

export const GlobeAltIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM8.25 15.375a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75-3.75a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6ZM9 8.625a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
  </svg>
);

export const HashtagIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5.25 4.5A.75.75 0 0 1 6 3.75h12a.75.75 0 0 1 .75.75v15a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75v-15ZM8.25 9a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5ZM8.25 13.5a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z" clipRule="evenodd" />
  </svg>
);

export const RocketLaunchIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M11.755 2.51a.75.75 0 0 1 .49 0l8.25 3.188a.75.75 0 0 1 .367.973l-2.422 6.312a.75.75 0 0 1-.72.467H6.75a.75.75 0 0 1-.72-.467L3.608 6.67a.75.75 0 0 1 .368-.973l8.25-3.187Zm.01 1.94 5.373 2.074-1.575 4.106H8.948L7.373 6.525l4.392-1.693ZM3.75 14.25a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm3.75 0a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm3.75 0a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm3.75 0a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm3.75 0a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
  </svg>
);

export const AlignLeftIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
  </svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.279-.087.431l4.258 7.373c.077.152.256.18.431.087l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.819V19.5a3 3 0 0 1-3 3h-2.25C6.55 22.5 1.5 17.45 1.5 10.5V4.5Z" clipRule="evenodd" />
  </svg>
);

export const UserCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
  </svg>
);

export const XMarkIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);

export const ArrowTopRightOnSquareIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M15.75 2.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0V4.81L9.47 11.28a.75.75 0 0 1-1.06-1.06L14.69 3.75H9.75a.75.75 0 0 1 0-1.5h6Z" clipRule="evenodd" />
    <path d="M3.75 6A2.25 2.25 0 0 0 1.5 8.25v12A2.25 2.25 0 0 0 3.75 22.5h12A2.25 2.25 0 0 0 18 20.25V13.5a.75.75 0 0 1 1.5 0v6.75A3.75 3.75 0 0 1 15.75 24h-12A3.75 3.75 0 0 1 0 20.25v-12A3.75 3.75 0 0 1 3.75 4.5h6.75a.75.75 0 0 1 0 1.5H3.75Z" />
  </svg>
);
