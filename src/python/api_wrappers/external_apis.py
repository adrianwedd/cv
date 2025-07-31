
import requests
import os
from src.python.utils.logging_utils import setup_logger

logger = setup_logger(__name__, 'api_wrappers.log')

class AbstractApiWrapper:
    """Wrapper for the Abstract API for firmographics data."""
    BASE_URL = "https://companyenrichment.abstractapi.com/v1/"

    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("ABSTRACT_API_KEY")
        if not self.api_key:
            logger.error("ABSTRACT_API_KEY not found. Please set the environment variable or pass it to the constructor.")
            raise ValueError("ABSTRACT_API_KEY is required.")

    def get_company_info(self, domain):
        """Fetches company information by domain."""
        params = {
            "api_key": self.api_key,
            "domain": domain
        }
        try:
            response = requests.get(self.BASE_URL, params=params)
            response.raise_for_status()  # Raise an exception for HTTP errors
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching company info for {domain}: {e}")
            return None

class IntellizenceApiWrapper:
    """Wrapper for the Intellizence Startup Funding Dataset API."""
    # Note: This is a placeholder URL as the actual API endpoint for free trial is not directly available.
    # Users would need to sign up for a trial to get the actual endpoint and API key.
    BASE_URL = "https://api.intellizence.com/v1/funding/"

    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("INTELLIZENCE_API_KEY")
        if not self.api_key:
            logger.error("INTELLIZENCE_API_KEY not found. Please set the environment variable or pass it to the constructor.")
            raise ValueError("INTELLIZENCE_API_KEY is required.")

    def get_funding_data(self, query_params=None):
        """Fetches funding data based on query parameters."""
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        try:
            response = requests.get(self.BASE_URL, headers=headers, params=query_params)
            response.raise_for_status() # Raise an exception for HTTP errors
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching funding data with params {query_params}: {e}")
            return None

