
import subprocess

class RcloneClient:
    """A client for interacting with rclone to manage files on cloud storage."""

    def __init__(self, rclone_path: str = "rclone"):
        """Initializes the RcloneClient.

        Args:
            rclone_path: The path to the rclone executable. Defaults to "rclone" (assumes it's in PATH).
        """
        self.rclone_path = rclone_path

    def _run_command(self, command_args: list) -> str:
        """Executes an rclone command using subprocess.

        Args:
            command_args: A list of arguments for the rclone command (e.g., ["lsf", "myremote:path"]).

        Returns:
            The stdout of the rclone command.

        Raises:
            subprocess.CalledProcessError: If the rclone command returns a non-zero exit code.
            FileNotFoundError: If the rclone executable is not found.
        """
        full_command = [self.rclone_path] + command_args
        try:
            result = subprocess.run(full_command, capture_output=True, text=True, check=True)
            return result.stdout
        except subprocess.CalledProcessError as e:
            print(f"Error executing rclone command: {e}")
            print(f"Command: {' '.join(e.cmd)}")
            print(f"Stdout: {e.stdout}")
            print(f"Stderr: {e.stderr}")
            raise
        except FileNotFoundError:
            print("Error: rclone command not found. Make sure rclone is installed and in your PATH.")
            raise

    def lsf(self, remote_path: str, include_filters: list = None, exclude_filters: list = None, recursive: bool = False) -> list:
        """Lists files and directories on a remote.

        Args:
            remote_path: The path on the rclone remote (e.g., "myremote:path/to/dir").
            include_filters: List of glob patterns to include (e.g., ["*.pdf", "*.docx"]).
            exclude_filters: List of glob patterns to exclude.
            recursive: Whether to list files recursively.

        Returns:
            A list of file/directory names.
        """
        command_args = ["lsf", remote_path]
        if recursive:
            command_args.append("--recursive")
        for f in include_filters or []:
            command_args.append(f"--include={f}")
        for f in exclude_filters or []:
            command_args.append(f"--exclude={f}")

        output = self._run_command(command_args)
        return [line.strip() for line in output.splitlines() if line.strip()]

    def copy(self, source_path: str, destination_path: str, include_filters: list = None, exclude_filters: list = None) -> str:
        """Copies files from a source path to a destination path.

        Args:
            source_path: The source path (e.g., "myremote:path/to/file" or "/local/path").
            destination_path: The destination path (e.g., "/local/path" or "myremote:path/to/dir").
            include_filters: List of glob patterns to include.
            exclude_filters: List of glob patterns to exclude.

        Returns:
            The stdout of the rclone command.
        """
        command_args = ["copy", source_path, destination_path]
        for f in include_filters or []:
            command_args.append(f"--include={f}")
        for f in exclude_filters or []:
            command_args.append(f"--exclude={f}")

        return self._run_command(command_args)
