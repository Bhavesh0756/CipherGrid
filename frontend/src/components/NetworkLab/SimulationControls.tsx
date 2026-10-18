import React from 'react';
import {
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Send,
  SkipForward,
  Square,
  XCircle,
} from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export const SimulationControls: React.FC = () => {
  const {
    activeSessionId,
    activeMessageId,
    simulationEvents,
    currentStepIndex,
    playbackState,
    playbackSpeed,
    playSimulation,
    pauseSimulation,
    stepSimulationForward,
    stopSimulation,
    resetSimulationState,
    setPlaybackSpeed,
    lastResult,
    setMessageModalOpen,
  } = useSimulatorStore();

  const totalEvents = simulationEvents.length;
  const currentEvent = simulationEvents[currentStepIndex];

  const getStatusBadge = () => {
    if (!lastResult) return null;
    if (lastResult.delivered) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <CheckCircle2 className="w-3 h-3" />
          Delivered
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  };

  const ControlButton = ({ onClick, disabled, title, children }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="h-12 bg-white border-t border-stone-200/80 px-4 flex items-center justify-between text-xs select-none shrink-0">
      {/* Left: Session info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMessageModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-[5px] bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-[11px] font-medium transition-colors shrink-0"
        >
          <Send className="w-3 h-3" />
          <span>Simulate</span>
        </button>

        {activeSessionId ? (
          <div className="flex items-center gap-3 border-l border-stone-200 pl-3 min-w-0 text-[10.5px]">
            <span className="text-stone-400 font-mono truncate max-w-[140px]">
              {activeSessionId.slice(0, 12)}…
            </span>
            {getStatusBadge()}
          </div>
        ) : (
          <span className="text-stone-400 text-[11px] border-l border-stone-200 pl-3 italic">
            No active session
          </span>
        )}
      </div>

      {/* Center: Playback controls */}
      <div className="flex items-center gap-1">
        <ControlButton onClick={playSimulation} disabled={playbackState === 'playing' || totalEvents === 0} title="Play">
          <Play className="w-3.5 h-3.5 fill-current" />
        </ControlButton>
        <ControlButton onClick={pauseSimulation} disabled={playbackState !== 'playing'} title="Pause">
          <Pause className="w-3.5 h-3.5" />
        </ControlButton>
        <ControlButton onClick={stepSimulationForward} disabled={totalEvents === 0 || currentStepIndex >= totalEvents - 1} title="Step Forward">
          <SkipForward className="w-3.5 h-3.5" />
        </ControlButton>
        <ControlButton onClick={stopSimulation} disabled={playbackState === 'idle' || totalEvents === 0} title="Stop">
          <Square className="w-3.5 h-3.5" />
        </ControlButton>
        <ControlButton onClick={resetSimulationState} disabled={totalEvents === 0} title="Clear">
          <RotateCcw className="w-3.5 h-3.5" />
        </ControlButton>

        {/* Speed */}
        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-stone-200">
          <Clock className="w-3 h-3 text-stone-400" />
          {[0.5, 1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-1.5 py-[2px] rounded text-[9.5px] font-mono font-medium transition-colors ${
                playbackSpeed === spd
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>
      </div>

      {/* Right: Step counter */}
      <div className="text-right min-w-[120px]">
        {totalEvents > 0 && currentEvent ? (
          <div>
            <div className="text-[10.5px] font-medium text-stone-700">
              <span className="font-mono text-cyan-600">{currentEvent.current_hop}</span>
              <span className="text-stone-400 mx-1">·</span>
              <span className="text-stone-500">{currentEvent.packet_state}</span>
            </div>
            <div className="text-[9.5px] text-stone-400 font-mono">
              {currentStepIndex + 1}/{totalEvents}
            </div>
          </div>
        ) : (
          <span className="text-[10.5px] text-stone-400">Idle</span>
        )}
      </div>
    </div>
  );
};
