import Image from "next/image";

type Props = {
  kind: "imdb" | "rt";
  className?: string;
};

export default function BrandLogo({ kind, className }: Props) {
  const src = kind === "imdb" ? "/brands/imdb.svg" : "/brands/rottentomatoes.svg";
  const alt = kind === "imdb" ? "IMDb" : "Rotten Tomatoes";

  // Tamaño pequeño y consistente. Ajustamos si quieres más pequeño/grande.
  const w = kind === "imdb" ? 44 : 72;
  const h = 18;

  return (
    <span className={className ?? ""} style={{ display: "inline-flex", alignItems: "center" }}>
      <Image src={src} alt={alt} width={w} height={h} priority />
    </span>
  );
}
