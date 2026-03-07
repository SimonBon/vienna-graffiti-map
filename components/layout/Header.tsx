export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎨</span>
        <span className="font-bold text-white tracking-widest uppercase text-sm">
          Vienna Graffiti Map
        </span>
      </div>
      <span className="text-zinc-400 text-xs font-mono">tap map to pin</span>
    </header>
  );
}
