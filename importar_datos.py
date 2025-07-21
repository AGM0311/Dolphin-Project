import csv
from pymongo import MongoClient

# Conexión a tu MongoDB Atlas
client = MongoClient("mongodb+srv://universal:general@proyectodelfin.semlbkd.mongodb.net/")
db = client["proyectodelfin"]

def importar_csv(nombre_archivo, nombre_coleccion):
    with open(nombre_archivo, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        datos = []
        for row in reader:
            # Convertir código a número si es posible
            try:
                row['codigo'] = int(row['codigo'])
            except ValueError:
                pass
            datos.append(row)
        
        # Borrar colección existente y crear nueva
        db[nombre_coleccion].drop()
        db[nombre_coleccion].insert_many(datos)
        print(f"✅ Insertados {len(datos)} documentos en {nombre_coleccion}")

# Importar los tres diccionarios
importar_csv('diccionario_derecho_habiencia.csv', 'derecho_habiencia')
importar_csv('diccionario_municipios.csv', 'municipios')
importar_csv('diccionario_ocupacion.csv', 'ocupaciones')

print("🎉 Todos los datos han sido importados correctamente")