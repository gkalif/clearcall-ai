# Fix 1: auth.py
with open('core/auth.py', 'r') as f:
    content = f.read()
content = content.replace('user_id: int = payload.get("sub")', 'user_id = payload.get("sub")')
content = content.replace('User.id == user_id', 'User.id == int(user_id)')
with open('core/auth.py', 'w') as f:
    f.write(content)
print('auth.py fixed')

# Fix 2: routers/auth.py
with open('routers/auth.py', 'r') as f:
    content = f.read()
content = content.replace('"sub": user.id,', '"sub": str(user.id),')
content = content.replace('"sub": biz.id,', '"sub": str(biz.id),')
with open('routers/auth.py', 'w') as f:
    f.write(content)
print('routers/auth.py fixed')