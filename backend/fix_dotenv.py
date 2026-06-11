with open('main.py', 'r') as f:
    content = f.read()

if 'load_dotenv' not in content:
    content = 'from dotenv import load_dotenv\nload_dotenv()\n\n' + content
    with open('main.py', 'w') as f:
        f.write(content)
    print('Fixed - load_dotenv added to main.py')
else:
    print('load_dotenv already in main.py')