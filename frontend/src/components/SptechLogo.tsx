export function SptechLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-lg">
        S
      </div>
      <div className="leading-tight">
        <div className="text-sm font-black tracking-wider text-secondary">SÃO PAULO</div>
        <div className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground -mt-0.5">TECH SCHOOL</div>
      </div>
    </div>
  );
}
