import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Key, 
  Hash, 
  FileCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Shield,
  Layers,
  FileCode,
  FlaskConical
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { api } from '../services/api';

/* Shared input styles */
const inputCls = "w-full bg-[#080f1e] border border-[#1a2844] rounded-lg px-3 py-2 text-xs text-slate-200 input-field font-mono-code";
const textareaCls = "w-full bg-[#080f1e] border border-[#1a2844] rounded-lg p-2.5 text-xs text-slate-200 input-field font-mono-code resize-none";

const Panel = ({ children, className = '' }) => (
  <div className={`bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 shadow-lg shadow-black/20 space-y-4 card-hover ${className}`}>
    {children}
  </div>
);

const ResultBlock = ({ success, title, children }) => (
  <div className={`p-3.5 rounded-lg text-xs animate-fade-in ${success ? 'alert-success text-emerald-300' : 'alert-critical text-rose-300'}`}>
    <div className="flex items-center gap-2 font-bold mb-1.5">
      {success
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        : <XCircle className="w-4 h-4 text-rose-400" />
      }
      <span>{title}</span>
    </div>
    {children}
  </div>
);

const InfoBanner = ({ icon: Icon, color, children }) => (
  <div className={`p-4 rounded-xl text-xs leading-relaxed flex items-start gap-3 ${color}`}>
    <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-70" />
    <div>{children}</div>
  </div>
);

