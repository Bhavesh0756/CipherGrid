import { create } from 'zustand';
/**
 * Global Simulator State Store (Zustand)
 * Manages active devices, network topologies, simulation speed, real-time message queues, and user interface modes.
 */
import { api } from '../services/api';
import type {
  AuditLog,
  Connection,
  DashboardStats,
  Device,
  DeviceType,
  LabReport,
  PurdueLevel,
  SecurityScenarioResult,
  SimulationEvent,
} from '../types';

/** Navigation section identifiers for primary OT simulation workspace views */
export type SectionType =
  | 'network-lab'
  | 'device-inventory'
  | 'packet-inspector'
  | 'security-center'
  | 'event-logs'
  | 'lab-reports'
  | 'dashboard'
  | 'settings';

interface SimulatorStore {
  // Navigation & Presentation
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
  showIntroAnimation: boolean;
  setShowIntroAnimation: (show: boolean) => void;
  triggerIntroAnimation: () => void;

  // Topology & Devices
  devices: Device[];
  connections: Connection[];
  selectedDevice: Device | null;
  isLoading: boolean;
  error: string | null;

  // Actions on Topology
  fetchTopology: () => Promise<void>;
  setSelectedDevice: (device: Device | null) => void;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  createDevice: (device: Partial<Device>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  saveTopology: () => Promise<void>;
  resetTopology: () => Promise<void>;
  setDevicePosition: (id: string, x: number, y: number) => void;
  addConnection: (conn: { source: string; target: string }) => void;
  deleteConnection: (id: string) => void;

  // Simulation & Playback State
  isSimulating: boolean;
  activeSessionId: string | null;
  activeMessageId: string | null;
  simulationEvents: SimulationEvent[];
  selectedEvent: SimulationEvent | null;
  lastResult: any | null;

  playbackState: 'idle' | 'playing' | 'paused' | 'finished';
  playbackSpeed: number;
  currentStepIndex: number;
  highlightedPath: string[];
  activeHopId: string | null;

  // Simulation actions
  dispatchMessage: (params: {
    sender_id: string;
    receiver_id: string;
    message_type: string;
    payload: string;
    security_profile: string;
    tamper_message?: boolean;
    tamper_signature?: boolean;
    tamper_tag?: boolean;
    replay_attack?: boolean;
  }) => Promise<any>;

  setPlaybackSpeed: (speed: number) => void;
  playSimulation: () => void;
  pauseSimulation: () => void;
  stepSimulationForward: () => void;
  stopSimulation: () => void;
  resetSimulationState: () => void;
  setSelectedEvent: (event: SimulationEvent | null) => void;

  // Modals
  isMessageModalOpen: boolean;
  setMessageModalOpen: (open: boolean) => void;

  // Security Scenarios
  scenarioResults: SecurityScenarioResult[];
  selectedScenario: SecurityScenarioResult | null;
  isRunningScenarios: boolean;
  runScenario: (scenarioId: string) => Promise<void>;
  runAllScenarios: () => Promise<void>;
  setSelectedScenario: (sc: SecurityScenarioResult | null) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  fetchAuditLogs: () => Promise<void>;

  // Dashboard Stats
  dashboardStats: DashboardStats | null;
  fetchDashboardStats: () => Promise<void>;

  // Lab Report
  labReport: LabReport | null;
  fetchLabReport: () => Promise<void>;
}

const derivePurdueLevel = (type: string): PurdueLevel => {
  switch (type) {
    case 'Sensor':
      return 'Level 0';
    case 'PLC':
      return 'Level 1';
    case 'SCADA Server':
    case 'Operator Workstation':
      return 'Level 2';
    case 'Industrial Gateway':
    case 'Monitoring Server':
    case 'Router':
      return 'Level 3';
    case 'Untrusted Device':
      return 'Untrusted';
    default:
      return 'Level 1';
  }
};

export const useSimulatorStore = create<SimulatorStore>((set, get) => {
  let playbackInterval: any = null;

  const clearTimer = () => {
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
  };

  return {
    activeSection: 'network-lab',
    setActiveSection: (section) => set({ activeSection: section }),
    showIntroAnimation: true,
    setShowIntroAnimation: (show) => set({ showIntroAnimation: show }),
    triggerIntroAnimation: () => set({ showIntroAnimation: true }),

    devices: [],
    connections: [],
    selectedDevice: null,
    isLoading: false,
    error: null,

    fetchTopology: async () => {
      set({ isLoading: true, error: null });
      try {
        const [devsRes, connsRes] = await Promise.all([
          api.getDevices(),
          api.getConnections(),
        ]);

        const mappedDevices: Device[] = (devsRes.devices || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          device_type: (d.type || 'Sensor') as DeviceType,
          ip_address: d.ip_address,
          mac_address: d.mac_address || '00:00:00:00:00:00',
          role: d.role,
          trust_status: d.trust_status || 'Trusted',
          purdue_level: derivePurdueLevel(d.type),
          is_enabled: Boolean(d.enabled),
          allowed_actions: Array.isArray(d.allowed_actions) ? d.allowed_actions : [],
          public_key_pem: d.public_key_pem,
          position_x: Number(d.x_pos ?? 100),
          position_y: Number(d.y_pos ?? 100),
        }));

        const mappedConnections: Connection[] = (connsRes.connections || []).map((c: any) => ({
          id: c.id,
          source_id: c.source_id,
          target_id: c.target_id,
          source_port: c.source_port || 'eth0',
          target_port: c.target_port || 'eth0',
          connection_type: c.link_type || 'Ethernet',
          is_active: c.status === 'Active',
          latency_ms: Number(c.latency_ms || 2.0),
        }));

        set({
          devices: mappedDevices,
          connections: mappedConnections,
          isLoading: false,
        });
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    },

    setSelectedDevice: (device) => set({ selectedDevice: device }),

    updateDevice: async (id, updates) => {
      try {
        const payload: any = { ...updates };
        if (updates.device_type) payload.type = updates.device_type;
        if (typeof updates.is_enabled === 'boolean') payload.enabled = updates.is_enabled;

        await api.updateDevice(id, payload);
        const currentDevices = get().devices.map((d) =>
          d.id === id ? { ...d, ...updates } : d
        );
        const updatedDev = currentDevices.find((d) => d.id === id) || null;
        set({
          devices: currentDevices,
          selectedDevice: get().selectedDevice?.id === id ? updatedDev : get().selectedDevice,
        });
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    createDevice: async (newDev) => {
      try {
        await api.createDevice({
          id: newDev.id,
          name: newDev.name,
          type: newDev.device_type,
          ip_address: newDev.ip_address,
          mac_address: newDev.mac_address,
          role: newDev.role,
          trust_status: newDev.trust_status,
          enabled: newDev.is_enabled,
          allowed_actions: newDev.allowed_actions,
          x_pos: newDev.position_x,
          y_pos: newDev.position_y,
        });
        await get().fetchTopology();
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    deleteDevice: async (id) => {
      try {
        await api.deleteDevice(id);
        set((state) => ({
          devices: state.devices.filter((d) => d.id !== id),
          connections: state.connections.filter(
            (c) => c.source_id !== id && c.target_id !== id
          ),
          selectedDevice: state.selectedDevice?.id === id ? null : state.selectedDevice,
        }));
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    setDevicePosition: (id, x, y) => {
      set((state) => ({
        devices: state.devices.map((d) =>
          d.id === id ? { ...d, position_x: x, position_y: y } : d
        ),
      }));
    },

    addConnection: (conn) => {
      const exists = get().connections.some(
        (c) =>
          (c.source_id === conn.source && c.target_id === conn.target) ||
          (c.source_id === conn.target && c.target_id === conn.source)
      );
      if (exists) return;

      const newConn: Connection = {
        id: `conn-${Date.now()}`,
        source_id: conn.source,
        target_id: conn.target,
        source_port: 'eth0',
        target_port: 'eth0',
        connection_type: 'Ethernet',
        is_active: true,
        latency_ms: 2.0,
      };

      set((state) => ({
        connections: [...state.connections, newConn],
      }));
    },

    deleteConnection: (id) => {
      set((state) => ({
        connections: state.connections.filter((c) => c.id !== id),
      }));
    },

    saveTopology: async () => {
      set({ isLoading: true, error: null });
      try {
        const { devices, connections } = get();
        const nodes = devices.map((d) => ({
          id: d.id,
          type: 'customDevice',
          position: { x: d.position_x, y: d.position_y },
          data: {
            id: d.id,
            name: d.name,
            type: d.device_type,
            ip_address: d.ip_address,
            role: d.role,
            trust_status: d.trust_status,
            enabled: d.is_enabled,
          },
        }));

        const edges = connections.map((c) => ({
          id: c.id,
          source: c.source_id,
          target: c.target_id,
          data: {
            latency_ms: c.latency_ms,
            link_type: c.connection_type,
            status: c.is_active ? 'Active' : 'Disabled',
          },
        }));

        await api.saveTopology({
          name: 'Active Industrial Topology',
          nodes,
          edges,
        });
        set({ isLoading: false });
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    },

    resetTopology: async () => {
      set({ isLoading: true, error: null });
      try {
        await api.resetTopology();
        await get().fetchTopology();
        get().resetSimulationState();
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    },

    // Simulation state
    isSimulating: false,
    activeSessionId: null,
    activeMessageId: null,
    simulationEvents: [],
    selectedEvent: null,
    lastResult: null,

    playbackState: 'idle',
    playbackSpeed: 1,
    currentStepIndex: 0,
    highlightedPath: [],
    activeHopId: null,

    dispatchMessage: async (params) => {
      clearTimer();
      set({ isSimulating: true, error: null });
      try {
        let scenarioId = 'normal';
        if (params.tamper_message) scenarioId = 'tampering';
        else if (params.tamper_signature) scenarioId = 'bad_signature';
        else if (params.tamper_tag) scenarioId = 'bad_auth_tag';
        else if (params.replay_attack) scenarioId = 'replay_attempt';

        const result = await api.simulateMessage({
          sender_id: params.sender_id,
          receiver_id: params.receiver_id,
          message_type: params.message_type,
          payload: params.payload,
          security_profile: params.security_profile,
          scenario_id: scenarioId,
        });

        const mappedEvents: SimulationEvent[] = (result.events || []).map((ev: any) => ({
          id: String(ev.id),
          session_id: ev.session_id,
          message_id: ev.message_id,
          event_time: ev.timestamp || new Date().toISOString(),
          source_id: ev.source_device || params.sender_id,
          destination_id: ev.destination_device || params.receiver_id,
          current_hop: ev.current_hop,
          message_type: params.message_type as any,
          packet_state: ev.packet_state,
          security_status: ev.security_status,
          details: ev.wire_details || ev.details || {},
          explanation: ev.explanation || '',
        }));

        set({
          isSimulating: false,
          activeSessionId: result.session_id,
          activeMessageId: result.message_id,
          simulationEvents: mappedEvents,
          selectedEvent: mappedEvents[0] || null,
          highlightedPath: result.path || [],
          lastResult: result,
          currentStepIndex: 0,
          playbackState: 'playing',
          activeHopId: result.path?.[0] || null,
        });

        get().playSimulation();
        return result;
      } catch (err: any) {
        set({ isSimulating: false, error: err.message });
        throw err;
      }
    },

    setPlaybackSpeed: (speed) => {
      set({ playbackSpeed: speed });
      if (get().playbackState === 'playing') {
        get().playSimulation();
      }
    },

    playSimulation: () => {
      clearTimer();
      const events = get().simulationEvents;
      if (!events || events.length === 0) {
        set({ playbackState: 'finished' });
        return;
      }

      set({ playbackState: 'playing' });
      const speed = get().playbackSpeed;
      const intervalMs = Math.max(300, 1200 / speed);

      playbackInterval = setInterval(() => {
        const currentIndex = get().currentStepIndex;
        if (currentIndex < events.length - 1) {
          const nextIndex = currentIndex + 1;
          const currentEv = events[nextIndex];
          set({
            currentStepIndex: nextIndex,
            selectedEvent: currentEv,
            activeHopId: currentEv.current_hop,
          });
        } else {
          clearTimer();
          set({ playbackState: 'finished' });
        }
      }, intervalMs);
    },

    pauseSimulation: () => {
      clearTimer();
      set({ playbackState: 'paused' });
    },

    stepSimulationForward: () => {
      clearTimer();
      const events = get().simulationEvents;
      const currentIndex = get().currentStepIndex;
      if (currentIndex < events.length - 1) {
        const nextIndex = currentIndex + 1;
        const currentEv = events[nextIndex];
        set({
          currentStepIndex: nextIndex,
          selectedEvent: currentEv,
          activeHopId: currentEv.current_hop,
          playbackState: nextIndex === events.length - 1 ? 'finished' : 'paused',
        });
      }
    },

    stopSimulation: () => {
      clearTimer();
      set({
        playbackState: 'finished',
        currentStepIndex: get().simulationEvents.length - 1,
      });
    },

    resetSimulationState: () => {
      clearTimer();
      set({
        activeSessionId: null,
        activeMessageId: null,
        simulationEvents: [],
        selectedEvent: null,
        lastResult: null,
        playbackState: 'idle',
        currentStepIndex: 0,
        highlightedPath: [],
        activeHopId: null,
      });
    },

    setSelectedEvent: (event) => set({ selectedEvent: event }),

    // Modals
    isMessageModalOpen: false,
    setMessageModalOpen: (open) => set({ isMessageModalOpen: open }),

    // Security Scenarios
    scenarioResults: [],
    selectedScenario: null,
    isRunningScenarios: false,

    runScenario: async (scenarioId) => {
      set({ isRunningScenarios: true, error: null });
      try {
        const res = await api.runSecurityScenario(scenarioId);
        const mappedResult: SecurityScenarioResult = {
          scenario_id: res.result.scenario_id,
          name: res.result.scenario_name,
          objective: res.result.test_objective,
          expected_outcome: res.result.expected_result,
          actual_outcome: res.result.actual_result,
          pass_status: res.result.pass_fail === 'PASS',
          reason: res.result.reason,
          checks_executed: res.result.checks_executed || [],
          session_id: res.result.session_id,
          message_id: res.result.message_id,
        };

        set((state) => {
          const existing = state.scenarioResults.filter(
            (s) => s.scenario_id !== scenarioId
          );
          return {
            scenarioResults: [...existing, mappedResult],
            selectedScenario: mappedResult,
            isRunningScenarios: false,
          };
        });
      } catch (err: any) {
        set({ error: err.message, isRunningScenarios: false });
      }
    },

    runAllScenarios: async () => {
      set({ isRunningScenarios: true, error: null });
      const scenarioIds = [
        'normal',
        'tampering',
        'bad_signature',
        'unauthorized_device',
        'replay_attempt',
        'bad_auth_tag',
        'missing_path',
        'disabled_destination',
        'recovery',
      ];

      const results: SecurityScenarioResult[] = [];
      try {
        for (const id of scenarioIds) {
          const res = await api.runSecurityScenario(id);
          results.push({
            scenario_id: res.result.scenario_id,
            name: res.result.scenario_name,
            objective: res.result.test_objective,
            expected_outcome: res.result.expected_result,
            actual_outcome: res.result.actual_result,
            pass_status: res.result.pass_fail === 'PASS',
            reason: res.result.reason,
            checks_executed: res.result.checks_executed || [],
            session_id: res.result.session_id,
            message_id: res.result.message_id,
          });
        }

        set({
          scenarioResults: results,
          selectedScenario: results[0] || null,
          isRunningScenarios: false,
        });
      } catch (err: any) {
        set({ error: err.message, isRunningScenarios: false });
      }
    },

    setSelectedScenario: (sc) => set({ selectedScenario: sc }),

    // Audit logs
    auditLogs: [],
    fetchAuditLogs: async () => {
      try {
        const res = await api.getAuditLogs({ limit: 100 });
        const mapped = (res.logs || []).map((l: any) => ({
          id: l.id,
          timestamp: l.timestamp,
          session_id: l.session_id || 'N/A',
          event_type: l.event_type,
          source_id: l.source_device,
          destination_id: l.destination_device || 'BROADCAST',
          security_result: l.security_result,
          status: (l.decision === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED') as any,
          rejection_reason: l.rejection_reason,
          details: l.details || {},
        }));
        set({ auditLogs: mapped });
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    // Dashboard stats
    dashboardStats: null,
    fetchDashboardStats: async () => {
      try {
        const stats = await api.getDashboardStats();
        set({
          dashboardStats: {
            total_devices: stats.total_devices,
            total_sessions: stats.total_sessions,
            messages_delivered: stats.messages_delivered,
            messages_rejected: stats.messages_rejected,
            pass_rate: stats.security_pass_rate_pct,
            security_events: (stats.recent_events || []).map((ev: any) => ({
              id: ev.id,
              timestamp: ev.timestamp,
              session_id: ev.session_id || 'N/A',
              event_type: ev.event_type,
              source_id: ev.source_device,
              destination_id: ev.destination_device || 'N/A',
              security_result: ev.security_result,
              status: ev.decision === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED',
              rejection_reason: ev.rejection_reason,
            })),
            devices_summary: {
              trusted: stats.trusted_devices,
              untrusted: stats.total_devices - stats.trusted_devices,
              quarantined: 0,
              online: stats.total_devices,
              offline: 0,
            },
          },
        });
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    // Lab Report
    labReport: null,
    fetchLabReport: async () => {
      try {
        const res = await api.getLabReport();
        const r = res.report;
        const mappedReport: LabReport = {
          title: r.title,
          generated_at: r.generated_at,
          topology_summary: {
            total_devices: r.topology_summary.total_nodes,
            total_connections: r.topology_summary.total_links,
            devices: (r.topology_summary.devices || []).map((d: any) => ({
              id: d.id,
              name: d.name,
              type: d.type,
              ip: d.ip_address,
              role: d.role,
            })),
          },
          scenarios: (r.scenario_evaluations || []).map((sc: any) => ({
            scenario_id: sc.scenario_id,
            name: sc.scenario_name,
            objective: sc.test_objective,
            expected_outcome: sc.expected_result,
            actual_outcome: sc.actual_result,
            pass_status: sc.pass_fail === 'PASS',
            reason: sc.reason,
            checks_executed: sc.checks_executed || [],
          })),
          security_summary: {
            total_tests: (r.scenario_evaluations || []).length,
            passed: (r.scenario_evaluations || []).filter((s: any) => s.pass_fail === 'PASS').length,
            failed: (r.scenario_evaluations || []).filter((s: any) => s.pass_fail !== 'PASS').length,
            pass_rate:
              (r.scenario_evaluations || []).length > 0
                ? Math.round(
                    ((r.scenario_evaluations || []).filter((s: any) => s.pass_fail === 'PASS').length /
                      (r.scenario_evaluations || []).length) *
                      100
                  )
                : 100,
          },
          conclusion: r.conclusion,
        };

        set({ labReport: mappedReport });
      } catch (err: any) {
        set({ error: err.message });
      }
    },
  };
});
