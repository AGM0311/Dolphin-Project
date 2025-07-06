from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import unicodedata

app = Flask(__name__)
CORS(app)

# Cargar datos desde el archivo JSON al iniciar la app
with open('datos.json', encoding='utf-8') as f:
    datos = json.load(f)

def normalize_text(text):
    return ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    ).lower()

@app.route("/api/datos")
def get_datos():
    alcaldia = request.args.get("alcaldia", "")
    alcaldia_norm = normalize_text(alcaldia)

    result = next(
        (d for d in datos if normalize_text(d["NOM_MUN"]) == alcaldia_norm),
        None
    )
    if result:
        return jsonify(result)
    else:
        return jsonify({"valor": "Sin datos"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
