import { wikiValidation } from '../../../utils/Utils';
import useSourceInput from '../../../hooks/useSourceInput';
import CustomSourceInput from '../CustomSourceInput';

export default function WikipediaInput({
  loading,
  setIsLoading,
}: {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
}) {
  const {
    inputVal,
    onChangeHandler,
    onBlurHandler,
    submitHandler,
    status,
    setStatus,
    statusMessage,
    isFocused,
    isValid,
    onClose,
    onPasteHandler,
  } = useSourceInput(wikiValidation, setIsLoading, 'Wikipedia', true, false, false);
  return (
    <CustomSourceInput
      onCloseHandler={onClose}
      isFocused={isFocused}
      isValid={isValid}
      disabledCheck={Boolean(loading)}
      label='维基百科链接'
      placeHolder='https://en.wikipedia.org/wiki/Albert_Einstein'
      value={inputVal}
      onChangeHandler={onChangeHandler}
      onBlurHandler={onBlurHandler}
      submitHandler={submitHandler}
      setStatus={setStatus}
      status={status}
      statusMessage={statusMessage}
      id='维基百科链接'
      onPasteHandler={onPasteHandler}
    />
  );
}
