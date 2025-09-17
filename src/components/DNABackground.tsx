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
}

const DNABackground: React.FC<DNABackgroundProps> = ({ className = "" }) => {
  // Генерируем картинки один раз при загрузке
  const icons = React.useMemo((): BackgroundIcon[] => {
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // 0-100%
      y: Math.random() * 100, // 0-100%
      size: Math.random() * 30 + 20, // 20-50px
      initialRotation: Math.random() * 360, // 0-360°
    }));
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      {/* Фоновый градиент */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        }}
      />

      {/* Вращающиеся картинки */}
      <div className="absolute inset-0 overflow-hidden">
        {icons.map((icon) => (
          <img
            key={icon.id}
            src="/bg/science_13933684.png"
            alt=""
            className="absolute animate-spin-continuous"
            style={
              {
                left: `${icon.x}%`,
                top: `${icon.y}%`,
                width: `${icon.size}px`,
                height: `${icon.size}px`,
                "--initial-angle": `${icon.initialRotation}deg`,
                opacity: 0.15,
                filter: "grayscale(70%)",
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: "20s",
              } as React.CSSProperties & { "--initial-angle": string }
            }
          />
        ))}
      </div>
    </div>
  );
};

export default DNABackground;
