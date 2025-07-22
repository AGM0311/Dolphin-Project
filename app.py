from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, errors
import unicodedata

app = Flask(__name__)
CORS(app)

def get_coleccion(nombre_coleccion):
    uri = "mongodb+srv://universal:general@proyectodelfin.semlbkd.mongodb.net/"
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.server_info()
        db = client["Egresos"]  # Ajusta si tu base de datos tiene otro nombre
        coleccion = db[nombre_coleccion]
        print(f"✅ Conexión exitosa a MongoDB Atlas, colección: {nombre_coleccion}")
        return coleccion
    except errors.ServerSelectionTimeoutError as err:
        print("❌ Error de conexión a MongoDB Atlas:", err)
        return None

@app.route("/api/datos")
def get_datos():
    codigo = request.args.get("codigo")
    if codigo is None:
        return jsonify({"error": "Falta parámetro 'codigo'"}), 400

    try:
        codigo_int = int(codigo)
    except ValueError:
        return jsonify({"error": "Parámetro 'codigo' inválido, debe ser numérico"}), 400

    coleccion_cancer = get_coleccion("Rcancer")
    if coleccion_cancer is None:
        return jsonify({"error": "Base de datos no disponible"}), 500

    pipeline = [
        {"$match": {"MUN_RESID": codigo_int}},
        {"$group": {
            "_id": "$TIPO_CANCER",
            "total": {"$sum": 1}
        }},
        {"$sort": {"total": -1}}
    ]

    resultados = list(coleccion_cancer.aggregate(pipeline))

    resumen_cancer = {item["_id"]: item["total"] for item in resultados}

    if not resumen_cancer:
        return jsonify({"mensaje": "Sin datos para ese código", "enfermedades": {}}), 200

    return jsonify({"enfermedades": {"cancer": resumen_cancer}}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)
