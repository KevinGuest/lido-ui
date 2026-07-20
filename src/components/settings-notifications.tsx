"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { useToast } from "@/components/toast";
import { ModalOverlay } from "@/components/modal-overlay";
import {
  NOTIFICATION_EVENT_META,
  POOL_DIGEST_OPTIONS,
  emptyNotificationSettings,
  fetchNotificationSettings,
  formatPoolDigest,
  saveNotificationSettings,
  testNotificationChannel,
  type NotificationEventKey,
  type NotificationEvents,
  type NotificationSettings,
  type PoolDigestConfig,
  type PoolDigestUnit,
} from "@/lib/notifications";
import { cn, hoverLabelClassName } from "@/lib/utils";

type NotifyPane = "overview" | "discord" | "telegram";

function DiscordLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TelegramLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  mono,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
  mono?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm outline-none",
          "focus-visible:border-foreground/40 disabled:opacity-60",
          mono && "font-mono text-xs",
        )}
      />
    </label>
  );
}

function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
        checked ? "border-transparent bg-foreground" : "border-border bg-transparent",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full transition-[left,background-color]",
          checked ? "left-[1.125rem] bg-background" : "left-0.5 bg-muted-foreground/40",
        )}
      />
    </button>
  );
}

function PaneIcon({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "group relative flex size-9 items-center justify-center rounded-md border transition-colors",
        active
          ? "border-transparent bg-foreground text-background"
          : "border-border bg-transparent text-foreground hover:bg-muted/40",
      )}
    >
      {children}
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2",
          hoverLabelClassName,
          "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function EventToggles({
  events,
  disabled,
  onChange,
  poolDigest,
  onPoolDigestChange,
}: {
  events: NotificationEvents;
  disabled?: boolean;
  onChange: (key: NotificationEventKey, value: boolean) => void;
  poolDigest: PoolDigestConfig;
  onPoolDigestChange: (value: PoolDigestConfig) => void;
}) {
  const [draftUnit, setDraftUnit] = useState<Exclude<PoolDigestUnit, "off"> | null>(null);
  const [draftEvery, setDraftEvery] = useState("1");

  function openIntervalEditor(unit: Exclude<PoolDigestUnit, "off">) {
    const current =
      poolDigest.unit === unit ? Math.max(1, Math.floor(poolDigest.every) || 1) : 1;
    setDraftEvery(String(current));
    setDraftUnit(unit);
  }

  function confirmInterval() {
    if (!draftUnit) return;
    const every = Math.max(1, Math.floor(Number(draftEvery)) || 1);
    onPoolDigestChange({ unit: draftUnit, every });
    setDraftUnit(null);
  }

  const unitNoun =
    draftUnit === "hours" ? "hours" : draftUnit === "weeks" ? "weeks" : "months";

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Events</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {NOTIFICATION_EVENT_META.map((event) => (
          <div
            key={event.key}
            className={cn(
              "flex items-start justify-between gap-3 rounded-xl border border-border/50 px-3 py-3",
              disabled && "opacity-50",
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{event.label}</p>
              <p className="text-xs text-muted-foreground">{event.description}</p>
            </div>
            <Switch
              checked={events[event.key]}
              disabled={disabled}
              label={event.label}
              onCheckedChange={(value) => onChange(event.key, value)}
            />
          </div>
        ))}
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border border-border/50 px-3 py-3",
            disabled && "opacity-50",
          )}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">Pool digest</p>
            <p className="text-xs text-muted-foreground">
              {poolDigest.unit === "off"
                ? "Periodic pool summary."
                : `Periodic pool summary — ${formatPoolDigest(poolDigest).toLowerCase()}.`}
            </p>
          </div>
          <div
            className="flex shrink-0 flex-wrap justify-end gap-1.5"
            role="radiogroup"
            aria-label="Pool digest frequency"
          >
            {POOL_DIGEST_OPTIONS.map((option) => {
              const active = poolDigest.unit === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={option.label}
                  title={option.label}
                  disabled={disabled}
                  onClick={() => {
                    if (option.value === "off") {
                      onPoolDigestChange({ unit: "off", every: 1 });
                      return;
                    }
                    openIntervalEditor(option.value);
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-transparent bg-foreground text-background"
                      : "border-border bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    disabled && "cursor-not-allowed",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ModalOverlay
        open={draftUnit != null}
        onClose={() => setDraftUnit(null)}
        label="Pool digest interval"
      >
        <div className="w-[min(100%,24rem)] rounded-2xl border border-border/60 bg-background p-5 shadow-xl">
          <h3 className="text-base font-medium">Pool digest interval</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            How often should Lido send this channel a pool summary?
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Every</span>
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={draftEvery}
              onChange={(e) => setDraftEvery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmInterval();
              }}
              className={cn(
                "w-20 rounded-md border border-border/60 bg-transparent px-2.5 py-1.5 text-sm outline-none",
                "focus-visible:border-foreground/40",
              )}
            />
            <span className="text-muted-foreground">{unitNoun}</span>
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraftUnit(null)}
              className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted/40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmInterval}
              className="rounded-md border border-transparent bg-foreground px-3 py-1.5 text-xs text-background"
            >
              Save
            </button>
          </div>
        </div>
      </ModalOverlay>
    </section>
  );
}

export function SettingsNotificationsPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(emptyNotificationSettings);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<"discord" | "telegram" | null>(null);
  const [pane, setPane] = useState<NotifyPane>("overview");
  /** Credential fingerprints that passed Test (or loaded as already configured). */
  const [verified, setVerified] = useState<{
    discord: string | null;
    telegram: string | null;
  }>({ discord: null, telegram: null });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await fetchNotificationSettings();
        if (!cancelled) {
          setSettings(next);
          setLoadError(null);
          setVerified({
            discord: next.discord.configured ? CONFIGURED_SENTINEL : null,
            telegram: next.telegram.configured ? CONFIGURED_SENTINEL : null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            (err as Error).message || "Could not load notification settings";
          setLoadError(message);
          toast(message, "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const discordFp = credentialFingerprint(
    "discord",
    settings.discord.webhookUrl,
    settings.discord.configured,
  );
  const telegramBlank =
    !settings.telegram.botToken.trim() && !settings.telegram.chatId.trim();
  const telegramFp = credentialFingerprint(
    "telegram",
    telegramBlank
      ? ""
      : `${settings.telegram.botToken}\0${settings.telegram.chatId}`,
    settings.telegram.configured,
  );
  const discordVerified = verified.discord != null && verified.discord === discordFp;
  const telegramVerified =
    verified.telegram != null && verified.telegram === telegramFp;

  const discordRequiresTest = settings.enabled && settings.discord.enabled;
  const telegramRequiresTest = settings.enabled && settings.telegram.enabled;
  const canSave =
    (!discordRequiresTest || discordVerified) &&
    (!telegramRequiresTest || telegramVerified);

  async function onSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const saved = await saveNotificationSettings(settings);
      setSettings(saved);
      setVerified({
        discord: saved.discord.configured ? CONFIGURED_SENTINEL : null,
        telegram: saved.telegram.configured ? CONFIGURED_SENTINEL : null,
      });
      toast(
        process.env.NEXT_PUBLIC_LIDO_DEMO === "true"
          ? "Saved in demo (browser only)"
          : "Notification settings saved",
        "success",
      );
    } catch (err) {
      toast((err as Error).message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function onTest(channel: "discord" | "telegram") {
    setTesting(channel);
    try {
      await testNotificationChannel({ channel, settings });
      if (channel === "discord") {
        setVerified((v) => ({
          ...v,
          discord: credentialFingerprint(
            "discord",
            settings.discord.webhookUrl,
            false,
          ),
        }));
      } else {
        setVerified((v) => ({
          ...v,
          telegram: credentialFingerprint(
            "telegram",
            `${settings.telegram.botToken}\0${settings.telegram.chatId}`,
            false,
          ),
        }));
      }
      toast(
        channel === "discord"
          ? "Connection test sent to Discord"
          : "Connection test sent to Telegram",
        "success",
      );
    } catch (err) {
      if (channel === "discord") {
        setVerified((v) => ({ ...v, discord: null }));
      } else {
        setVerified((v) => ({ ...v, telegram: null }));
      }
      toast((err as Error).message || "Test failed", "error");
    } finally {
      setTesting(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading notifications…</p>;
  }

  if (loadError) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4">
        <p className="text-sm font-medium text-destructive">{loadError}</p>
        <p className="text-sm text-muted-foreground">
          The pool could not be reached from your browser, so these controls do not
          reflect what is saved on the server. Alerts may still be active until
          settings load and you save changes. Restart Lido after updating — the
          latest package refreshes nginx routing on start.
        </p>
      </div>
    );
  }

  const paneCopy =
    pane === "overview"
      ? {
          title: "Notifications",
          description:
            "Master mute for all channels. Pick Discord or Telegram to choose events and credentials.",
        }
      : pane === "discord"
        ? {
            title: "Discord",
            description:
              "Webhook URL plus which events should post to this channel.",
          }
        : {
            title: "Telegram",
            description:
              "Bot token, chat ID, and which events should message this chat.",
          };

  const saveHint = !canSave
    ? discordRequiresTest && !discordVerified && telegramRequiresTest && !telegramVerified
      ? "Test Discord and Telegram before saving"
      : discordRequiresTest && !discordVerified
        ? "Test Discord before saving"
        : "Test Telegram before saving"
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-medium">{paneCopy.title}</h2>
          <p className="max-w-xl text-sm text-muted-foreground">{paneCopy.description}</p>
        </div>

        {/* Desktop: icon tabs */}
        <div
          className="hidden items-center gap-1.5 md:flex"
          role="tablist"
          aria-label="Notification channels"
        >
          <PaneIcon
            active={pane === "overview"}
            label="General"
            onClick={() => setPane("overview")}
          >
            <Bell className="size-4" strokeWidth={1.75} />
          </PaneIcon>
          <PaneIcon
            active={pane === "discord"}
            label="Discord"
            onClick={() => setPane("discord")}
          >
            <DiscordLogo className="size-4" />
          </PaneIcon>
          <PaneIcon
            active={pane === "telegram"}
            label="Telegram"
            onClick={() => setPane("telegram")}
          >
            <TelegramLogo className="size-4" />
          </PaneIcon>
        </div>

        {/* Mobile: labeled segments */}
        <div
          className="grid w-full grid-cols-3 gap-1 md:hidden"
          role="tablist"
          aria-label="Notification channels"
        >
          {(
            [
              { id: "overview" as const, label: "General" },
              { id: "discord" as const, label: "Discord" },
              { id: "telegram" as const, label: "Telegram" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={pane === item.id}
              onClick={() => setPane(item.id)}
              className={cn(
                "rounded-md border px-2 py-2.5 text-center text-xs font-medium transition-colors",
                pane === item.id
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-transparent text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {pane === "overview" ? (
        <section className="flex items-center justify-between gap-4 rounded-xl border border-border/50 px-4 py-3">
          <div>
            <p className="font-medium">Notifications</p>
            <p className="text-sm text-muted-foreground">
              Master switch for all alert channels.
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            label="Notifications"
            onCheckedChange={(enabled) => setSettings((s) => ({ ...s, enabled }))}
          />
        </section>
      ) : null}

      {pane === "discord" ? (
        <div className="space-y-5">
          <section className="space-y-4 rounded-xl border border-border/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">Discord webhook</h3>
                <p className="text-sm text-muted-foreground">
                  One URL posts into the channel you create the webhook in.
                </p>
              </div>
              <Switch
                checked={settings.discord.enabled}
                label="Discord enabled"
                disabled={!settings.enabled}
                onCheckedChange={(enabled) =>
                  setSettings((s) => ({
                    ...s,
                    discord: { ...s.discord, enabled },
                  }))
                }
              />
            </div>
            {settings.discord.enabled ? (
              <>
                <Field
                  label="Webhook URL"
                  value={settings.discord.webhookUrl}
                  disabled={!settings.enabled}
                  placeholder={
                    settings.discord.configured
                      ? "Saved on server — paste a new URL to replace"
                      : "https://discord.com/api/webhooks/…"
                  }
                  onChange={(webhookUrl) => {
                    setVerified((v) => ({ ...v, discord: null }));
                    setSettings((s) => ({
                      ...s,
                      discord: { ...s.discord, webhookUrl },
                    }));
                  }}
                  type="password"
                  mono
                />
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {discordVerified ? (
                    <span className="text-xs text-emerald-400">
                      {settings.discord.webhookUrl.trim() ? "Tested" : "Saved"}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void onTest("discord")}
                    disabled={
                      testing != null ||
                      saving ||
                      !settings.enabled ||
                      !settings.discord.webhookUrl.trim()
                    }
                    className={cn(
                      "rounded-md border border-border px-3 py-1.5 text-xs transition-colors",
                      "hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40",
                    )}
                  >
                    {testing === "discord" ? "Testing…" : "Test Discord"}
                  </button>
                </div>
              </>
            ) : null}
          </section>
          {settings.discord.enabled ? (
            <EventToggles
              events={settings.discord.events}
              disabled={!settings.enabled}
              poolDigest={settings.discord.poolDigest}
              onPoolDigestChange={(poolDigest) =>
                setSettings((s) => ({
                  ...s,
                  discord: { ...s.discord, poolDigest },
                }))
              }
              onChange={(key, value) =>
                setSettings((s) => ({
                  ...s,
                  discord: {
                    ...s.discord,
                    events: { ...s.discord.events, [key]: value },
                  },
                }))
              }
            />
          ) : null}
        </div>
      ) : null}

      {pane === "telegram" ? (
        <div className="space-y-5">
          <section className="space-y-4 rounded-xl border border-border/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">Telegram bot</h3>
                <p className="text-sm text-muted-foreground">
                  BotFather token plus the chat ID that should receive alerts.
                </p>
              </div>
              <Switch
                checked={settings.telegram.enabled}
                label="Telegram enabled"
                disabled={!settings.enabled}
                onCheckedChange={(enabled) =>
                  setSettings((s) => ({
                    ...s,
                    telegram: { ...s.telegram, enabled },
                  }))
                }
              />
            </div>
            {settings.telegram.enabled ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Bot token"
                    value={settings.telegram.botToken}
                    disabled={!settings.enabled}
                    placeholder={
                      settings.telegram.configured
                        ? "Saved on server — paste a new token to replace"
                        : undefined
                    }
                    onChange={(botToken) => {
                      setVerified((v) => ({ ...v, telegram: null }));
                      setSettings((s) => ({
                        ...s,
                        telegram: { ...s.telegram, botToken },
                      }));
                    }}
                    type="password"
                    mono
                  />
                  <Field
                    label="Chat ID"
                    value={settings.telegram.chatId}
                    disabled={!settings.enabled}
                    placeholder={
                      settings.telegram.configured
                        ? "Saved on server — paste a new chat ID to replace"
                        : undefined
                    }
                    onChange={(chatId) => {
                      setVerified((v) => ({ ...v, telegram: null }));
                      setSettings((s) => ({
                        ...s,
                        telegram: { ...s.telegram, chatId },
                      }));
                    }}
                    type="password"
                    mono
                  />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {telegramVerified ? (
                    <span className="text-xs text-emerald-400">
                      {settings.telegram.botToken.trim() || settings.telegram.chatId.trim()
                        ? "Tested"
                        : "Saved"}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void onTest("telegram")}
                    disabled={
                      testing != null ||
                      saving ||
                      !settings.enabled ||
                      !settings.telegram.botToken.trim() ||
                      !settings.telegram.chatId.trim()
                    }
                    className={cn(
                      "rounded-md border border-border px-3 py-1.5 text-xs transition-colors",
                      "hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40",
                    )}
                  >
                    {testing === "telegram" ? "Testing…" : "Test Telegram"}
                  </button>
                </div>
              </>
            ) : null}
          </section>
          {settings.telegram.enabled ? (
            <EventToggles
              events={settings.telegram.events}
              disabled={!settings.enabled}
              poolDigest={settings.telegram.poolDigest}
              onPoolDigestChange={(poolDigest) =>
                setSettings((s) => ({
                  ...s,
                  telegram: { ...s.telegram, poolDigest },
                }))
              }
              onChange={(key, value) =>
                setSettings((s) => ({
                  ...s,
                  telegram: {
                    ...s.telegram,
                    events: { ...s.telegram.events, [key]: value },
                  },
                }))
              }
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {saveHint ? (
          <p className="text-xs text-muted-foreground">{saveHint}</p>
        ) : null}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !canSave}
          className={cn(
            "rounded-md border border-transparent bg-foreground px-4 py-2 text-sm text-background",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

const CONFIGURED_SENTINEL = "__configured__";

/** Empty fields + configured on server → treat as already verified until edited. */
function credentialFingerprint(
  _channel: "discord" | "telegram",
  value: string,
  configured: boolean,
): string {
  const trimmed = value.trim();
  if (!trimmed && configured) return CONFIGURED_SENTINEL;
  return trimmed;
}
