import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Code2,
  FileText,
  Lock,
  Send,
  Shield,
  ShieldAlert,
  X,
  Zap,
} from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { MessageType, SecurityProfile } from '../../types';

interface MessageSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MessageSimulatorModal: React.FC<MessageSimulatorModalProps> = ({ isOpen, onClose }) => {
  const { devices, dispatchMessage, isSimulating } = useSimulatorStore();

  const [senderId, setSenderId] = useState<string>('');
  const [receiverId, setReceiverId] = useState<string>('');
  const [messageType, setMessageType] = useState<MessageType>('Sensor Reading');
  const [payload, setPayload] = useState<string>('temperature=42.5;pressure=101.3;unit=celsius');
  const [securityProfile, setSecurityProfile] = useState<SecurityProfile>('Authenticated Secure Communication');

  const [tamperMessage, setTamperMessage] = useState<boolean>(false);
  const [tamperSignature, setTamperSignature] = useState<boolean>(false);
  const [tamperTag, setTamperTag] = useState<boolean>(false);
  const [replayAttack, setReplayAttack] = useState<boolean>(false);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize senderId and receiverId with existing devices when modal opens or devices change
  useEffect(() => {
    if (!isOpen || devices.length === 0) return;

    let currentSender = senderId;
    if (!devices.some((d) => d.id === currentSender)) {
      currentSender = devices[0].id;
      setSenderId(currentSender);
    }

    if (!devices.some((d) => d.id === receiverId) || receiverId === currentSender) {
      const alt = devices.find((d) => d.id !== currentSender) || devices[0];
      setReceiverId(alt.id);
    }
  }, [isOpen, devices]);

  if (!isOpen) return null;

  const handleSenderChange = (newSender: string) => {
    setSenderId(newSender);
    if (receiverId === newSender && devices.length > 1) {
      const alt = devices.find((d) => d.id !== newSender);
      if (alt) setReceiverId(alt.id);
    }
  };

  const handleReceiverChange = (newReceiver: string) => {
    setReceiverId(newReceiver);
    if (senderId === newReceiver && devices.length > 1) {
      const alt = devices.find((d) => d.id !== newReceiver);
      if (alt) setSenderId(alt.id);
    }
  };

  const handleMessageTypeChange = (t: MessageType) => {
    setMessageType(t);
    switch (t) {
      case 'Sensor Reading': setPayload('temperature=42.5;pressure=101.3;unit=celsius'); break;
      case 'Device Status': setPayload('status=HEALTHY;cpu_load=14%;firmware=v2.4.1;uptime=86400s'); break;
      case 'Controller Command': setPayload('command=SET_VALVE;target=VALVE_A3;position=75%;override=false'); break;
      case 'Alarm Notification': setPayload('level=HIGH;code=ALM_TEMP_EXCEEDED;source=TANK_01;threshold=40.0;measured=42.5'); break;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (senderId === receiverId) {
      setValidationError('Source and destination devices must be different.');
      return;
    }
    if (!payload.trim()) {
      setValidationError('Payload cannot be empty.');
      return;
    }

    try {
      await dispatchMessage({
        sender_id: senderId,
        receiver_id: receiverId,
        message_type: messageType,
        payload: payload.trim(),
        security_profile: securityProfile,
        tamper_message: tamperMessage,
        tamper_signature: tamperSignature,
        tamper_tag: tamperTag,
        replay_attack: replayAttack,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to dispatch message.');
    }
  };

  const serializedPreview = JSON.stringify(
    {
      spec: 'ICS-SEC-SIM/1.0',
      timestamp: new Date().toISOString(),
      sender: senderId,
      receiver: receiverId,
      type: messageType,
      profile: securityProfile,
      tampering_flags: { tamper_payload: tamperMessage, tamper_signature: tamperSignature, tamper_tag: tamperTag, replay_attack: replayAttack },
      raw_payload: payload,
    },
    null, 2
  );

  const inputClass = "w-full px-3 py-1.5 border border-slate-700 rounded-lg text-xs bg-slate-900 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors font-mono";

  return (
    <div className="fixed inset-0 z-50 bg-[#060913]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b101f] rounded-2xl border border-slate-700/80 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#060913]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-inner">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight font-display">PACKET INJECTION GENERATOR</h2>
              <p className="text-[10px] text-slate-400 font-mono">Simulate encrypted industrial payload transmission & attack triggers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-mono">
          {validationError && (
            <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Device selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">Source Node (Sender)</label>
              <select value={senderId} onChange={(e) => handleSenderChange(e.target.value)} className={inputClass}>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.ip_address})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">Destination Node (Receiver)</label>
              <select value={receiverId} onChange={(e) => handleReceiverChange(e.target.value)} className={inputClass}>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.ip_address})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Message type & security */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Protocol Message Type</label>
              <select value={messageType} onChange={(e) => handleMessageTypeChange(e.target.value as MessageType)} className={inputClass}>
                <option value="Sensor Reading">Sensor Reading (Modbus)</option>
                <option value="Device Status">Device Status</option>
                <option value="Controller Command">Controller Command (CIP)</option>
                <option value="Alarm Notification">Alarm Notification</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cryptographic Profile</label>
              <select value={securityProfile} onChange={(e) => setSecurityProfile(e.target.value as SecurityProfile)} className={inputClass}>
                <option value="Authenticated Secure Communication">AES-256-GCM + RSA-PSS + SHA-256</option>
                <option value="Integrity Verified">SHA-256 Digest Only</option>
                <option value="Security Disabled">Plaintext (Insecure)</option>
              </select>
            </div>
          </div>

          {/* Payload */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Raw Payload Parameters</label>
            <textarea
              rows={2}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className={`${inputClass} resize-none font-mono text-cyan-300`}
              placeholder="key1=value1;key2=value2"
              required
            />
          </div>

          {/* Attack injection */}
          <div className="bg-[#12192c] border border-amber-500/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase font-display">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Adversarial Cyber Attack Injection</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Test AES-GCM tag verification, RSA-PSS signature authenticity, and replay detection filters by injecting intentional corruptions.
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
              {[
                { label: 'Tamper Ciphertext (MITM)', checked: tamperMessage, onChange: setTamperMessage },
                { label: 'Corrupt RSA-PSS Signature', checked: tamperSignature, onChange: setTamperSignature },
                { label: 'Corrupt AES-GCM Auth Tag', checked: tamperTag, onChange: setTamperTag },
                { label: 'Replay Stale Sequence ID', checked: replayAttack, onChange: setReplayAttack },
              ].map((atk) => (
                <label key={atk.label} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={atk.checked}
                    onChange={(e) => atk.onChange(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>{atk.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mb-1">
              <Code2 className="w-3 h-3 text-slate-400" />
              <span>Serialized Packet Envelope Preview</span>
            </label>
            <pre className="p-3 bg-[#060913] text-slate-300 rounded-xl border border-slate-800 font-mono text-[10px] overflow-x-auto max-h-24 leading-relaxed">
              {serializedPreview}
            </pre>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800/80 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Injecting…' : 'Inject & Transmit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
