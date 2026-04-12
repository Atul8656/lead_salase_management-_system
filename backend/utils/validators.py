import re

def validate_email(email: str):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email) is not None
