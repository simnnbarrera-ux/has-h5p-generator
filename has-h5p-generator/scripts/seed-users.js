#!/usr/bin/env node
"use strict";

const { createClient } = require("@supabase/supabase-js");

async function main() {
  if (process.env.ALLOW_DEMO_USER_SEED !== "1") {
    throw new Error("Seeder desactivado. Usa ALLOW_DEMO_USER_SEED=1 solo en un proyecto de prueba aislado.");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("El seeder de demostración está prohibido en producción.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;
  if (!url || !serviceKey || !email || !password) {
    throw new Error("Define URL, clave server-only, DEMO_USER_EMAIL y DEMO_USER_PASSWORD en el entorno local seguro.");
  }
  if (password.length < 16) {
    throw new Error("DEMO_USER_PASSWORD debe tener al menos 16 caracteres.");
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "Cuenta de demostración",
      faculty: "Facultad de Ingeniería y Ciencias Básicas",
      program: "Campus Digital UAO",
    },
  });
  if (error) throw new Error(`No se pudo crear la cuenta de prueba: ${error.message}`);
  if (!data.user) throw new Error("Supabase no devolvió el usuario de prueba creado.");

  console.log(`Cuenta de prueba creada: ${data.user.email}. El trigger asigna el rol estándar professor.`);
  console.log("No se imprimió ni almacenó la contraseña.");
}

main().catch((error) => {
  console.error("Seeder cancelado:", error.message || "error desconocido");
  process.exitCode = 1;
});
