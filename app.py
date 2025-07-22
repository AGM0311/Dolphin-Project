from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, errors
import json
import unicodedata

app = Flask(__name__)
CORS(app)

# === Conexión a MongoDB Atlas como función reutilizable ===
def get_coleccion():
    uri = "mongodb+srv://universal:general@proyectodelfin.semlbkd.mongodb.net/"
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.server_info()  # Fuerza conexión
        db = client["Egresos"]         # Nombre de la base de datos
        coleccion = db["Registro"]     # Nombre de la colección
        print("✅ Conexión exitosa a MongoDB Atlas")
        return coleccion
    except errors.ServerSelectionTimeoutError as err:
        print("❌ Error de conexión a MongoDB Atlas:", err)
        return None

# === Carga de archivo local ===
with open('datos.json', encoding='utf-8') as f:
    datos = json.load(f)

# === Normalizador de texto ===
def normalize_text(text):
    return ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    ).lower()

# === Ruta que usa archivo local ===
@app.route("/api/datos")
def get_datos():
    alcaldia = request.args.get("alcaldia", "")
    alcaldia_norm = normalize_text(alcaldia)

    result = next(
        (d for d in datos if normalize_text(d["NOM_MUN"]) == alcaldia_norm),
        None
    )

    if result:
        return jsonify({"enfermedades": result.get("enfermedades", {})})
    else:
        return jsonify({"enfermedades": None, "mensaje": "Sin datos para esa alcaldía"})

# === Ruta que usa MongoDB Atlas ===
@app.route("/api/bd")
def get_datos_db():
    coleccion = get_coleccion()
    if not coleccion:
        return jsonify({"error": "Base de datos no disponible"}), 500

    resultados = list(coleccion.find({}, {"_id": 0}))
    return jsonify(resultados)

# === Ejecución del servidor ===
if __name__ == "__main__":
    app.run(debug=True, port=5000)
    