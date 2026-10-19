import { useEffect, useState } from 'react';

const currencyFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const standardFormatter = new Intl.NumberFormat('en-IN');

const AnimatedCounter = ({ value = 0, duration = 1.2, isCurrency = false, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numValue = Number(value) || 0;
    let animationFrameId;

    if (numValue === 0) {
      animationFrameId = requestAnimationFrame(() => setDisplayValue(0));
      return () => cancelAnimationFrame(animationFrameId);
    }

    let start = 0;
    const end = numValue;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  const formatted = isCurrency
    ? currencyFormatter.format(displayValue)
    : standardFormatter.format(displayValue);

  return (
    <span className="font-extrabold tracking-tight">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
