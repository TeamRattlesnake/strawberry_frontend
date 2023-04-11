import { ActionSheet, ActionSheetDefaultIosCloseItem, ActionSheetItem, Avatar, Button, ButtonGroup, Card, CardGrid, CardScroll, Cell, CellButton, Div, FormItem, Group, Header, Link, Panel, PanelHeader, PanelHeaderBack, PanelHeaderContent, Platform, ScreenSpinner, Spinner, SplitCol, SplitLayout, Textarea, usePlatform } from "@vkontakte/vkui";
import React, {useEffect, useRef, useState} from "react";

import { Icon12ClockOutline, Icon20Stars, Icon24ClockOutline, Icon56RecentOutline } from '@vkontakte/icons';

import { Icon24WriteOutline } from '@vkontakte/icons';
import { Icon24ArrowRightCircleOutline } from '@vkontakte/icons';
import { Icon24MagicWandOutline } from '@vkontakte/icons';
import { Icon24SubtitlesOutline } from '@vkontakte/icons';
import { Icon24Shuffle } from '@vkontakte/icons';

import StrawberryBackend from "../api/SBBackend";
import { FilterMode } from "./Home";

const Service = {
    TEXTGEN: {
        id: "text_gen",
        alias: "Продолжить текст",
        placeholder: "Текст, который вы хотите продолжить",
        button_name: "Продолжить текст",
        icon: <Icon24ArrowRightCircleOutline/>,
        execute: StrawberryBackend.appendText,
    },
    REPHRASE: {
        id: "rephrase",
        alias: "Перефразировать текст",
        placeholder: "Текст, который вы хотите перефразировать",
        button_name: "Перефразировать текст",
        icon: <Icon24MagicWandOutline/>,
        execute: StrawberryBackend.rephraseText,
    },
    SUMMARIZE: {
        id: "summarize",
        alias: "Резюмировать текст",
        placeholder: "Большой текст, который нужно резюмировать (сократить)",
        button_name: "Резюмировать текст",
        icon: <Icon24SubtitlesOutline/>,
        execute: StrawberryBackend.summarizeText,
    },
    BERT: {
        id: "bert",
        alias: "Заменить часть текста",
        placeholder: "Текст, в котором нужно заменить его часть/части (обязательно с маской <MASK> в местах замены)",
        button_name: "Заменить часть текста",
        icon: <Icon24Shuffle/>,
        execute: StrawberryBackend.unmaskText,
    },
    TEXTGEN_THEME: {
        id: "textgen_theme",
        alias: "Создать текст с нуля по заданной теме",
        placeholder: "Ваша тема для текста (о чем он будет?)",
        button_name: "Создать текст",
        icon: <Icon24WriteOutline/>,
        execute: StrawberryBackend.generateText,
    }
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
    const renderItem = (serviceKey, service) => {
        return (
            <ActionSheetItem
                onChange={onServiceClick}
                checked={activeService.id === service.id}
                value={serviceKey}
                autoClose
                selectable
                before={service.icon}
            >
                {service.alias}
            </ActionSheetItem>
        )
    }
    return (
        <ActionSheet
            onClose={onClose}
            iosCloseItem={<ActionSheetDefaultIosCloseItem />}
            toggleRef={targetRef}
        >
            {
                Object.entries(Service).map(([key, item]) => renderItem(key, item))
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

const PostHistory = ({items}) => {
    return (
        <Group header={<Header>История запросов</Header>}>
            <Div>
                {
                    items && items.length > 0
                    ?
                    <CardScroll size="l">
                        {    
                            items.map((item) => {
                                const onFeedback = (score) => {
                                    if (!item.id) return;
                                    StrawberryBackend.sendFeedback(item.id, score)
                                    .then((ok) => {
                                        if (ok) dataset.showSnackBar({text: `Спасибо за ваш отзыв!`, type: "success"});
                                        else dataset.showSnackBar({text: `Не удалось отправить отзыв`, type: "danger"});
                                    })
                                }
                                const onBadResult = () => onFeedback(-1);
                                const onGoodResult = () => onFeedback(1);
                                return (
                                    <Card
                                        key={item.id}
                                        mode="shadow"
                                        style={{
                                            flex: '2 2 auto',
                                            paddingTop: '24px',
                                            paddingBottom: '24px',
                                            minWidth: '40vw'
                                        }}
                                    >
                                        <div>
                                            <Div>
                                                <Textarea
                                                    id={item.id}
                                                    value={item.text}
                                                    defaultValue={item.text}
                                                    rows={6}
                                                    readOnly
                                                />
                                            </Div>
                                            <Div>
                                                <ButtonGroup stretched>
                                                    <Button
                                                        stretched
                                                        appearance="negative"
                                                        onClick={onBadResult}
                                                    >👎</Button>
                                                    <Button
                                                        stretched
                                                        appearance="positive"
                                                        onClick={onGoodResult}
                                                    >👍</Button>
                                                </ButtonGroup>
                                            </Div>
                                        </div>
                                    </Card>
                                )
                            })
                        }
                    </CardScroll>
                    :
                    <div style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
						textAlign: "center",
						width: "100%"
					}}>
                        <Icon56RecentOutline/>
                        <span>Нет данных</span>
                    </div>
                }
            </Div>
        </Group>
    )
}

const GenerationPage = ({id, go, dataset}) => {
    const group = dataset.targetGroup;
    const [service, setService] = useState(Service.TEXTGEN);
    const [popout, setPopout] = useState(null);
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [editorPlaceholder, setEditorPlaceholder] = useState("Текст, который нужно продолжить");
    const [postHistory, setPostHistory] = useState([]);
    const [showPostHistory, setShowPostHistory] = useState(false);
    const platform = usePlatform();

    const selectableTargetRef = useRef();

    useEffect(() => {
        setEditorPlaceholder(service.placeholder);
    }, [service])
    
    const handleTextChange = (e) => {
        setText(e.target.value);
    }

    const handleServiceClick = (e) => {
        setService(Service[e.target.value]);
        setPopout(null);
    }

    const handleExecute = () => {
        setIsLoading(true);
        service.execute(dataset.targetGroup.id, dataset.targetGroup.texts, text)
        .then(({text_data, result_id}) => {
            setPostHistory((prev) => {
                const post = {
                    id: result_id,
                    text: text_data
                }
                return [...prev, post]
            });
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

    return (
        <Panel id={id}>
            <PanelHeader
                before={
                    <PanelHeaderBack onClick={() => go({
                        "to": "home"
                    })}/>
                }
            >
                <PanelHeaderContent before={group.photo_200 ? <Avatar size={36} src={group.photo_200}/> : null} status={group.screen_name}>
                    {group.name}
                </PanelHeaderContent>
            </PanelHeader>
            <SplitLayout popout={popout}>
                <SplitCol>
                    <Group>
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
                                before={service.icon}
                            >
                                {service.alias}
                            </CellButton>
                        </Div>
                        <Div>
                            <Textarea
                                rows={7}
                                value={text}
                                placeholder={editorPlaceholder}
                                onChange={handleTextChange}
                            />
                        </Div>
                        <Div>
                            {
                                <Button
                                    stretched
                                    loading={isLoading}
                                    onClick={handleExecute}
                                >
                                    {service.button_name}
                                </Button>
                            }
                        </Div>
                        {
                            dataset.targetGroup.mode === FilterMode.MANAGED &&
                            <Div>
                                <Button
                                    stretched
                                    appearance="positive"
                                    onClick={handlePublish}
                                >
                                    Опубликовать
                                </Button>
                            </Div>
                        }
                    </Group>
                    <PostHistory items={postHistory}/>
                </SplitCol>
            </SplitLayout>
        </Panel>
    )
}

export default GenerationPage;
