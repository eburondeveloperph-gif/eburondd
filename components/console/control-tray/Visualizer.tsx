import React from 'react';
import cn from 'classnames';

export const Visualizer = ({ isSpeaking }: { isSpeaking: boolean }) => {
  return (
    <div className={cn('flex items-center gap-0.5', { 'opacity-100': isSpeaking, 'opacity-0': !isSpeaking })}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn('w-1 bg-current rounded-full animate-pulse', {
            'h-3': i === 1,
            'h-5': i === 2,
            'h-3': i === 3,
          })}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
};
