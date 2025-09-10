# PyTesseract Backend

## Setup

1. Create a Python virtual environment (recommended) and activate it.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Ensure the native Tesseract OCR engine is installed and available in PATH.
   - Windows: install from https://github.com/UB-Mannheim/tesseract/wiki
   - macOS: `brew install tesseract`
   - Linux (Debian/Ubuntu): `sudo apt-get install tesseract-ocr`

## Run

```bash
python app.py
```
This starts the server on http://localhost:5001

## Endpoint

- `POST /ocr` with form-data field `file`: returns `{"text": "..."}`