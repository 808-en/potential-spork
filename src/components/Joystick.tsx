import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { playSound } from '../utils/audio';

interface JoystickProps {
  onDirectionChange: (dir: { x: number; y: number } | null) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onDirectionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const maxDistance = 40; // Max radius in pixels for the joystick knob movement

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    playSound.click();
    updateKnob(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    updateKnob(clientX, clientY);
  };

  const handleEnd = () => {
    setIsDragging(false);
    setKnobPosition({ x: 0, y: 0 });
    onDirectionChange(null);
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rawDx = clientX - centerX;
    const rawDy = clientY - centerY;
    const distance = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
    
    let finalX = rawDx;
    let finalY = rawDy;
    
    if (distance > maxDistance) {
      finalX = (rawDx / distance) * maxDistance;
      finalY = (rawDy / distance) * maxDistance;
    }
    
    setKnobPosition({ x: finalX, y: finalY });
    
    // Normalized direction vector
    const normDistance = Math.sqrt(finalX * finalX + finalY * finalY);
    if (normDistance > 8) { // Deadzone of 8px
      const normX = finalX / maxDistance;
      const normY = finalY / maxDistance;
      
      // Determine dominant direction
      onDirectionChange({ x: normX, y: normY });
    } else {
      onDirectionChange(null);
    }
  };

  // Mouse listeners
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  // Touch listeners
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalTouchMove);
      window.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center">
      <div 
        id="joystick-container"
        ref={containerRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="relative w-28 h-28 rounded-full bg-slate-900/90 border-2 border-emerald-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
      >
        {/* Cardinal Markers */}
        <span className="absolute top-1 text-[10px] font-mono text-emerald-500/40 select-none">N</span>
        <span className="absolute bottom-1 text-[10px] font-mono text-emerald-500/40 select-none">S</span>
        <span className="absolute left-1.5 text-[10px] font-mono text-emerald-500/40 select-none">W</span>
        <span className="absolute right-1.5 text-[10px] font-mono text-emerald-500/40 select-none">E</span>
        
        {/* Inner Grid Ring */}
        <div className="absolute w-20 h-20 rounded-full border border-slate-800/80 pointer-events-none" />
        <div className="absolute w-12 h-12 rounded-full border border-slate-800/40 pointer-events-none" />
        
        {/* Joystick Handle Knob */}
        <motion.div
          id="joystick-knob"
          animate={{ x: knobPosition.x, y: knobPosition.y }}
          transition={isDragging ? { type: 'just' } : { type: 'spring', stiffness: 350, damping: 20 }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors duration-150 ${
            isDragging 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-300' 
              : 'bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 hover:border-emerald-500/50'
          }`}
        >
          {/* Inner glowing dot */}
          <div className={`w-3.5 h-3.5 rounded-full ${isDragging ? 'bg-white animate-pulse' : 'bg-emerald-500/40'}`} />
        </motion.div>
      </div>
      <span className="mt-2 text-[10px] font-mono tracking-wider text-slate-400 select-none uppercase">Virtual Joystick</span>
    </div>
  );
};
