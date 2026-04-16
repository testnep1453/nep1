import { useState } from 'react';
import { EmojiReaction } from '../../types/student';
import { extractYoutubeId } from '../../services/dbFirebase';

interface YouTubePlayerProps {
  videoId: string;
}

const EMOJIS = ['🔥', '👏', '❤️', '💪', '🎯'];

export const YouTubePlayer = ({ videoId }: YouTubePlayerProps) => {
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);

  const handleEmojiClick = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = Math.random() * 80 + 10;

    setReactions((prev) => [...prev, { id, emoji, x, timestamp: Date.now() }]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  return (
    <div className="bg-gradient-to-br from-[#2d3142] to-[#25293c] rounded-2xl p-6 border-2 border-[#6358cc]/30 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
        🎬 VİDEO SİNEMASI
      </h2>

      <div className="relative bg-black rounded-xl overflow-hidden mb-4" style={{ paddingTop: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${extractYoutubeId(videoId)}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />

        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute text-4xl pointer-events-none animate-float-up"
            style={{
              left: `${reaction.x}%`,
              bottom: '10%',
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="text-4xl hover:scale-125 active:scale-95 transition-transform bg-[#1a1d2e] rounded-xl p-3 hover:bg-[#2d3142] border-2 border-transparent hover:border-[#6358cc]"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
