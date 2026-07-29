"use client";

import { useActionState, useEffect, useState } from "react";
import { Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  buyInsuranceAction,
  type InsuranceActionState,
} from "@/features/insurance/actions/insurance.actions";
import type { InsurancePolicy } from "@/features/insurance/services/insurance.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const initial: InsuranceActionState = {};

const TYPES = [
  { value: "account", label: "Hesap Sigortası", desc: "Bakiyenizi koruyun" },
  { value: "stock", label: "Hisse Sigortası", desc: "Borsa kayıplarına karşı" },
  { value: "crypto", label: "Kripto Sigortası", desc: "Kripto düşüşlerine karşı" },
];

type Props = { policies: InsurancePolicy[]; cash: number };

export function InsuranceHub({ policies, cash }: Props) {
  const [state, action, pending] = useActionState(buyInsuranceAction, initial);
  const [type, setType] = useState("account");
  const [coverage, setCoverage] = useState("2000");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state]);

  const premium = Math.round(Number(coverage) * 0.05 * 100) / 100;
  const activeTypes = new Set(policies.filter((p) => p.status === "active").map((p) => p.policyType));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Bakiye: <span className="font-semibold text-foreground">{formatCurrency(cash)}</span>
      </p>

      <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="size-4 text-primary" />
          <h2 className="font-semibold tracking-tight">Sigorta satın al</h2>
        </div>
        <form action={action} className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  type === t.value ? "border-primary/40 bg-primary/5" : "border-border/50",
                  activeTypes.has(t.value) && "opacity-50",
                )}
                disabled={activeTypes.has(t.value)}
              >
                <p className="text-sm font-medium">{t.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {activeTypes.has(t.value) ? "Aktif poliçe var" : t.desc}
                </p>
              </button>
            ))}
          </div>
          <input type="hidden" name="type" value={type} />
          <div>
            <label className="text-xs text-muted-foreground">Teminat tutarı ($)</label>
            <input
              type="number"
              name="coverage"
              min={500}
              value={coverage}
              onChange={(e) => setCoverage(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Prim: <span className="font-medium">{formatCurrency(premium)}</span> (teminatın %5&apos;i) · 30 gün geçerli
          </p>
          <MotionButton type="submit" className="min-h-11 w-full" pending={pending} pendingLabel="İşleniyor…"
            disabled={activeTypes.has(type)}>
            Sigorta satın al
          </MotionButton>
        </form>
      </div>

      {policies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h2 className="font-semibold tracking-tight">Poliçelerim</h2>
          </div>
          {policies.map((p) => {
            const expired = new Date(p.expiresAt).getTime() <= Date.now();
            return (
              <div key={p.id} className={cn(
                "rounded-[1.35rem] border bg-card/80 p-4 shadow-soft",
                p.status === "active" && !expired ? "border-primary/20" : "border-border/50",
              )}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold capitalize">{p.policyType} sigortası</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Teminat: {formatCurrency(p.coverageAmount)} · Prim: {formatCurrency(p.premium)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Bitiş: {new Date(p.expiresAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    p.status === "active" && !expired ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground",
                  )}>
                    {p.status === "active" && !expired ? "Aktif" : expired ? "Süresi doldu" : p.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
