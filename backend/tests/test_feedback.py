"""The feedback form: one entry per person, which only its owner may change."""

import base64
import io
import struct
import zlib

from fastapi.testclient import TestClient
from PIL import Image

from tests.conftest import FakeEmailSender, sign_in

ADA = "ada@example.com"
BOB = "bob@example.com"


def photo(width: int = 1200, height: int = 800, image_format: str = "PNG") -> str:
    """A test picture as a base64 data URL, like the browser sends it."""
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), "orange").save(buffer, format=image_format)
    mime = f"image/{image_format.lower()}"
    return f"data:{mime};base64,{base64.b64encode(buffer.getvalue()).decode()}"


def submit(client: TestClient, **fields: object) -> int:
    body = {"rating": 5, "comment": "Great!", **fields}
    return client.post("/api/feedback", json=body).status_code


def mine(client: TestClient) -> dict[str, object] | None:
    response = client.get("/api/feedback/mine")
    assert response.status_code == 200
    result: dict[str, object] | None = response.json()
    return result


def test_must_be_signed_in(client: TestClient) -> None:
    assert submit(client) == 401
    assert client.get("/api/feedback/mine").status_code == 401


def test_submit_and_read_back(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    assert mine(client) is None

    assert submit(client, rating=4, comment="  Loved the demos  ") == 201

    entry = mine(client)
    assert entry is not None
    assert entry["rating"] == 4
    assert entry["comment"] == "Loved the demos"
    assert entry["photo_url"] is None


def test_one_entry_per_person(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    assert submit(client) == 201
    assert submit(client) == 409


def test_rating_must_be_one_to_five(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    assert submit(client, rating=0) == 422
    assert submit(client, rating=6) == 422
    assert client.post("/api/feedback", json={"comment": "no rating"}).status_code == 422


def test_comment_is_at_most_500_characters(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    assert submit(client, comment="x" * 501) == 422
    assert submit(client, comment="x" * 500) == 201


def test_photo_with_consent_is_saved_as_a_small_jpeg(
    client: TestClient, outbox: FakeEmailSender
) -> None:
    sign_in(client, outbox, ADA)
    assert submit(client, photo=photo(1200, 800), photo_consent=True) == 201

    entry = mine(client)
    assert entry is not None
    assert isinstance(entry["photo_url"], str)
    response = client.get(entry["photo_url"])
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    image = Image.open(io.BytesIO(response.content))
    assert image.format == "JPEG"
    assert max(image.size) <= 640


def test_photo_without_consent_is_not_saved(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    assert submit(client, photo=photo(), photo_consent=False) == 201
    entry = mine(client)
    assert entry is not None
    assert entry["photo_url"] is None


def test_a_photo_must_be_a_real_image(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    not_an_image = "data:image/png;base64," + base64.b64encode(b"<script>").decode()
    assert submit(client, photo=not_an_image, photo_consent=True) == 422
    assert submit(client, photo="%%% not base64 %%%", photo_consent=True) == 422


def test_a_photo_claiming_gigantic_dimensions_is_rejected(
    client: TestClient, outbox: FakeEmailSender
) -> None:
    """A "decompression bomb": a tiny file whose header claims 30000 x 30000 pixels."""
    buffer = io.BytesIO()
    Image.new("1", (1, 1)).save(buffer, format="PNG")
    png = bytearray(buffer.getvalue())
    png[16:24] = struct.pack(">II", 30_000, 30_000)  # width and height in the header
    png[29:33] = struct.pack(">I", zlib.crc32(png[12:29]))  # keep the header checksum valid
    bomb = "data:image/png;base64," + base64.b64encode(bytes(png)).decode()

    sign_in(client, outbox, ADA)
    assert submit(client, photo=bomb, photo_consent=True) == 422


def test_a_data_url_without_data_is_rejected(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    assert submit(client, photo="data:image/png", photo_consent=True) == 422


def test_a_photo_with_huge_dimensions_is_rejected(
    client: TestClient, outbox: FakeEmailSender
) -> None:
    sign_in(client, outbox, ADA)
    assert submit(client, photo=photo(6000, 6000), photo_consent=True) == 422


def test_update_own_entry(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    submit(client, photo=photo(), photo_consent=True)
    entry = mine(client)
    assert entry is not None

    response = client.put(
        f"/api/feedback/{entry['id']}", json={"rating": 2, "comment": "Changed my mind"}
    )

    assert response.status_code == 200
    updated = mine(client)
    assert updated is not None
    assert updated["rating"] == 2
    assert updated["comment"] == "Changed my mind"


def test_update_keeps_the_photo_unless_removed_or_consent_withdrawn(
    client: TestClient, outbox: FakeEmailSender
) -> None:
    sign_in(client, outbox, ADA)
    submit(client, photo=photo(), photo_consent=True)
    entry = mine(client)
    assert entry is not None
    url = f"/api/feedback/{entry['id']}"

    client.put(url, json={"rating": 3, "photo_consent": True})
    assert (mine(client) or {})["photo_url"] is not None  # no new photo sent: keep the old one

    client.put(url, json={"rating": 3, "photo_consent": False})
    assert (mine(client) or {})["photo_url"] is None  # consent withdrawn: photo deleted

    client.put(url, json={"rating": 3, "photo": photo(), "photo_consent": True})
    client.put(url, json={"rating": 3, "photo_consent": True, "remove_photo": True})
    assert (mine(client) or {})["photo_url"] is None


def test_delete_own_entry(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    submit(client)
    entry = mine(client)
    assert entry is not None

    assert client.delete(f"/api/feedback/{entry['id']}").status_code == 204
    assert mine(client) is None
    assert submit(client) == 201  # and can submit again


def test_cannot_change_someone_elses_entry(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    submit(client, rating=5, comment="Ada's")
    entry = mine(client)
    assert entry is not None
    url = f"/api/feedback/{entry['id']}"

    sign_in(client, outbox, BOB)
    assert client.put(url, json={"rating": 1, "comment": "hacked"}).status_code == 403
    assert client.delete(url).status_code == 403

    sign_in(client, outbox, ADA)
    assert mine(client) == entry  # unchanged


def test_changing_a_missing_entry_is_404(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA)
    assert client.put("/api/feedback/999999", json={"rating": 3}).status_code == 404
    assert client.delete("/api/feedback/999999").status_code == 404


def test_list_shows_names_but_never_emails(client: TestClient, outbox: FakeEmailSender) -> None:
    sign_in(client, outbox, ADA, name="Ada")
    submit(client, rating=5, comment="first")
    sign_in(client, outbox, BOB)  # no display name
    submit(client, rating=3, comment="second")
    client.post("/api/auth/sign-out")

    response = client.get("/api/feedback")  # public: no sign-in needed

    assert response.status_code == 200
    entries = response.json()
    assert [entry["comment"] for entry in entries] == ["second", "first"]  # newest first
    assert entries[1]["display_name"] == "Ada"
    assert entries[0]["display_name"] is None
    assert "@" not in response.text
