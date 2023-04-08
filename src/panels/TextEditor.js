import { ActionSheet, ActionSheetDefaultIosCloseItem, ActionSheetItem, Avatar, Button, ButtonGroup, Cell, CellButton, Div, FormItem, Group, Panel, PanelHeader, PanelHeaderBack, ScreenSpinner, Spinner, SplitCol, SplitLayout, Textarea } from "@vkontakte/vkui";
import React, {useEffect, useRef, useState} from "react";

import { Icon20Stars } from '@vkontakte/icons';

import StrawberryBackend from "../api/SBBackend";

const Service = {
    TEXTGEN: "text_gen",
    REPHRASE: "rephrase",
    SUMMARIZE: "summarize",
    BERT: "bert"
};

const TextareaDropdown = ({isLoading, items, onClick, onClose, position}) => {
    return (
        <select style={{
            position: "absolute",
            top: position.top,
            left: position.left,
        }}>
            {
                isLoading ?
                <Spinner/>
                :
                items.map((item) => {
                    return (
                        <option onClick={() => {
                            onClick(value);
                            onClose();
                        }} value={item}>{item}</option>
                    )
                })
            }
        </select>
    )
}

const TextareaCustom = ({onSelect, onItemClick, ...props}) => {
    const textAreaRef = useRef();
    const [dropdownShown, setDropdownShow] = useState(false);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [dropdownItems, setDropdownItems] = useState([]);
    let cursorPositionTop = null;
    let cursorPositionLeft = null;
    let selectionStart = null;
    let selectionEnd = null;
    useEffect(() => {
        const handleSelectionChange = () => {
            console.log("selection changed");
            selectionStart = textAreaRef.current.selectionStart;
            selectionEnd = textAreaRef.current.selectionEnd;
            cursorPositionTop = textAreaRef.current.offsetTop + textAreaRef.current.scrollTop;
            cursorPositionLeft = textAreaRef.current.offsetLeft + textAreaRef.current.scrollLeft;
            const textMasked = text.slice(undefined, selectionStart) + "[MASK]" + text.slice(selectionEnd, undefined);
            setDropdownShow(true);
            setDropdownLoading(true);
            onSelect(textMasked)
            .then((itemsData) => setDropdownItems(itemsData))
            .catch((_) => setDropdownShow(false))
            .finally(() => setDropdownLoading(false));
        };
        if (onSelect && onItemClick) {
            textAreaRef.current.addEventListener('click', () => console.log("check click"));
            textAreaRef.current.addEventListener('selectionchange', handleSelectionChange);
            return () => {
                textAreaRef.current.removeEventListener('selectionchange', handleSelectionChange);
            };
        }
      }, [onSelect, onItemClick]);
    return (
        <Textarea
            style={{
                position: "relative"
            }}
            getRootRef={textAreaRef}
            {...props}
        >
            {
                dropdownShown &&
                <TextareaDropdown
                    isLoading={dropdownLoading}
                    items={dropdownItems}
                    onClose={() => setDropdownShow(false)}
                    onClick={(value) => {onItemClick(value, selectionStart, selectionEnd)}}
                    position={{top: cursorPositionTop, left: cursorPositionLeft}}
                />
            }
        </Textarea>
    )
}

const ServiceList = ({activeService, onServiceClick, onClose, targetRef}) => {
    const renderItem = (service, alias) => {
        return (
            <ActionSheetItem
                onChange={onServiceClick}
                checked={activeService === service}
                name={alias}
                value={service}
                autoClose
                selectable
            >
                {alias}
            </ActionSheetItem>
        )
    }
    const items = [
        [Service.TEXTGEN, "Многословная генерация текста"],
        [Service.REPHRASE, "Перефразирование текста"],
        [Service.SUMMARIZE, "Резюмирование текста"],
        [Service.BERT, "Пословная генерация текста"]
    ];
    return (
        <ActionSheet
            onClose={onClose}
            iosCloseItem={<ActionSheetDefaultIosCloseItem />}
            toggleRef={targetRef}
        >
            {
                items.map((item) => renderItem(...item))
            }
        </ActionSheet>
    )
}

/*
onSelect={
    service === Service.BERT ?
    (text) => StrawberryBackend.generate(service, groupId, text).then((text) => {
            return text.split(',');
        })
    :
    null
}
onItemClick={
    service === Service.BERT ?
    (value, start, stop) => setText((prevText) => {
        return prevText.slice(undefined, start)+value+prevText.slice(stop, undefined)
    })
    :
    null
}
*/

