import { useState, useEffect } from 'react';
import { getArchiveVideos, ArchiveVideo } from '../../services/archiveService';

export const ArchivePage = () => {
  const [videos, setVideos] = useState<ArchiveVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<ArchiveVideo | null>(null);

  useEffect(() => {
    getArchiveVideos().then(v => { setVideos(v); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500 animate-pulse">Arşiv yükleniyor...</div>;
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="text-5xl mb-4">🎬</div>
        <h3 className="text-xl font-bold text-gray-400 mb-2">Arşiv Boş</h3>
        <p className="text-gray-600 text-sm">Henüz arşive eklenmiş video yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Seçili video oynatıcı */}
      {selectedVideo && (
        <div className="bg-[#0A1128]/80 border border-[#FF4500]/30 rounded-lg overflow-hidden">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media" allowFullScreen
            />
          </div>
          <div className="p-4 flex items-center justify-between">
            <h3 className="text-white font-bold">{selectedVideo.title}</h3>
            <button onClick={() => setSelectedVideo(null)}
              className="text-gray-500 hover:text-[#FF4500] text-sm transition-colors">
              ✕ Kapat
            </button>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map(video => (
          <div key={video.id}
            onClick={() => setSelectedVideo(video)}
            className="bg-[#0A1128]/80 border border-gray-800 rounded-lg overflow-hidden cursor-pointer hover:border-[#00F0FF]/30 transition-all group">
            <div className="aspect-video relative overflow-hidden">
              <img src={video.thumbnailUrl} alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-2xl ml-1">▶</span>
                </div>
              </div>
            </div>
            <div className="p-3">
              <h4 className="text-white font-bold text-sm truncate">{video.title}</h4>
              {video.lessonDate && (
                <p className="text-gray-600 text-xs font-mono mt-1">{video.lessonDate}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
