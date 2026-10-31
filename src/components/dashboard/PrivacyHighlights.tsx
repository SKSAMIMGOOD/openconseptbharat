import React from "react";
import { ShieldCheck, EyeOff, ServerOff, Cpu, RefreshCw } from "lucide-react";

export const PrivacyHighlights: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-surface-900 to-surface-800 text-white rounded-3xl p-8 sm:p-12 mb-16 shadow-float border border-surface-700">
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict Client-Side Guarantee</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          How Browser Utility Studio Protects Your Privacy
        </h2>
        <p className="text-sm text-surface-300 mt-2 leading-relaxed">
          Traditional web tools upload your personal identity cards and private photos to remote servers. Browser Utility Studio takes a completely different path: 100% of the image manipulation, card cropping, and PDF synthesis happens locally inside your device.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-surface-700/60">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-surface-700/60 text-emerald-400 flex items-center justify-center">
            <ServerOff className="w-5 h-5" />
          </div>
          <h4 className="font-semibold text-sm">No Server Uploads</h4>
          <p className="text-xs text-surface-400 leading-relaxed">
            Not a single byte of your uploaded file is transmitted over the network.
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-surface-700/60 text-brand-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="font-semibold text-sm">Canvas & Web Workers</h4>
          <p className="text-xs text-surface-400 leading-relaxed">
            Multi-threaded browser APIs handle image enhancement and PDF generation natively.
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-surface-700/60 text-amber-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h4 className="font-semibold text-sm">Ephemeral Memory</h4>
          <p className="text-xs text-surface-400 leading-relaxed">
            Files exist in temporary RAM only. Closing the browser tab discards everything.
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-surface-700/60 text-rose-400 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h4 className="font-semibold text-sm">Zero Trackers</h4>
          <p className="text-xs text-surface-400 leading-relaxed">
            No analytics scripts, tracking pixels, or third-party behavioral monitors.
          </p>
        </div>
      </div>
    </div>
  );
};
