import type { Metadata } from "next";
import Link from "next/link";

import { GITHUB_REPO_URL, UMBREL_APP_URL } from "@/lib/app-meta";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for the Lido solo Bitcoin mining pool at lido.wtf.",
  robots: { index: true, follow: true },
};

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Use at Your Own Risk",
    body: "Lido is provided as-is, without warranties or guarantees of any kind. Bitcoin mining is probabilistic and operationally risky. You are solely responsible for deciding whether to use the pool, how to configure your miners, and how to secure your keys, addresses, wallets, devices, and network.",
  },
  {
    title: "No Payout or Uptime Guarantees",
    body: "There is no guarantee that any share, block candidate, block submission, payout calculation, coinbase payout, user interface value, API value, or accounting value will be accepted, displayed, credited, or paid. There is no guarantee of uptime, connectivity, latency, block propagation, compatibility with any miner, or continued operation of any endpoint or payout mode.",
  },
  {
    title: "No Liability for Losses",
    body: "To the fullest extent allowed by law, the pool operator is not responsible for lost funds, lost mining rewards, stale work, invalid blocks, misdirected payouts, incorrect addresses, configuration mistakes, software bugs, network failures, database failures, downtime, security incidents, third-party service failures, or any direct, indirect, incidental, consequential, special, exemplary, or punitive damages.",
  },
  {
    title: "Open Source Operation",
    body: "The pool operator will run the public Lido pool server code published in the official Lido repositories for pool logic and payout-critical behavior. Deployment configuration, secrets, keys, infrastructure settings, monitoring, firewall rules, and other operational details may be private.",
  },
  {
    title: "Miner Configuration and Addresses",
    body: "You are responsible for using the correct network, payout mode, endpoint, username, Bitcoin address, worker name, firmware, and failover configuration. Submitting work with a wrong address, wrong network address, wrong payout mode, malformed username, stale job, incompatible client, or unsupported protocol may result in no credit or no payout.",
  },
  {
    title: "Prohibited Use",
    body: "You may not attack, disrupt, overload, scan abusively, exploit, reverse proxy malicious traffic through, evade rate limits, submit fraudulent work, attempt unauthorized access, interfere with other miners, or use the service in a way that violates applicable law or harms the pool, its users, or its infrastructure.",
  },
  {
    title: "Changes and Termination",
    body: "The pool operator may change, suspend, rate limit, restrict, or terminate any service, endpoint, protocol, payout mode, dashboard, API, or configuration at any time. Continued use of the pool after terms or service behavior changes means you accept those changes.",
  },
  {
    title: "No Custody or Financial Advice",
    body: "Lido is mining infrastructure, not a wallet, custodian, broker, exchange, investment adviser, or financial adviser. Nothing on the site, API, dashboard, repository, or related communication is financial, legal, tax, or investment advice.",
  },
  {
    title: "Contact and Source Review",
    body: "You should review the public source code and test your setup before mining. If you do not understand or accept these terms, do not use the pool.",
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            ← Back to dashboard
          </Link>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Effective July 21, 2026</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          These terms apply to the hosted Lido pool at{" "}
          <span className="text-foreground">lido.wtf</span>. Adapted from the{" "}
          <a
            href="https://web.public-pool.io/#/terms"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Public Pool terms
          </a>
          .
        </p>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-lg font-medium tracking-tight">{section.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="border-t border-border pt-6 text-sm text-muted-foreground">
        Source:{" "}
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          lido-ui
        </a>
        {" · "}
        <a
          href={UMBREL_APP_URL}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Umbrel app
        </a>
      </p>
    </main>
  );
}
