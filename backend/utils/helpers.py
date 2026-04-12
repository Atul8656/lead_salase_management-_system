def format_phone_number(phone: str):
    # Simple helper to clean phone numbers
    return "".join(filter(str.isdigit, phone)) if phone else None
