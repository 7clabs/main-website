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
    <span className="flex items-center gap-3">
      {file && (
        <Image src={`/${file}`} alt="" width={96} height={96} priority className="h-10 w-auto sm:h-12" unoptimized={file.endsWith(".svg")} />
      )}
      <span className="whitespace-nowrap text-[1.5rem] font-bold leading-none tracking-tight text-foreground sm:text-[2rem]">7C Labs</span>
    </span>
  );
}
