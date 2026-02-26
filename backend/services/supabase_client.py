"""
Supabase Client — Uses postgrest + httpx for DB/Storage operations
(Avoids full `supabase` SDK which requires C++ build tools on Windows)
"""
import os
import httpx
from postgrest import SyncPostgrestClient

_postgrest: SyncPostgrestClient | None = None
_url: str = ""
_service_key: str = ""


def _init():
    global _postgrest, _url, _service_key
    _url = os.getenv("SUPABASE_URL", "")
    _service_key = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
    if not _url or not _service_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
    _postgrest = SyncPostgrestClient(
        f"{_url}/rest/v1",
        headers={
            "apikey": _service_key,
            "Authorization": f"Bearer {_service_key}",
        },
    )


class SupabaseHelper:
    """Lightweight Supabase helper wrapping postgrest + httpx for storage."""

    def table(self, name: str):
        global _postgrest
        if _postgrest is None:
            _init()
        return _postgrest.from_(name)

    class _Storage:
        def from_(self, bucket: str):
            return SupabaseHelper._Bucket(bucket)

    class _Bucket:
        def __init__(self, bucket: str):
            self.bucket = bucket

        def upload(self, path: str, file_body: bytes, options: dict | None = None):
            url = f"{_url}/storage/v1/object/{self.bucket}/{path}"
            content_type = (options or {}).get("content-type", "application/octet-stream")
            resp = httpx.post(
                url,
                content=file_body,
                headers={
                    "apikey": _service_key,
                    "Authorization": f"Bearer {_service_key}",
                    "Content-Type": content_type,
                },
            )
            return resp.json() if resp.status_code < 400 else None

    storage = _Storage()

    class _Auth:
        def get_user(self, token: str):
            resp = httpx.get(
                f"{_url}/auth/v1/user",
                headers={
                    "apikey": _service_key,
                    "Authorization": f"Bearer {token}",
                },
            )
            if resp.status_code == 200:
                data = resp.json()

                class _User:
                    def __init__(self, d):
                        self.id = d.get("id", "")
                        self.email = d.get("email", "")

                class _Result:
                    def __init__(self, d):
                        self.user = _User(d)

                return _Result(data)
            return None

    auth = _Auth()


_helper: SupabaseHelper | None = None


def get_supabase() -> SupabaseHelper:
    """Get the Supabase helper singleton."""
    global _helper
    if _helper is None:
        _init()
        _helper = SupabaseHelper()
    return _helper
