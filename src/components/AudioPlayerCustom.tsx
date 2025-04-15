import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import '../App.css';

const AudioPlayerCustom = ({ src }: { src: string }) => {
  return (
    <div className="w-full max-w-xl mx-auto">
      <AudioPlayer
        src={src}
        className="custom-audio-player rounded-lg shadow-lg"
        showJumpControls={false}
        customAdditionalControls={[]}
        customVolumeControls={[]}
        autoPlayAfterSrcChange={false}
      />
    </div>
  );
};

export default AudioPlayerCustom;
