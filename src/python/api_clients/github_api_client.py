import requests
import os

class GitHubApiClient:
    """A client for interacting with the GitHub API to fetch repository data."""

    BASE_URL = "https://api.github.com"

    def __init__(self, token: str, owner: str, repo: str):
        """Initializes the GitHubApiClient.

        Args:
            token: GitHub Personal Access Token for authentication.
            owner: The owner of the repository.
            repo: The name of the repository.
        """
        self.token = token
        self.owner = owner
        self.repo = repo
        self.headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHubDataMiner/1.0"
        }

    def _make_request(self, endpoint: str, params: dict = None) -> dict or list:
        """Makes a GET request to the GitHub API.

        Args:
            endpoint: The API endpoint (e.g., /repos/{owner}/{repo}/commits).
            params: Optional dictionary of query parameters.

        Returns:
            The JSON response from the API.

        Raises:
            requests.exceptions.RequestException: If the API request fails.
        """
        url = f"{self.BASE_URL}{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()

    def get_commits(self, sha: str = None, author: str = None, since: str = None, until: str = None, per_page: int = 100, page: int = 1) -> list:
        """Fetches commit data for the repository.

        Args:
            sha: SHA or name of the commit, branch, or tag.
            author: GitHub login or email of the author.
            since: Only commits after this date will be returned (ISO 8601 format).
            until: Only commits before this date will be returned (ISO 8601 format).
            per_page: Number of results per page (max 100).
            page: Page number of the results to fetch.

        Returns:
            A list of commit dictionaries.
        """
        endpoint = f"/repos/{self.owner}/{self.repo}/commits"
        params = {
            "sha": sha,
            "author": author,
            "since": since,
            "until": until,
            "per_page": per_page,
            "page": page
        }
        # Filter out None values from params
        params = {k: v for k, v in params.items() if v is not None}
        return self._make_request(endpoint, params=params)

    def get_issues(self, state: str = "all", labels: str = None, since: str = None, per_page: int = 100, page: int = 1) -> list:
        """Fetches issue data for the repository.

        Args:
            state: State of the issues (open, closed, all).
            labels: Comma-separated list of labels.
            since: Only issues updated at or after this date will be returned (ISO 8601 format).
            per_page: Number of results per page (max 100).
            page: Page number of the results to fetch.

        Returns:
            A list of issue dictionaries.
        """
        endpoint = f"/repos/{self.owner}/{self.repo}/issues"
        params = {
            "state": state,
            "labels": labels,
            "since": since,
            "per_page": per_page,
            "page": page
        }
        params = {k: v for k, v in params.items() if v is not None}
        return self._make_request(endpoint, params=params)

    def get_pull_requests(self, state: str = "all", head: str = None, base: str = None, sort: str = "created", direction: str = "desc", per_page: int = 100, page: int = 1) -> list:
        """Fetches pull request data for the repository.

        Args:
            state: State of the pull request (open, closed, all).
            head: Filter pulls by head user or head organization and branch name.
            base: Filter pulls by base branch name.
            sort: What to sort results by (created, updated, popularity, long-running).
            direction: Order of results (asc or desc).
            per_page: Number of results per page (max 100).
            page: Page number of the results to fetch.

        Returns:
            A list of pull request dictionaries.
        """
        endpoint = f"/repos/{self.owner}/{self.repo}/pulls"
        params = {
            "state": state,
            "head": head,
            "base": base,
            "sort": sort,
            "direction": direction,
            "per_page": per_page,
            "page": page
        }
        params = {k: v for k, v in params.items() if v is not None}
        return self._make_request(endpoint, params=params)

    def get_repo_traffic_views(self) -> dict:
        """Fetches repository traffic views data.

        Returns:
            A dictionary containing view count data.
        """
        endpoint = f"/repos/{self.owner}/{self.repo}/traffic/views"
        return self._make_request(endpoint)

    def get_repo_traffic_clones(self) -> dict:
        """Fetches repository traffic clones data.

        Returns:
            A dictionary containing clone count data.
        """
        endpoint = f"/repos/{self.owner}/{self.repo}/traffic/clones"
        return self._make_request(endpoint)

    def get_repo_referrers(self) -> list:
        """Fetches top 10 referring sites for the repository.

        Returns:
            A list of referrer dictionaries.
        """
        endpoint = f"/repos/{self.owner}/{self.repo}/traffic/popular/referrers"
        return self._make_request(endpoint)

    def get_repo_paths(self) -> list:
        """Fetches top 10 popular content paths for the repository.

        Returns:
            A list of path dictionaries.
        """
        endpoint = f"/repos/{self.owner}/{self.repo}/traffic/popular/paths"
        return self._make_request(endpoint)

    def get_contributors_stats(self) -> list:
        """Fetches contributor statistics for the repository.

        Returns:
            A list of contributor statistics dictionaries.
        """
        endpoint = f"/repos/{self.owner}/{self.repo}/stats/contributors"
        return self._make_request(endpoint)

# Example Usage (for local testing)
if __name__ == "__main__":
    # Ensure you have a GitHub Personal Access Token set as an environment variable
    # For example: export GITHUB_TOKEN="YOUR_PAT_HERE"
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        print("Please set the GITHUB_TOKEN environment variable.")
        exit(1)

    # Replace with your GitHub username and a public repository for testing
    test_owner = "octocat"
    test_repo = "Spoon-Knife"

    client = GitHubApiClient(github_token, test_owner, test_repo)

    try:
        print(f"\n--- Commits for {test_owner}/{test_repo} ---")
        commits = client.get_commits(per_page=5)
        for commit in commits:
            print(f"- {commit['sha'][:7]}: {commit['commit']['message']}")

        print(f"\n--- Issues for {test_owner}/{test_repo} (open) ---")
        issues = client.get_issues(state="open", per_page=3)
        for issue in issues:
            print(f"- #{issue['number']}: {issue['title']}")

        print(f"\n--- Pull Requests for {test_owner}/{test_repo} (all) ---")
        pulls = client.get_pull_requests(state="all", per_page=3)
        for pull in pulls:
            print(f"- #{pull['number']}: {pull['title']}")

        print(f"\n--- Repository Views for {test_owner}/{test_repo} ---")
        views = client.get_repo_traffic_views()
        print(f"Total views: {views['count']}, Unique views: {views['uniques']}")

        print(f"\n--- Top Referrers for {test_owner}/{test_repo} ---")
        referrers = client.get_repo_referrers()
        for referrer in referrers:
            print(f"- {referrer['referrer']}: {referrer['count']} views")

        print(f"\n--- Contributors Stats for {test_owner}/{test_repo} ---")
        contributors = client.get_contributors_stats()
        for contributor in contributors:
            print(f"- {contributor['author']['login']}: {contributor['total']} total contributions")

    except requests.exceptions.RequestException as e:
        print(f"API Request Error: {e}")
        if e.response is not None:
            print(f"Response Status Code: {e.response.status_code}")
            print(f"Response Body: {e.response.text}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
