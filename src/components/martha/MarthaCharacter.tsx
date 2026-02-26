// ============================================================
// Martha Character Component — SVG Renderer with Pose Switching
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import type { MarthaPose } from '../../types';

// Import all poses
import greetingSvg from '../../assets/martha/martha-greeting.svg';
import presentingSvg from '../../assets/martha/martha-presenting.svg';
import thinkingSvg from '../../assets/martha/martha-thinking.svg';
import celebratingSvg from '../../assets/martha/martha-celebrating.svg';
import clipboardSvg from '../../assets/martha/martha-clipboard.svg';
import warningSvg from '../../assets/martha/martha-warning.svg';
import thumbsupSvg from '../../assets/martha/martha-thumbsup.svg';

const POSE_MAP: Record<MarthaPose, string> = {
  greeting: greetingSvg,
  presenting: presentingSvg,
  thinking: thinkingSvg,
  celebrating: celebratingSvg,
  clipboard: clipboardSvg,
  warning: warningSvg,
  thumbsup: thumbsupSvg,
  pointing: presentingSvg,    // reuse presenting for now
  desk: clipboardSvg,         // reuse clipboard for now
  waving: greetingSvg,        // reuse greeting for now
};

interface MarthaCharacterProps {
  pose: MarthaPose;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-20 h-30',
  md: 'w-32 h-48',
  lg: 'w-44 h-64',
  xl: 'w-56 h-80',
};

export default function MarthaCharacter({
  pose,
  size = 'md',
  animate = true,
  className = '',
}: MarthaCharacterProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pose}
        className={`${SIZE_MAP[size]} ${className} relative`}
        initial={animate ? { opacity: 0, scale: 0.9, y: 10 } : false}
        animate={{
          opacity: 1,
          scale: 1,
          y: animate ? [0, -4, 0] : 0,
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.4,
          y: animate
            ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            : undefined,
        }}
      >
        <img
          src={POSE_MAP[pose]}
          alt={`Martha - ${pose}`}
          className="w-full h-full object-contain drop-shadow-lg"
          draggable={false}
        />
      </motion.div>
    </AnimatePresence>
  );
}
