import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FileText,
  Lock,
  Send,
  Shield,
  X,
} from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { MessageType, SecurityProfile } from '../../types';

interface MessageSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MessageSimulatorModal: React.FC<MessageSimulatorModalProps> = ({ isOpen, onClose }) => {
  const { devices, dispatchMessage, isSimulating } = useSimulatorStore();

  const [senderId, setSenderId] = useState<string>('Sensor-01');
  const [receiverId, setReceiverId] = useState<string>('SCADA-Server');
  const [messageType, setMessageType] = useState<MessageType>('Sensor Reading');
  const [payload, setPayload] = useState<string>('temperature=42.5;pressure=101.3;unit=celsius');
  const [securityProfile, setSecurityProfile] = useState<SecurityProfile>('Authenticated Secure Communication');

  // Adversarial switches
  const [tamperMessage, setTamperMessage] = useState<boolean>(false);
  const [tamperSignature, setTamperSignature] = useState<boolean>(false);
  const [tamperTag, setTamperTag] = useState<boolean>(false);
  const [replayAttack, setReplayAttack] = useState<boolean>(false);

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-fill example payloads when message type changes
  const handleMessageTypeChange = (t: MessageType) => {
    setMessageType(t);
    switch (t) {
      case 'Sensor Reading':
        setPayload('temperature=42.5;pressure=101.3;unit=celsius');
        break;
      case 'Device Status':
        setPayload('status=HEALTHY;cpu_load=14%;firmware=v2.4.1;uptime=86400s');
        break;
      case 'Controller Command':
        setPayload('command=SET_VALVE;target=VALVE_A3;position=75%;override=false');
        break;
      case 'Alarm Notification':
        setPayload('level=HIGH;code=ALM_TEMP_EXCEEDED;source=TANK_01;threshold=40.0;measured=42.5');
        break;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (senderId === receiverId) {
      setValidationError('Sender and receiver must be different devices.');
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

  // Preview serialized packet envelope
  const serializedPreview = JSON.stringify(
    {
      spec: 'ICS-SEC-SIM/1.0',
      timestamp: new Date().toISOString(),
      sender: senderId,
      receiver: receiverId,
      type: messageType,
      profile: securityProfile,
      tampering_flags: {
        tamper_payload: tamperMessage,
        tamper_signature: tamperSignature,
        tamper_tag: tamperTag,
        replay_attack: replayAttack,
      },
      raw_payload: payload,
    },
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-800">Industrial Message Simulator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSend} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Device Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Source / Sender Device</label>
              <select
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ip_address} - {d.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Destination / Receiver Device</label>
              <select
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ip_address} - {d.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message Type & Security Profile */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Message Type</label>
              <select
                value={messageType}
                onChange={(e) => handleMessageTypeChange(e.target.value as MessageType)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="Sensor Reading">Sensor Reading</option>
                <option value="Device Status">Device Status</option>
                <option value="Controller Command">Controller Command</option>
                <option value="Alarm Notification">Alarm Notification</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Security Profile</label>
              <select
                value={securityProfile}
                onChange={(e) => setSecurityProfile(e.target.value as SecurityProfile)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="Authenticated Secure Communication">
                  Authenticated Secure Communication (AES-GCM + RSA-PSS + SHA-256)
                </option>
                <option value="Integrity Verified">Integrity Verified (SHA-256 Digest)</option>
                <option value="Security Disabled">Security Disabled (Plaintext Baseline)</option>
              </select>
            </div>
          </div>

          {/* Payload */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Message Payload (Structured Key-Values)</label>
            <textarea
              rows={2}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500"
              placeholder="key1=value1;key2=value2"
              required
            />
          </div>

          {/* Adversarial In-Transit Attack Injection Switches */}
          <div className="bg-amber-50/70 border border-amber-200 rounded p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Adversarial Cyber Attack Injection (Educational Testing)</span>
            </div>
            <p className="text-[11px] text-amber-700">
              Select an adversarial violation to test the cryptographic and RBAC defenses on the industrial gateway and receivers.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tamperMessage}
                  onChange={(e) => setTamperMessage(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-800 font-medium">Tamper Ciphertext / Digest</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tamperSignature}
                  onChange={(e) => setTamperSignature(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-800 font-medium">Corrupt RSA-PSS Signature</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tamperTag}
                  onChange={(e) => setTamperTag(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-800 font-medium">Corrupt AES-GCM Tag (MAC)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replayAttack}
                  onChange={(e) => setReplayAttack(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-800 font-medium">Replay Stale Message ID</span>
              </label>
            </div>
          </div>

          {/* Serialized Envelope Preview */}
          <div>
            <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Canonical Packet Specification Preview</span>
            </label>
            <pre className="p-2 bg-slate-900 text-slate-300 rounded font-mono text-[10px] overflow-x-auto max-h-28 leading-tight">
              {serializedPreview}
            </pre>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded text-xs font-medium shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Processing Simulation...' : 'Inject & Transmit Packet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
