
# External API Wrappers

This directory contains Python wrappers for external APIs.

## `external_apis.py`

This module provides classes to interact with third-party APIs for fetching data such as firmographics and funding information.

### `AbstractApiWrapper`

Wrapper for the [Abstract API Company Enrichment](https://www.abstractapi.com/api/company-enrichment-api) for firmographics data.

**Initialization:**

```python
from api_wrappers.external_apis import AbstractApiWrapper

# API key can be passed directly or set as an environment variable ABSTRACT_API_KEY
api_wrapper = AbstractApiWrapper(api_key="YOUR_ABSTRACT_API_KEY")
```

**Usage:**

```python
company_info = api_wrapper.get_company_info(domain="google.com")
if company_info:
    print(company_info)
else:
    print("Failed to retrieve company info.")
```

### `IntellizenceApiWrapper`

Wrapper for the Intellizence Startup Funding Dataset API.

**Initialization:**

```python
from api_wrappers.external_apis import IntellizenceApiWrapper

# API key can be passed directly or set as an environment variable INTELLIZENCE_API_KEY
api_wrapper = IntellizenceApiWrapper(api_key="YOUR_INTELLIZENCE_API_KEY")
```

**Usage:**

```python
funding_data = api_wrapper.get_funding_data(query_params={'country': 'USA', 'limit': 10})
if funding_data:
    print(funding_data)
else:
    print("Failed to retrieve funding data.")
```

**Note:** For both wrappers, it is recommended to set the API keys as environment variables (`ABSTRACT_API_KEY` and `INTELLIZENCE_API_KEY`) to avoid hardcoding them in your code.
