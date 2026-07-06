import { SeedCards } from "@/components/SeedCards";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20, padding: 32,
        background: "var(--cream)",
      }}
    >
      <h1 style={{ fontSize: 64, color: "var(--crayon)", fontFamily: "Georgia, serif", margin: 0 }}>Inkling</h1>
      <p style={{ fontSize: 22, color: "var(--ink)", marginTop: -8 }}>Draw yourself into the story.</p>
      <SeedCards />
    </main>
  );
}
