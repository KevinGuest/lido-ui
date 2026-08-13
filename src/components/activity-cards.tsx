"use client";

import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil } from "lucide-react";

import { BlocksFoundCard } from "@/components/blocks-found-card";
import { MetricValue } from "@/components/metric-value";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ACTIVITY_CARD_CATALOG,
  availableFiats,
  cardIsAvailable,
  DEFAULT_ACTIVITY_CARD_IDS,
  DEFAULT_FIAT,
  formatFiatAmount,
  formatSatsPerFiat,
  getActivityCardLayoutServerSnapshot,
  getActivityCardLayoutSnapshot,
  isFiatCurrency,
  parseActivityCardLayoutSnapshot,
  sanitizeLayout,
  subscribeActivityCardLayout,
  writeActivityCardLayout,
  type ActivityCardDef,
  type ActivityCardGroup,
  type ActivityCardId,
  type ActivityCardLayout,
  type FiatCurrency,
} from "@/lib/activity-cards";
import { feeRateSats, formatTempC, formatUptime, formatWatts, hashSuffix, numberSuffix } from "@/lib/format";
import type { FoundBlock } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export type ActivityCardValues = {
  uptimeSeconds: number | null;
  hashrate: number;
  bestDifficulty: number;
  networkDifficulty: number;
  blocksFound: number;
  foundBlocks: FoundBlock[];
  connectedMiners: number;
  sharesAccepted: number;
  sharesRejected: number;
  blockHeight: number;
  networkHashrate: number;
  minFeeBtcKvB: number;
  hottestTempC: number | null;
  avgTempC: number | null;
  totalPowerW: number | null;
  prices: Record<string, number> | null;
};

const GROUP_LABEL: Record<ActivityCardGroup, string> = {
  pool: "Pool",
  chain: "Chain",
  device: "Device",
  market: "Market",
};

const GROUP_ORDER: ActivityCardGroup[] = ["pool", "chain", "device", "market"];

function SortableCardShell({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
      }}
      className={cn(
        "min-w-0",
        !disabled && "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "opacity-70",
      )}
      {...attributes}
      {...(disabled ? {} : listeners)}
    >
      {children}
    </div>
  );
}

