import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Key, 
  Hash, 
  FileCheck, 
  ShieldAlert, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Sliders,
  Shield,
  Layers,
  FileCode,
  Info
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { api } from '../services/api';

export const CryptographyLab = () => {
  const [activeTab, setActiveTab] = useState('aes');

  // --- Sub-module states ---

  // 1. Classical
  const [caesarInput, setCaesarInput] = useState('CRITICAL_TURBINE_VALVE_PRESSURE_ALERT');
  const [caesarShift, setCaesarShift] = useState(3);
  const [caesarResult, setCaesarResult] = useState(null);

  const [transInput, setTransInput] = useState('EMERGENCY_SHUTDOWN_LOOP_INITIATED');
  const [transKey, setTransKey] = useState('CIPHER');
  const [transResult, setTransResult] = useState(null);

  // 2. AES-GCM
  const [aesInput, setAesInput] = useState('SUBSTATION_4: FREQUENCY=60.02Hz, VOLTAGE=138.4kV, BREAKER=CLOSED');
  const [aesAad, setAesAad] = useState('device_id=RTU-SUBSTATION-4;seq=2048');
  const [aesEncResult, setAesEncResult] = useState(null);
  const [tamperCt, setTamperCt] = useState('');
  const [tamperNonce, setTamperNonce] = useState('');
  const [tamperAad, setTamperAad] = useState('');
  const [aesDecResult, setAesDecResult] = useState(null);
  const [isAesLoading, setIsAesLoading] = useState(false);

  // 3. RSA & Hybrid
  const [rsaKeyData, setRsaKeyData] = useState(null);
  const [hybridInput, setHybridInput] = useState('CONFIDENTIAL_SCADA_SECRET_COMMAND: ROTATE_TURBINE_SPEED_4000_RPM');
  const [hybridEncResult, setHybridEncResult] = useState(null);
  const [hybridDecResult, setHybridDecResult] = useState(null);
  const [isRsaLoading, setIsRsaLoading] = useState(false);

  // 4. SHA-256 Hashing
  const [hashInput, setHashInput] = useState('TURBINE_BEARING_STATUS_NORMAL');
  const [hashResult, setHashResult] = useState(null);
  const [compareA, setCompareA] = useState('VALVE_OPEN_COMMAND_PORT_8080');
  const [compareB, setCompareB] = useState('VALVE_OPEN_COMMAND_PORT_8081');
  const [compareResult, setCompareResult] = useState(null);

  // 5. RSA-PSS Signatures
  const [sigInput, setSigInput] = useState('AUTHORIZE_SCHEDULED_TURBINE_MAINTENANCE_WINDOW_OCTOBER');
  const [sigResult, setSigResult] = useState(null);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifySig, setVerifySig] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  // 6. X.509 Certificates
  const [certData, setCertData] = useState(null);
  const [validateHost, setValidateHost] = useState('localhost');
  const [certValidation, setCertValidation] = useState(null);
  const [isCertLoading, setIsCertLoading] = useState(false);

  // Initial load
  useEffect(() => {
    // Preload RSA public key & X.509 cert
    api.getRsaPublicKey().then(r => r.ok && setRsaKeyData(r.data));
    api.inspectCertificate().then(r => r.ok && setCertData(r.data));
  }, []);

  // --- Handlers ---

  const handleCaesarEncrypt = async () => {
    const res = await api.runCaesar(caesarInput, caesarShift, false);
    if (res.ok) setCaesarResult(res.data);
  };
  const handleCaesarDecrypt = async () => {
    const res = await api.runCaesar(caesarResult?.ciphertext || caesarInput, caesarShift, true);
    if (res.ok) setCaesarResult(res.data);
  };

  const handleTransEncrypt = async () => {
    const res = await api.runTransposition(transInput, transKey, false);
    if (res.ok) setTransResult(res.data);
  };
  const handleTransDecrypt = async () => {
    const res = await api.runTransposition(transResult?.ciphertext || transInput, transKey, true);
    if (res.ok) setTransResult(res.data);
  };

  const handleAesEncrypt = async () => {
    setIsAesLoading(true);
    setAesDecResult(null);
    try {
      const res = await api.aesEncrypt(aesInput, aesAad);
      if (res.ok) {
        setAesEncResult(res.data);
        setTamperCt(res.data.combined_ciphertext_b64);
        setTamperNonce(res.data.nonce_b64);
        setTamperAad(res.data.associated_data);
      }
    } finally {
      setIsAesLoading(false);
    }
  };

  const handleAesDecrypt = async (useTampered = false) => {
    if (!aesEncResult) return;
    setIsAesLoading(true);
    try {
      const ct = useTampered ? tamperCt : aesEncResult.combined_ciphertext_b64;
      const nonce = useTampered ? tamperNonce : aesEncResult.nonce_b64;
      const aad = useTampered ? tamperAad : aesEncResult.associated_data;
      const res = await api.aesDecrypt(ct, nonce, '', aad, aesEncResult.key_b64);
      setAesDecResult(res.data);
    } finally {
      setIsAesLoading(false);
    }
  };

  const handleSimulateTamperBit = () => {
    if (!tamperCt) return;
    // Flip 1 character in base64 string
    const chars = tamperCt.split('');
    chars[10] = chars[10] === 'A' ? 'B' : 'A';
    setTamperCt(chars.join(''));
  };

  const handleRsaKeygen = async () => {
    setIsRsaLoading(true);
    try {
      const res = await api.generateRsaKeypair(2048);
      if (res.ok) setRsaKeyData(res.data);
    } finally {
      setIsRsaLoading(false);
    }
  };

  const handleHybridEncrypt = async () => {
    const res = await api.hybridEncrypt(hybridInput);
    if (res.ok) {
      setHybridEncResult(res.data);
      setHybridDecResult(null);
    }
  };

  const handleHybridDecrypt = async () => {
    if (!hybridEncResult) return;
    const res = await api.hybridDecrypt(hybridEncResult);
    if (res.ok) setHybridDecResult(res.data);
  };

  const handleSha256Hash = async () => {
    const res = await api.hashSha256(hashInput);
    if (res.ok) setHashResult(res.data);
  };

  const handleCompareHashes = async () => {
    const res = await api.compareSha256(compareA, compareB);
    if (res.ok) setCompareResult(res.data);
  };

  const handleSign = async () => {
    const res = await api.signMessage(sigInput);
    if (res.ok) {
      setSigResult(res.data);
      setVerifyMsg(res.data.message);
      setVerifySig(res.data.signature_b64);
      setVerifyResult(null);
    }
  };

  const handleVerify = async () => {
    const res = await api.verifySignature(verifyMsg, verifySig);
    setVerifyResult(res.data);
  };

  const handleCertGenerate = async () => {
    setIsCertLoading(true);
    try {
      const res = await api.generateCertificate('localhost', 'Industrial SecureSim SCADA Lab');
      if (res.ok) setCertData(res.data);
    } finally {
      setIsCertLoading(false);
    }
  };

  const handleCertValidate = async () => {
    const res = await api.validateCertificate(validateHost);
    if (res.ok) setCertValidation(res.data);
  };

  const tabs = [
    { id: 'classical', label: 'Classical Ciphers', icon: Layers, module: 'Module 1' },
    { id: 'aes', label: 'AES-256-GCM AEAD', icon: Lock, module: 'Module 2' },
    { id: 'rsa', label: 'RSA & Hybrid Envelope', icon: Key, module: 'Module 2' },
    { id: 'hash', label: 'SHA-256 Hashing', icon: Hash, module: 'Module 2' },
    { id: 'signatures', label: 'RSA-PSS Signatures', icon: FileCheck, module: 'Module 2' },
    { id: 'certificates', label: 'X.509 Certificates', icon: FileCode, module: 'Module 2' },
    { id: 'key-mgmt', label: 'Key Management', icon: Shield, module: 'Module 2' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0d1629]/70 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Cryptography Laboratory (Modules 1 & 2)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Interactive cryptographic implementations using Python's standard cryptography library and hashlib. Test encryption, digital signatures, key encapsulation, and tamper detection.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono-code text-slate-500 bg-slate-900 px-1 rounded">
                {tab.module}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CLASSICAL CRYPTOGRAPHY */}
      {activeTab === 'classical' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Educational Demonstration (Module 1):</strong>
              <p className="mt-0.5 text-amber-400/90 leading-relaxed">
                Classical ciphers (Caesar and Columnar Transposition) provide historical and pedagogical foundation. They possess trivial key spaces (e.g. 25 keys for Caesar) and are vulnerable to frequency analysis. They must NEVER be used for actual industrial communications.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Caesar Cipher Box */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Caesar Shift Cipher</h3>
                <p className="text-xs text-slate-400 mt-0.5">Monoalphabetic substitution with modular integer shift (1-25)</p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Plaintext / Ciphertext:</label>
                <input
                  type="text"
                  value={caesarInput}
                  onChange={(e) => setCaesarInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Shift Key:</span>
                  <span className="font-mono-code text-cyan-400">k = {caesarShift}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={caesarShift}
                  onChange={(e) => setCaesarShift(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCaesarEncrypt}
                  className="flex-1 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  Encrypt (Shift +{caesarShift})
                </button>
                <button
                  onClick={handleCaesarDecrypt}
                  className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Decrypt (Shift -{caesarShift})
                </button>
              </div>

              {caesarResult && (
                <div className="p-3 rounded bg-[#070d19] border border-slate-800 text-xs font-mono-code space-y-1">
                  <div className="text-slate-400">Ciphertext Result:</div>
                  <div className="text-cyan-300 font-bold break-all">{caesarResult.ciphertext}</div>
                  {caesarResult.plaintext && caesarResult.plaintext !== caesarInput && (
                    <div className="text-slate-400 mt-1">Decrypted: <span className="text-emerald-400">{caesarResult.plaintext}</span></div>
                  )}
                </div>
              )}
            </div>

            {/* Columnar Transposition Box */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Columnar Transposition Cipher</h3>
                <p className="text-xs text-slate-400 mt-0.5">Permutation cipher rearranging character positions via keyword grid</p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Message:</label>
                <input
                  type="text"
                  value={transInput}
                  onChange={(e) => setTransInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Keyword:</label>
                <input
                  type="text"
                  value={transKey}
                  onChange={(e) => setTransKey(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleTransEncrypt}
                  className="flex-1 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
                >
                  Encrypt Columns
                </button>
                <button
                  onClick={handleTransDecrypt}
                  className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Decrypt Columns
                </button>
              </div>

              {transResult && (
                <div className="p-3 rounded bg-[#070d19] border border-slate-800 text-xs font-mono-code space-y-1">
                  <div className="text-slate-400">Ciphertext Result:</div>
                  <div className="text-teal-300 font-bold break-all">{transResult.ciphertext}</div>
                  {transResult.plaintext && transResult.plaintext !== transInput && (
                    <div className="text-slate-400 mt-1">Decrypted: <span className="text-emerald-400">{transResult.plaintext}</span></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AES-GCM SYMMETRIC ENCRYPTION & TAMPERING */}
      {activeTab === 'aes' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-300 text-xs leading-relaxed flex items-start gap-3">
            <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>Authenticated Encryption with Associated Data (AEAD) — Module 2:</strong>
              <p className="mt-0.5 text-cyan-400/90">
                AES-GCM combines Galois counter mode (AES-CTR) for confidentiality with GHASH polynomial evaluation for integrity/authenticity (128-bit MAC tag). Every encryption generates a unique, cryptographically random 96-bit nonce. Any bit flipped in the ciphertext or associated data causes decryption to immediately fail with <code className="text-rose-300">InvalidTag</code>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Encryption Box */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">1. AES-256-GCM Encryption</h3>
                <span className="text-[11px] font-mono-code text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  AESGCM (256-bit key)
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Industrial Plaintext Payload:</label>
                <textarea
                  rows="3"
                  value={aesInput}
                  onChange={(e) => setAesInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Authenticated Associated Data (AAD - Unencrypted Metadata):
                </label>
                <input
                  type="text"
                  value={aesAad}
                  onChange={(e) => setAesAad(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleAesEncrypt}
                disabled={isAesLoading}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/40 flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Encrypt with Fresh 96-bit Nonce</span>
              </button>

              {aesEncResult && (
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Active Key Masked:</span>
                    <span className="font-mono-code text-slate-300">{aesEncResult.key_masked}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Nonce (Base64 - 12 bytes):</span>
                    <div className="p-2 bg-[#070d19] rounded border border-slate-800 font-mono-code text-[11px] text-cyan-300 break-all">
                      {aesEncResult.nonce_b64}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Authentication Tag (GHASH - 16 bytes):</span>
                    <div className="p-2 bg-[#070d19] rounded border border-slate-800 font-mono-code text-[11px] text-teal-300 break-all">
                      {aesEncResult.tag_b64}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Combined Ciphertext + Tag (Base64):</span>
                    <CodeBlock code={aesEncResult.combined_ciphertext_b64} maxHeight="max-h-24" />
                  </div>
                </div>
              )}
            </div>

            {/* Controlled Tampering & Decryption Box */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">2. Decryption & Tamper Verification</h3>
                <span className="text-[11px] font-mono-code text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Integrity Demonstration
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Ciphertext to Decrypt (Base64):
                </label>
                <textarea
                  rows="3"
                  value={tamperCt}
                  onChange={(e) => setTamperCt(e.target.value)}
                  placeholder="Encrypt payload first..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateTamperBit}
                  className="px-3 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Simulate Wire Tampering (Flip 1 Byte)</span>
                </button>
                <button
                  onClick={() => aesEncResult && setTamperCt(aesEncResult.combined_ciphertext_b64)}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Reset Original
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAesDecrypt(false)}
                  disabled={!aesEncResult || isAesLoading}
                  className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Decrypt Untampered</span>
                </button>
                <button
                  onClick={() => handleAesDecrypt(true)}
                  disabled={!tamperCt || isAesLoading}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Verify & Decrypt Active Buffer</span>
                </button>
              </div>

              {aesDecResult && (
                <div className={`p-4 rounded-lg border text-xs ${
                  aesDecResult.success 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {aesDecResult.success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>INTEGRITY VERIFIED: Valid Authentication Tag</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>INTEGRITY FAILURE: {aesDecResult.error_type}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed">{aesDecResult.message}</p>
                  {aesDecResult.plaintext && (
                    <div className="mt-2 p-2 rounded bg-[#070d19] border border-slate-800 font-mono-code text-[11px] text-white">
                      Decrypted Plaintext: "{aesDecResult.plaintext}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RSA & HYBRID ENVELOPE */}
      {activeTab === 'rsa' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-300 text-xs leading-relaxed flex items-start gap-3">
            <Key className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong>Asymmetric Cryptography & Hybrid Encryption (Module 2):</strong>
              <p className="mt-0.5 text-indigo-400/90">
                In real industrial systems, asymmetric algorithms (RSA-2048) are not used to encrypt bulk telemetry directly because RSA is computationally intensive and limited in message size. Instead, <strong>Hybrid Cryptography</strong> is used: an ephemeral symmetric AES-256 session key is generated, the industrial telemetry is encrypted with AES-GCM, and only the 32-byte AES key is encapsulated with RSA-OAEP.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RSA Key Management */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">RSA-2048 Key Pair</h3>
                <button
                  onClick={handleRsaKeygen}
                  disabled={isRsaLoading}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isRsaLoading ? 'animate-spin' : ''}`} />
                  <span>Generate New Key Pair</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 space-y-2">
                <div className="flex justify-between">
                  <span>Algorithm:</span>
                  <span className="font-mono-code text-indigo-300">RSA (Exponent e=65537)</span>
                </div>
                <div className="flex justify-between">
                  <span>Modulus Size:</span>
                  <span className="font-mono-code text-cyan-300">2048 bits</span>
                </div>
                <div className="flex justify-between">
                  <span>Private Key Protection:</span>
                  <span className="font-mono-code text-emerald-400">Server-Side Protected Memory</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  Exported Public Key (PEM - SubjectPublicKeyInfo):
                </span>
                <CodeBlock 
                  code={rsaKeyData?.public_key_pem || 'Loading public key...'} 
                  language="pem"
                  maxHeight="max-h-48"
                />
              </div>
            </div>

            {/* Hybrid Envelope Demo */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Key Encapsulation (Hybrid Envelope)</h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Industrial Message to Wrap:</label>
                <textarea
                  rows="2"
                  value={hybridInput}
                  onChange={(e) => setHybridInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleHybridEncrypt}
                  className="flex-1 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Wrap (RSA-OAEP + AES-GCM)
                </button>
                <button
                  onClick={handleHybridDecrypt}
                  disabled={!hybridEncResult}
                  className="flex-1 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  Unwrap & Decrypt
                </button>
              </div>

              {hybridEncResult && (
                <div className="p-3 rounded bg-[#070d19] border border-slate-800 text-xs font-mono-code space-y-2">
                  <div className="text-indigo-400 font-semibold">1. RSA-OAEP Encrypted Session Key (Base64):</div>
                  <div className="text-[11px] text-slate-300 break-all truncate">
                    {hybridEncResult.encrypted_session_key_b64}
                  </div>
                  <div className="text-teal-400 font-semibold">2. AES-GCM Encrypted Payload (Base64):</div>
                  <div className="text-[11px] text-slate-300 break-all truncate">
                    {hybridEncResult.encrypted_payload_b64}
                  </div>
                </div>
              )}

              {hybridDecResult && (
                <div className="p-3 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Envelope Unwrapped Successfully</span>
                  </div>
                  <p className="text-[11px] font-mono-code mt-1 text-white">
                    "{hybridDecResult.decrypted_plaintext}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SHA-256 HASHING & AVALANCHE EFFECT */}
      {activeTab === 'hash' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/30 text-teal-300 text-xs leading-relaxed flex items-start gap-3">
            <Hash className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong>Cryptographic Hash Functions & The Avalanche Effect (Module 2):</strong>
              <p className="mt-0.5 text-teal-400/90">
                Hashing is a one-way mathematical compression function (pre-image and collision resistant). Hashes cannot be 'decrypted'. In a secure hash algorithm like SHA-256, changing even a single input bit flips approximately 50% of the 256 output bits.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SHA-256 Single Hash Generator */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">SHA-256 Digest Generator</h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Input String:</label>
                <textarea
                  rows="3"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleSha256Hash}
                className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
              >
                Compute SHA-256 Hash
              </button>

              {hashResult && (
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 block">Hexadecimal Digest (256 bits = 64 characters):</span>
                  <div className="p-3 bg-[#070d19] rounded border border-slate-800 font-mono-code text-xs text-teal-300 break-all">
                    {hashResult.hash_hex}
                  </div>
                </div>
              )}
            </div>

            {/* Avalanche Effect Comparator */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Interactive Avalanche Effect Demonstration</h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Message A:</label>
                <input
                  type="text"
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Message B (Modify 1 Character):</label>
                <input
                  type="text"
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleCompareHashes}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Compare Bit Hamming Distance
              </button>

              {compareResult && (
                <div className="p-3 rounded bg-[#070d19] border border-slate-800 text-xs font-mono-code space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Differing Bits:</span>
                    <span className="text-cyan-400 font-bold">{compareResult.differing_bits} / 256 bits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avalanche Percentage:</span>
                    <span className="text-teal-400 font-bold">{compareResult.avalanche_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-400 h-full transition-all"
                      style={{ width: `${compareResult.avalanche_percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans mt-1">
                    {compareResult.avalanche_analysis}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RSA-PSS DIGITAL SIGNATURES */}
      {activeTab === 'signatures' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-300 text-xs leading-relaxed flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong>RSA-PSS Digital Signatures (Module 2):</strong>
              <p className="mt-0.5 text-purple-400/90">
                Probabilistic Signature Scheme (PSS) with SHA-256 and MGF1 provides mathematical proof of message origin (Authentication), proof of uncorrupted content (Integrity), and prevents the sender from claiming they did not issue the command (Non-Repudiation).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Signature Creation */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">1. Sign Industrial Command (Private Key)</h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Critical Command to Sign:</label>
                <textarea
                  rows="3"
                  value={sigInput}
                  onChange={(e) => setSigInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleSign}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
              >
                Sign with RSA Private Key (RSA-PSS-SHA256)
              </button>

              {sigResult && (
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono-code">
                  <span className="text-slate-400 block">Generated Digital Signature (Base64):</span>
                  <CodeBlock code={sigResult.signature_b64} maxHeight="max-h-24" />
                </div>
              )}
            </div>

            {/* Signature Verification & Tampering */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">2. Verify Signature (Public Key)</h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Message to Verify:</label>
                <textarea
                  rows="2"
                  value={verifyMsg}
                  onChange={(e) => setVerifyMsg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Digital Signature (Base64):</label>
                <textarea
                  rows="2"
                  value={verifySig}
                  onChange={(e) => setVerifySig(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setVerifyMsg(verifyMsg + '_TAMPERED')}
                  className="px-2.5 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 text-rose-300 text-xs font-semibold"
                >
                  Tamper Message
                </button>
                <button
                  onClick={handleVerify}
                  className="flex-1 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  Verify Signature Against Public Key
                </button>
              </div>

              {verifyResult && (
                <div className={`p-3 rounded-lg border text-xs ${
                  verifyResult.valid 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {verifyResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    <span>{verifyResult.status}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{verifyResult.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: X.509 DIGITAL CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-blue-300 text-xs leading-relaxed flex items-start gap-3">
            <FileCode className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong>X.509 Digital Certificates & PKI Trust (Module 2):</strong>
              <p className="mt-0.5 text-blue-400/90">
                Binds a cryptographic public key to an industrial node identity (Common Name, Organization, Subject Alternative Names). 
                <strong> Important:</strong> The local certificate generated below is self-signed for educational and localhost TLS demonstration. It is not signed by a public Certificate Authority (CA) and requires explicit local trust configuration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Certificate Metadata Inspection */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Active Server X.509 Certificate</h3>
                <button
                  onClick={handleCertGenerate}
                  disabled={isCertLoading}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isCertLoading ? 'animate-spin' : ''}`} />
                  <span>Regenerate Local Cert</span>
                </button>
              </div>

              {certData ? (
                <div className="space-y-2 text-xs font-mono-code">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Subject CN:</span>
                    <span className="text-cyan-300">{certData.subject_common_name || certData.common_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Organization:</span>
                    <span className="text-slate-200">{certData.subject_organization || certData.organization}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Serial Number:</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{certData.serial_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">SHA-256 Fingerprint:</span>
                    <span className="text-teal-300 truncate max-w-[220px]">{certData.sha256_fingerprint}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">SANs (DNS & IP):</span>
                    <span className="text-cyan-400">localhost, 127.0.0.1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trust Model:</span>
                    <span className="text-amber-400">Self-Signed (Local SCADA Lab)</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Loading certificate metadata...</p>
              )}

              <div>
                <span className="text-xs text-slate-400 block mb-1">Certificate PEM:</span>
                <CodeBlock code={certData?.cert_pem || ''} language="x509" maxHeight="max-h-36" />
              </div>
            </div>

            {/* Certificate Hostname Validation */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Local Certificate Identity Validation</h3>
              <p className="text-xs text-slate-400">
                Tests hostname matching and certificate validity periods against local TLS rules.
              </p>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Expected Hostname:</label>
                <input
                  type="text"
                  value={validateHost}
                  onChange={(e) => setValidateHost(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleCertValidate}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Validate Identity & Dates
              </button>

              {certValidation && (
                <div className={`p-4 rounded-lg border text-xs ${
                  certValidation.overall_status === 'VALID_FOR_LOCAL_TLS'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {certValidation.overall_status === 'VALID_FOR_LOCAL_TLS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{certValidation.overall_status}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{certValidation.pki_explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: KEY MANAGEMENT */}
      {activeTab === 'key-mgmt' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs leading-relaxed space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Cryptographic Key Management Principles (Module 2)</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Cryptographic strength relies strictly on key secrecy, not algorithmic obscurity (Kerckhoffs's Principle). In modern industrial networks, private keys and symmetric pre-shared keys must adhere to strict handling guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0d1629]/90 border border-slate-800 space-y-2 text-xs">
              <span className="text-cyan-400 font-semibold uppercase tracking-wider text-[11px] block">
                1. Safe Generation & Entropy
              </span>
              <p className="text-slate-400 leading-relaxed">
                Keys must be generated using cryptographically secure pseudorandom number generators (CSPRNG, such as <code className="text-cyan-300">os.urandom()</code>), drawing entropy from the OS kernel.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1629]/90 border border-slate-800 space-y-2 text-xs">
              <span className="text-teal-400 font-semibold uppercase tracking-wider text-[11px] block">
                2. Separation of Keys
              </span>
              <p className="text-slate-400 leading-relaxed">
                Public keys are safely distributed via certificates. Private keys reside exclusively in secure hardware (HSMs, TPM chips) or encrypted keystores, never in frontend source code.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1629]/90 border border-slate-800 space-y-2 text-xs">
              <span className="text-indigo-400 font-semibold uppercase tracking-wider text-[11px] block">
                3. Nonce Uniqueness
              </span>
              <p className="text-slate-400 leading-relaxed">
                For AES-GCM, reusing a 96-bit nonce with the same 256-bit key destroys authenticity and allows polynomial MAC forgery. Nonces are never repeated.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
