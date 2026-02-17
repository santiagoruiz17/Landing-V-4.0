# Página de Aterrizaje "Pre-Aprobado" - Firma 7

## 📋 Descripción
Página de éxito para leads calificados que han sido pre-aprobados. Diseñada para vivir en el subdominio `aprobado.firma7.com`.

## 🎨 Características

### Diseño
- **Estética**: Client Portal/Dashboard con fondo gris claro
- **Tipografía**: Inter (sans-serif) y Playfair Display (serif)
- **Paleta de colores**: Colores de marca Firma 7
  - Verde Firma: `#006d4e`
  - Charcoal: `#1A1A1A`
  - Concrete: `#F9FAFB`

### Efectos WOW
- ✨ **Confeti animado** al cargar la página (dos ráfagas desde esquinas inferiores)
- 🎯 Animaciones suaves en hover
- 💚 Iconos animados con efectos de escala

### Secciones

1. **Banner de Estatus**
   - Mensaje "Perfil Pre-Aprobado"
   - Check de verificación verde animado

2. **Tarjetas de Valor** (3 cards)
   - 💰 Hasta $5M MXN
   - ⏱️ Respuesta en 24h
   - 👥 Asesoría personalizada SOC

3. **Contenedor de Formulario**
   - Espacio para integrar "Formulario 2" de GoHighLevel
   - Diseño elegante con instrucciones claras

4. **CTA Final**
   - Botón para agendar sesión de perfilamiento
   - Enlace a calendario de GoHighLevel

## 🚀 Instalación y Configuración

### Opción 1: Archivo HTML Standalone (Recomendado)
El archivo `aprobado.html` es completamente independiente y listo para usar.

#### Pasos de implementación:

1. **Subir a Hostinger**
   ```
   - Accede a tu panel de Hostinger
   - Ve a File Manager
   - Crea un subdirectorio para el subdominio (si es necesario)
   - Sube el archivo aprobado.html
   - Renómbralo a index.html en el directorio del subdominio
   ```

2. **Configurar Subdominio**
   ```
   - En Hostinger, ve a Dominios > Subdominios
   - Crea el subdominio: aprobado.firma7.com
   - Apunta al directorio donde subiste el archivo
   ```

3. **Integrar Formulario de GoHighLevel**
   
   a. Obtén el código del formulario:
   ```
   - Inicia sesión en GoHighLevel
   - Ve a Sites > Forms
   - Selecciona "Formulario 2" (Carga de Documentos)
   - Haz clic en "Embed" o "Integrar"
   - Copia el código (iframe o script)
   ```
   
   b. Edita el archivo HTML:
   ```html
   - Busca la línea 437 (comentario de integración GHL)
   - Reemplaza el div.ghl-placeholder con el código copiado
   - Guarda los cambios
   ```

4. **Configurar Botón de Agendamiento**
   ```html
   - Busca la línea 490 (enlace del botón CTA)
   - Reemplaza el href con tu enlace de calendario GHL
   - Ejemplo: https://firma7.gohighlevel.com/widget/bookings/tu-calendario-id
   ```

### Opción 2: Componente React
Si prefieres integrar en tu proyecto React existente:

1. **Instalar dependencias**
   ```bash
   npm install canvas-confetti lucide-react
   ```

2. **Importar el componente**
   ```tsx
   import { ApprovedLanding } from './components/ApprovedLanding';
   ```

3. **Crear ruta en tu aplicación**
   ```tsx
   // En tu router
   <Route path="/aprobado" element={<ApprovedLanding />} />
   ```

## 🔧 Personalización

### Cambiar colores
Edita las variables CSS en el archivo HTML (líneas 30-46):
```css
:root {
  --color-firma-green: #006d4e;  /* Color principal */
  --color-charcoal: #1A1A1A;     /* Texto oscuro */
  /* ... más colores */
}
```

### Ajustar efecto de confeti
Modifica los parámetros en el script (líneas 524-548):
```javascript
const defaults = { 
  startVelocity: 30,  // Velocidad inicial
  spread: 360,        // Dispersión
  ticks: 60,          // Duración
  zIndex: 0 
};
```

### Modificar contenido
- **Título del banner**: Línea 365
- **Texto de bienvenida**: Líneas 376-382
- **Contenido de tarjetas**: Líneas 387-420
- **Texto del CTA**: Líneas 484-489

## 📱 Responsive Design
La página está completamente optimizada para:
- 📱 Móviles (< 768px)
- 💻 Tablets (768px - 1024px)
- 🖥️ Desktop (> 1024px)

## 🔒 SEO y Seguridad
- Meta tag `noindex, nofollow` (página privada para leads)
- Optimización de carga con preconnect a Google Fonts
- CDN para librerías externas (confetti, lucide)

## 📞 Soporte
Para preguntas o asistencia:
- Email: contacto@firma7.com

## ✅ Checklist de Implementación

- [ ] Subir archivo a Hostinger
- [ ] Configurar subdominio aprobado.firma7.com
- [ ] Integrar Formulario 2 de GoHighLevel
- [ ] Configurar enlace de calendario GHL
- [ ] Probar en diferentes dispositivos
- [ ] Verificar efecto de confeti
- [ ] Confirmar envío de formulario
- [ ] Probar botón de agendamiento

## 🎯 Próximos Pasos Sugeridos
1. Configurar Google Analytics para tracking
2. Agregar pixel de Facebook/Meta
3. Implementar chat en vivo (opcional)
4. Configurar email de confirmación automático
5. A/B testing del CTA

---

**Versión**: 1.0  
**Última actualización**: Febrero 2026  
**Desarrollado para**: Firma 7