function MetricCard({
  label,
  loading,
  value,
  hint,
}: {
  label: string;
  loading?: boolean;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardDescription>{hint ? `${label} · ${hint}` : label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">
          <MetricValue loading={loading} skeletonClassName="h-7 w-24">
            {value}
          </MetricValue>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function cardValue(
  id: ActivityCardId,
  values: ActivityCardValues,
  fiat: FiatCurrency,
): { label: string; node: ReactNode; hint?: string } {
  const def = ACTIVITY_CARD_CATALOG.find((card) => card.id === id);
  const label = def?.label ?? id;

  switch (id) {
    case "uptime":
      return {
        label,
        node:
          values.uptimeSeconds == null || values.uptimeSeconds <= 0
            ? null
            : formatUptime(values.uptimeSeconds),
      };
    case "hashrate":
      return { label, node: hashSuffix(values.hashrate) };
    case "bestDifficulty":
      return {
        label,
        node: values.bestDifficulty ? numberSuffix(values.bestDifficulty) : null,
      };
    case "networkDifficulty":
      return {
        label,
        node: values.networkDifficulty ? numberSuffix(values.networkDifficulty) : null,
      };
    case "blocksFound":
      return { label, node: values.blocksFound };
    case "connectedMiners":
      return { label, node: values.connectedMiners.toLocaleString() };
    case "shares": {
      const total = values.sharesAccepted + values.sharesRejected;
      const rejectPct =
        total > 0 ? ((values.sharesRejected / total) * 100).toFixed(1) : null;
      return {
        label,
        hint: rejectPct ? `${rejectPct}% rej` : undefined,
        node: values.sharesAccepted.toLocaleString(),
      };
    }
    case "blockHeight":
      return {
        label,
        node: values.blockHeight > 0 ? values.blockHeight.toLocaleString() : null,
      };
    case "networkHashrate":
      return {
        label,
        node: values.networkHashrate > 0 ? hashSuffix(values.networkHashrate) : null,
      };
    case "avgTxFee":
      return {
        label,
        node: values.minFeeBtcKvB > 0 ? feeRateSats(values.minFeeBtcKvB) : null,
      };
    case "temperature": {
      const hottest = formatTempC(values.hottestTempC);
      const avg = formatTempC(values.avgTempC);
      const showAvg =
        hottest &&
        avg &&
        values.avgTempC != null &&
        values.hottestTempC != null &&
        Math.abs(values.hottestTempC - values.avgTempC) > 0.15;
      return {
        label,
        hint: showAvg ? `avg ${avg}` : undefined,
        node: hottest,
      };
    }
    case "wattage":
      return { label, node: formatWatts(values.totalPowerW) };
    case "btcPrice": {
      const price = values.prices?.[fiat];
      return {
        label: `BTC / ${fiat}`,
        node:
          price != null && Number.isFinite(price) && price > 0
            ? formatFiatAmount(price, fiat)
            : null,
      };
    }
    case "satsPerFiat": {
      const price = values.prices?.[fiat];
      return {
        label: `Sats / ${fiat}`,
        node: price != null ? formatSatsPerFiat(price, fiat) : null,
      };
    }
    default:
      return { label, node: null };
  }
}

function EditCardsMenu({
  layout,
  catalog,
  fiats,
  onToggle,
  onFiat,
  onReset,
}: {
  layout: ActivityCardLayout;
  catalog: ActivityCardDef[];
  fiats: FiatCurrency[];
  onToggle: (id: ActivityCardId, visible: boolean) => void;
  onFiat: (fiat: FiatCurrency) => void;
  onReset: () => void;
}) {
  const visible = new Set(layout.order);
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    cards: catalog.filter((card) => card.group === group),
  })).filter((entry) => entry.cards.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton
        aria-label="Edit activity cards"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md",
          "text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
        )}
      >
        <Pencil className="size-3.5" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        {grouped.map((entry, index) => (
          <DropdownMenuGroup key={entry.group}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>{GROUP_LABEL[entry.group]}</DropdownMenuLabel>
            {entry.cards.map((card) => {
              const checked = visible.has(card.id);
              return (
                <DropdownMenuCheckboxItem
                  key={card.id}
                  checked={checked}
                  disabled={checked && layout.order.length <= 1}
                  closeOnClick={false}
                  onCheckedChange={(next) => onToggle(card.id, Boolean(next))}
                >
                  {card.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuGroup>
        ))}
        {fiats.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Currency</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-28">
                <DropdownMenuRadioGroup
                  value={layout.fiat}
                  onValueChange={(value) => {
                    if (value && isFiatCurrency(value)) onFiat(value);
                  }}
                >
                  {fiats.map((code) => (
                    <DropdownMenuRadioItem key={code} value={code}>
                      {code}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onReset}>Reset layout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ActivityCards({
  editable,
  loading = false,
  allowDevice,
  values,
}: {
  editable: boolean;
  loading?: boolean;
  allowDevice: boolean;
  values: ActivityCardValues;
}) {
  const hasPrices = availableFiats(values.prices).length > 0;
  const availability = useMemo(
    () => ({ device: allowDevice, prices: hasPrices }),
    [allowDevice, hasPrices],
  );
  const rawLayout = useSyncExternalStore(
    subscribeActivityCardLayout,
    getActivityCardLayoutSnapshot,
    getActivityCardLayoutServerSnapshot,
  );
  const storedLayout = useMemo(
    () => parseActivityCardLayoutSnapshot(rawLayout, availability),
    [rawLayout, availability],
  );
  const layout = editable
    ? storedLayout
    : { order: [...DEFAULT_ACTIVITY_CARD_IDS], fiat: DEFAULT_FIAT };

  const persist = useCallback(
    (next: ActivityCardLayout) => {
      if (!editable) return;
      writeActivityCardLayout(sanitizeLayout(next, availability));
    },
    [availability, editable],
  );

  const catalog = useMemo(
    () => ACTIVITY_CARD_CATALOG.filter((card) => cardIsAvailable(card, availability)),
    [availability],
  );
  const fiats = useMemo(() => availableFiats(values.prices), [values.prices]);
  const fiat = fiats.includes(layout.fiat) ? layout.fiat : (fiats[0] ?? layout.fiat);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = layout.order.indexOf(String(active.id) as ActivityCardId);
    const newIndex = layout.order.indexOf(String(over.id) as ActivityCardId);
    if (oldIndex < 0 || newIndex < 0) return;
    persist({ ...layout, fiat, order: arrayMove(layout.order, oldIndex, newIndex) });
  }

  function toggleCard(id: ActivityCardId, visible: boolean) {
    if (visible) {
      if (layout.order.includes(id)) return;
      persist({ ...layout, fiat, order: [...layout.order, id] });
      return;
    }
    if (layout.order.length <= 1) return;
    persist({ ...layout, fiat, order: layout.order.filter((cardId) => cardId !== id) });
  }

  function renderCard(id: ActivityCardId) {
    if (id === "blocksFound") {
      return (
        <BlocksFoundCard
          count={values.blocksFound}
          blocks={values.foundBlocks}
          loading={loading}
        />
      );
    }
    const content = cardValue(id, values, fiat);
    return (
      <MetricCard
        label={content.label}
        hint={content.hint}
        loading={
          loading &&
          (id === "uptime" ||
            id === "hashrate" ||
            id === "bestDifficulty" ||
            id === "networkDifficulty" ||
            id === "btcPrice" ||
            id === "satsPerFiat" ||
            id === "avgTxFee" ||
            id === "networkHashrate" ||
            id === "blockHeight")
        }
        value={content.node}
      />
    );
  }

  const cards = layout.order.map((id) =>
    editable ? (
      <SortableCardShell key={id} id={id} disabled={false}>
        {renderCard(id)}
      </SortableCardShell>
    ) : (
      <div key={id} className="min-w-0">
        {renderCard(id)}
      </div>
    ),
  );

  const grid = <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards}</div>;

  return (
    <div className="space-y-2">
      {editable ? (
        <div className="flex justify-end">
          <EditCardsMenu
            layout={{ ...layout, fiat }}
            catalog={catalog}
            fiats={fiats}
            onToggle={toggleCard}
            onFiat={(next) => persist({ ...layout, fiat: next })}
            onReset={() =>
              persist({ order: [...DEFAULT_ACTIVITY_CARD_IDS], fiat: DEFAULT_FIAT })
            }
          />
        </div>
      ) : null}
      {editable ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layout.order} strategy={rectSortingStrategy}>
            {grid}
          </SortableContext>
        </DndContext>
      ) : (
        grid
      )}
    </div>
  );
}
