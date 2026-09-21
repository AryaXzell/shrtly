import React from 'react';
import { ArrowLeft, Flag } from 'lucide-react';
import {
  LinkExpiredIllustration,
  LinkDisabledIllustration,
  UnknownLinkIllustration,
  OfflineIllustration,
} from './illustrations/Illustrations';

interface StatusViewProps {
  status: 'expired' | 'disabled' | 'deleted' | 'unknown' | 'error';
  code: string;
  onNavigateHome: () => void;
  onOpenReport: (code: string) => void;
}

export const StatusView: React.FC<StatusViewProps> = ({
  status,
  code,
  onNavigateHome,
  onOpenReport,
}) => {
  let illustration = <UnknownLinkIllustration size={120} />;
  let title = 'Tautan Tidak Ditemukan';
  let description =
    'Tautan singkat ini tidak ada di sistem SHRTLY. Periksa kembali ejaan kode tautan Anda.';

  if (status === 'expired') {
    illustration = <LinkExpiredIllustration size={120} />;
    title = 'Tautan Telah Kedaluwarsa';
    description =
      'Tautan ini telah melewati batas masa berlaku yang ditentukan oleh pemiliknya dan tidak lagi mengalihkan ke tujuan.';
  } else if (status === 'disabled') {
    illustration = <LinkDisabledIllustration size={120} />;
    title = 'Tautan Sementara Tidak Tersedia';
    description =
      'Tautan ini dinonaktifkan sementara oleh pemiliknya atau sedang dalam peninjauan.';
  } else if (status === 'deleted') {
    illustration = <UnknownLinkIllustration size={120} />;
    title = 'Tautan Telah Dihapus';
    description =
      'Tautan ini telah dihapus dari sistem. Demi keamanan, kode tautan ini tetap direservasi permanen dan tidak akan digunakan ulang.';
  } else if (status === 'error') {
    illustration = <OfflineIllustration size={120} />;
    title = 'Layanan Mengalami Kendala';
    description =
      'Terjadi gangguan saat memproses pengalihan tautan. Silakan coba muat ulang kembali.';
  }

  return (
    <div id="status-view" className="py-12 px-4 max-w-md mx-auto text-center space-y-6">
      <div>{illustration}</div>

      <div className="space-y-2">
        {code && (
          <div className="font-mono text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 inline-block px-3 py-1 rounded-full">
            /{code}
          </div>
        )}
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>

        {code && (
          <button
            onClick={() => onOpenReport(code)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Flag className="w-3.5 h-3.5 text-neutral-400" />
            <span>Laporkan Masalah</span>
          </button>
        )}
      </div>
    </div>
  );
};
