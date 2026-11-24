"""The live wall: stats, entries with reactions, a word cloud. Public — no sign-in needed."""

from fastapi.testclient import TestClient

from app.config import settings
from app.wall import top_words
from tests.conftest import FakeEmailSender, sign_in


def give_feedback(
    client: TestClient, outbox: FakeEmailSender, email: str, rating: int, comment: str = ""
) -> int:
    sign_in(client, outbox, email, name=email.split("@")[0].title())
    response = client.post("/api/feedback", json={"rating": rating, "comment": comment})
    assert response.status_code == 201
    feedback_id: int = response.json()["id"]
    return feedback_id


def test_empty_wall(client: TestClient) -> None:
    wall = client.get("/api/wall").json()
    assert wall["average"] is None
    assert wall["count"] == 0
    assert wall["histogram"] == [0, 0, 0, 0, 0]
    assert wall["entries"] == []
    assert wall["words"] == []


def test_average_and_histogram(client: TestClient, outbox: FakeEmailSender) -> None:
    give_feedback(client, outbox, "a@example.com", 5)
    give_feedback(client, outbox, "b@example.com", 4)
    give_feedback(client, outbox, "c@example.com", 4)
    client.post("/api/auth/sign-out")

    wall = client.get("/api/wall").json()

    assert wall["count"] == 3
    assert wall["average"] == 4.33
    assert wall["histogram"] == [0, 0, 0, 2, 1]  # how many gave 1, 2, 3, 4, 5 stars


def test_entries_show_names_but_never_emails(client: TestClient, outbox: FakeEmailSender) -> None:
    give_feedback(client, outbox, "ada@example.com", 5, "Brilliant")
    client.post("/api/auth/sign-out")

    response = client.get("/api/wall")

    entry = response.json()["entries"][0]
    assert entry["display_name"] == "Ada"
    assert entry["comment"] == "Brilliant"
    assert "@" not in response.text


def test_join_url_points_to_the_sign_in_page(client: TestClient) -> None:
    assert client.get("/api/wall").json()["join_url"] == settings.public_url


def test_word_cloud_counts_words_and_skips_common_ones(
    client: TestClient, outbox: FakeEmailSender
) -> None:
    give_feedback(client, outbox, "a@example.com", 5, "The demos were great and fun")
    give_feedback(client, outbox, "b@example.com", 4, "Great demos! The pace is GREAT.")

    words = client.get("/api/wall").json()["words"]

    assert words[0] == {"word": "great", "count": 3}
    assert {"word": "demos", "count": 2} in words
    assert not {"the", "and", "is", "were"} & {w["word"] for w in words}


def test_word_cloud_skips_contractions() -> None:
    words = {w.word for w in top_words(["It's great, don't change it. I'm happy!"])}
    assert words == {"great", "change", "happy"}


def test_top_words_ignores_short_words_and_limits_the_list() -> None:
    comments = ["ok AI " + " ".join("x" * length for length in range(3, 20))]  # xxx, xxxx, ...
    words = top_words(comments, limit=10)
    assert len(words) == 10
    assert all(len(word.word) >= 3 for word in words)


def test_reacting_needs_sign_in(client: TestClient, outbox: FakeEmailSender) -> None:
    feedback_id = give_feedback(client, outbox, "a@example.com", 5)
    client.post("/api/auth/sign-out")
    response = client.post(f"/api/feedback/{feedback_id}/reactions", json={"emoji": "clap"})
    assert response.status_code == 401


def test_reactions_are_counted_and_toggle(client: TestClient, outbox: FakeEmailSender) -> None:
    feedback_id = give_feedback(client, outbox, "a@example.com", 5)
    url = f"/api/feedback/{feedback_id}/reactions"

    client.post(url, json={"emoji": "clap"})
    client.post(url, json={"emoji": "heart"})
    sign_in(client, outbox, "b@example.com")
    client.post(url, json={"emoji": "clap"})

    entry = client.get("/api/wall").json()["entries"][0]
    assert entry["reactions"] == {"clap": 2, "laugh": 0, "heart": 1}
    assert entry["my_reactions"] == ["clap"]

    response = client.post(url, json={"emoji": "heart"})  # bob adds a heart
    assert response.json() == {
        "reactions": {"clap": 2, "laugh": 0, "heart": 2},
        "my_reactions": ["clap", "heart"],
    }

    client.post(url, json={"emoji": "heart"})
    client.post(url, json={"emoji": "clap"})  # pressing again takes it back
    entry = client.get("/api/wall").json()["entries"][0]
    assert entry["reactions"]["clap"] == 1
    assert entry["my_reactions"] == []


def test_only_known_emoji_on_existing_entries(client: TestClient, outbox: FakeEmailSender) -> None:
    feedback_id = give_feedback(client, outbox, "a@example.com", 5)
    url = f"/api/feedback/{feedback_id}/reactions"
    assert client.post(url, json={"emoji": "poop"}).status_code == 422
    assert client.post("/api/feedback/999999/reactions", json={"emoji": "clap"}).status_code == 404
