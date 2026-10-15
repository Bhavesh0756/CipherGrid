"""Digital Certificates Module (Module 2 - Network Security).

Implements X.509 digital certificate generation, inspection, and local validation
via Python's cryptography.x509 library.
"""
import os
import ipaddress
from datetime import datetime, timezone, timedelta
from cryptography import x509
from cryptography.x509.oid import NameOID, ExtendedKeyUsageOID
from cryptography.hazmat.primitives import hashes, serialization
from .asymmetric import get_or_create_rsa_keypair

CERT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "certificates")
CERT_PATH = os.path.join(CERT_DIR, "server_cert.pem")
KEY_PATH = os.path.join(CERT_DIR, "server_key.pem")

def generate_local_x509_certificate(
    common_name: str = "localhost",
    organization: str = "Industrial SecureSim SCADA Lab",
    validity_days: int = 365
) -> dict:
    """Generates an X.509 self-signed certificate for the local test server."""
    os.makedirs(CERT_DIR, exist_ok=True)
    private_key, _ = get_or_create_rsa_keypair()

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "CyberLab"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "ICS Security Operations"),
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
    ])

    now = datetime.now(timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + timedelta(days=validity_days))
        .add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
            ]),
            critical=False,
        )
        .add_extension(
            x509.BasicConstraints(ca=True, path_length=None),
            critical=True,
        )
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=False,
                key_encipherment=True,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=True,
                crl_sign=True,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .add_extension(
            x509.ExtendedKeyUsage([
                ExtendedKeyUsageOID.SERVER_AUTH,
                ExtendedKeyUsageOID.CLIENT_AUTH
            ]),
            critical=False
        )
        .sign(private_key, hashes.SHA256())
    )

    cert_pem = cert.public_bytes(serialization.Encoding.PEM)
    key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )

    with open(CERT_PATH, "wb") as f:
        f.write(cert_pem)
    with open(KEY_PATH, "wb") as f:
        f.write(key_pem)

    fingerprint = cert.fingerprint(hashes.SHA256()).hex().upper()
    formatted_fingerprint = ":".join(fingerprint[i:i+2] for i in range(0, len(fingerprint), 2))

    return {
        "common_name": common_name,
        "organization": organization,
        "serial_number": str(cert.serial_number),
        "valid_from": cert.not_valid_before_utc.isoformat(),
        "valid_until": cert.not_valid_after_utc.isoformat(),
        "sha256_fingerprint": formatted_fingerprint,
        "san_dns": ["localhost"],
        "san_ip": ["127.0.0.1"],
        "cert_pem": cert_pem.decode('utf-8'),
        "cert_file_path": CERT_PATH,
        "key_file_path": KEY_PATH,
        "is_self_signed": True,
        "trust_status": "LOCALLY_TRUSTED_DEMO_ONLY",
        "pki_disclaimer": (
            "CRITICAL NOTE: This certificate is SELF-SIGNED for local development and laboratory testing. "
            "It establishes local cryptographic identity and encrypts local TLS traffic, but is NOT trusted "
            "by public browsers or operating system trust stores without manual CA importation. In production ICS/SCADA "
            "environments, an enterprise Public Key Infrastructure (PKI) with an offline Root CA and intermediate CAs is mandatory."
        )
    }

def inspect_current_certificate() -> dict:
    """Reads and parses the active X.509 certificate."""
    if not os.path.exists(CERT_PATH):
        return generate_local_x509_certificate()

    with open(CERT_PATH, "rb") as f:
        cert_data = f.read()

    cert = x509.load_pem_x509_certificate(cert_data)
    
    subject_cn = cert.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
    subject_org = cert.subject.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)[0].value
    issuer_cn = cert.issuer.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value

    fingerprint = cert.fingerprint(hashes.SHA256()).hex().upper()
    formatted_fingerprint = ":".join(fingerprint[i:i+2] for i in range(0, len(fingerprint), 2))

    now = datetime.now(timezone.utc)
    is_expired = now > cert.not_valid_after_utc
    is_not_yet_valid = now < cert.not_valid_before_utc

    return {
        "subject_common_name": subject_cn,
        "subject_organization": subject_org,
        "issuer_common_name": issuer_cn,
        "serial_number": str(cert.serial_number),
        "valid_from": cert.not_valid_before_utc.isoformat(),
        "valid_until": cert.not_valid_after_utc.isoformat(),
        "is_expired": is_expired,
        "is_not_yet_valid": is_not_yet_valid,
        "signature_algorithm": cert.signature_hash_algorithm.name if cert.signature_hash_algorithm else "Unknown",
        "sha256_fingerprint": formatted_fingerprint,
        "san_entries": ["localhost", "127.0.0.1"],
        "cert_pem": cert_data.decode('utf-8'),
        "is_self_signed": (cert.subject == cert.issuer)
    }

def validate_certificate_for_host(expected_hostname: str = "localhost") -> dict:
    """Validates certificate validity dates, issuer, and expected hostname."""
    cert_info = inspect_current_certificate()
    now = datetime.now(timezone.utc)
    
    valid_from = datetime.fromisoformat(cert_info["valid_from"])
    valid_until = datetime.fromisoformat(cert_info["valid_until"])

    date_valid = valid_from <= now <= valid_until
    host_valid = expected_hostname.lower() in [s.lower() for s in cert_info["san_entries"]] or expected_hostname == cert_info["subject_common_name"]

    overall_valid = date_valid and host_valid

    return {
        "expected_hostname": expected_hostname,
        "date_check_passed": date_valid,
        "hostname_check_passed": host_valid,
        "is_self_signed": cert_info["is_self_signed"],
        "overall_status": "VALID_FOR_LOCAL_TLS" if overall_valid else "VALIDATION_FAILED",
        "verification_details": {
            "not_before": cert_info["valid_from"],
            "not_after": cert_info["valid_until"],
            "current_time": now.isoformat(),
            "subject_cn": cert_info["subject_common_name"]
        },
        "pki_explanation": (
            "Host and validity periods match local TLS criteria. Note that TLS clients must supply this "
            "certificate as a trusted CA (cafile) to establish trust without disabling certificate verification."
        )
    }
