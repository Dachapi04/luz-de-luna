/**
 * Importa el respaldo Excel del negocio (productos/inventario, compras,
 * usuarios) a Firestore. Pensado para correr una sola vez al migrar desde
 * la versión anterior (ver sección 8 de la especificación del proyecto).
 *
 * El formato esperado por columna es el mismo que genera
 * src/lib/excel/export.ts (hojas "Inventario", "Compras", "Usuarios").
 * Si tu respaldo viene de la app anterior con nombres de columna
 * distintos, ajusta los `row['...']` de abajo antes de correrlo — no hay
 * forma segura de adivinar un formato legado sin verlo primero.
 *
 * Uso:
 *   npm run import-backup -- ./ruta/a/respaldo.xlsx
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import * as XLSX from 'xlsx';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Uso: npm run import-backup -- ./ruta/a/respaldo.xlsx');
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    console.error('Faltan variables FIREBASE_ADMIN_* en .env.local.');
    process.exit(1);
  }

  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const db = getFirestore(app);

  const wb = XLSX.read(readFileSync(filePath));
  const pending: { ref: FirebaseFirestore.DocumentReference; data: FirebaseFirestore.DocumentData }[] = [];

  const inventario = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Inventario'] ?? {});
  for (const row of inventario) {
    const tipo = String(row.tipo) === 'platillo' ? 'platillo' : 'insumo';
    const receta = row.receta ? JSON.parse(String(row.receta)) : [];
    pending.push({
      ref: db.collection('productos').doc(),
      data: {
        nombre: String(row.nombre ?? ''),
        tipo,
        categoria: String(row.categoria ?? 'Otros'),
        unidad: String(row.unidad ?? ''),
        ...(tipo === 'insumo'
          ? { cantidad: Number(row.cantidad) || 0, stockMinimo: Number(row.stockMinimo) || 0 }
          : { precio: Number(row.precio) || 0, receta }),
      },
    });
  }

  const compras = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Compras'] ?? {});
  for (const row of compras) {
    pending.push({
      ref: db.collection('compras').doc(),
      data: {
        fecha: String(row.fecha ?? ''),
        concepto: String(row.concepto ?? ''),
        categoria: String(row.categoria ?? 'Otros'),
        cantidad: row.cantidad ? Number(row.cantidad) : null,
        unidad: row.unidad ? String(row.unidad) : null,
        total: Number(row.total) || 0,
      },
    });
  }

  // Los usuarios NO se importan aquí: requieren crear cuentas de Firebase
  // Auth (contraseña + uid), que es justo lo que hace scripts/bootstrap-admin.ts
  // y la pantalla de Usuarios. Este script solo trae inventario y compras.

  if (pending.length === 0) {
    console.log('No se encontraron filas para importar. Revisa los nombres de hoja del Excel.');
    return;
  }

  const CHUNK = 400; // margen bajo el límite de 500 escrituras por batch de Firestore
  for (let i = 0; i < pending.length; i += CHUNK) {
    const batch = db.batch();
    for (const { ref, data } of pending.slice(i, i + CHUNK)) batch.set(ref, data);
    await batch.commit();
  }
  console.log(`Importado: ${inventario.length} productos, ${compras.length} compras.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
