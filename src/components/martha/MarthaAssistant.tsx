// ============================================================
// Martha Assistant Widget — Character + Bubble combined
// ============================================================

import MarthaCharacter from './MarthaCharacter';
import MarthaChatBubble from './MarthaChatBubble';
import { useMarthaStore } from '../../store/useMarthaStore';
import type { MarthaPose } from '../../types';

interface MarthaAssistantProps {
  pose?: MarthaPose;
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBubble?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export default function MarthaAssistant({
  pose,
  message,
  size = 'md',
  showBubble = true,
  layout = 'horizontal',
  className = '',
}: MarthaAssistantProps) {
  const store = useMarthaStore();
  const activePose = pose ?? store.currentPose;
  const activeMessage = message ?? store.currentMessage;

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <MarthaCharacter pose={activePose} size={size} />
        {showBubble && <MarthaChatBubble message={activeMessage} />}
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <MarthaCharacter pose={activePose} size={size} />
      {showBubble && (
        <div className="flex-1 mb-4">
          <MarthaChatBubble message={activeMessage} />
        </div>
      )}
    </div>
  );
}
