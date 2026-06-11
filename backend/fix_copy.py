with open('../frontend/src/pages/app/Home.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    "Record your voice \u2014 we'll clean it up and re-speak it clearly for the business.",
    "Send a voice message \u2014 we'll make sure every detail reaches the business accurately."
)
content = content.replace(
    "AI cleans & transcribes",
    "AI captures every detail accurately"
)
content = content.replace(
    "We fix grammar, fill gaps, generate a summary.",
    "Every word and detail is captured accurately."
)
content = content.replace(
    "Clear voice is generated",
    "A clear version is created"
)
content = content.replace(
    "A polished AI version re-speaks your message.",
    "A clear audio version is prepared for the business."
)
content = content.replace(
    "Business receives both",
    "Business receives your full message"
)
content = content.replace(
    "They hear the original + the AI-clarified version.",
    "They receive your original message plus a complete transcript."
)
with open('../frontend/src/pages/app/Home.tsx', 'w') as f:
    f.write(content)
print('Home.tsx updated')

with open('../frontend/src/pages/app/Record.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    "Speak naturally \u2014 we'll clarify it for the business.",
    "Speak naturally \u2014 we'll make sure nothing gets missed."
)
with open('../frontend/src/pages/app/Record.tsx', 'w') as f:
    f.write(content)
print('Record.tsx updated')

with open('../frontend/src/pages/app/Onboarding.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    "Tell us about your accent",
    "Help us capture your message accurately"
)
content = content.replace(
    "This helps our AI better understand your speech patterns and generate more accurate transcripts.",
    "Select your primary language background so our AI can better understand your speech patterns and capture every detail correctly."
)
with open('../frontend/src/pages/app/Onboarding.tsx', 'w') as f:
    f.write(content)
print('Onboarding.tsx updated')