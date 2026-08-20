"use client";

import { Input } from "./ui";

export function PhoneInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="tel"
      inputMode="numeric"
      maxLength={11}
      placeholder="01x xxxx xxxx"
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
        onChange(digits);
      }}
    />
  );
}