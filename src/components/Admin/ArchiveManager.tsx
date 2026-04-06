import { useState, useEffect } from 'react';
import { getArchiveVideos, addArchiveVideo, removeArchiveVideo, ArchiveVideo } from '../../services/archiveService';

export const ArchiveManager = () => {
  const [videos, setVideos] = useState<ArchiveVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const v = await getArchiveVideos();
    setVideos(v);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!title || !youtubeUrl) { setMessage('Başlık ve YouTube linki gerekli!'); return; }
    try {
      await addArchiveVideo(title, youtubeUrl, '1002', lessonDate);
      setTitle(''); setYoutubeUrl(''); setLessonDate('');
      setMessage('Video arşive eklendi!');
      await load();
    } catch (e) {
      setMessage('Hata: ' + (e as Error).message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Bu videoyu arşivden silmek istediğinize emin misiniz?')) return;
    await removeArchiveVideo(id);
    await load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#0A1128]/80 border border-[#FF9F43]/30 p-6 rounded-lg">
        <h3 className="text-[#FF9F43] font-bold text-sm uppercase tracking-wider mb-4">🎬 Video Ekle</h3>
        <div className="space-y-3 max-w-xl">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Video Başlığı" className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#FF9F43] rounded font-mono" />
          <input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
            placeholder="YouTube URL" className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#FF9F43] rounded font-mono" />
          <input type="date" value={lessonDate} onChange={e => setLessonDate(e.target.value)}
            className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#FF9F43] rounded" />
          <button onClick={handleAdd}
            className="bg-[#FF9F43]/20 hover:bg-[#FF9F43] text-[#FF9F43] hover:text-black border border-[#FF9F43] px-6 py-3 font-bold transition-all uppercase tracking-widest rounded">
            Arşive Ekle
          </button>
          {message && <p className="text-[#39FF14] text-sm">{message}</p>}
        </div>
      </div>

      <div className="bg-[#0A1128]/60 border border-gray-800 rounded">
        <h3 className="text-gray-400 text-sm font-mono p-4 border-b border-gray-800">ARŞİV LİSTESİ ({videos.length})</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 animate-pulse">Yükleniyor...</div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8 text-gray-600">Arşivde video yok.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {videos.map(v => (
              <div key={v.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                <img src={v.thumbnailUrl} alt={v.title} className="w-24 h-16 object-cover rounded" />
                <div className="flex-1">
                  <div className="text-white font-bold text-sm">{v.title}</div>
                  <div className="text-gray-600 text-xs font-mono">{v.lessonDate || 'Tarih yok'}</div>
                </div>
                <button onClick={() => handleRemove(v.id)}
                  className="px-3 py-1.5 bg-[#FF4500]/10 text-[#FF4500] text-xs font-bold border border-[#FF4500]/30 hover:bg-[#FF4500] hover:text-black transition-colors rounded">
                  SİL
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
