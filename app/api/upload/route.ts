import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1) Save upload to /uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // sanitize filename a bit
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(uploadDir, safeName);

    fs.writeFileSync(filePath, buffer);

    // 2) Extract text
    let extractedText = "";

    const lower = safeName.toLowerCase();

    if (lower.endsWith(".txt")) {
      extractedText = fs.readFileSync(filePath, "utf-8");
    } else if (lower.endsWith(".pdf")) {
      // Convert PDF -> txt via pdftotext (poppler)
      const txtPath = filePath.replace(/\.pdf$/i, ".txt");

      // -layout keeps layout-ish, -nopgbrk avoids page breaks sometimes
      execSync(`pdftotext -layout -nopgbrk "${filePath}" "${txtPath}"`);

      extractedText = fs.readFileSync(txtPath, "utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload .pdf or .txt" },
        { status: 400 }
      );
    }

    // 3) Return preview
    return NextResponse.json({
      ok: true,
      filename: safeName,
      storedAt: `/uploads/${safeName}`,
      textLength: extractedText.length,
      preview: extractedText.slice(0, 1200),
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Upload failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}