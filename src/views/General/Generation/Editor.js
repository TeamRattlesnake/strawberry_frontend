import { Icon24ArrowUturnLeftOutline, Icon24ArrowUturnRightOutline } from '@vkontakte/icons';
import { Button, ButtonGroup, Div, IconButton, Textarea } from '@vkontakte/vkui';
import { TextTooltip } from '@vkontakte/vkui/dist/components/TextTooltip/TextTooltip';
import React, { useState } from 'react';
import styles from "./Editor.module.css";

function Editor({services, executeTextWrapper, text, setText, ...props}) {

  if (!text || !setText) [text, setText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [editHistory, setEditHistory] = useState([]);
  const [editHistoryIndex, setEditHistoryIndex] = useState(-1);
  const [activeButton, setActiveButton] = useState(null);

  const handleTextChange = (event) => {
    const updatedText = event.target.value;
    setText(updatedText);
    setEditHistory([...editHistory.slice(0, editHistoryIndex + 1), updatedText]);
    setEditHistoryIndex((ind) => ind + 1)
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    const selectedString = selection.toString();
    setSelectedText(selectedString);
  };

  const handleServiceSelect = async (id, serviceExecute) => {
    setActiveButton(id);
    const targetText = selectedText || text;
    const updatedText = await serviceExecute(targetText);
    if (!updatedText) {
      setActiveButton(null);
      return;
    }
    const newText = selectedText ? text.replace(selectedText, updatedText) : updatedText;
    setText(newText);
    setEditHistory([...editHistory.slice(0, editHistoryIndex + 1), newText]);
    setEditHistoryIndex((ind) => ind + 1);
    setActiveButton(null);
  };

  const undo = () => {
    if (editHistoryIndex > 0) {
      const previousEdit = editHistory[editHistoryIndex - 1];
      setText(previousEdit);
      setEditHistoryIndex((ind) => ind - 1);
    }
  };

  const redo = () => {
    if (editHistory.length - 1 > editHistoryIndex) {
      const nextEdit = editHistory[editHistoryIndex + 1];
      setText(nextEdit);
      setEditHistoryIndex((ind) => ind + 1)
    }
  };

  const isLoading = activeButton !== null;

  return (
    <div>
      <Div>
        <ButtonGroup mode="horizontal" gap="s" stretched>
          <Button onClick={undo} before={<Icon24ArrowUturnLeftOutline/>} disabled={isLoading || editHistoryIndex <= 0}/>
          {services.map((service, idx) => {
              const id = service.id || `service_${idx}`;
              const isDisabled = (service.allow_generate && !service.allow_generate(text))
              ||
              (!service.allow_generate && (!text || text.length === 0));
              let genButton = (icon, name) => (
                <Button
                  key={id}
                  onClick={() => {
                    handleServiceSelect(id, executeTextWrapper(service.execute));
                  }}
                  before={icon}
                  loading={isLoading && activeButton && activeButton === id}
                  disabled={isDisabled || isLoading}
                  className={styles.button_patch}
                  stretched
                >
                  {name}
                </Button>
              );
              let elem = null;
              if (service.alias && service.icon) {
                elem = (
                  <TextTooltip text={service.alias}>
                    {genButton(service.icon, undefined)}
                  </TextTooltip>
                )
              } else if (service.alias || service.icon) {
                elem = genButton(service.icon, service.alias);
              };
              return elem;
            })}
          <Button onClick={redo} before={<Icon24ArrowUturnRightOutline/>} disabled={isLoading || editHistory.length - 1 <= editHistoryIndex}/>
        </ButtonGroup>
      </Div>
      <Textarea
        value={text}
        onChange={handleTextChange}
        onSelect={handleTextSelect}
        {...props}
      />
    </div>
  );
}

export default Editor;