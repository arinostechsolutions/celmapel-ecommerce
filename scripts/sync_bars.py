#!/usr/bin/env python3
"""
Lê os arquivos da pasta ~/Documents/bars, usa o nome do arquivo como código
de barras, consulta o PostgreSQL (VR), faz upload da imagem no Cloudinary
e faz upsert no MongoDB (incluindo o campo images).

Uso:
  ./scripts/.venv/bin/python3 scripts/sync_bars.py

Para escalar a 8k+ arquivos, o script processa em lotes (BATCH_SIZE).
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras
import cloudinary
import cloudinary.uploader
from pymongo import MongoClient, UpdateOne
from slugify import slugify

# ── Configuração ─────────────────────────────────────────────────────────────

BARS_DIR     = Path.home() / "Documents" / "bars"
BATCH_SIZE   = 100   # quantos barcodes processar por rodada no PG

PG = dict(
    host     = os.getenv("PG_HOST",     "10.200.102.226"),
    port     = int(os.getenv("PG_PORT", "8745")),
    dbname   = os.getenv("PG_DATABASE", "vr"),
    user     = os.getenv("PG_USER",     "appvendas"),
    password = os.getenv("PG_PASSWORD", "Ap#8745"),
)

MONGO_URI  = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://contato_db_user:kDayX1IcRdtQMPM9@celmapel.daham3b.mongodb.net/celmapel-dev?appName=celmapel"
)
STORE_ID   = os.getenv("DEFAULT_STORE_ID", "6a033f08ac8ba558a21c0e9c")
PG_LOJA_ID = int(os.getenv("PG_LOJA_ID", "1"))

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "durusveju")
CLOUDINARY_API_KEY    = os.getenv("CLOUDINARY_API_KEY",    "855151415331897")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "zoFXPyejO8GHUz2tqU7KMvEh3yM")
CLOUDINARY_FOLDER     = "selmapel/products"

cloudinary.config(
    cloud_name = CLOUDINARY_CLOUD_NAME,
    api_key    = CLOUDINARY_API_KEY,
    api_secret = CLOUDINARY_API_SECRET,
    secure     = True,
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_price(value) -> float:
    """Converte Decimal, '20,99' ou '20.99' para float."""
    if value is None:
        return 0.0
    return float(str(value).replace(".", "").replace(",", ".")) if isinstance(value, str) else float(value)


def collect_barcodes(directory: Path) -> list[str]:
    """Retorna lista de barcodes extraídos dos nomes de arquivo (sem extensão)."""
    supported = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    codes = []
    for f in sorted(directory.iterdir()):
        if f.suffix.lower() in supported:
            barcode = f.stem.strip()
            if barcode:
                codes.append(barcode)
    return codes


def query_pg(pg_conn, barcodes: list[str], loja_id: int) -> list[dict]:
    """Busca produtos no PostgreSQL a partir de uma lista de códigos de barras."""
    query = """
        SELECT DISTINCT ON (p.id)
            p.id            AS codigointerno,
            pa.codigobarras AS codigobarras,
            p.descricaocompleta AS descricao,
            pc.precovenda   AS precovenda,
            CAST(pc.estoque AS INTEGER) AS estoque,
            m.descricao     AS marca
        FROM produto p
        LEFT JOIN produtoautomacao   pa ON p.id = pa.id_produto
        LEFT JOIN produtocomplemento pc ON p.id = pc.id_produto
        LEFT JOIN marca              m  ON p.id_marca = m.id
        WHERE pa.codigobarras::text = ANY(%s)
          AND pc.id_loja = %s
        ORDER BY p.id, pa.id DESC
    """
    with pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query, (barcodes, loja_id))
        return cur.fetchall()


def upload_image(image_path: Path, public_id: str) -> dict | None:
    """Faz upload da imagem no Cloudinary. Retorna {url, publicId} ou None em caso de erro."""
    try:
        result = cloudinary.uploader.upload(
            str(image_path),
            public_id  = public_id,
            folder     = CLOUDINARY_FOLDER,
            overwrite  = False,   # não re-sobe se já existe
            resource_type = "image",
        )
        return {
            "url":      result["secure_url"],
            "publicId": result["public_id"],
            "alt":      image_path.stem,
            "order":    0,
        }
    except Exception as e:
        print(f"\n    ⚠️  Cloudinary erro ({image_path.name}): {e}")
        return None


def build_mongo_op(row: dict, store_id: str, image: dict | None) -> UpdateOne:
    """Constrói um UpdateOne (upsert) para o MongoDB a partir de uma linha do PG."""
    from bson import ObjectId

    barcode   = str(row["codigobarras"]) if row["codigobarras"] else str(row["codigointerno"])
    name      = row["descricao"] or barcode
    price     = parse_price(row["precovenda"])
    brand     = row["marca"] or ""
    ext_id    = str(row["codigointerno"])

    base_slug = slugify(name)
    slug = f"{base_slug}-{ext_id}"

    doc = {
        "storeId":    ObjectId(store_id),
        "name":       name,
        "slug":       slug,
        "description": name,
        "price":      price,
        "sku":        barcode,
        "externalId": ext_id,
        "tags":       [brand] if brand else [],
        "status":     "draft",
        "showOnSite": False,
        "isFeatured": False,
        "isDeleted":  False,
        "images":     [image] if image else [],
        "variations": [],
        "viewCount":  0,
        "cartCount":  0,
        "orderCount": 0,
        "updatedAt":  datetime.now(timezone.utc),
    }

    return UpdateOne(
        {"externalId": ext_id, "storeId": ObjectId(store_id)},
        {
            "$set": doc,
            "$setOnInsert": {"createdAt": datetime.now(timezone.utc)},
        },
        upsert=True,
    )


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"📂 Lendo barcodes em: {BARS_DIR}")
    if not BARS_DIR.exists():
        print(f"❌ Pasta não encontrada: {BARS_DIR}", file=sys.stderr)
        sys.exit(1)

    barcodes = collect_barcodes(BARS_DIR)
    if not barcodes:
        print("Nenhuma imagem encontrada.")
        return

    print(f"🔍 {len(barcodes)} barcodes encontrados.")

    print("🐘 Conectando ao PostgreSQL...")
    pg_conn = psycopg2.connect(**PG)

    print("🍃 Conectando ao MongoDB...")
    mongo   = MongoClient(MONGO_URI)
    db      = mongo.get_default_database()
    col     = db["products"]

    total_found   = 0
    total_upserted = 0
    not_found     = []

    # Mapa barcode → path do arquivo para upload posterior
    barcode_to_file = {f.stem: f for f in BARS_DIR.iterdir()
                       if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".gif"}}

    # Processa em lotes para suportar 8k+ arquivos
    for i in range(0, len(barcodes), BATCH_SIZE):
        batch = barcodes[i : i + BATCH_SIZE]
        print(f"  ↳ Lote {i // BATCH_SIZE + 1}: {len(batch)} barcodes...", end=" ", flush=True)

        rows = query_pg(pg_conn, batch, PG_LOJA_ID)
        found_codes = {str(r["codigobarras"]) for r in rows if r["codigobarras"]}
        missing     = [b for b in batch if b not in found_codes]
        not_found.extend(missing)

        if rows:
            ops = []
            for row in rows:
                barcode  = str(row["codigobarras"]) if row["codigobarras"] else str(row["codigointerno"])
                ext_id   = str(row["codigointerno"])
                img_path = barcode_to_file.get(barcode)
                image    = upload_image(img_path, ext_id) if img_path else None
                ops.append(build_mongo_op(row, STORE_ID, image))

            result = col.bulk_write(ops, ordered=False)
            total_found    += len(rows)
            total_upserted += result.upserted_count + result.modified_count
            print(f"✅ {len(rows)} encontrados, {result.upserted_count} inseridos, {result.modified_count} atualizados")
        else:
            print("⚠️  nenhum encontrado")

    pg_conn.close()
    mongo.close()

    print("\n── Resumo ────────────────────────────────────────────")
    print(f"  Total de barcodes lidos : {len(barcodes)}")
    print(f"  Encontrados no PG       : {total_found}")
    print(f"  Operações no MongoDB    : {total_upserted}")
    if not_found:
        print(f"  Não encontrados ({len(not_found)}): {', '.join(not_found)}")
    print("──────────────────────────────────────────────────────")


if __name__ == "__main__":
    main()
