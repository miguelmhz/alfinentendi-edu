# Configuración de Stripe - Guía Completa

## 📋 Requisitos Previos

- Cuenta de Stripe creada (https://dashboard.stripe.com)
- API Keys de Stripe (test mode)
- Aplicación desplegada o túnel ngrok para desarrollo

---

## 🔑 1. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Obtener las API Keys:

1. Ve a https://dashboard.stripe.com/test/apikeys
2. Copia la **Secret key** (sk_test_...)
3. Copia la **Publishable key** (pk_test_...)

---

## 🪝 2. Configurar Webhook en Stripe

### Opción A: Desarrollo Local con Stripe CLI (Recomendado)

1. **Instalar Stripe CLI:**
   ```bash
   # Windows (con Scoop)
   scoop install stripe
   
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Linux
   # Descargar desde: https://github.com/stripe/stripe-cli/releases
   ```

2. **Autenticar:**
   ```bash
   stripe login
   ```

3. **Iniciar el webhook listener:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copiar el webhook secret:**
   El comando anterior mostrará algo como:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxx
   ```
   Copia ese valor y agrégalo a tu `.env` como `STRIPE_WEBHOOK_SECRET`

5. **Probar el webhook:**
   ```bash
   stripe trigger checkout.session.completed
   ```

### Opción B: Desarrollo con ngrok

1. **Instalar ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Iniciar túnel:**
   ```bash
   ngrok http 3000
   ```

3. **Configurar webhook en Stripe Dashboard:**
   - Ve a https://dashboard.stripe.com/test/webhooks
   - Click en "Add endpoint"
   - URL: `https://tu-url-ngrok.ngrok.io/api/webhooks/stripe`
   - Eventos a escuchar:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Click en "Add endpoint"
   - Copia el **Signing secret** (whsec_...) y agrégalo a `.env`

### Opción C: Producción

1. Ve a https://dashboard.stripe.com/webhooks
2. Click en "Add endpoint"
3. URL: `https://tu-dominio.com/api/webhooks/stripe`
4. Selecciona los mismos eventos que en Opción B
5. Copia el **Signing secret** y agrégalo a tus variables de entorno de producción

---

## 🧪 3. Probar el Sistema de Pagos

### Tarjetas de Prueba de Stripe:

**Pago Exitoso:**
- Número: `4242 4242 4242 4242`
- Fecha: Cualquier fecha futura
- CVC: Cualquier 3 dígitos
- ZIP: Cualquier código postal

**Pago Rechazado:**
- Número: `4000 0000 0000 0002`

**Requiere Autenticación 3D Secure:**
- Número: `4000 0025 0000 3155`

**OXXO (México):**
- Seleccionar método de pago OXXO en el checkout
- Se generará un código de pago

### Flujo de Prueba:

1. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Iniciar webhook listener (en otra terminal):**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Navegar a un libro:**
   - Ve a http://localhost:3000/libros
   - Selecciona un libro
   - Click en "Comprar" o "Suscribirse"

4. **Completar pago:**
   - Usa una tarjeta de prueba
   - Completa el checkout

5. **Verificar:**
   - Deberías ser redirigido a `/mis-libros?payment=success`
   - Verás un toast de éxito
   - El libro aparecerá en "Mis Libros"
   - Recibirás un email de confirmación
   - Verás una notificación en la plataforma

---

## 📊 4. Verificar en Stripe Dashboard

Después de un pago exitoso, verifica:

1. **Pagos:** https://dashboard.stripe.com/test/payments
   - Deberías ver el pago completado

2. **Eventos:** https://dashboard.stripe.com/test/events
   - Verifica que `checkout.session.completed` fue procesado

3. **Webhooks:** https://dashboard.stripe.com/test/webhooks
   - Verifica que el webhook fue llamado exitosamente

---

## 🗄️ 5. Migrar Base de Datos

Antes de usar el sistema de pagos, ejecuta la migración:

```bash
npx prisma migrate dev --name add_payment_system
```

Esto creará las tablas:
- `subscriptions`
- `purchases`
- `transactions`
- `promotions`

---

## 📧 6. Configurar Email (Nodemailer)

Asegúrate de tener estas variables en `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
EMAIL_FROM="Al Fin Entendí <noreply@alfinentendi.com>"
```

**Para Gmail:**
1. Habilita verificación en 2 pasos
2. Genera una "App Password": https://myaccount.google.com/apppasswords
3. Usa esa contraseña en `EMAIL_PASSWORD`

---

## 🎨 7. Agregar Precios en Sanity

Los libros en Sanity deben tener estos campos:

```javascript
{
  name: 'book',
  fields: [
    // ... otros campos
    {
      name: 'price',
      title: 'Precio Base',
      type: 'number',
    },
    {
      name: 'monthlyPrice',
      title: 'Precio Mensual',
      type: 'number',
    },
    {
      name: 'quarterlyPrice',
      title: 'Precio Semestral',
      type: 'number',
    },
    {
      name: 'annualPrice',
      title: 'Precio Anual',
      type: 'number',
    },
    {
      name: 'lifetimePrice',
      title: 'Precio Lifetime',
      type: 'number',
    },
  ]
}
```

---

## 🔍 8. Monitoreo y Logs

### Ver logs del webhook:
```bash
# En desarrollo
stripe listen --forward-to localhost:3000/api/webhooks/stripe --print-json

# En producción
# Revisa los logs de tu servidor
```

### Verificar transacciones en la base de datos:
```bash
npx prisma studio
```

---

## 🚨 9. Troubleshooting

### Error: "No signature"
- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado
- Asegúrate de estar usando Stripe CLI o ngrok

### Error: "Webhook signature verification failed"
- El secret del webhook no coincide
- Regenera el secret en Stripe Dashboard

### El pago se completa pero no se asigna el acceso:
- Revisa los logs del webhook
- Verifica que el evento `checkout.session.completed` se esté procesando
- Revisa la tabla `transactions` en la base de datos

### No llegan emails:
- Verifica las credenciales de email en `.env`
- Revisa los logs del servidor
- Para Gmail, asegúrate de usar una App Password

---

## 📱 10. Integración en el Frontend

Para agregar un botón de compra en la página de un libro:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function BookPurchaseButton({ bookSlug, subscriptionPlan }: { bookSlug: string, subscriptionPlan?: string }) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookSlug, 
          subscriptionPlan, // 'monthly', 'quarterly', 'annual', 'lifetime'
          couponCode: '' // opcional
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePurchase} disabled={loading}>
      {loading ? 'Procesando...' : 'Comprar'}
    </Button>
  );
}
```

---

## ✅ Checklist de Configuración

- [ ] API Keys de Stripe configuradas en `.env`
- [ ] Webhook configurado (CLI, ngrok, o producción)
- [ ] `STRIPE_WEBHOOK_SECRET` en `.env`
- [ ] Migración de base de datos ejecutada
- [ ] Email configurado (Nodemailer)
- [ ] Precios agregados en Sanity
- [ ] Prueba de pago exitosa realizada
- [ ] Verificación de acceso al libro después del pago
- [ ] Emails de confirmación funcionando
- [ ] Notificaciones en plataforma funcionando

---

## 🎯 Próximos Pasos

1. Agregar botones de compra en las páginas de libros
2. Crear página de gestión de suscripciones
3. Implementar sistema de renovación automática
4. Agregar dashboard de analytics de ventas
5. Configurar Stripe en modo producción

---

## 📞 Soporte

- Documentación de Stripe: https://stripe.com/docs
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Webhooks: https://stripe.com/docs/webhooks
