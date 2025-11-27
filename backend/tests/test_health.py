import re
import time

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# Maximum reasonable uptime during test execution (1 hour)
_MAX_TEST_UPTIME_SECONDS = 3600


def test_health_ok():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_metrics_exposes_prometheus_format():
    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/plain")
    assert b"app_uptime_seconds" in resp.content


def _parse_uptime(response_content: bytes) -> float:
    """Extract the uptime value from Prometheus metrics response."""
    content = response_content.decode("utf-8")
    match = re.search(r"app_uptime_seconds\s+([\d.]+)", content)
    if match:
        return float(match.group(1))
    raise ValueError("Could not parse app_uptime_seconds from metrics response")


def test_metrics_uptime_increases():
    """Test that uptime increases between sequential requests."""
    resp1 = client.get("/metrics")
    uptime1 = _parse_uptime(resp1.content)

    time.sleep(0.1)

    resp2 = client.get("/metrics")
    uptime2 = _parse_uptime(resp2.content)

    # Verify uptime increased between requests
    assert uptime2 > uptime1, f"Uptime should increase: {uptime2} should be > {uptime1}"


def test_metrics_uptime_is_elapsed_time():
    """Test that uptime represents elapsed time, not Unix timestamp."""
    resp = client.get("/metrics")
    uptime = _parse_uptime(resp.content)

    # Unix timestamps would be ~1.7 billion seconds (since 1970)
    # Reasonable test uptime should be well under the max test uptime threshold
    assert uptime < _MAX_TEST_UPTIME_SECONDS, (
        f"Uptime {uptime} looks like Unix timestamp, not elapsed time"
    )
