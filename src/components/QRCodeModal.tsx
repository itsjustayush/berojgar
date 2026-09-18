import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Smartphone, CloudDownload, Copy, Check, Download } from 'lucide-react';
import { BundleItem } from '../types';

interface QRCodeModalProps {
  roomId: string;
  bundleItems: BundleItem[];
  onClose: () => void;
  onDownloadAll: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  roomId,
  bundleItems,
  onClose,
  onDownloadAll,
}) => {
  const [activeTab, setActiveTab] = useState<'JOIN' | 'DOWNLOAD'>('JOIN');
  const [copiedLink, setCopiedLink] = useState(false);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://berojgarchat.vercel.app';
  
  // URL 1: Mobile Join Room Session URL
  const joinUrl = `${originUrl}?room=${encodeURIComponent(roomId)}`;

  // URL 2: Auto Download Bundle URL
  const downloadUrl = `${originUrl}?action=download_bundle&room=${encodeURIComponent(roomId)}`;

  const currentUrl = activeTab === 'JOIN' ? joinUrl : downloadUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#0c1626] border border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col p-6 md:p-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4E22]/15 border border-[#EF4E22]/30 flex items-center justify-center text-[#EF4E22]">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Session QR Codes
              </h3>
              <p className="font-mono text-xs text-white/50">
                ROOM_OTP: <span className="text-[#EF4E22] font-bold">{roomId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </header>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('JOIN')}
            className={`py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'JOIN'
                ? 'bg-[#EF4E22] text-white shadow-lg shadow-[#EF4E22]/25'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone size={16} />
            JOIN_ROOM_QR
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DOWNLOAD')}
            className={`py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'DOWNLOAD'
                ? 'bg-[#EF4E22] text-white shadow-lg shadow-[#EF4E22]/25'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <CloudDownload size={16} />
            DOWNLOAD_BUNDLE_QR
          </button>
        </div>

        {/* QR Display Frame */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-4 border-[#EF4E22]/30 shadow-inner relative group">
          <QRCodeSVG
            value={currentUrl}
            size={220}
            bgColor="#FFFFFF"
            fgColor="#0A0A0C"
            level="H"
            includeMargin={true}
          />

          <div className="mt-4 px-3 py-1 bg-[#0A0A0C] text-white rounded-full text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#EF4E22] rounded-full animate-pulse"></span>
            {activeTab === 'JOIN' ? 'SCAN TO JOIN SESSION' : `SCAN TO DOWNLOAD ${bundleItems.length} FILES`}
          </div>
        </div>

        {/* Info & Action Controls */}
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between gap-2">
            <span className="text-white/60 truncate max-w-[280px]">{currentUrl}</span>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-[#EF4E22]/20 hover:bg-[#EF4E22]/30 text-[#EF4E22] border border-[#EF4E22]/40 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedLink ? 'COPIED' : 'COPY_LINK'}
            </button>
          </div>

          {activeTab === 'DOWNLOAD' && (
            <button
              onClick={() => {
                onDownloadAll();
                onClose();
              }}
              disabled={bundleItems.length === 0}
              className="w-full py-3.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-bold tracking-wider hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={18} />
              DOWNLOAD ALL BUNDLE FILES ({bundleItems.length})
            </button>
          )}

          <p className="text-[11px] text-white/40 text-center leading-relaxed">
            {activeTab === 'JOIN'
              ? 'Scan with any smartphone camera or tablet to connect immediately via WebRTC P2P.'
              : 'Scan with a phone to initiate direct browser download of all active encrypted bundle items.'}
          </p>
        </div>
      </div>
    </div>
  );
};
