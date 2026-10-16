import { useId } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  multiline = false,
  name,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string;
  type?: "text" | "email" | "search";
  multiline?: boolean;
  name?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          name={name}
          value={value}
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="mt-1"
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          name={name}
          type={type}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="mt-1"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint ? (
        <p id={hintId} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
