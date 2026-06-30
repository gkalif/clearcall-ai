from slowapi import Limiter
from slowapi.util import get_remote_address

# Define the single source of truth for the rate limiter
limiter = Limiter(key_func=get_remote_address)