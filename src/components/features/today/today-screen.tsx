import { Card, CardAction, CardHeader } from "@/components/ui/card";
import { List, ListRow } from "@/components/ui/list-row";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusDot, type StatusTone } from "@/components/ui/status-dot";
import { formatNumberTL, formatTL, formatTodayLine } from "@/lib/format";
import {
  businessName,
  cashKurus,
  monthExpenseKurus,
  monthIncomeKurus,
  receivableCustomerCount,
  receivablesKurus,
  todaysJobs,
  weeklyChangeKurus,
  type JobStatus,
} from "./mock-data";

const jobStatus: Record<JobStatus, { tone: StatusTone; label: string }> = {
  done: { tone: "success", label: "Tamamlandı" },
  pending: { tone: "warning", label: "Bekliyor" },
  planned: { tone: "muted", label: "Planlandı" },
};

function CashCard() {
  return (
    <Card className="p-4">
      <SectionLabel>Kasa</SectionLabel>
      <p className="mt-2 flex items-start gap-1 tabular-nums">
        <span className="mt-[3px] font-display text-[22px] font-semibold leading-none text-ink">
          ₺
        </span>
        <span className="font-display text-[40px] font-semibold leading-[44px] text-ink">
          {formatNumberTL(cashKurus / 100, 0)}
        </span>
      </p>
      <p className="mt-1.5 text-[13px] font-semibold tabular-nums text-pos">
        +{formatTL(weeklyChangeKurus, 0)} bu hafta
      </p>
    </Card>
  );
}

function TodaysJobsCard() {
  return (
    <Card>
      <CardHeader>
        <SectionLabel>Bugünkü İşler</SectionLabel>
        <CardAction href="/isler">Tümü →</CardAction>
      </CardHeader>
      <List className="mt-1 pb-2">
        {todaysJobs.map((job) => {
          const status = jobStatus[job.status];
          return (
            <ListRow
              key={`${job.time}-${job.customer}`}
              title={
                <>
                  <span className="mr-2 inline-block w-11 text-[13px] font-medium tabular-nums text-muted">
                    {job.time}
                  </span>
                  {job.customer}
                </>
              }
              subtitle={job.work}
              trailing={<StatusDot tone={status.tone} label={status.label} />}
            />
          );
        })}
      </List>
    </Card>
  );
}

function MonthSummaryBar({
  label,
  valueKurus,
  maxKurus,
  tone,
}: {
  label: string;
  valueKurus: number;
  maxKurus: number;
  tone: "pos" | "neg";
}) {
  const width = Math.round((valueKurus / maxKurus) * 100);
  const barClass = tone === "pos" ? "bg-pos" : "bg-neg";
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="w-12 shrink-0 text-[13px] font-medium text-muted">
          {label}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-[2px] bg-surface-sunken">
          <div
            className={`h-full rounded-[2px] ${barClass}`}
            style={{ width: `${width}%` }}
          />
        </div>
        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
          {formatTL(valueKurus, 0)}
        </span>
      </div>
    </div>
  );
}

function MonthSummaryCard() {
  const maxKurus = Math.max(monthIncomeKurus, monthExpenseKurus);
  return (
    <Card className="p-4">
      <SectionLabel>Bu Ay</SectionLabel>
      <div className="mt-3 space-y-3">
        <MonthSummaryBar
          label="Gelir"
          valueKurus={monthIncomeKurus}
          maxKurus={maxKurus}
          tone="pos"
        />
        <MonthSummaryBar
          label="Gider"
          valueKurus={monthExpenseKurus}
          maxKurus={maxKurus}
          tone="neg"
        />
      </div>
    </Card>
  );
}

function ReceivablesCard() {
  return (
    <Card>
      <CardHeader>
        <SectionLabel>Alacaklar</SectionLabel>
      </CardHeader>
      <a
        href="/alacaklar"
        className="flex items-center justify-between gap-3 px-4 pb-4 pt-3 transition-colors hover:bg-surface-sunken"
      >
        <div>
          <p className="text-[15px] font-semibold tabular-nums text-ink">
            {formatTL(receivablesKurus, 0)}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {receivableCustomerCount} müşteri
          </p>
        </div>
        <span
          aria-hidden
          className="material-symbols-outlined text-base text-faint"
        >
          chevron_right
        </span>
      </a>
    </Card>
  );
}

export function TodayScreen() {
  const today = new Date();
  return (
    <div className="mx-auto w-full max-w-[600px] px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-4 lg:max-w-[680px] lg:px-5 lg:pb-10 lg:pt-10">
      <header className="mb-7">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="material-symbols-outlined text-xl text-primary"
          >
            bolt
          </span>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {businessName}
          </h1>
        </div>
        <p className="mt-1 text-[13px] text-muted">{formatTodayLine(today)}</p>
      </header>
      <div className="space-y-7">
        <CashCard />
        <TodaysJobsCard />
        <MonthSummaryCard />
        <ReceivablesCard />
      </div>
    </div>
  );
}
