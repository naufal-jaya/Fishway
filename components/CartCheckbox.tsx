"use client";

import { useState } from "react";
import { ReactNode } from "react";

export default function CartCheckbox({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(true);

  return (
    <div className="flex items-center gap-3">
        <input
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
        className="flex-shrink-0 cursor-pointer"
        style={{ borderColor: checked ? "#407BB5" : "#d1d5db" }}
        />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}