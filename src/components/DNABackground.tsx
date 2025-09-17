import React from "react";

import { DNAIcons } from "./DNAIcons";

interface DNABackgroundProps {
  className?: string;
}

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