const TextEditor = ({id, go, dataset}) => {
    const group = dataset.targetGroup;
    const [resultId, setResultId] = useState(null);
    const [service, setService] = useState(Service.TEXTGEN);
    const [serviceAlias, setServiceAlias] = useState("Многословная генерация текста");
    const [popout, setPopout] = useState(null);
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const selectableTargetRef = useRef();
    
    const handleTextChange = (e) => {
        setText(e.target.value);
    }

    const handleServiceClick = (e) => {
        setService(e.target.value);
        setServiceAlias(e.target.name)
        setPopout(null);
    }

    const handleExecute = () => {
        let hint = text;
        if (service === Service.BERT) {
            hint += " [MASK]";
        }
        let generate
        switch (service) {
            case Service.BERT:
                generate = StrawberryBackend.unmaskText;
                break;
            case Service.REPHRASE:
                generate = StrawberryBackend.rephraseText;
                break;
            case Service.SUMMARIZE:
                generate = StrawberryBackend.summarizeText;
                break
            default:
                generate = StrawberryBackend.appendText;
        }
        setIsLoading(true);
        generate(dataset.targetGroup.texts, hint)
        .then(({text_data, result_id}) => {
            setResultId(result_id);
            /*
            if (service == Service.TEXTGEN) {
                setText((prevText) => {
                    return prevText+text_data;
                })
            */
            setText(text_data);
        })
        .catch((error) => {
            console.log(error);
            dataset.showSnackBar({text: "Неизвестная ошибка", type: "danger"});
        })
        .finally(() => setIsLoading(false));
    }

    const handlePublish = () => {
        StrawberryBackend.publishPost(dataset.targetGroup.id, text)
        .then((status) => {
            console.log(status);
            switch (status) {
                case 0:
                    dataset.showSnackBar({text: "Ура, запись успешно опубликована!", type: "success"});
                    break;
                case 1:
                    dataset.showSnackBar({text: "Передумали?", type: "danger"});
                    break;
                default:
                    dataset.showSnackBar({text: "Ошибка при публикации записи", type: "danger"});
                    break;
            }
        })
    }

    const onFeedback = (score) => {
        if (!resultId) return;
        StrawberryBackend.sendFeedback(resultId, score)
        .then((ok) => {
            if (ok) dataset.showSnackBar({text: `Спасибо за ваш отзыв!`, type: "success"});
            else dataset.showSnackBar({text: `Не удалось отправить отзыв`, type: "danger"});
        })
    }
    
    const onBadResult = e => {
        onFeedback(-1)
    }

    const onGoodResult = e => {
        onFeedback(1)
    }

    return (
        <SplitLayout popout={popout}>
            <SplitCol>
                <Panel id={id}>
                    <PanelHeader before={<PanelHeaderBack onClick={() => go({
                        "to": "home"
                    })}/>}>Редактор текста</PanelHeader>
                    <Group>
                        {
                            group &&
                            <Cell
                                before={group.photo_200 ? <Avatar src={group.photo_200}/> : null}
                                subtitle={group.screen_name}
                                href={`vk.com/${dataset.targetGroup.screen_name}`}
                            >
                                {group.name}
                            </Cell>
                        }
                        <Div>
                            <CellButton
                                getRootRef={selectableTargetRef}
                                onClick={() => setPopout(
                                    <ServiceList
                                        activeService={service}
                                        onServiceClick={handleServiceClick}
                                        onClose={() => setPopout(null)}
                                        targetRef={selectableTargetRef}
                                    />
                                )}
                            >
                                {serviceAlias}
                            </CellButton>
                        </Div>
                        <Div>
                            <Textarea
                                value={text}
                                placeholder="Я хочу написать о том, что..."
                                onChange={handleTextChange}
                            />
                        </Div>
                        <Div>
                            {
                                //service !== Service.BERT &&
                                <Button
                                    stretched
                                    loading={isLoading}
                                    onClick={handleExecute}
                                >
                                    {(() => {
                                        switch (service) {
                                            case Service.REPHRASE:
                                                return "Перефразировать";
                                            case Service.SUMMARIZE:
                                                return "Резюмировать";
                                            default:
                                                return "Генерировать";
                                        }
                                    })()}
                                </Button>
                            }
                        </Div>
                        <Div>
                            <ButtonGroup stretched>
                                <Button
                                    disabled={!resultId}
                                    appearance="negative"
                                    onClick={onBadResult}
                                >👎</Button>
                                 <Button
                                    stretched
                                    appearance="positive"
                                    onClick={handlePublish}
                                >
                                    Опубликовать
                                </Button>
                                <Button
                                    disabled={!resultId}
                                    appearance="positive"
                                    onClick={onGoodResult}
                                >👍</Button>
                            </ButtonGroup>
                        </Div>
                    </Group>
                </Panel>
            </SplitCol>
        </SplitLayout>
    )
}

export default TextEditor;
