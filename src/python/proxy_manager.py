import os
from urllib.parse import urlparse

class ProxyManager:
    """A utility class for parsing and managing proxy configurations."""

    @staticmethod
    def parse_proxy_url(proxy_url: str) -> dict or None:
        """Parses a proxy URL string into a dictionary suitable for Playwright.

        Args:
            proxy_url: The proxy URL string (e.g., 'http://user:pass@host:port').

        Returns:
            A dictionary with 'server', 'username', and 'password' keys, or None if parsing fails.
        """
        if not proxy_url:
            print("Warning: Proxy URL is empty.")
            return None

        try:
            parsed_url = urlparse(proxy_url)

            if not all([parsed_url.scheme, parsed_url.hostname, parsed_url.port]):
                print(f"Warning: Invalid proxy URL format: {proxy_url}. Missing scheme, hostname, or port.")
                return None

            proxy_config = {
                "server": f"{parsed_url.scheme}://{parsed_url.hostname}:{parsed_url.port}"
            }

            if parsed_url.username:
                proxy_config["username"] = parsed_url.username
            if parsed_url.password:
                proxy_config["password"] = parsed_url.password

            print(f"Successfully parsed proxy URL: {proxy_url}")
            return proxy_config

        except Exception as e:
            print(f"Error parsing proxy URL '{proxy_url}': {e}")
            return None

# Example Usage (for local testing)
if __name__ == "__main__":
    # Test with a valid proxy URL
    valid_proxy = "http://myuser:mypass@proxy.example.com:8080"
    config = ProxyManager.parse_proxy_url(valid_proxy)
    print(f"Config for valid proxy: {config}")

    # Test with a proxy URL without credentials
    no_auth_proxy = "http://proxy.example.com:3128"
    config = ProxyManager.parse_proxy_url(no_auth_proxy)
    print(f"Config for no-auth proxy: {config}")

    # Test with an invalid proxy URL
    invalid_proxy = "invalid-url"
    config = ProxyManager.parse_proxy_url(invalid_proxy)
    print(f"Config for invalid proxy: {config}")

    # Test with an empty proxy URL
    empty_proxy = ""
    config = ProxyManager.parse_proxy_url(empty_proxy)
    print(f"Config for empty proxy: {config}")

    # Test with proxy URL from environment variable
    os.environ["TEST_PROXY_URL"] = "http://envuser:envpass@envproxy.com:9000"
    env_proxy = os.environ.get("TEST_PROXY_URL")
    config = ProxyManager.parse_proxy_url(env_proxy)
    print(f"Config from env variable: {config}")
    del os.environ["TEST_PROXY_URL"]
