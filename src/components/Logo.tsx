import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

// Drop your logo into the /public folder as logo.svg, logo.png or logo.webp.
const CANDIDATES = ["logo.svg", "logo.png", "logo.jpg", "logo.webp"];

function findLogo() {
  return CANDIDATES.find((f) => fs.existsSync(path.join(process.cwd(), "public", f)));
}

export function Logo() {
  const file = findLogo();
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      {file && (
        <Image src={`/${file}`} alt="" width={28} height={28} className="h-7 w-auto" unoptimized={file.endsWith(".svg")} />
      )}
      <span>7C Labs</span>
    </span>
  );
}
