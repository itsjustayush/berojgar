import { Download, FileArchive, Github, HardDrive, Leaf, LockKeyhole, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { BundleItem } from '../types';
import { formatBytes } from '../lib/crypto';

interface HistoryScreenProps {
  bundleItems: BundleItem[];
  onWipeSession: () => void;
}

const makerLinks = [
  { label: 'GitHub profile', href: 'https://github.com/itsjustayush', icon: Github },
  { label: 'UltronChat repository', href: 'https://github.com/itsjustayush/UltronChat', icon: FileArchive },
  { label: 'Portfolio', href: 'https://itsjustayush.vercel.app/', icon: UserRound },
  { label: 'Email Ayush', href: 'mailto:info.cometlabs@gmail.com', icon: Mail },
];

export function HistoryScreen({ bundleItems, onWipeSession }: HistoryScreenProps) {
  const totalBytes = bundleItems.reduce((acc, curr) => acc + curr.size, 0);
  const totalCarbonGrams = bundleItems.reduce((acc, curr) => acc + curr.carbonFootprintGrams, 0);
  const savedCloudCarbonGrams = parseFloat((totalBytes / (1024 * 1024) * 0.055).toFixed(2));

  const downloadFile = (item: BundleItem) => {
    if (!item.blobUrl) return;
    const anchor = document.createElement('a');
    anchor.href = item.blobUrl;
    anchor.download = item.name;
    anchor.rel = 'noreferrer';
    anchor.click();
  };

  return (
    <div className="history-shell page-reveal mx-auto min-h-screen w-full max-w-[1440px] px-5 pb-20 pt-10 sm:px-8 lg:px-12 lg:pt-16 text-on-surface dark:text-white">
      <header className="flex flex-col justify-between gap-8 border-b border-surface-variant/40 pb-8 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.2em] text-secondary font-bold">
            <HardDrive size={13} /> Memory / current tab
          </div>
          <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-[.92] tracking-tight text-on-surface dark:text-white">
            Session<br />
            <em className="font-sans font-medium not-italic text-on-surface-variant">memory.</em>
          </h1>
          <p className="mt-6 max-w-xl text-sm sm:text-base leading-relaxed text-on-surface-variant">
            A local view of files received or shared in this tab. This is not a cloud archive; wiping the session removes the in-memory registry and its downloadable blobs.
          </p>
        </div>
        <button
          onClick={onWipeSession}
          className="self-start md:self-end px-5 py-2.5 rounded-full border border-error/30 bg-error-container/40 text-on-error-container hover:bg-error-container text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
        >
          <Trash2 size={16} /> Wipe session memory
        </button>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-surface-container-lowest dark:bg-[#0d1c2d] border border-surface-variant/40 dark:border-white/10 p-6 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-mono text-[10px] uppercase tracking-[.16em]">Assets held</span>
            <FileArchive size={16} />
          </div>
          <div className="mt-5 text-3xl font-bold tracking-tight text-on-surface dark:text-white">
            {bundleItems.length}
            <span className="ml-2 text-base font-normal text-on-surface-variant">files</span>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-lowest dark:bg-[#0d1c2d] border border-surface-variant/40 dark:border-white/10 p-6 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-mono text-[10px] uppercase tracking-[.16em]">Memory used</span>
            <HardDrive size={16} />
          </div>
          <div className="mt-5 text-3xl font-bold tracking-tight text-secondary">
            {formatBytes(totalBytes)}
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-lowest dark:bg-[#0d1c2d] border border-surface-variant/40 dark:border-white/10 p-6 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-mono text-[10px] uppercase tracking-[.16em]">Estimated savings</span>
            <Leaf size={16} className="text-secondary" />
          </div>
          <div className="mt-5 text-3xl font-bold tracking-tight text-on-surface dark:text-white">
            {savedCloudCarbonGrams}
            <span className="ml-2 text-base font-normal text-on-surface-variant">g CO₂e</span>
          </div>
          <div className="mt-2 font-mono text-[10px] text-on-surface-variant/70">
            {totalCarbonGrams.toFixed(2)} g used by direct transfer
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl bg-surface-container-lowest dark:bg-[#0d1c2d] border border-surface-variant/40 dark:border-white/10 shadow-xs">
        <div className="flex flex-col justify-between gap-3 border-b border-surface-variant/40 bg-surface-container-low dark:bg-white/[.03] p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-base font-bold tracking-tight text-on-surface dark:text-white">Local transfer registry</h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[.16em] text-on-surface-variant">Non-persistent / RAM only</p>
          </div>
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-secondary font-bold">
            <ShieldCheck size={14} /> No room archive
          </div>
        </div>
        {bundleItems.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-surface-variant/40 bg-surface-container text-secondary">
              <HardDrive size={22} />
            </span>
            <h3 className="mt-5 text-lg font-bold text-on-surface dark:text-white">Nothing held in memory yet.</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">
              Files shared or received in an active room will appear here until you leave the room or wipe this tab.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-surface-variant/40 bg-surface-container-low dark:bg-white/[.02] font-mono text-[10px] uppercase tracking-[.14em] text-on-surface-variant">
                <tr>
                  <th className="p-4 font-semibold sm:p-5">File</th>
                  <th className="p-4 font-semibold sm:p-5">File ID</th>
                  <th className="p-4 font-semibold sm:p-5">Size</th>
                  <th className="p-4 font-semibold sm:p-5">Transport</th>
                  <th className="p-4 font-semibold sm:p-5">Carbon</th>
                  <th className="p-4 font-semibold sm:p-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/30 text-sm text-on-surface dark:text-white/75">
                {bundleItems.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-surface-container/50">
                    <td className="max-w-[240px] p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-surface-variant/40 bg-surface-container text-secondary">
                          <FileArchive size={15} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-on-surface dark:text-white">{item.name}</div>
                          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[.12em] text-on-surface-variant">{item.fileTypeLabel}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-secondary font-bold sm:p-5">{item.fileId}</td>
                    <td className="p-4 font-mono text-xs text-on-surface-variant sm:p-5">{formatBytes(item.size)}</td>
                    <td className="p-4 sm:p-5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/10 px-2.5 py-1 font-mono text-[10px] text-secondary font-bold">
                        <LockKeyhole size={11} /> WebRTC
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-on-surface-variant sm:p-5">{item.carbonFootprintGrams}g</td>
                    <td className="p-4 sm:p-5">
                      <button
                        disabled={!item.blobUrl}
                        onClick={() => downloadFile(item)}
                        className="inline-flex items-center gap-2 rounded-full border border-surface-variant/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-on-surface hover:text-secondary hover:border-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                      >
                        <Download size={13} /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-3xl bg-surface-container-lowest dark:bg-[#0d1c2d] border border-surface-variant/40 dark:border-white/10 p-6 sm:p-8 shadow-xs">
          <div className="mb-7 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary-container text-on-secondary-container">
              <UserRound size={18} />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-on-surface-variant">Maker / builder</p>
              <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-on-surface dark:text-white">Ayush Bhattacharya</h2>
            </div>
          </div>
          <p className="max-w-lg text-sm leading-6 text-on-surface-variant">
            Berojgar is an ephemeral and persistent social collaboration experience designed around direct transport, local memory, and a calmer workflow.
          </p>
          <a href="mailto:info.cometlabs@gmail.com" className="mt-6 inline-flex items-center gap-2 text-sm text-secondary font-bold hover:underline">
            <Mail size={15} /> info.cometlabs@gmail.com
          </a>
        </div>
        <div className="rounded-3xl bg-surface-container-lowest dark:bg-[#0d1c2d] border border-surface-variant/40 dark:border-white/10 p-6 sm:p-8 shadow-xs">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-on-surface-variant">Find the maker</p>
          <div className="mt-5 grid gap-2">
            {makerLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                className="flex items-center justify-between rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-white/[.03] px-4 py-3 text-sm text-on-surface dark:text-white/70 transition-colors hover:border-secondary/40 hover:bg-secondary-container/20 hover:text-on-surface"
              >
                <span className="flex items-center gap-3 font-medium">
                  <Icon size={16} className="text-secondary" />
                  {label}
                </span>
                <span className="font-mono text-[10px] text-on-surface-variant">OPEN</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
