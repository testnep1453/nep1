import { useState, useEffect } from 'react';
import { getArchiveVideos, addArchiveVideo, removeArchiveVideo, ArchiveVideo } from '../../services/archiveService';

interface Props {
  isAdmin?: boolean;
}

export const ArchiveManager = ({ isAdmin = false }: Props) => {
  const [videos, setVideos] = useState<ArchiveVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const v = await getArchiveVideos();
    setVideos(v);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!title.trim() || !youtubeUrl.trim()) {
      setMessage('⚠️ Başlık ve YouTube linki zorunludur!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSaving(true);
    try {
      await addArchiveVideo(title.trim(), youtubeUrl.trim(), '1002');
      setTitle('');
      setYoutubeUrl('');
      setMessage('✅ Video arşive eklendi!');
      await load();
    } catch (e) {
      setMessage('❌ Hata: ' + (e as Error).message);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Bu videoyu arşivden silmek istediğinize emin misiniz?')) return;
    try {
      await removeArchiveVideo(id);

      await load();
    } catch (e) {
      alert('Silme hatası: ' + (e as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Video Ekle — yalnızca admin */}
      {isAdmin && (
        <div className="bg-[#0A1128]/80 border border-[#FF9F43]/30 p-6 rounded-lg">
          <h3 className="text-[#FF9F43] font-bold text-sm uppercase tracking-wider mb-4">🎬 Arşive Video Ekle</h3>
          <div className="space-y-3 max-w-xl">
            <input
              id="archiveTitle"
              name="archiveTitle"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Video Başlığı"
              className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#FF9F43] rounded font-mono transition-colors"
            />
            <input
              id="archiveYtUrl"
              name="archiveYtUrl"
              type="text"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="YouTube URL (https://www.youtube.com/watch?v=...)"
              className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#FF9F43] rounded font-mono transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={saving}
              className="bg-[#FF9F43]/20 hover:bg-[#FF9F43] text-[#FF9F43] hover:text-black border border-[#FF9F43] px-6 py-3 font-bold transition-all uppercase tracking-widest rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Ekleniyor…' : 'Arşive Ekle'}
            </button>
            {message && (
              <p className={`text-sm font-mono ${message.startsWith('✅') ? 'text-[#39FF14]' : 'text-[#FF4500]'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Arşiv Listesi */}
      <div className="bg-[#0A1128]/60 border border-gray-800 rounded">
        <h3 className="text-gray-400 text-sm font-mono p-4 border-b border-gray-800">
          ARŞİV ({videos.length} video)
        </h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 animate-pulse">Yükleniyor…</div>
        ) : videos.length === 0 ? (
          <div className="text-center py-10 text-gray-600">Arşivde henüz video yok.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {videos.map(v => {
              const activeId = v.youtube_id || extractYoutubeId(v.youtube_url);
              const thumbUrl = v.thumbnail_url || (activeId ? `https://img.youtube.com/vi/${activeId}/mqdefault.jpg` : '');

              return (
                <div key={v.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                  <div className="w-24 h-16 relative flex-shrink-0 bg-gray-900 rounded overflow-hidden">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={v.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (!img.src.endsWith('default.jpg') && activeId) {
                            img.src = `https://img.youtube.com/vi/${activeId}/default.jpg`;
                          } else {
                            img.style.display = 'none';
                            if (img.nextElementSibling) (img.nextElementSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                    )}
                    <div className="hidden absolute inset-0 items-center justify-center text-xl bg-gray-900">🎬</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm truncate">{v.title}</div>
                    <div className="text-gray-600 text-xs font-mono mt-0.5 truncate">{v.youtube_url}</div>
                    {v.added_at && (
                      <div className="text-gray-500 text-[10px] font-mono mt-1">EKLENME: {new Date(v.added_at).toLocaleDateString()}</div>
                    )}
                  </div>
                {/* Silme butonu sadece admin */}
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(v.id)}
                    className="px-3 py-1.5 bg-[#FF4500]/10 text-[#FF4500] text-xs font-bold border border-[#FF4500]/30 hover:bg-[#FF4500] hover:text-black transition-colors rounded flex-shrink-0"
                  >
                    SİL
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
