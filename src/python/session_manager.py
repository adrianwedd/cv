import gnupg
import os
import base64

class SessionManager:
    """A utility class for encrypting and decrypting session states using GnuPG."""

    def __init__(self, gnupg_home: str = None):
        """Initializes the SessionManager.

        Args:
            gnupg_home: Optional path to the GnuPG home directory. If None, uses default.
        """
        self.gpg = gnupg.GPG(gnupg_home=gnupg_home)
        # Ensure a GPG key is available for testing/development purposes
        # In a real CI environment, keys would be imported securely.
        if not self.gpg.list_keys():
            print("Warning: No GPG keys found. Generating a new key pair for testing.")
            self._generate_test_key()

    def _generate_test_key(self):
        """Generates a test GPG key pair. FOR DEVELOPMENT ONLY."""
        input_data = self.gpg.gen_key_input(
            key_type="RSA",
            key_length=2048,
            name_real="Test User",
            name_comment="Generated for SessionManager testing",
            name_email="test@example.com",
            passphrase="testpass"
        )
        key = self.gpg.gen_key(input_data)
        print(f"Generated GPG key: {key.fingerprint}")

    def encrypt_session_state(self, session_data: str, recipient_fingerprint: str, passphrase: str) -> str:
        """Encrypts session data using GnuPG.

        Args:
            session_data: The session data (e.g., JSON string) to encrypt.
            recipient_fingerprint: The fingerprint of the recipient's public key.
            passphrase: The passphrase for the recipient's private key (if needed for encryption, though typically only for decryption).

        Returns:
            Base64 encoded encrypted session data.
        """
        encrypted_data = self.gpg.encrypt(session_data, recipients=[recipient_fingerprint], passphrase=passphrase, always_trust=True)
        if not encrypted_data.ok:
            raise Exception(f"GPG encryption failed: {encrypted_data.stderr}")
        return base64.b64encode(str(encrypted_data).encode('utf-8')).decode('utf-8')

    def decrypt_session_state(self, encrypted_session_data_b64: str, passphrase: str) -> str:
        """Decrypts Base64 encoded session data using GnuPG.

        Args:
            encrypted_session_data_b64: Base64 encoded encrypted session data.
            passphrase: The passphrase for the private key used for decryption.

        Returns:
            Decrypted session data string.
        """
        decoded_data = base64.b64decode(encrypted_session_data_b64).decode('utf-8')
        decrypted_data = self.gpg.decrypt(decoded_data, passphrase=passphrase)
        if not decrypted_data.ok:
            raise Exception(f"GPG decryption failed: {decrypted_data.stderr}")
        return str(decrypted_data)

# Example Usage (for local testing)
if __name__ == "__main__":
    # Ensure GnuPG is installed and configured on your system for this example to run.
    # For testing, you might want to set a temporary GnuPG home directory.
    # import tempfile
    # with tempfile.TemporaryDirectory() as tmpdir:
    #     session_manager = SessionManager(gnupg_home=tmpdir)

    session_manager = SessionManager()

    # Generate a test key if none exists (for demonstration)
    # In a real scenario, you would import existing keys.
    keys = session_manager.gpg.list_keys()
    if not keys:
        print("Please generate a GPG key or import one for testing.")
        print("Example: gpg --gen-key")
        exit(1)

    # Use the first available key for testing
    test_fingerprint = keys[0]['fingerprint']
    print(f"Using GPG key with fingerprint: {test_fingerprint}")

    original_session_data = '{"cookies": [{"name": "sessionid", "value": "abc"}]}'
    test_passphrase = "testpass" # This should match the passphrase of your test key

    try:
        # Encrypt
        encrypted_b64 = session_manager.encrypt_session_state(
            original_session_data,
            test_fingerprint,
            test_passphrase # Passphrase for encryption is usually not needed unless key is protected
        )
        print(f"Encrypted (Base64): {encrypted_b64}")

        # Decrypt
        decrypted_data = session_manager.decrypt_session_state(
            encrypted_b64,
            test_passphrase
        )
        print(f"Decrypted: {decrypted_data}")

        assert original_session_data == decrypted_data
        print("Encryption and decryption successful!")

    except Exception as e:
        print(f"Test failed: {e}")
        print("Ensure GnuPG is installed and a key with the specified passphrase exists.")
        print("You might need to run 'gpg --import' or 'gpg --gen-key' and ensure the passphrase is correct.")
