import React from 'react';
import {
  CheckCircle2,
  Clock,
  FastForward,
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Delivered</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-800">
        <XCircle className="w-3.5 h-3.5" />
        <span>Rejected / Failed</span>
      </span>
    );
  };

  return (
    <div className="h-14 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-xs select-none">
      {/* Left: Active Session & Status Info */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={() => setMessageModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-xs transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Simulate Message</span>
        </button>

        {activeSessionId ? (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 min-w-0">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Session:</span>{' '}
              <span className="font-mono text-[11px] text-slate-700 font-medium">{activeSessionId.slice(0, 15)}...</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Msg ID:</span>{' '}
              <span className="font-mono text-[11px] text-slate-700 font-medium">{activeMessageId || 'N/A'}</span>
            </div>
            {getStatusBadge()}
          </div>
        ) : (
          <div className="text-slate-400 italic text-[11px] border-l border-slate-200 pl-4">
            No active simulation session. Click 'Simulate Message' to start.
          </div>
        )}
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={playSimulation}
          disabled={playbackState === 'playing' || totalEvents === 0}
          className="p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Play Simulation"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>

        <button
          onClick={pauseSimulation}
          disabled={playbackState !== 'playing'}
          className="p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Pause Simulation"
        >
          <Pause className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={stepSimulationForward}
          disabled={totalEvents === 0 || currentStepIndex >= totalEvents - 1}
          className="p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Step Forward"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={stopSimulation}
          disabled={playbackState === 'idle' || totalEvents === 0}
          className="p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Stop Simulation"
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={resetSimulationState}
          disabled={totalEvents === 0}
          className="p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Clear Simulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-3">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-[11px] text-slate-500 font-medium">Speed:</span>
          {[0.5, 1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                playbackSpeed === spd
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Right: Step Counter and Hop details */}
      <div className="flex items-center gap-3">
        {totalEvents > 0 && currentEvent ? (
          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-700">
              Hop: <span className="font-mono text-blue-600">{currentEvent.current_hop}</span> ({currentEvent.packet_state})
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Step {currentStepIndex + 1} of {totalEvents}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400">Idle</div>
        )}
      </div>
    </div>
  );
};
