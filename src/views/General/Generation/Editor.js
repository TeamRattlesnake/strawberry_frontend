import { Icon24ArrowUturnLeftOutline, Icon24ArrowUturnRightOutline, Icon24InfoCircleOutline } from '@vkontakte/icons';
import { Button, ButtonGroup, Div, Headline, IconButton, Textarea, usePlatform } from '@vkontakte/vkui';
import { TextTooltip } from '@vkontakte/vkui/dist/components/TextTooltip/TextTooltip';
import React, { useEffect, useRef, useState } from 'react';
import styles from "./Editor.module.css";
import { editorGuideData, showSlides } from '../../../api/slides';
import API from '../../../api/API';
import { CircleMenu } from 'react-circular-menu';
import Service, { CategoryToService } from '../../../api/Service';
import { GenerationMethod } from '../../../api/SBBackend';


const Editor = ({executeTextWrapper, text, setText, onShowEditorInfo, ...props}) => {

  const textAreaRef = useRef(null);
  const circleMenuWrapperRef = useRef(null);

  const isMobile = (usePlatform() === 'android' || usePlatform() === 'ios');

  if (text === undefined || text === null || setText === undefined || setText === null) {
    console.log('Creating Editor text and setText');
    [text, setText] = useState('');
  }
  const [selectedText, setSelectedText] = useState({});
  const [editHistory, setEditHistory] = useState(['']);
  const [editHistoryIndex, setEditHistoryIndex] = useState(0);
  const [activeButton, setActiveButton] = useState(null);

  const handleTextChange = (event) => {
    const updatedText = event.target.value;
    setText(updatedText);
    setEditHistory([...editHistory.slice(0, editHistoryIndex + 1), updatedText]);
    setEditHistoryIndex((ind) => ind + 1)
  };

  const handleTextSelect = () => {
    const textArea = textAreaRef.current;
    const text = textArea.value.substring(textArea.selectionStart, textArea.selectionEnd);
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    setSelectedText({text, start, end});
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
  };

  const handleContextMenu = (e) => {
    isMobile && e.preventDefault();
  };

  const handleBlur = (e) => {
    e.preventDefault();
  };

  const handleServiceSelect = async (id, serviceExecute) => {
    setActiveButton(id);
    const targetText = id === GenerationMethod.UNMASK_TEXT ? text.slice(0, selectedText.start) + "<MASK>" + text.slice(selectedText.end) : selectedText.text || text;
    const updatedText = await serviceExecute(targetText);
    if (!updatedText) {
      setActiveButton(null);
      return;
    }
    const newText = (id !== GenerationMethod.UNMASK_TEXT && selectedText.text) ? text.replace(selectedText.text, updatedText) : updatedText;
    setText(newText);
    setEditHistory([...editHistory.slice(0, editHistoryIndex + 1), newText]);
    setEditHistoryIndex((ind) => ind + 1);
    setActiveButton(null);
    setSelectedText({});
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

  useEffect(() => {
		API.getLSKey("slides_editor_shown")
		.then((ok) => {
			if (!ok) {
				showSlides(editorGuideData, () => API.setLSKey("slides_editor_shown", true));
			}
		})
	}, []);

  /*
  useEffect(() => {
    if (isMobile && selectedText.text) {
      circleMenuWrapperRef.click();
    }
  }, [selectedText.text]);
  */

  const ButtonContainer = (props) => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        ...props.style,
      }}>{props.children}</div>
    )
  };

  const parseService = (id, service) => {
    const isDisabled = (service.allow_generate && !service.allow_generate(text, selectedText.text))
    ||
    (!service.allow_generate && (!text || text.length === 0));
    let genButton = (icon, name) => {
      return isMobile ?
      (
        <TextTooltip key={id} text={service.alias}>
          <IconButton
            onMouseDownCapture={(e) => (e.preventDefault())}
            onFocus={(e) => (e.preventDefault())}
            onClick={() => {
              handleServiceSelect(id, executeTextWrapper(service.execute));
            }}
            disabled={isDisabled || isLoading}
          >
            {service.icon}
          </IconButton>
        </TextTooltip>
      )
      :
      (
        <Button
          key={id}
          onMouseDownCapture={(e) => (e.preventDefault())}
          onFocus={(e) => (e.preventDefault())}
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
    }
    let elem = null;
    if (service.alias && service.icon) {
      elem = (
        <TextTooltip key={id} text={service.alias}>
          {genButton(service.icon, undefined)}
        </TextTooltip>
      )
    } else if (service.alias || service.icon) {
      elem = genButton(service.icon, service.alias);
    };
    return elem;
  }

  const servicesPanel = Object.entries(CategoryToService).map(([category, serviceKeys]) => {
    return (
      <div
        className={styles.button_category_container}
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "column",
          alignItems: "center",
          height: "100%",
          gap: '1rem',
          width: '100%',
          padding: '1rem',
        }}
      >
        <Headline>{category}</Headline>
        <ButtonGroup
          mode="horizontal"
          style={{
            width: '100%',
          }}
        >
          {serviceKeys.map((serviceKey, idx) => {
            const id = serviceKey || `category_${category}_service_${idx}`;
            return parseService(id, Service[serviceKey]);
          })}
        </ButtonGroup>
      </div>
    )
  });

  const servicesButtons = Object.keys(Service).map((serviceKey) => {
    const id = serviceKey || `service_${idx}`;
    return parseService(id, Service[serviceKey]);
  })

  return (
    <div>
      <Div>
        <ButtonContainer
          style={{ 
            paddingTope: 0,
            paddingBottom: 0,
            justifyContent: isMobile ? 'center' : 'flex-end'
          }}
        >
          <Button
            onClick={onShowEditorInfo}
            before={<Icon24InfoCircleOutline/>}
          />
        </ButtonContainer>
      </Div>
      <Div>
        <ButtonContainer>                                                                                                                                                                                                     
          <Button
            onClick={undo}
            before={<Icon24ArrowUturnLeftOutline/>}
            disabled={isLoading || editHistoryIndex <= 0}
            onMouseDownCapture={(e) => (e.preventDefault())}
            onFocus={(e) => (e.preventDefault())}
          />
          {isMobile ? (
            <div
              onMouseDownCapture={(e) => {e.stopPropagation(); e.preventDefault();}}
              onFocus={(e) => {e.stopPropagation(); e.preventDefault();}}
              ref={circleMenuWrapperRef}
              className={styles.circle_menu_wrapper}
            >
              <CircleMenu
                startAngle={-45}
                rotationAngle={270}
                itemSize={1}
                radius={5}
                rotationAngleInclusive={true}
              >
                {servicesButtons.reverse()}
              </CircleMenu>
            </div>
          ) : servicesPanel }
          <Button
            onClick={redo}
            before={<Icon24ArrowUturnRightOutline/>}
            disabled={isLoading || editHistory.length - 1 <= editHistoryIndex}
            onMouseDownCapture={(e) => (e.preventDefault())}
            onFocus={(e) => (e.preventDefault())}
          />
        </ButtonContainer>
      </Div>
      <Textarea
        getRef={textAreaRef}
        value={text}
        onChange={handleTextChange}
        onSelect={handleTextSelect}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onBlur={handleBlur}
        disabled={isLoading}
        placeholder='Ваш текст...'
        {...props}
      />
    </div>
  );
};

export default React.memo(Editor);