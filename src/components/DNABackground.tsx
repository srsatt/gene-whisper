import React from "react";

interface DNABackgroundProps {
  className?: string;
}

// SVG иконки на медицинскую и научную тематику
const DNAIcons = {
  dnaHelix: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" />
      <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" />
      <path d="M8 7L16 7" />
      <path d="M8 12L16 12" />
      <path d="M8 17L16 17" />
      <circle cx="8" cy="7" r="1" />
      <circle cx="16" cy="7" r="1" />
      <circle cx="8" cy="12" r="1" />
      <circle cx="16" cy="12" r="1" />
      <circle cx="8" cy="17" r="1" />
      <circle cx="16" cy="17" r="1" />
    </svg>
  ),

  flask: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M9 2V8L4.5 20C4.2 20.8 4.8 21.5 5.7 21.5H18.3C19.2 21.5 19.8 20.8 19.5 20L15 8V2" />
      <path d="M9 2H15" />
      <path d="M9 16L15 16" />
      <circle cx="10" cy="18" r="1" />
      <circle cx="14" cy="18" r="1" />
    </svg>
  ),

  pill: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M10.5 20.5C13.8 20.5 16.5 17.8 16.5 14.5C16.5 11.2 13.8 8.5 10.5 8.5C7.2 8.5 4.5 11.2 4.5 14.5C4.5 17.8 7.2 20.5 10.5 20.5Z" />
      <path d="M13.5 3.5C16.8 3.5 19.5 6.2 19.5 9.5C19.5 12.8 16.8 15.5 13.5 15.5C10.2 15.5 7.5 12.8 7.5 9.5C7.5 6.2 10.2 3.5 13.5 3.5Z" />
      <path d="M8.5 12L15.5 12" />
    </svg>
  ),

  heartRate: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M22 12H18L15 21L9 3L6 12H2" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),

  stethoscope: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4.8 2.3C4.1 2 3.3 2.5 3 3.2L2.3 4.8C2 5.5 2.5 6.3 3.2 6.6L4.8 7.3C5.5 7.6 6.3 7.1 6.6 6.4L7.3 4.8C7.6 4.1 7.1 3.3 6.4 3L4.8 2.3Z" />
      <path d="M18.8 2.3C18.1 2 17.3 2.5 17 3.2L16.3 4.8C16 5.5 16.5 6.3 17.2 6.6L18.8 7.3C19.5 7.6 20.3 7.1 20.6 6.4L21.3 4.8C21.6 4.1 21.1 3.3 20.4 3L18.8 2.3Z" />
      <path d="M5 8V15C5 17.8 7.2 20 10 20H14C16.8 20 19 17.8 19 15V8" />
      <circle cx="19" cy="14" r="3" />
      <path d="M12 20V22" />
    </svg>
  ),

  heart: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20.8 4.6C20.3 4.1 19.7 3.7 19 3.4C18.3 3.1 17.6 3 16.8 3C16 3 15.3 3.1 14.6 3.4C13.9 3.7 13.3 4.1 12.8 4.6L12 5.4L11.2 4.6C10.7 4.1 10.1 3.7 9.4 3.4C8.7 3.1 8 3 7.2 3C6.4 3 5.7 3.1 5 3.4C4.3 3.7 3.7 4.1 3.2 4.6C1.1 6.7 1.1 10.1 3.2 12.2L12 21L20.8 12.2C22.9 10.1 22.9 6.7 20.8 4.6Z" />
    </svg>
  ),

  fingerprint: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12" />
      <path d="M5 12C5 8.1 8.1 5 12 5C15.9 5 19 8.1 19 12" />
      <path d="M8 12C8 9.8 9.8 8 12 8C14.2 8 16 9.8 16 12V13" />
      <path d="M12 10V20" />
      <path d="M10 12V18" />
      <path d="M14 12V16" />
    </svg>
  ),

  microscope: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6 18H4C2.9 18 2 17.1 2 16V14C2 12.9 2.9 12 4 12H6" />
      <path d="M6 14H8V10L12 6L16 10V14H18" />
      <path d="M12 6V2" />
      <path d="M10 2H14" />
      <circle cx="12" cy="18" r="4" />
    </svg>
  ),

  glasses: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="6" cy="15" r="4" />
      <circle cx="18" cy="15" r="4" />
      <path d="M6 11L2 11" />
      <path d="M18 11L22 11" />
      <path d="M10 15L14 15" />
    </svg>
  ),

  droplet: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2.7C13.6 4.4 16 7.1 16 10.5C16 12.4 15.2 14.2 13.7 15.5C12.2 16.8 10.2 17.3 8.3 16.9C6.4 16.5 4.8 15.2 4 13.4C3.2 11.6 3.4 9.5 4.5 7.9C5.6 6.3 7.4 5.4 9.3 5.5C10.3 5.6 11.2 6 12 6.7" />
      <path d="M12 2.7L12 6.7" />
    </svg>
  ),

  pipette: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M9.06 12.44L15.5 6L18 8.5L11.56 14.94" />
      <path d="M21 3L18 6" />
      <path d="M9 15L4.5 19.5C4.1 19.9 3.5 20.1 2.9 19.9L2.1 19.6C1.5 19.4 1.1 18.8 1.1 18.2V17.8C1.1 17.2 1.5 16.6 2.1 16.4L2.9 16.1C3.5 15.9 4.1 16.1 4.5 16.5L9 21" />
      <circle cx="11.5" cy="12.5" r="1.5" />
    </svg>
  ),

  syringe: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M18 2L20 4L18 6L16 4Z" />
      <path d="M17 5L4 18L6 20L19 7" />
      <path d="M9 15L4 20" />
      <path d="M14.5 9.5L16.5 11.5" />
      <path d="M12.5 11.5L14.5 13.5" />
    </svg>
  ),

  thermometer: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M14 4V10.5C15.2 11.2 16 12.5 16 14C16 16.2 14.2 18 12 18C9.8 18 8 16.2 8 14C8 12.5 8.8 11.2 10 10.5V4C10 2.9 10.9 2 12 2C13.1 2 14 2.9 14 4Z" />
      <circle cx="12" cy="14" r="2" />
      <path d="M12 6V10" />
    </svg>
  ),

  bandage: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 6L20 6C21.1 6 22 6.9 22 8V16C22 17.1 21.1 18 20 18L4 18C2.9 18 2 17.1 2 16V8C2 6.9 2.9 6 4 6Z" />
      <circle cx="8" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="16" cy="12" r="1" />
      <path d="M6 6V18" />
      <path d="M18 6V18" />
    </svg>
  ),

  brain: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M9.5 2C8.7 2 8 2.7 8 3.5C7.2 3.5 6.5 4.2 6.5 5C5.7 5 5 5.7 5 6.5C4.2 6.5 3.5 7.2 3.5 8C3.5 8.8 4.2 9.5 5 9.5V16C5 18.2 6.8 20 9 20H15C17.2 20 19 18.2 19 16V9.5C19.8 9.5 20.5 8.8 20.5 8C20.5 7.2 19.8 6.5 19 6.5C19 5.7 18.3 5 17.5 5C17.5 4.2 16.8 3.5 16 3.5C16 2.7 15.3 2 14.5 2H9.5Z" />
      <path d="M9 7L15 7" />
      <path d="M9 11L15 11" />
      <path d="M9 15L15 15" />
    </svg>
  ),

  virus: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="6" />
      <path d="M12 2V6" />
      <path d="M12 18V22" />
      <path d="M22 12H18" />
      <path d="M6 12H2" />
      <path d="M19.1 4.9L16.2 7.8" />
      <path d="M7.8 16.2L4.9 19.1" />
      <path d="M19.1 19.1L16.2 16.2" />
      <path d="M7.8 7.8L4.9 4.9" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),

  xray: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M8 7V17" />
      <path d="M16 7V17" />
      <path d="M12 7V17" />
      <circle cx="8" cy="10" r="1" />
      <circle cx="16" cy="10" r="1" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="16" cy="14" r="1" />
    </svg>
  ),

  dna: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 4C4 4 8 8 12 8C16 8 20 4 20 4" />
      <path d="M4 12C4 12 8 8 12 8C16 8 20 12 20 12" />
      <path d="M4 20C4 20 8 16 12 16C16 16 20 20 20 20" />
      <path d="M4 12C4 12 8 16 12 16C16 16 20 12 20 12" />
      <circle cx="6" cy="6" r="1" />
      <circle cx="18" cy="6" r="1" />
      <circle cx="6" cy="18" r="1" />
      <circle cx="18" cy="18" r="1" />
    </svg>
  ),

  lungs: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8.5 14.5C8.5 16.4 6.9 18 5 18C3.1 18 1.5 16.4 1.5 14.5V9.5C1.5 7.6 3.1 6 5 6C6.9 6 8.5 7.6 8.5 9.5V14.5Z" />
      <path d="M22.5 14.5C22.5 16.4 20.9 18 19 18C17.1 18 15.5 16.4 15.5 14.5V9.5C15.5 7.6 17.1 6 19 6C20.9 6 22.5 7.6 22.5 9.5V14.5Z" />
      <path d="M8.5 12H15.5" />
      <path d="M12 2V12" />
    </svg>
  ),

  kidney: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2C8 2 5 5 5 9V15C5 19 8 22 12 22C16 22 19 19 19 15V9C19 5 16 2 12 2Z" />
      <path d="M9 8C9 6.9 9.9 6 11 6H13C14.1 6 15 6.9 15 8V16C15 17.1 14.1 18 13 18H11C9.9 18 9 17.1 9 16V8Z" />
      <circle cx="12" cy="10" r="1" />
      <circle cx="12" cy="14" r="1" />
    </svg>
  ),

  bone: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M17 4C18.7 4 20 5.3 20 7C20 8.7 18.7 10 17 10H7C5.3 10 4 8.7 4 7C4 5.3 5.3 4 7 4C8.7 4 10 5.3 10 7" />
      <path d="M17 20C18.7 20 20 18.7 20 17C20 15.3 18.7 14 17 14H7C5.3 14 4 15.3 4 17C4 18.7 5.3 20 7 20C8.7 20 10 18.7 10 17" />
      <path d="M10 7V17" />
      <path d="M14 7V17" />
    </svg>
  ),

  tooth: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2C9.8 2 8 3.8 8 6V12C8 14.2 9.8 16 12 16C14.2 16 16 14.2 16 12V6C16 3.8 14.2 2 12 2Z" />
      <path d="M10 16V20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20V16" />
      <circle cx="12" cy="8" r="1" />
    </svg>
  ),

  bloodDrop: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2L16 10C16 13.3 13.3 16 10 16C6.7 16 4 13.3 4 10L12 2Z" />
      <path d="M12 2C15.3 2 18 4.7 18 8C18 11.3 15.3 14 12 14" />
      <circle cx="10" cy="12" r="1" />
    </svg>
  ),

  medicalCross: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2V22" />
      <path d="M2 12H22" />
      <rect x="9" y="9" width="6" height="6" />
    </svg>
  ),

  ambulance: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M16 7V3C16 2.4 15.6 2 15 2H9C8.4 2 8 2.4 8 3V7" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M12 9V13" />
      <path d="M10 11H14" />
    </svg>
  ),

  wheelchair: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7V15" />
      <path d="M8 15H16" />
      <circle cx="12" cy="17" r="5" />
      <path d="M8 11H16" />
    </svg>
  ),

  hospitalBed: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="10" width="20" height="6" />
      <path d="M6 10V6C6 4.9 6.9 4 8 4H16C17.1 4 18 4.9 18 6V10" />
      <path d="M6 16V20" />
      <path d="M18 16V20" />
      <path d="M10 7H14" />
    </svg>
  ),

  pills: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="4" />
      <circle cx="16" cy="16" r="4" />
      <path d="M6 10L10 6" />
      <path d="M14 18L18 14" />
    </svg>
  ),

  vaccine: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M18 2L20 4L18 6L16 4Z" />
      <path d="M17 5L8 14V18H12L21 9" />
      <path d="M16 13L18 15" />
      <circle cx="4" cy="20" r="2" />
    </svg>
  ),

  medicalChart: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8L17 8" />
      <path d="M7 12L17 12" />
      <path d="M7 16L13 16" />
      <circle cx="17" cy="16" r="2" />
    </svg>
  ),
};

