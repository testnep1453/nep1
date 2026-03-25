import { useCountdown } from '../../hooks/useCountdown';

interface CircularCountdownProps {
  targetTime: number;
  onComplete?: () => void;
}

export const CircularCountdown = ({ targetTime, onComplete }: CircularCountdownProps) => {
  const timeRemaining = useCountdown(targetTime);

  if (timeRemaining.total <= 0 && onComplete) {
    setTimeout(onComplete, 100);
  }

  const getCircleProgress = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    return 100 - percentage;
  };

  const circles = [
    {
      label: 'GÜN',
      value: timeRemaining.days,
      max: 30,
      color: '#2b9956',
      gradient: 'from-[#2b9956] to-[#3dd56d]'
    },
    {
      label: 'SAAT',
      value: timeRemaining.hours,
      max: 24,
      color: '#d44d4e',
      gradient: 'from-[#d44d4e] to-[#ff6b6e]'
    },
    {
      label: 'DAKİKA',
      value: timeRemaining.minutes,
      max: 60,
      color: '#ff9f43',
      gradient: 'from-[#ff9f43] to-[#ffba69]'
    },
    {
      label: 'SANİYE',
      value: timeRemaining.seconds,
      max: 60,
      color: '#00cfe8',
      gradient: 'from-[#00cfe8] to-[#48e5ff]'
    }
  ];

  return (
    <div className="w-full">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8 uppercase tracking-wider">
        ⏰ SONRAKİ DERSE
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {circles.map((circle, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="relative w-28 h-28 md:w-32 md:h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke={circle.color}
                  strokeWidth="8"
                  strokeDasharray="339.292"
                  strokeDashoffset={getCircleProgress(circle.value, circle.max) * 3.39292}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 8px ${circle.color})`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-br ${circle.gradient} bg-clip-text text-transparent`}>
                  {String(circle.value).padStart(2, '0')}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm md:text-base font-bold text-white/70 uppercase tracking-wider">
              {circle.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
