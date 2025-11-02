# 🔐 Firestore Rules - CONTROLBIO

## 📋 Arquitectura

**CONTROLBIO NO despliega reglas al Firestore compartido.**

Este repositorio mantiene sus reglas organizadas localmente, pero **CONTROLFILE** es el repositorio maestro que combina todas las reglas y las despliega al Firestore compartido.

## 📁 Estructura de Archivos

```
controlbio/
├── firestore-rules/              # 📁 Carpeta de reglas (solo para controlbio)
│   ├── base.rules                # ✅ Helpers compartidos (debe ser idéntico al de CONTROLFILE)
│   ├── controlbio.rules         # ✅ Reglas específicas de CONTROLBIO
│   ├── build.js                  # ✅ Genera firestore.rules solo para testing local
│   ├── README.md                 # Documentación de CONTROLFILE (referencia)
│   ├── ESTRUCTURA.md             # Estructura de CONTROLFILE (referencia)
│   └── README-CONTROLBIO.md     # Este archivo
│
├── firestore.rules               # ✅ GENERADO (NO editar manualmente) - Solo para testing local
├── firebase.json                 # ⚠️ Configurado para local, NO desplegar
└── package.json                  # Script: "build:rules": "node firestore-rules/build.js"
```

## 🔄 Flujo de Trabajo

### Desarrollo Local

1. **Editar reglas:**
   - Edita `firestore-rules/controlbio.rules` para cambios específicos de controlbio
   - Edita `firestore-rules/base.rules` solo si es necesario sincronizar con CONTROLFILE

2. **Generar para testing local:**
   ```bash
   npm run build:rules
   ```
   Esto genera `firestore.rules` solo con reglas de controlbio (para testing local con Firebase Emulator).

### Actualizar Reglas en Producción

Cuando necesites actualizar las reglas de controlbio en el Firestore compartido:

**Paso 1: Actualizar en este repositorio**
1. Edita `firestore-rules/controlbio.rules` con los cambios
2. (Opcional) Prueba localmente:
   ```bash
   npm run build:rules  # Genera firestore.rules solo con controlbio
   # Probar con Firebase Emulator si lo necesitas
   ```

**Paso 2: Copiar a CONTROLFILE (repositorio maestro)**
1. Copia `firestore-rules/controlbio.rules` desde este repo
2. Pega en CONTROLFILE aquí: `firestore-rules/controlbio.rules` (reemplaza el existente)

**Paso 3: Desplegar desde CONTROLFILE**
```bash
cd repo-controlfile
npm run build:rules              # Regenera firestore.rules con TODAS las apps
firebase deploy --only firestore:rules  # Despliega al Firestore compartido
```

## ⚠️ Reglas Importantes

1. ✅ **NO ejecutar** `firebase deploy --only firestore:rules` desde este repositorio
2. ✅ **SÍ generar** `firestore.rules` localmente para testing (`npm run build:rules`)
3. ✅ **SÍ copiar** `controlbio.rules` a CONTROLFILE cuando haya cambios
4. ✅ **Mantener** `base.rules` idéntico al de CONTROLFILE

## 📝 Scripts Disponibles

- `npm run build:rules` - Genera `firestore.rules` solo con reglas de controlbio (para testing local)

## 🔗 Referencias

- Ver `firestore-rules/README.md` para la documentación completa de la arquitectura (desde CONTROLFILE)
- Ver `firestore-rules/ESTRUCTURA.md` para la estructura de archivos

---

**Resumen:** CONTROLBIO mantiene sus reglas organizadas, pero CONTROLFILE es quien las despliega al Firestore compartido.

