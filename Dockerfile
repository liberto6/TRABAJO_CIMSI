# Usa una imagen base de Node.js
FROM node:18

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación
COPY . .

# Expone el puerto que usa tu aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
