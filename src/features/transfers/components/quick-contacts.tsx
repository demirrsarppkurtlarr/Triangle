"use client";

import { User } from "lucide-react";

import type { QuickContact } from "@/features/transfers/services/contacts.service";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type QuickContactsProps = {
  contacts: QuickContact[];
  onSelect: (triangleId: string) => void;
  selectedId?: string;
};

export function QuickContacts({
  contacts,
  onSelect,
  selectedId,
}: QuickContactsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t.transfer.quickContacts}
      </p>
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.transfer.noContacts}</p>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {contacts.map((contact) => {
            const active = selectedId === contact.triangleId;
            return (
              <button
                key={contact.userId}
                type="button"
                onClick={() => onSelect(contact.triangleId)}
                className={cn(
                  "flex min-w-[8.5rem] shrink-0 flex-col items-start gap-1 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/60 bg-secondary/50 text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <User className="size-3.5" />
                  @{contact.username}
                </span>
                <span className="font-mono text-[10px]">{contact.triangleId}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
