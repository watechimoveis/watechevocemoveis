def test_health_returns_ok_and_storage_mode(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["storage"] in ("local", "supabase")
