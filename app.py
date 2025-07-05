from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json

# ✅ Primero defines la app
app = Flask(__name__)
CORS(app)

# ✅ Luego defines los datos
with open('datos.json') as f:
    datos = json.load(f)

# ✅ Ahora sí, tus rutas
@app.route("/api/datos")
def get_datos():
    alcaldia = request.args.get("alcaldia")
    result = next((d for d in datos if d["NOM_MUN"] == alcaldia), None)
    return jsonify(result if result else {"valor": "Sin datos"})

@app.route("/alcaldias.geojson")
def get_geojson():
    return send_from_directory('.', 'CDMX_mpal.geojson')

if __name__ == "__main__":
    app.run(debug=True)
