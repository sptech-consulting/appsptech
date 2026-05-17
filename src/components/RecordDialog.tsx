import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "url" | "number" | "select" | "image" | "multiselect";
  required?: boolean;
  options?: [string, string][];
  /** Para type=multiselect: opções carregadas dinamicamente. */
  loadOptions?: () => Promise<[string, string][]>;
  placeholder?: string;
  /** Pasta no bucket para uploads (type=image). */
  uploadFolder?: string;
  /** Aspect ratio do preview (type=image). */
  aspect?: string;
};

export function RecordDialog<T extends Record<string, any>>({
  title,
  trigger,
  fields,
  initial,
  onSubmit,
  open,
  onOpenChange,
}: {
  title: string;
  trigger?: React.ReactNode;
  fields: FieldDef[];
  initial?: Partial<T>;
  onSubmit: (data: T) => Promise<boolean | void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [state, setState] = useState<Record<string, any>>(initial ?? {});
  const [busy, setBusy] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setState(initial ?? {});
        onOpenChange?.(o);
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const ok = await onSubmit(state as T);
            setBusy(false);
            if (ok !== false) onOpenChange?.(false);
          }}
          className="space-y-3"
        >
          {fields.map((f) => (
            <div key={f.name}>
              <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-secondary">
                {f.label}
                {f.required && " *"}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  required={f.required}
                  value={state[f.name] ?? ""}
                  onChange={(e) => setState((s) => ({ ...s, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={3}
                />
              ) : f.type === "image" ? (
                <ImageUpload
                  value={state[f.name] ?? null}
                  onChange={(url) => setState((s) => ({ ...s, [f.name]: url }))}
                  folder={f.uploadFolder ?? "diversos"}
                  aspect={f.aspect ?? "aspect-square"}
                />
              ) : f.type === "select" ? (
                <select
                  required={f.required}
                  value={state[f.name] ?? ""}
                  onChange={(e) => setState((s) => ({ ...s, [f.name]: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm"
                >
                  <option value="">Selecione…</option>
                  {f.options?.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : f.type === "multiselect" ? (
                <MultiSelectField
                  field={f}
                  value={(state[f.name] as string[]) ?? []}
                  onChange={(v) => setState((s) => ({ ...s, [f.name]: v }))}
                />
              ) : (
                <Input
                  type={f.type === "url" ? "url" : f.type === "number" ? "number" : "text"}
                  required={f.required}
                  value={state[f.name] ?? ""}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      [f.name]: f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value,
                    }))
                  }
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
