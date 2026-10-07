# AYBAR Instruments

Aplicación para registrar instrumentos con información del usuario, nombre del instrumento, número de parte, número de serie y foto asociada.

## Funcionalidad
- CRUD de instrumentos
- Registro de usuario
- Número de parte
- Número de serie
- Subida de foto
- La foto se guarda como archivo separado
- La base de datos guarda la URL o la ruta de la foto

## Arquitectura
La app guarda la foto fuera de la base de datos y solo almacena la referencia en la BD.

### En desarrollo/local
Si no hay un storage configurado, la app guarda la imagen en:
- public/uploads

y almacena la ruta relativa en la base de datos, por ejemplo:
- /uploads/archivo.jpg

### En producción en Vercel
Se recomienda usar Vercel Blob con acceso público.

Variables de entorno necesarias:
- POSTGRES_URL
- BLOB_READ_WRITE_TOKEN

La variable BLOB_READ_WRITE_TOKEN debe apuntar a un Blob Store configurado como public.

Si el Blob está configurado como private, la app no podrá devolver una URL pública para la foto.

## Comandos locales

```bash
cd "C:\Users\Win11\AYBARinstruments\instrumentsdata"
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Abrir:
- http://localhost:3000

## Deploy en Vercel
1. Crear un Blob Storage en Vercel
2. Elegir tipo público
3. Copiar el token
4. Ir a Project > Settings > Environment Variables
5. Agregar:
   BLOB_READ_WRITE_TOKEN=tu_token
6. Hacer deploy

## Nota
La base de datos guarda dónde está la foto, no la imagen en sí.
