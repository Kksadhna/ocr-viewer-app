from deep_translator import GoogleTranslator

# Example: English → Hindi
translated = GoogleTranslator(source='en', target='hi').translate("Hello, how are you?")

print("Translated:", translated)