const PrimaryBtn = ({ onClick, disabled, children, color = 'bg-sky-600 hover:bg-sky-500 shadow-sky-950/40' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-2 rounded-lg ${color} text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all btn-press disabled:opacity-50`}
  >
    {children}
  </button>
);

export const CryptographyLab = () => {
  const [activeTab, setActiveTab] = useState('aes');

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

  // 4. SHA-256
  const [hashInput, setHashInput] = useState('TURBINE_BEARING_STATUS_NORMAL');
  const [hashResult, setHashResult] = useState(null);
  const [compareA, setCompareA] = useState('VALVE_OPEN_COMMAND_PORT_8080');
  const [compareB, setCompareB] = useState('VALVE_OPEN_COMMAND_PORT_8081');
  const [compareResult, setCompareResult] = useState(null);

  // 5. RSA-PSS
  const [sigInput, setSigInput] = useState('AUTHORIZE_SCHEDULED_TURBINE_MAINTENANCE_WINDOW_OCTOBER');
  const [sigResult, setSigResult] = useState(null);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifySig, setVerifySig] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  // 6. X.509
  const [certData, setCertData] = useState(null);
  const [validateHost, setValidateHost] = useState('localhost');
  const [certValidation, setCertValidation] = useState(null);
  const [isCertLoading, setIsCertLoading] = useState(false);

  useEffect(() => {
    api.getRsaPublicKey().then(r => r.ok && setRsaKeyData(r.data));
    api.inspectCertificate().then(r => r.ok && setCertData(r.data));
  }, []);

  // Handlers
  const handleCaesarEncrypt = async () => { const r = await api.runCaesar(caesarInput, caesarShift, false); if (r.ok) setCaesarResult(r.data); };
  const handleCaesarDecrypt = async () => { const r = await api.runCaesar(caesarResult?.ciphertext || caesarInput, caesarShift, true); if (r.ok) setCaesarResult(r.data); };
  const handleTransEncrypt = async () => { const r = await api.runTransposition(transInput, transKey, false); if (r.ok) setTransResult(r.data); };
  const handleTransDecrypt = async () => { const r = await api.runTransposition(transResult?.ciphertext || transInput, transKey, true); if (r.ok) setTransResult(r.data); };

  const handleAesEncrypt = async () => {
    setIsAesLoading(true); setAesDecResult(null);
    try {
      const r = await api.aesEncrypt(aesInput, aesAad);
      if (r.ok) { setAesEncResult(r.data); setTamperCt(r.data.combined_ciphertext_b64); setTamperNonce(r.data.nonce_b64); setTamperAad(r.data.associated_data); }
    } finally { setIsAesLoading(false); }
  };

  const handleAesDecrypt = async (useTampered = false) => {
    if (!aesEncResult) return;
    setIsAesLoading(true);
    try {
      const r = await api.aesDecrypt(
        useTampered ? tamperCt : aesEncResult.combined_ciphertext_b64,
        useTampered ? tamperNonce : aesEncResult.nonce_b64,
        '', useTampered ? tamperAad : aesEncResult.associated_data, aesEncResult.key_b64
      );
      setAesDecResult(r.data);
    } finally { setIsAesLoading(false); }
  };

  const handleSimulateTamperBit = () => {
    if (!tamperCt) return;
    const chars = tamperCt.split('');
    chars[10] = chars[10] === 'A' ? 'B' : 'A';
    setTamperCt(chars.join(''));
  };

  const handleRsaKeygen = async () => {
    setIsRsaLoading(true);
    try { const r = await api.generateRsaKeypair(2048); if (r.ok) setRsaKeyData(r.data); }
    finally { setIsRsaLoading(false); }
  };

  const handleHybridEncrypt = async () => {
    const r = await api.hybridEncrypt(hybridInput);
    if (r.ok) { setHybridEncResult(r.data); setHybridDecResult(null); }
  };
  const handleHybridDecrypt = async () => {
    if (!hybridEncResult) return;
    const r = await api.hybridDecrypt(hybridEncResult);
    if (r.ok) setHybridDecResult(r.data);
  };

  const handleSha256Hash = async () => { const r = await api.hashSha256(hashInput); if (r.ok) setHashResult(r.data); };
  const handleCompareHashes = async () => { const r = await api.compareSha256(compareA, compareB); if (r.ok) setCompareResult(r.data); };

  const handleSign = async () => {
    const r = await api.signMessage(sigInput);
    if (r.ok) { setSigResult(r.data); setVerifyMsg(r.data.message); setVerifySig(r.data.signature_b64); setVerifyResult(null); }
  };
  const handleVerify = async () => { const r = await api.verifySignature(verifyMsg, verifySig); setVerifyResult(r.data); };

  const handleCertGenerate = async () => {
    setIsCertLoading(true);
    try { const r = await api.generateCertificate('localhost', 'AegisGrid ICS SCADA Lab'); if (r.ok) setCertData(r.data); }
    finally { setIsCertLoading(false); }
  };
  const handleCertValidate = async () => { const r = await api.validateCertificate(validateHost); if (r.ok) setCertValidation(r.data); };

  const tabs = [
    { id: 'classical',     label: 'Classical Ciphers',    icon: Layers,     tag: 'Historical' },
    { id: 'aes',           label: 'AES-256-GCM',          icon: Lock,       tag: 'AEAD'       },
    { id: 'rsa',           label: 'RSA & Hybrid',         icon: Key,        tag: 'Asymmetric' },
    { id: 'hash',          label: 'SHA-256 Hashing',      icon: Hash,       tag: 'Digest'     },
    { id: 'signatures',    label: 'RSA-PSS Signatures',   icon: FileCheck,  tag: 'Non-Repud.' },
    { id: 'certificates',  label: 'X.509 / PKI',          icon: FileCode,   tag: 'PKI'        },
    { id: 'key-mgmt',      label: 'Key Management',       icon: Shield,     tag: 'Principles' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 flowing-border">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-violet-400" />
          Cryptography Laboratory
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Interactive cryptographic implementations using Python's standard <code className="text-violet-400">cryptography</code> library and <code className="text-violet-400">hashlib</code>. All operations execute on the backend.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-[#080f1e] rounded-xl border border-[#1a2844]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex-1 min-w-fit justify-center sm:justify-start btn-press ${
                isActive
                  ? 'bg-[#0c1428] text-violet-300 border border-violet-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1428]/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
              <span className="hidden sm:block">{tab.label}</span>
              <span className="font-mono-code text-[9px] px-1 rounded bg-[#080f1e] border border-[#1a2844] text-slate-600">
                {tab.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── TAB: CLASSICAL ── */}
      {activeTab === 'classical' && (
        <div className="space-y-5 animate-fade-slide-up">
          <InfoBanner icon={AlertTriangle} color="alert-warning text-amber-300">
            <strong>Historical Context — Educational Only.</strong>
            <p className="mt-0.5 opacity-80">Classical ciphers (Caesar, Columnar Transposition) have trivial key spaces (≤25 for Caesar) and are completely broken by frequency analysis. They MUST NEVER be used for real industrial data.</p>
          </InfoBanner>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Panel>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Caesar Shift Cipher</h3>
                <p className="text-xs text-slate-500 mt-0.5">Monoalphabetic substitution — shift each letter by k (mod 26)</p>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Plaintext / Ciphertext</label>
                <input type="text" value={caesarInput} onChange={e => setCaesarInput(e.target.value)} className={inputCls} />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                  <span>Shift Key</span>
                  <span className="font-mono-code text-sky-400">k = {caesarShift}</span>
                </div>
                <input type="range" min="1" max="25" value={caesarShift} onChange={e => setCaesarShift(parseInt(e.target.value))} className="w-full accent-sky-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCaesarEncrypt} className="flex-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors btn-press">
                  Encrypt (+{caesarShift})
                </button>
                <button onClick={handleCaesarDecrypt} className="flex-1 py-2 rounded-lg bg-[#080f1e] hover:bg-slate-800 border border-[#1a2844] text-slate-200 text-xs font-semibold transition-colors btn-press">
                  Decrypt (-{caesarShift})
                </button>
              </div>
              {caesarResult && (
                <div className="p-3 rounded-lg code-block animate-fade-in">
                  <div className="text-slate-500 text-[10px] mb-1 uppercase tracking-wider">Result</div>
                  <div className="text-sky-300 font-bold break-all text-[11px]">{caesarResult.ciphertext}</div>
                  {caesarResult.plaintext && caesarResult.plaintext !== caesarInput && (
                    <div className="text-emerald-400 mt-1 text-[11px]">Decrypted: {caesarResult.plaintext}</div>
                  )}
                </div>
              )}
            </Panel>

            <Panel>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Columnar Transposition Cipher</h3>
                <p className="text-xs text-slate-500 mt-0.5">Permutation cipher — rearranges characters via keyword-ordered grid</p>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Message</label>
                <input type="text" value={transInput} onChange={e => setTransInput(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Keyword</label>
                <input type="text" value={transKey} onChange={e => setTransKey(e.target.value.toUpperCase())} className={inputCls} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleTransEncrypt} className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors btn-press">
                  Encrypt Columns
                </button>
                <button onClick={handleTransDecrypt} className="flex-1 py-2 rounded-lg bg-[#080f1e] hover:bg-slate-800 border border-[#1a2844] text-slate-200 text-xs font-semibold transition-colors btn-press">
                  Decrypt Columns
                </button>
              </div>
              {transResult && (
                <div className="p-3 rounded-lg code-block animate-fade-in">
                  <div className="text-slate-500 text-[10px] mb-1 uppercase tracking-wider">Result</div>
                  <div className="text-teal-300 font-bold break-all text-[11px]">{transResult.ciphertext}</div>
                  {transResult.plaintext && transResult.plaintext !== transInput && (
                    <div className="text-emerald-400 mt-1 text-[11px]">Decrypted: {transResult.plaintext}</div>
                  )}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* ── TAB: AES-GCM ── */}
      {activeTab === 'aes' && (
        <div className="space-y-5 animate-fade-slide-up">
          <InfoBanner icon={Lock} color="alert-info text-sky-300">
            <strong>Authenticated Encryption with Associated Data (AEAD).</strong>
            <p className="mt-0.5 opacity-80">AES-GCM combines GCM counter mode (AES-CTR) for confidentiality with GHASH polynomial evaluation for integrity (128-bit MAC tag). Every encryption uses a cryptographically random 96-bit nonce. Any bit flipped in the ciphertext or AAD causes decryption to fail with <code className="text-rose-300">InvalidTag</code>.</p>
          </InfoBanner>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">1. AES-256-GCM Encryption</h3>
                <span className="text-[10px] font-mono-code text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-500/30">256-bit key</span>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Industrial Plaintext Payload</label>
                <textarea rows="3" value={aesInput} onChange={e => setAesInput(e.target.value)} className={textareaCls} />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Authenticated Associated Data (AAD)</label>
                <input type="text" value={aesAad} onChange={e => setAesAad(e.target.value)} className={inputCls} />
              </div>
              <PrimaryBtn onClick={handleAesEncrypt} disabled={isAesLoading}>
                <Lock className="w-3.5 h-3.5" />
                <span>{isAesLoading ? 'Encrypting...' : 'Encrypt with Fresh 96-bit Nonce'}</span>
              </PrimaryBtn>
              {aesEncResult && (
                <div className="space-y-2 pt-2 border-t border-[#1a2844] text-xs animate-fade-in">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Active Key (masked)</span>
                    <span className="font-mono-code text-slate-300">{aesEncResult.key_masked}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 text-[10px] uppercase tracking-wider">Nonce (96-bit, Base64)</span>
                    <div className="p-2 code-block font-mono-code text-[11px] text-sky-300 break-all">{aesEncResult.nonce_b64}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 text-[10px] uppercase tracking-wider">Auth Tag / GHASH (128-bit)</span>
                    <div className="p-2 code-block font-mono-code text-[11px] text-teal-300 break-all">{aesEncResult.tag_b64}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 text-[10px] uppercase tracking-wider">Combined Ciphertext + Tag (Base64)</span>
                    <CodeBlock code={aesEncResult.combined_ciphertext_b64} maxHeight="max-h-20" />
                  </div>
                </div>
              )}
            </Panel>

            <Panel>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">2. Decryption & Tamper Verification</h3>
                <span className="text-[10px] font-mono-code text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">Integrity Demo</span>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Ciphertext (Base64)</label>
                <textarea rows="3" value={tamperCt} onChange={e => setTamperCt(e.target.value)} placeholder="Encrypt payload first…" className={textareaCls} />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSimulateTamperBit} className="px-3 py-1.5 rounded-lg alert-critical hover:bg-rose-900/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors btn-press border-0">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Flip 1 Byte (Tamper)
                </button>
                <button onClick={() => aesEncResult && setTamperCt(aesEncResult.combined_ciphertext_b64)} className="px-2.5 py-1.5 rounded-lg bg-[#080f1e] hover:bg-slate-800 text-slate-300 text-xs border border-[#1a2844] transition-colors btn-press">
                  Reset
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAesDecrypt(false)} disabled={!aesEncResult || isAesLoading} className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors btn-press">
                  <Unlock className="w-3.5 h-3.5" />Decrypt Untampered
                </button>
                <button onClick={() => handleAesDecrypt(true)} disabled={!tamperCt || isAesLoading} className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors btn-press">
                  <ShieldAlert className="w-3.5 h-3.5" />Verify Buffer
                </button>
              </div>
              {aesDecResult && (
                <ResultBlock success={aesDecResult.success} title={aesDecResult.success ? 'INTEGRITY VERIFIED — Valid Auth Tag' : `INTEGRITY FAILURE: ${aesDecResult.error_type}`}>
                  <p className="text-[11px] mt-1 leading-relaxed opacity-80">{aesDecResult.message}</p>
                  {aesDecResult.plaintext && (
                    <div className="mt-2 p-2 rounded code-block font-mono-code text-[11px] text-white">
                      Decrypted: "{aesDecResult.plaintext}"
                    </div>
                  )}
                </ResultBlock>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* ── TAB: RSA & HYBRID ── */}
      {activeTab === 'rsa' && (
        <div className="space-y-5 animate-fade-slide-up">
          <InfoBanner icon={Key} color="bg-violet-950/20 border border-violet-500/30 text-violet-300">
            <strong>Hybrid Cryptography — RSA-OAEP + AES-256-GCM.</strong>
            <p className="mt-0.5 opacity-80">RSA-2048 is computationally intensive and has message size limits. In practice, an ephemeral AES-256 session key is generated, industrial telemetry is encrypted with AES-GCM, and only the 32-byte key is encapsulated via RSA-OAEP. This combines asymmetric key exchange with symmetric bulk encryption.</p>
          </InfoBanner>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">RSA-2048 Key Pair</h3>
                <button onClick={handleRsaKeygen} disabled={isRsaLoading} className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors btn-press">
                  <RefreshCw className={`w-3 h-3 ${isRsaLoading ? 'animate-spin' : ''}`} />
                  Generate Pair
                </button>
              </div>
              <div className="text-xs text-slate-400 space-y-2">
                {[
                  ['Algorithm', 'RSA (e = 65537)', 'text-violet-300'],
                  ['Modulus Size', '2048 bits', 'text-sky-300'],
                  ['Private Key', 'Server-Side Protected Memory', 'text-emerald-400'],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex justify-between border-b border-[#1a2844] pb-1.5">
                    <span className="text-slate-500">{k}</span>
                    <span className={`font-mono-code text-[11px] ${c}`}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-wider">Public Key PEM (SubjectPublicKeyInfo)</span>
                <CodeBlock code={rsaKeyData?.public_key_pem || 'Loading public key…'} language="pem" maxHeight="max-h-44" />
              </div>
            </Panel>

            <Panel>
              <h3 className="text-sm font-semibold text-slate-200">Key Encapsulation (Hybrid Envelope)</h3>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Industrial Message</label>
                <textarea rows="2" value={hybridInput} onChange={e => setHybridInput(e.target.value)} className={textareaCls} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleHybridEncrypt} className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors btn-press">
                  Wrap (RSA-OAEP + AES-GCM)
                </button>
                <button onClick={handleHybridDecrypt} disabled={!hybridEncResult} className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors btn-press">
                  Unwrap & Decrypt
                </button>
              </div>
              {hybridEncResult && (
                <div className="p-3 rounded-lg code-block text-xs font-mono-code space-y-2 animate-fade-in">
                  <div className="text-violet-400 text-[10px] uppercase tracking-wider">RSA-OAEP Encrypted Session Key</div>
                  <div className="text-[10px] text-slate-400 break-all truncate">{hybridEncResult.encrypted_session_key_b64}</div>
                  <div className="text-teal-400 text-[10px] uppercase tracking-wider">AES-GCM Encrypted Payload</div>
                  <div className="text-[10px] text-slate-400 break-all truncate">{hybridEncResult.encrypted_payload_b64}</div>
                </div>
              )}
              {hybridDecResult && (
                <ResultBlock success title="Envelope Unwrapped Successfully">
                  <p className="text-[11px] font-mono-code mt-1 text-white">"{hybridDecResult.decrypted_plaintext}"</p>
                </ResultBlock>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* ── TAB: SHA-256 ── */}
      {activeTab === 'hash' && (
        <div className="space-y-5 animate-fade-slide-up">
          <InfoBanner icon={Hash} color="bg-teal-950/20 border border-teal-500/30 text-teal-300">
            <strong>Cryptographic Hash Functions & The Avalanche Effect.</strong>
            <p className="mt-0.5 opacity-80">SHA-256 is a one-way compression function (pre-image and collision resistant). Hashes cannot be decrypted. Changing a single input bit flips ~50% of the 256 output bits — the avalanche effect.</p>
          </InfoBanner>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel>
              <h3 className="text-sm font-semibold text-slate-200">SHA-256 Digest Generator</h3>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Input String</label>
                <textarea rows="3" value={hashInput} onChange={e => setHashInput(e.target.value)} className={textareaCls} />
              </div>
              <PrimaryBtn onClick={handleSha256Hash} color="bg-teal-600 hover:bg-teal-500 shadow-teal-950/40">
                <Hash className="w-3.5 h-3.5" />Compute SHA-256 Digest
              </PrimaryBtn>
              {hashResult && (
                <div className="animate-fade-in">
                  <span className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-wider">Hexadecimal Digest (256 bits = 64 hex chars)</span>
                  <div className="p-3 code-block font-mono-code text-xs text-teal-300 break-all">{hashResult.hash_hex}</div>
                </div>
              )}
            </Panel>

            <Panel>
              <h3 className="text-sm font-semibold text-slate-200">Avalanche Effect Analyzer</h3>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Message A</label>
                <input type="text" value={compareA} onChange={e => setCompareA(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Message B (modify 1 char)</label>
                <input type="text" value={compareB} onChange={e => setCompareB(e.target.value)} className={inputCls} />
              </div>
              <PrimaryBtn onClick={handleCompareHashes}>
                <Hash className="w-3.5 h-3.5" />Compare Bit Hamming Distance
              </PrimaryBtn>
              {compareResult && (
                <div className="p-3 rounded-lg code-block text-xs font-mono-code space-y-2 animate-fade-in">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Differing Bits</span>
                    <span className="text-sky-400 font-bold">{compareResult.differing_bits} / 256</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avalanche Effect</span>
                    <span className="text-teal-400 font-bold">{compareResult.avalanche_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-sky-500 to-teal-400 h-full transition-all duration-700 ease-out rounded-full" style={{ width: `${compareResult.avalanche_percentage}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans">{compareResult.avalanche_analysis}</p>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* ── TAB: RSA-PSS SIGNATURES ── */}
      {activeTab === 'signatures' && (
        <div className="space-y-5 animate-fade-slide-up">
          <InfoBanner icon={FileCheck} color="bg-purple-950/20 border border-purple-500/30 text-purple-300">
            <strong>RSA-PSS Digital Signatures — Non-Repudiation.</strong>
            <p className="mt-0.5 opacity-80">Probabilistic Signature Scheme (PSS) with SHA-256 and MGF1 provides Authentication (proof of origin), Integrity (proof of unmodified content), and Non-Repudiation (sender cannot deny issuing the command).</p>
          </InfoBanner>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel>
              <h3 className="text-sm font-semibold text-slate-200">1. Sign Command (Private Key)</h3>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Critical Command to Sign</label>
                <textarea rows="3" value={sigInput} onChange={e => setSigInput(e.target.value)} className={textareaCls} />
              </div>
              <PrimaryBtn onClick={handleSign} color="bg-purple-600 hover:bg-purple-500 shadow-purple-950/40">
                <FileCheck className="w-3.5 h-3.5" />Sign via RSA-PSS-SHA256
              </PrimaryBtn>
              {sigResult && (
                <div className="animate-fade-in">
                  <span className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-wider">Generated Digital Signature (Base64)</span>
                  <CodeBlock code={sigResult.signature_b64} maxHeight="max-h-20" />
                </div>
              )}
            </Panel>

            <Panel>
              <h3 className="text-sm font-semibold text-slate-200">2. Verify Signature (Public Key)</h3>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Message to Verify</label>
                <textarea rows="2" value={verifyMsg} onChange={e => setVerifyMsg(e.target.value)} className={textareaCls} />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Digital Signature (Base64)</label>
                <textarea rows="2" value={verifySig} onChange={e => setVerifySig(e.target.value)} className={textareaCls} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setVerifyMsg(verifyMsg + '_TAMPERED')} className="px-3 py-2 rounded-lg alert-critical text-rose-300 text-xs font-semibold flex items-center gap-1 btn-press border-0">
                  Tamper Message
                </button>
                <button onClick={handleVerify} className="flex-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors btn-press">
                  Verify Against Public Key
                </button>
              </div>
              {verifyResult && (
                <ResultBlock success={verifyResult.valid} title={verifyResult.status}>
                  <p className="text-[11px] leading-relaxed mt-1 opacity-80">{verifyResult.message}</p>
                </ResultBlock>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* ── TAB: X.509 CERTIFICATES ── */}
      {activeTab === 'certificates' && (
        <div className="space-y-5 animate-fade-slide-up">
          <InfoBanner icon={FileCode} color="bg-blue-950/20 border border-blue-500/30 text-blue-300">
            <strong>X.509 Digital Certificates & PKI Trust Chain.</strong>
            <p className="mt-0.5 opacity-80">Binds a cryptographic public key to an industrial node identity (Common Name, SANs). The certificate below is self-signed for local TLS demo — not signed by a public CA. Explicit local trust configuration is required.</p>
          </InfoBanner>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Active Server X.509 Certificate</h3>
                <button onClick={handleCertGenerate} disabled={isCertLoading} className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors btn-press">
                  <RefreshCw className={`w-3 h-3 ${isCertLoading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
              {certData ? (
                <div className="space-y-2 text-xs font-mono-code">
                  {[
                    ['Subject CN', certData.subject_common_name || certData.common_name, 'text-sky-300'],
                    ['Organization', certData.subject_organization || certData.organization, 'text-slate-200'],
                    ['Serial No.', certData.serial_number, 'text-slate-300'],
                    ['SHA-256 Fingerprint', certData.sha256_fingerprint, 'text-teal-300'],
                    ['SANs', 'localhost, 127.0.0.1', 'text-sky-400'],
                    ['Trust Model', 'Self-Signed (Local SCADA Lab)', 'text-amber-400'],
                  ].map(([k, v, c]) => (
                    <div key={k} className="flex justify-between border-b border-[#1a2844] pb-1.5">
                      <span className="text-slate-500 shrink-0 mr-2">{k}</span>
                      <span className={`${c} truncate max-w-[220px] text-right text-[10px]`}>{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="skeleton h-24 rounded-lg" />
              )}
              <div>
                <span className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-wider">Certificate PEM</span>
                <CodeBlock code={certData?.cert_pem || ''} language="x509" maxHeight="max-h-32" />
              </div>
            </Panel>

            <Panel>
              <h3 className="text-sm font-semibold text-slate-200">Certificate Identity Validation</h3>
              <p className="text-xs text-slate-500">Tests hostname matching and certificate validity against local TLS rules.</p>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Expected Hostname</label>
                <input type="text" value={validateHost} onChange={e => setValidateHost(e.target.value)} className={inputCls} />
              </div>
              <PrimaryBtn onClick={handleCertValidate} color="bg-blue-600 hover:bg-blue-500 shadow-blue-950/40">
                <FileCode className="w-3.5 h-3.5" />Validate Identity & Dates
              </PrimaryBtn>
              {certValidation && (
                <ResultBlock
                  success={certValidation.overall_status === 'VALID_FOR_LOCAL_TLS'}
                  title={certValidation.overall_status}
                >
                  <p className="text-[11px] leading-relaxed mt-1 opacity-80">{certValidation.pki_explanation}</p>
                </ResultBlock>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* ── TAB: KEY MANAGEMENT ── */}
      {activeTab === 'key-mgmt' && (
        <div className="space-y-5 animate-fade-slide-up">
          <div className="bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-sky-400" />
              Cryptographic Key Management Principles
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cryptographic strength relies entirely on key secrecy, not algorithmic obscurity (Kerckhoffs's Principle). Private keys and symmetric pre-shared keys in industrial networks must follow strict lifecycle governance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: '01', title: 'Safe Generation & Entropy', color: 'text-sky-400 border-sky-500/30 bg-sky-950/20',
                body: 'Keys must use CSPRNGs (e.g. os.urandom()) drawing entropy from the OS kernel. Never seed from system time, predictable values, or low-entropy sources.',
              },
              {
                num: '02', title: 'Key Separation & Storage', color: 'text-teal-400 border-teal-500/30 bg-teal-950/20',
                body: 'Public keys are distributed via X.509 certificates. Private keys reside exclusively in HSMs, TPM chips, or encrypted keystores — never in frontend source code or unencrypted files.',
              },
              {
                num: '03', title: 'Nonce Uniqueness (AES-GCM)', color: 'text-violet-400 border-violet-500/30 bg-violet-950/20',
                body: 'Reusing a 96-bit nonce with the same 256-bit AES key destroys both confidentiality and authenticity, allowing polynomial MAC forgery. AegisGrid generates a fresh nonce for every encryption.',
              },
            ].map((p) => (
              <div key={p.num} className={`p-4 rounded-xl border ${p.color} space-y-2 text-xs card-hover`}>
                <span className={`font-mono-code font-bold text-lg ${p.color.split(' ')[0]} opacity-30`}>{p.num}</span>
                <span className={`font-semibold uppercase tracking-wider text-[11px] block ${p.color.split(' ')[0]}`}>{p.title}</span>
                <p className="text-slate-400 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