const iconKeys = Object.keys(DNAIcons) as (keyof typeof DNAIcons)[];

interface FloatingIcon {
  id: number;
  iconKey: keyof typeof DNAIcons;
  size: number;
  left: number;
  top: number;
  opacity: number;
  animationClass: string;
  rotation: number;
}

// Генерируем случайные позиции и параметры для иконок
const generateIcons = (count: number): FloatingIcon[] => {
  const animationClasses = [
    "animate-float-slow",
    "animate-float-medium",
    "animate-float-fast",
    "animate-drift-left",
    "animate-drift-right",
    "animate-bounce-subtle",
  ];

  return Array.from({ length: count }, (_, i) => {
    const iconKey = iconKeys[Math.floor(Math.random() * iconKeys.length)];
    return {
      id: i,
      iconKey,
      size: Math.random() * 20 + 15, // 15-35px
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: Math.random() * 0.08 + 0.02, // 0.02-0.1
      animationClass:
        animationClasses[Math.floor(Math.random() * animationClasses.length)],
      rotation: Math.random() * 360,
    };
  });
};

const DNABackground: React.FC<DNABackgroundProps> = ({ className = "" }) => {
  // Генерируем много иконок для насыщенного фона
  const icons = React.useMemo(() => generateIcons(300), []);

  return (
    <>
      <div
        className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
      >
        <div className="absolute inset-0">
          {icons.map((iconData) => (
            <div
              key={iconData.id}
              className={`absolute text-gray-800 ${iconData.animationClass}`}
              style={{
                left: `${iconData.left}%`,
                top: `${iconData.top}%`,
                width: `${iconData.size}px`,
                height: `${iconData.size}px`,
                opacity: iconData.opacity,
                transform: `rotate(${iconData.rotation}deg)`,
                animationDelay: `${Math.random() * 10}s`,
              }}
            >
              {DNAIcons[iconData.iconKey]}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default DNABackground;
