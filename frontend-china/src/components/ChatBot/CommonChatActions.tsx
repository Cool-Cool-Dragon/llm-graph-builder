import { ClipboardDocumentIconOutline, SpeakerWaveIconOutline, SpeakerXMarkIconOutline } from '@neo4j-ndl/react/icons';
import { Messages } from '../../types';
import ButtonWithToolTip from '../UI/ButtonWithToolTip';
import { IconButtonWithToolTip } from '../UI/IconButtonToolTip';
import { buttonCaptions, tooltips } from '../../utils/Constants';

export default function CommonActions({
  chat,
  detailsHandler,
  speechHandler,
  copyHandler,
  listMessages,
  activeChat,
}: {
  chat: Messages;
  activeChat: Messages | null;
  detailsHandler: (chat: Messages, activeChat: Messages | null) => void;
  speechHandler: (chat: Messages) => void;
  copyHandler: (message: string, id: number) => void;
  listMessages: Messages[];
}) {
  return (
    <>
      <ButtonWithToolTip
        className='w-4 h-4 inline-block p-6 mt-1.5'
        fill='text'
        placement='top'
        clean
        text='检索信息'
        label='检索信息'
        disabled={chat.isTyping || chat.isLoading}
        onClick={() => detailsHandler(chat, activeChat)}
        aria-label='检索信息'
      >
        {buttonCaptions.details}
      </ButtonWithToolTip>
      <IconButtonWithToolTip
        label='复制文本'
        placement='top'
        clean
        text={chat.copying ? tooltips.copied : tooltips.copy}
        onClick={() => copyHandler(chat.modes[chat.currentMode]?.message, chat.id)}
        disabled={chat.isTyping || chat.isLoading}
        aria-label='复制文本'
      >
        <ClipboardDocumentIconOutline className='n-size-token-4' />
      </IconButtonWithToolTip>
      <IconButtonWithToolTip
        placement='top'
        clean
        onClick={() => speechHandler(chat)}
        text={chat.speaking ? tooltips.stopSpeaking : tooltips.textTospeech}
        disabled={listMessages.some((msg) => msg.speaking && msg.id !== chat.id)}
        label={chat.speaking ? '停止朗读' : '文字转语音'}
        aria-label='语音'
      >
        {chat.speaking ? (
          <SpeakerXMarkIconOutline className='n-size-token-4' />
        ) : (
          <SpeakerWaveIconOutline className='n-size-token-4' />
        )}
      </IconButtonWithToolTip>
    </>
  );
}
