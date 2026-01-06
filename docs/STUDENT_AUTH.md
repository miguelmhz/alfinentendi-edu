# Autenticación de Estudiantes - Magic Link / OTP

## 📋 Resumen

Los estudiantes **NO necesitan crear contraseñas**. El sistema utiliza **Magic Links** (enlaces mágicos) y **OTP** (One-Time Password) proporcionados por Supabase Auth para una autenticación sin contraseña.

## 🔐 Flujo de Autenticación

### 1. Creación de Estudiante

Cuando un admin o coordinador agrega un estudiante:

```typescript
// El estudiante se crea con status INVITED
await prisma.user.create({
  data: {
    email: "estudiante@ejemplo.com",
    name: "Juan Pérez",
    roles: ["STUDENT"],
    status: "INVITED",
    schoolId: "school-id",
  }
});

// Supabase envía automáticamente un email de invitación
await supabase.auth.admin.inviteUserByEmail(email);
```

### 2. Primer Acceso del Estudiante

**Opción A: Magic Link (Recomendado)**

1. El estudiante recibe un correo con un enlace mágico
2. Click en el enlace → Acceso automático
3. El enlace expira después de 1 hora
4. Status cambia de `INVITED` a `ACTIVE`

**Opción B: OTP (Código de un solo uso)**

1. El estudiante va a `/login`
2. Ingresa su correo electrónico
3. Recibe un código de 6 dígitos por correo
4. Ingresa el código → Acceso concedido
5. El código expira después de 5 minutos

### 3. Accesos Posteriores

Para accesos futuros, el estudiante puede:

1. **Magic Link:** Solicitar nuevo enlace desde `/login`
2. **OTP:** Solicitar nuevo código desde `/login`
3. **Sesión persistente:** Si marcó "Recordarme", la sesión dura 30 días

## 🛠️ Implementación Técnica

### Configuración de Supabase

```typescript
// lib/supabase/server.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
```

### Envío de Magic Link

```typescript
// Desde el frontend
const { error } = await supabase.auth.signInWithOtp({
  email: 'estudiante@ejemplo.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

### Envío de OTP

```typescript
// Desde el frontend
const { error } = await supabase.auth.signInWithOtp({
  email: 'estudiante@ejemplo.com',
  options: {
    shouldCreateUser: false, // Solo para usuarios existentes
  },
});

// Verificar OTP
const { data, error } = await supabase.auth.verifyOtp({
  email: 'estudiante@ejemplo.com',
  token: '123456',
  type: 'email',
});
```

## 📧 Plantillas de Email

### Email de Invitación

```
Asunto: Bienvenido a Al Fin Entendí

Hola [Nombre],

Has sido agregado como estudiante en [Nombre de Escuela].

Para acceder a la plataforma, haz clic en el siguiente enlace:

[MAGIC LINK]

Este enlace expira en 1 hora.

---

¿No funciona el enlace? Copia y pega esta URL en tu navegador:
[MAGIC LINK URL]
```

### Email de Acceso (Magic Link)

```
Asunto: Enlace de acceso - Al Fin Entendí

Hola [Nombre],

Haz clic en el siguiente enlace para acceder a tu cuenta:

[MAGIC LINK]

Este enlace expira en 1 hora y solo puede usarse una vez.

Si no solicitaste este acceso, ignora este correo.
```

### Email de Acceso (OTP)

```
Asunto: Código de acceso - Al Fin Entendí

Hola [Nombre],

Tu código de acceso es:

[123456]

Este código expira en 5 minutos.

Si no solicitaste este código, ignora este correo.
```

## 🔒 Seguridad

### Ventajas del Sistema Sin Contraseña

✅ **No hay contraseñas débiles** - Los estudiantes no pueden crear contraseñas inseguras
✅ **Sin reutilización** - Cada código/enlace es único y temporal
✅ **Sin phishing de contraseñas** - No hay contraseñas que robar
✅ **Fácil recuperación** - No hay "olvidé mi contraseña"
✅ **Mejor UX** - Acceso más rápido y simple

### Medidas de Seguridad

- ✅ Enlaces mágicos expiran en 1 hora
- ✅ Códigos OTP expiran en 5 minutos
- ✅ Rate limiting en solicitudes de códigos
- ✅ Validación de email en backend
- ✅ Tokens JWT con refresh automático
- ✅ Sesiones seguras con httpOnly cookies

## 📱 Flujo de Usuario (UI)

### Página de Login (`/login`)

```tsx
<form onSubmit={handleLogin}>
  <Input
    type="email"
    placeholder="correo@ejemplo.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
  
  <Button type="submit">
    Enviar enlace de acceso
  </Button>
  
  <p className="text-sm text-muted-foreground">
    Te enviaremos un enlace mágico a tu correo.
    No necesitas contraseña.
  </p>
</form>
```

### Verificación de OTP (Opcional)

```tsx
<form onSubmit={handleVerifyOtp}>
  <Input
    type="text"
    placeholder="123456"
    maxLength={6}
    value={otp}
    onChange={(e) => setOtp(e.target.value)}
  />
  
  <Button type="submit">
    Verificar código
  </Button>
  
  <Button variant="link" onClick={resendOtp}>
    Reenviar código
  </Button>
</form>
```

## 🔄 Estados del Usuario

```typescript
enum UserStatus {
  INVITED = "INVITED",    // Recién creado, esperando primer acceso
  ACTIVE = "ACTIVE",      // Ha accedido al menos una vez
  SUSPENDED = "SUSPENDED", // Acceso temporalmente bloqueado
}
```

### Transiciones de Estado

```
INVITED → (primer acceso) → ACTIVE
ACTIVE → (admin suspende) → SUSPENDED
SUSPENDED → (admin reactiva) → ACTIVE
```

## 📊 Monitoreo

### Métricas Importantes

- Tasa de activación (INVITED → ACTIVE)
- Tiempo promedio de primer acceso
- Frecuencia de solicitudes de magic link
- Errores de autenticación

### Logs Recomendados

```typescript
// Cuando se crea un estudiante
console.log('Student invited:', { email, schoolId, timestamp });

// Cuando accede por primera vez
console.log('Student activated:', { email, timestamp, method: 'magic-link' });

// Cuando solicita nuevo acceso
console.log('Auth requested:', { email, method: 'otp', timestamp });
```

## 🚀 Próximas Mejoras

- [ ] Autenticación con Google/Microsoft (SSO)
- [ ] Biometría en dispositivos móviles
- [ ] Sesiones por dispositivo
- [ ] Notificaciones de acceso sospechoso
- [ ] 2FA opcional para administradores

## 📞 Soporte

Si un estudiante no recibe el correo:

1. Verificar carpeta de spam
2. Verificar que el correo esté bien escrito
3. Reenviar invitación desde el panel de admin
4. Contactar soporte técnico

---

**Nota:** Este sistema está construido sobre Supabase Auth, que maneja toda la complejidad de la autenticación sin contraseña de forma segura y escalable.
