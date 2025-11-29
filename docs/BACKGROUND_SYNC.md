# Background Sync - Implementación Offline First

## 📋 Índice

1. [¿Qué problema resolvemos?](#qué-problema-resolvemos)
2. [¿Qué es Background Sync?](#qué-es-background-sync)
3. [Arquitectura de la solución](#arquitectura-de-la-solución)
4. [Flujo paso a paso](#flujo-paso-a-paso)
5. [Explicación del código](#explicación-del-código)
6. [¿Por qué esta implementación?](#por-qué-esta-implementación)
7. [Cómo probar](#cómo-probar)

---

## ¿Qué problema resolvemos?

Imagina este escenario: un usuario está creando un evento en el calendario, pero en ese momento pierde conexión a internet. Sin Background Sync:

- ❌ El request POST falla
- ❌ El usuario ve un error
- ❌ Tiene que recordar volver a crear el evento cuando tenga conexión
- ❌ Mala experiencia de usuario

Con Background Sync:

- ✅ El request se guarda localmente (IndexedDB)
- ✅ El usuario ve que "funcionó" (respuesta simulada)
- ✅ Cuando vuelve la conexión, se envía automáticamente
- ✅ El usuario ni se entera del problema de red

---

## ¿Qué es Background Sync?

Background Sync es una API del navegador que permite a un Service Worker **diferir acciones hasta que el usuario tenga conexión estable**.

### Componentes clave:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Aplicación    │────▶│  Service Worker │────▶│    IndexedDB    │
│   (React App)   │     │    (sw.js)      │     │  (Cola offline) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Backend API    │
                        │  (cuando hay    │
                        │   conexión)     │
                        └─────────────────┘
```

---

## Arquitectura de la solución

### Archivos involucrados:

| Archivo | Responsabilidad |
|---------|-----------------|
| `sw.js` | Service Worker que intercepta requests y maneja la cola offline |
| `main.jsx` | Detecta cuando vuelve la conexión y coordina con el SW |

### Tecnologías usadas:

- **Workbox**: Librería de Google para facilitar el trabajo con Service Workers
- **Workbox Queue**: Maneja la cola de requests pendientes en IndexedDB
- **Service Worker API**: Intercepta requests de red
- **postMessage API**: Comunicación entre SW y la aplicación

---

## Flujo paso a paso

### Escenario: Usuario crea evento SIN conexión

```
PASO 1: Usuario hace clic en "Guardar Evento"
         │
         ▼
PASO 2: React hace POST a /api/events
         │
         ▼
PASO 3: Service Worker intercepta el request
         │
         ▼
PASO 4: SW intenta hacer fetch() al servidor
         │
         ▼
PASO 5: fetch() FALLA (no hay conexión)
         │
         ▼
PASO 6: SW guarda el request en la Queue (IndexedDB)
         │
         ▼
PASO 7: SW retorna respuesta FAKE exitosa
         │
         ▼
PASO 8: React recibe "éxito" y actualiza la UI
         │
         ▼
    [Usuario sigue trabajando normalmente]
```

### Escenario: Vuelve la conexión

```
PASO 1: Navegador detecta conexión (evento 'online')
         │
         ▼
PASO 2: main.jsx envía mensaje al SW: "REPLAY_QUEUE"
         │
         ▼
PASO 3: SW obtiene todos los requests guardados
         │
         ▼
PASO 4: SW ejecuta cada request uno por uno
         │
         ▼
PASO 5: Si éxito → elimina de la cola
        Si falla → lo deja para reintentar
         │
         ▼
PASO 6: SW envía mensaje: "SYNC_COMPLETE"
         │
         ▼
PASO 7: main.jsx recarga la página para mostrar datos actualizados
```

---

## Explicación del código

### `sw.js` - El Service Worker

#### 1. Crear la Cola (Queue)

```javascript
import { Queue } from 'workbox-background-sync';

const queue = new Queue('posts-offline', {
  maxRetentionTime: 24 * 60, // 24 horas en minutos
});
```

**¿Qué hace?**
- Crea una cola llamada `posts-offline` en IndexedDB
- Los requests se guardan máximo 24 horas
- Después de 24 horas, se eliminan automáticamente

**¿Por qué `Queue` y no `BackgroundSyncPlugin`?**
- `Queue` nos da control manual sobre cuándo ejecutar los requests
- `BackgroundSyncPlugin` depende del evento `sync` del navegador, que es inconsistente
- Con `Queue` podemos disparar el replay nosotros mismos

#### 2. Interceptar requests de mutación

```javascript
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo interceptamos POST, PUT, DELETE a /api/events
  if (url.pathname.includes('/api/events') && 
      ['POST', 'PUT', 'DELETE'].includes(request.method)) {
    
    const requestClone = request.clone();
    
    event.respondWith(
      fetch(request).catch(async (error) => {
        // Red falló, guardar en cola
        await queue.pushRequest({ request: requestClone });
        
        // Retornar respuesta fake
        return new Response(
          JSON.stringify({ 
            ok: true, 
            offline: true,
            data: { id: 'temp-' + Date.now() }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' }}
        );
      })
    );
  }
});
```

**¿Qué hace paso a paso?**

1. `self.addEventListener('fetch', ...)` - Intercepta TODOS los requests de la app
2. Filtramos solo requests a `/api/events` que sean POST/PUT/DELETE
3. `request.clone()` - Clonamos porque un Request solo se puede leer una vez
4. `fetch(request)` - Intentamos hacer el request normal
5. `.catch()` - Si falla (sin conexión), entramos aquí
6. `queue.pushRequest()` - Guardamos el request en IndexedDB
7. Retornamos respuesta fake para que la app no se rompa

**¿Por qué clonamos el request?**
```javascript
const requestClone = request.clone();
```
Los objetos `Request` en JavaScript son "streams" - una vez que los lees, no puedes leerlos de nuevo. Como necesitamos:
1. Intentar `fetch(request)` 
2. Si falla, guardar `request` en la cola

Necesitamos una copia porque el primer uso "consume" el request.

**¿Por qué retornamos respuesta fake?**
```javascript
return new Response(
  JSON.stringify({ 
    ok: true, 
    offline: true,
    data: { id: 'temp-' + Date.now() }
  }),
  { status: 200 }
);
```
- La app React espera una respuesta
- Si no retornamos nada, Axios lanza error y el usuario ve un error
- Con la respuesta fake, la app "cree" que funcionó
- El `id: 'temp-...'` es temporal, cuando se sincronice se reemplazará con el ID real

#### 3. Replay de la cola

```javascript
self.addEventListener('message', async (event) => {
  if (event.data?.type === 'REPLAY_QUEUE') {
    const entries = await queue.getAll();
    
    for (const entry of entries) {
      try {
        await fetch(entry.request.clone());
        await queue.shiftRequest(); // Eliminar de la cola
      } catch (error) {
        break; // Parar si falla, reintentar después
      }
    }
    
    // Notificar que terminamos
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
  }
});
```

**¿Qué hace?**
1. Escucha mensajes de la aplicación
2. Cuando recibe `REPLAY_QUEUE`, obtiene todos los requests guardados
3. Ejecuta cada uno secuencialmente
4. Si tiene éxito, lo elimina de la cola (`shiftRequest`)
5. Si falla, para el loop (lo intentará de nuevo después)
6. Al terminar, notifica a todas las pestañas abiertas

---

### `main.jsx` - Coordinación desde React

```javascript
if ('serviceWorker' in navigator) {
  // Cuando vuelve la conexión
  window.addEventListener('online', () => {
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({ type: 'REPLAY_QUEUE' });
    });
  });

  // Cuando el SW termina de sincronizar
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_COMPLETE') {
      window.location.reload();
    }
  });
}
```

**Flujo:**
1. `window.addEventListener('online', ...)` - Detecta cuando vuelve internet
2. `postMessage({ type: 'REPLAY_QUEUE' })` - Le dice al SW "ejecuta los pendientes"
3. Escucha `SYNC_COMPLETE` del SW
4. `window.location.reload()` - Recarga para mostrar datos actualizados del servidor

---

## ¿Por qué esta implementación?

### ¿Por qué NO usar solo `BackgroundSyncPlugin`?

```javascript
// ❌ Esto NO funcionaba bien
const bgSyncPlugin = new BackgroundSyncPlugin('queue', {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  /\/api\/events/,
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'POST'
);
```

**Problemas:**
1. El evento `sync` del navegador es inconsistente
2. Chrome a veces no lo dispara inmediatamente al volver online
3. No teníamos control sobre cuándo ejecutar los requests
4. El `registerRoute` para POST y GET entraban en conflicto

### ¿Por qué usar `Queue` directamente?

```javascript
// ✅ Esto SÍ funciona
const queue = new Queue('posts-offline', {...});

// Control manual del replay
self.addEventListener('message', async (event) => {
  if (event.data?.type === 'REPLAY_QUEUE') {
    // Nosotros decidimos cuándo ejecutar
  }
});
```

**Ventajas:**
1. Control total sobre el timing
2. Podemos disparar el sync desde el cliente (`postMessage`)
3. Podemos notificar cuando termina
4. No dependemos del evento `sync` del navegador

### ¿Por qué el listener `fetch` manual?

```javascript
// ✅ Listener manual
self.addEventListener('fetch', (event) => {
  if (shouldHandle(request)) {
    event.respondWith(/* nuestra lógica */);
  }
});
```

**vs**

```javascript
// ❌ registerRoute con conflictos
registerRoute(/\/api\/events/, new NetworkOnly({...}), 'POST');
registerRoute(/\/api\/events/, new NetworkFirst({...})); // ¡Conflicto!
```

El listener manual nos permite:
1. Manejar POST/PUT/DELETE de forma especial
2. No interferir con los GET (que usan cache)
3. Retornar respuesta fake cuando falla

---

## Cómo probar

### Preparación
1. Haz build de la aplicación: `npm run build`
2. Sirve la build: `npm run preview`
3. Abre DevTools (F12)

### Prueba paso a paso

1. **Verificar SW activo:**
   - DevTools → Application → Service Workers
   - Debe mostrar `sw.js` como "activated"

2. **Simular offline:**
   - DevTools → Network → ☑️ Offline
   
3. **Crear un evento:**
   - Crea un evento en el calendario
   - Debería "funcionar" (respuesta fake)

4. **Verificar cola:**
   - DevTools → Application → IndexedDB
   - Busca `workbox-background-sync`
   - Debería haber un request guardado

5. **Volver online:**
   - DevTools → Network → ☐ Offline (desmarcar)
   - La página debería recargar automáticamente

6. **Verificar sincronización:**
   - El evento debe aparecer con su ID real del servidor
   - La cola en IndexedDB debe estar vacía

### Logs útiles en consola

```
Request queued for background sync: http://localhost:9090/api/events
Replaying queue, entries: 1
Request replayed successfully
Sync complete, refreshing data...
```

---

## Resumen

| Componente | Función |
|------------|---------|
| `Queue` | Almacena requests fallidos en IndexedDB |
| `fetch` listener | Intercepta requests y los encola si fallan |
| Respuesta fake | Permite que la app siga funcionando offline |
| `online` event | Detecta cuando vuelve la conexión |
| `postMessage` | Comunicación bidireccional SW ↔ App |
| `SYNC_COMPLETE` | Señal para recargar y mostrar datos reales |

Esta implementación logra una experiencia **offline-first** donde el usuario puede seguir trabajando sin conexión, y sus cambios se sincronizan automáticamente cuando vuelve internet.
