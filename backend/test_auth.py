import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

# Test with one of the existing users
username = 'timotry'
password = 'password'

user = User.objects.get(username=username)
print(f"User {username} exists: {user is not None}")
print(f"User is_active: {user.is_active}")
print(f"Password check result: {user.check_password(password)}")
print(f"Authenticate result: {authenticate(username=username, password=password)}")

# Also test a fresh signup - try these credentials
print("\n--- Testing what password might have been set ---")
# Let's see the password hash structure
print(f"Password hash starts with: {user.password[:30]}")

# Try some common passwords
common_passwords = ['password', '123456', 'admin', 'test', 'password123']
for pwd in common_passwords:
    if user.check_password(pwd):
        print(f"Password is: {pwd}")
        break
else:
    print("Password not in common list")
