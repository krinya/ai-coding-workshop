"""Sending email. Routes ask for an `EmailSenderDep` and call `.send(Email(...))`.

- With RESEND_API_KEY set, email goes out through Resend's HTTP API.
- Otherwise it goes over SMTP to Mailpit, which catches it (inbox: http://localhost:8025).
- Tests swap in a fake sender that keeps emails in a list (see tests/conftest.py).
"""

import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from typing import Annotated, Protocol

import httpx
from fastapi import Depends

from app.config import settings


@dataclass
class Email:
    to: str
    subject: str
    text: str


class EmailSender(Protocol):
    def send(self, email: Email) -> None: ...


class SmtpEmailSender:
    def send(self, email: Email) -> None:
        message = EmailMessage()
        message["From"] = settings.email_from
        message["To"] = email.to
        message["Subject"] = email.subject
        message.set_content(email.text)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            smtp.send_message(message)


class ResendEmailSender:
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key

    def send(self, email: Email) -> None:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "from": settings.email_from,
                "to": [email.to],
                "subject": email.subject,
                "text": email.text,
            },
            timeout=10,
        )
        response.raise_for_status()


def get_email_sender() -> EmailSender:
    if settings.resend_api_key is not None:
        return ResendEmailSender(settings.resend_api_key.get_secret_value())
    return SmtpEmailSender()


EmailSenderDep = Annotated[EmailSender, Depends(get_email_sender)]
