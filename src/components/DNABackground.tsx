import React from "react";

interface DNABackgroundProps {
  className?: string;
}

interface BackgroundIcon {
  id: number;
  x: number; // Случайная позиция X (0-100%)
  y: number; // Случайная позиция Y (0-100%)
  size: number; // Случайный размер (20-50px)
  initialRotation: number; // Случайный начальный угол (0-360°)
  opacity: number; // Случайная прозрачность (0.05-0.25)
  animationType: string; // Тип анимации движения
}

const DNABackground: React.FC<DNABackgroundProps> = ({ className = "" }) => {
  // Генерируем картинки один раз при загрузке с проверкой на пересечения
  const icons = React.useMemo((): BackgroundIcon[] => {
    const icons: BackgroundIcon[] = [];
    const minDistance = 8; // Минимальное расстояние между центрами картинок (в %)
    const movementTypes = [
      "float-gentle",
      "drift-horizontal",
      "drift-vertical",
      "sway-circular",
      "pulse-scale",
      "rotate-only",
    ];

    for (let i = 0; i < 120; i++) {
      let attempts = 0;
      let x: number, y: number;

      do {
        x = Math.random() * 100; // 0-100%
        y = Math.random() * 100; // 0-100%
        attempts++;

        // Если не можем найти свободное место за 50 попыток, размещаем где угодно
        if (attempts > 50) break;
      } while (
        icons.some((existingIcon) => {
          const distance = Math.sqrt(
            Math.pow(existingIcon.x - x, 2) + Math.pow(existingIcon.y - y, 2)
          );
          return distance < minDistance;
        })
      );

      icons.push({
        id: i,
        x,
        y,
        size: Math.random() * 30 + 20, // 20-50px
        initialRotation: Math.random() * 360, // 0-360°
        opacity: Math.random() * 0.2 + 0.4, // 0.05-0.25
        animationType:
          movementTypes[Math.floor(Math.random() * movementTypes.length)],
      });
    }

    return icons;
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      {/* Вращающиеся картинки */}
      <div className="absolute inset-0 overflow-hidden">
        {icons.map((icon) => (
          <div
            key={icon.id}
            className={`absolute animate-${icon.animationType}`}
            style={{
              left: `${icon.x}%`,
              top: `${icon.y}%`,
              width: `${icon.size}px`,
              height: `${icon.size}px`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            <img
              src="/bg/icons8-dna-96.png"
              alt=""
              className="w-full h-full animate-spin-continuous"
              style={
                {
                  "--initial-angle": `${icon.initialRotation}deg`,
                  "--base-opacity": `${icon.opacity}`,
                  opacity: icon.opacity,
                  filter: "grayscale(70%)",
                  animationDuration: "20s",
                  animationDelay: `${Math.random() * 2}s`, // Different delay for rotation
                } as React.CSSProperties & {
                  "--initial-angle": string;
                  "--base-opacity": string;
                }
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DNABackground;
