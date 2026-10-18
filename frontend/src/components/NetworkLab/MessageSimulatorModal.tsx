import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  Send,
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

  const [tamperMessage, setTamperMessage] = useState<boolean>(false);
  const [tamperSignature, setTamperSignature] = useState<boolean>(false);
  const [tamperTag, setTamperTag] = useState<boolean>(false);
  const [replayAttack, setReplayAttack] = useState<boolean>(false);

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const inputClass = "w-full px-2.5 py-[6px] border border-stone-200 rounded-md text-[12px] bg-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Send className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-stone-800">Message Simulator</h2>
              <p className="text-[10px] text-stone-400">Configure and inject a packet into the simulation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {validationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200/60 text-rose-700 rounded-lg flex items-center gap-2 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Device selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Source Device</label>
              <select value={senderId} onChange={(e) => setSenderId(e.target.value)} className={inputClass}>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.ip_address})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Destination Device</label>
              <select value={receiverId} onChange={(e) => setReceiverId(e.target.value)} className={inputClass}>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.ip_address})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Message type & security */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Message Type</label>
              <select value={messageType} onChange={(e) => handleMessageTypeChange(e.target.value as MessageType)} className={inputClass}>
                <option value="Sensor Reading">Sensor Reading</option>
                <option value="Device Status">Device Status</option>
                <option value="Controller Command">Controller Command</option>
                <option value="Alarm Notification">Alarm Notification</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Security Profile</label>
              <select value={securityProfile} onChange={(e) => setSecurityProfile(e.target.value as SecurityProfile)} className={`${inputClass} font-medium`}>
                <option value="Authenticated Secure Communication">Full: AES-GCM + RSA-PSS + SHA-256</option>
                <option value="Integrity Verified">Integrity: SHA-256 Digest</option>
                <option value="Security Disabled">Disabled: Plaintext</option>
              </select>
            </div>
          </div>

          {/* Payload */}
          <div>
            <label className="block text-[11px] font-medium text-stone-600 mb-1">Payload</label>
            <textarea
              rows={2}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className={`${inputClass} font-mono resize-none`}
              placeholder="key1=value1;key2=value2"
              required
            />
          </div>

          {/* Attack injection */}
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Adversarial Attack Injection</span>
            </div>
            <p className="text-[10.5px] text-amber-700/80">
              Test cryptographic and RBAC defenses by injecting tampering scenarios.
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
              {[
                { label: 'Tamper Ciphertext', checked: tamperMessage, onChange: setTamperMessage },
                { label: 'Corrupt RSA-PSS Signature', checked: tamperSignature, onChange: setTamperSignature },
                { label: 'Corrupt AES-GCM Tag', checked: tamperTag, onChange: setTamperTag },
                { label: 'Replay Stale Message', checked: replayAttack, onChange: setReplayAttack },
              ].map((atk) => (
                <label key={atk.label} className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={atk.checked}
                    onChange={(e) => atk.onChange(e.target.checked)}
                    className="rounded border-stone-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                  />
                  <span className="text-stone-700 font-medium">{atk.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="flex items-center gap-1 text-[11px] font-medium text-stone-600 mb-1">
              <FileText className="w-3 h-3 text-stone-400" />
              Packet Specification Preview
            </label>
            <pre className="p-2.5 bg-stone-900 text-stone-400 rounded-lg font-mono text-[10px] overflow-x-auto max-h-24 leading-relaxed">
              {serializedPreview}
            </pre>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3.5 py-[6px] border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-md text-[11.5px] font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-4 py-[6px] bg-cyan-600 hover:bg-cyan-500 disabled:bg-stone-300 text-white rounded-md text-[11.5px] font-medium transition-colors"
            >
              <Send className="w-3 h-3" />
              {isSimulating ? 'Processing…' : 'Inject & Transmit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
