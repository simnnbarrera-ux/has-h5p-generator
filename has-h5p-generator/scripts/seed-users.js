const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpwpuesdjrezlmpfjymt.supabase.co";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEFAULT_USERS = [
  {
    email: "simon.barrera@uao.edu.co",
    password: "UAO2026!EQ36",
    fullName: "Simón Barrera Ruíz",
    role: "admin",
    program: "Ingeniería Mecatrónica (EQ-36)",
  },
  {
    email: "hermaioni.delgado@uao.edu.co",
    password: "UAO2026!EQ36",
    fullName: "Hermaioni Delgado Paz",
    role: "admin",
    program: "Ingeniería Mecatrónica (EQ-36)",
  },
  {
    email: "alex.silva@uao.edu.co",
    password: "UAO2026!EQ36",
    fullName: "Alex Yohan Silva Mina",
    role: "admin",
    program: "Ingeniería Informática (EQ-36)",
  },
  {
    email: "demo.docente@uao.edu.co",
    password: "UAO2026!EQ36",
    fullName: "Docente Invitado Demo",
    role: "professor",
    program: "Campus Digital UAO",
  },
  {
    email: "oswaldo.rodriguez@uao.edu.co",
    password: "UAO2026!EQ36",
    fullName: "Prof. Oswaldo Rodríguez Díaz",
    role: "professor",
    program: "Matemáticas Discretas (Reto 11)",
  },
];

async function seed() {
  console.log("=== Creando / Verificando Cuentas en Supabase Auth ===");
  const { data: listData } = await admin.auth.admin.listUsers();
  const existingEmails = new Set(listData?.users?.map((u) => u.email?.toLowerCase()));

  for (const u of DEFAULT_USERS) {
    if (existingEmails.has(u.email.toLowerCase())) {
      console.log(`[EXISTE] ${u.email}`);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.fullName,
          role: u.role,
          faculty: "Facultad de Ingeniería y Ciencias Básicas",
          program: u.program,
        },
      });
      if (error) {
        console.error(`[ERROR] ${u.email}:`, error.message);
      } else {
        console.log(`[CREADO] ${u.email} (ID: ${data.user.id})`);
      }
    }
  }

  // Actualizar también la lista de perfiles en storage (db/has_profiles.json)
  const profiles = DEFAULT_USERS.map((u) => ({
    email: u.email,
    full_name: u.fullName,
    faculty: "Facultad de Ingeniería y Ciencias Básicas",
    program: u.program,
    role: u.role,
    daily_quota: u.role === "admin" ? 100 : 50,
    preferred_voice:
      u.email.includes("oswaldo") || u.email.includes("alex")
        ? "es-CO-GonzaloNeural"
        : "es-CO-SalomeNeural",
  }));

  const body = Buffer.from(JSON.stringify(profiles, null, 2), "utf-8");
  await admin.storage
    .from("has-h5p-store")
    .upload("db/has_profiles.json", body, {
      contentType: "application/json",
      upsert: true,
    });
  console.log("Perfiles sincronizados en Supabase Storage (db/has_profiles.json)");
}

seed().catch(console.error);
