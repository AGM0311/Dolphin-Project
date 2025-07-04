from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Cargar datos simulados
df = pd.read_csv('data/fake_salud.csv')

@app.route('/')
def inicio():
    return 'API de salud funcionando'

@app.route('/api/casos', methods=['GET'])
def filtrar_datos():
    enfermedad = request.args.get('enfermedad')
    estado = request.args.get('estado')
    anio = request.args.get('anio')

    filtrado = df.copy()

    if enfermedad:
        filtrado = filtrado[filtrado['enfermedad'] == enfermedad]
    if estado:
        filtrado = filtrado[filtrado['estado'] == estado]
    if anio:
        filtrado = filtrado[filtrado['fecha'].str.startswith(anio)]

    return jsonify(filtrado.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)
