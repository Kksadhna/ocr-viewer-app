from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
import io
from deep_translator import GoogleTranslator  # ✅ use deep-translator

app = Flask(__name__)
CORS(app)

@app.route("/ocr", methods=["POST"])
def ocr():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded under 'file' field"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    target_lang = request.form.get("lang", "en")

    try:
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))

        # OCR
        original_text = pytesseract.image_to_string(image)

        # Translation
        translated_text = ""
        if original_text.strip():
            translated_text = GoogleTranslator(source="auto", target=target_lang).translate(original_text)

        return jsonify({
            "original": original_text,
            "translated": translated_text
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
