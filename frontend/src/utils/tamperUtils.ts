/**
 * Utility functions for detecting and formatting in-flight payload tampering differentials
 * (e.g. when an attacker tampers with sensor values such as changing 55 -> 60 or 43.0 -> 56.0).
 */

export interface TamperDiffInfo {
  isTampered: boolean;
  field: string;
  originalValue: string;
  tamperedValue: string;
  delta: string;
  unit: string;
  explanation: string;
  originalSnippet?: string;
  tamperedSnippet?: string;
  mutatedPayload?: string;
}

/**
 * Extracts and formats before-and-after tampered parameter values from sent and received payloads.
 */
export function extractTamperedValueDiff(
  sentPayloadStr?: string,
  receivedPayloadStr?: string,
  serverTamperDiff?: Partial<TamperDiffInfo> | null,
  isPlaintextAccepted?: boolean
): TamperDiffInfo | null {
  if (serverTamperDiff && serverTamperDiff.originalValue && serverTamperDiff.tamperedValue) {
    const orig = serverTamperDiff.originalValue;
    const tamp = serverTamperDiff.tamperedValue;
    const field = serverTamperDiff.field || 'temperature';
    const unit = serverTamperDiff.unit || (field.toLowerCase().includes('temp') ? '°C' : '');

    const explanation = isPlaintextAccepted
      ? `🚨 PLAINTEXT EXPLOITED: Communication is unencrypted Plaintext (Security Disabled) without MAC or digital signature. Attacker altered '${field}' from ${orig}${unit} to ${tamp}${unit}, and the receiver BLINDLY ACCEPTED the forged setpoint!`
      : (serverTamperDiff.explanation ||
        `In-flight MITM tampering: '${field}' manipulated from ${orig}${unit} to ${tamp}${unit}. Rejected by receiver cryptographic verification.`);

    return {
      isTampered: true,
      field,
      originalValue: orig,
      tamperedValue: tamp,
      delta: serverTamperDiff.delta || '+5',
      unit,
      explanation,
      originalSnippet: `"${field}": ${orig}`,
      tamperedSnippet: `"${field}": ${tamp}`,
      mutatedPayload: serverTamperDiff.mutatedPayload,
    };
  }

  const sent = sentPayloadStr || '{"sensor": "TEMP-01", "temperature": 55.0, "unit": "C"}';
  
  // Prefer operational parameter keys (temperature, pressure, speed, etc.) over device IDs
  const priorityMatch = sent.match(/(["']?(?:temperature|pressure|speed|flow|level|voltage|current|val|temp|rpm|measured|setpoint)["']?\s*[:=]\s*["']?)(\b\d+(?:\.\d+)?\b)(["']?)/i);
  const genericKvMatch = sent.match(/(["']?([a-zA-Z_][a-zA-Z0-9_-]*)["']?\s*[:=]\s*["']?)(\b\d+(?:\.\d+)?\b)(["']?)/);

  let field = 'temperature';
  let origStr = '55.0';
  let matchStart = -1;
  let matchEnd = -1;

  if (priorityMatch && priorityMatch.index !== undefined) {
    const keyMatch = priorityMatch[1].match(/[a-zA-Z0-9_]+/);
    field = keyMatch ? keyMatch[0] : 'temperature';
    origStr = priorityMatch[2];
    matchStart = priorityMatch.index + priorityMatch[1].length;
    matchEnd = matchStart + origStr.length;
  } else if (genericKvMatch && genericKvMatch.index !== undefined) {
    field = genericKvMatch[2];
    origStr = genericKvMatch[3];
    matchStart = genericKvMatch.index + genericKvMatch[1].length;
    matchEnd = matchStart + origStr.length;
  } else {
    const numMatch = sent.match(/\b\d+(?:\.\d+)?\b/);
    if (numMatch && numMatch.index !== undefined) {
      origStr = numMatch[0];
      matchStart = numMatch.index;
      matchEnd = matchStart + origStr.length;
    }
  }

  // Calculate tampered value (e.g. 55 -> 60, or 43.0 -> 56.0)
  let tamperedStr = '60.0';
  let deltaStr = '+5.0';

  if (origStr.includes('.')) {
    const num = parseFloat(origStr);
    const tamperedNum = Math.abs(num - 55.0) < 0.01 ? 60.0 : num + 13.0;
    tamperedStr = tamperedNum.toFixed(1);
    const diff = tamperedNum - num;
    deltaStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  } else {
    const num = parseInt(origStr, 10);
    const tamperedNum = num === 55 ? 60 : num + 13;
    tamperedStr = tamperedNum.toString();
    const diff = tamperedNum - num;
    deltaStr = diff > 0 ? `+${diff}` : diff.toString();
  }

  // If received payload already has an altered number, reflect that
  if (receivedPayloadStr && !receivedPayloadStr.startsWith('[')) {
    const recvMatch = receivedPayloadStr.match(new RegExp(`"?${field}"?\\s*[:=]\\s*"?(\\b\\d+(?:\\.\\d+)?\\b)"?`, 'i'));
    if (recvMatch && recvMatch[1] !== origStr) {
      tamperedStr = recvMatch[1];
      const origN = parseFloat(origStr);
      const recvN = parseFloat(tamperedStr);
      const diff = recvN - origN;
      deltaStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    }
  }

  const isTemp = field.toLowerCase().includes('temp');
  const isPress = field.toLowerCase().includes('press');
  const unit = isTemp ? '°C' : isPress ? ' PSI' : '';

  // Synthesize mutated payload string
  let mutatedPayload = sent;
  if (matchStart >= 0 && matchEnd >= matchStart) {
    mutatedPayload = sent.slice(0, matchStart) + tamperedStr + sent.slice(matchEnd);
  } else {
    mutatedPayload = sent.replace(origStr, tamperedStr);
  }

  const explanation = isPlaintextAccepted
    ? `🚨 PLAINTEXT VULNERABILITY EXPLOITED: Because communication is unencrypted Plaintext (Security Disabled), the receiving controller has no cryptographic MAC or digital signature. The attacker altered '${field}' from ${origStr}${unit} to ${tamperedStr}${unit}, and the forged value was ACCEPTED by the industrial node!`
    : `In-flight MITM tampering: '${field}' manipulated in transit from ${origStr}${unit} to ${tamperedStr}${unit}. AEAD tag mismatch caught the alteration and rejected frame delivery.`;

  return {
    isTampered: true,
    field,
    originalValue: origStr,
    tamperedValue: tamperedStr,
    delta: deltaStr,
    unit,
    explanation,
    originalSnippet: `"${field}": ${origStr}`,
    tamperedSnippet: `"${field}": ${tamperedStr}`,
    mutatedPayload,
  };
}
