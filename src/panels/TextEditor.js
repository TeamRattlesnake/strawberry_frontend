import { ActionSheet, ActionSheetDefaultIosCloseItem, ActionSheetItem, Avatar, Button, ButtonGroup, Cell, CellButton, Div, FormItem, Group, Panel, PanelHeader, PanelHeaderBack, ScreenSpinner, SplitCol, SplitLayout, Textarea } from "@vkontakte/vkui";
import React, {useRef, useState} from "react";

import { Icon20Stars } from '@vkontakte/icons';

import StrawberryBackend from "../api/SBBackend";


const Service = {
    TEXTGEN: "text_gen",
    REPHRASE: "rephrase",
    SUMMARIZE: "summarize",
    BERT: "bert"
};

const ServiceList = ({activeService, onServiceClick, onClose, targetRef}) => {
    const renderItem = (service, alias) => {
        console.log("alias", alias);
        return (
            <ActionSheetItem
                onChange={onServiceClick}
                checked={activeService === service}
                name={service}
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

const TextEditor = ({id, go, dataset}) => {
    const group = dataset.targetGroup;
    const groupId = group.id;
    const [service, setService] = useState(Service.TEXTGEN);
    const [popout, setPopout] = useState(null);
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const selectableTargetRef = useRef();
    
    const handleTextChange = (e) => {
        setText(e.target.value);
    }

    const handleServiceClick = (e) => {
        console.log('e', e);
        console.log('value', e.target.value);
        console.log('target', e.target);
        setService(e.target.value);
        setPopout(null);
    }

    const handleExecute = () => {
        let hint = text;
        if (service === Service.BERT) {
            hint += " [MASK]";
        }
        setIsLoading(true);
        StrawberryBackend.generate(service, groupId, hint)
        .then((text) => {
            if (service === Service.BERT) {
                let words = text.split(',');
                setText((prevText) => {
                    return prevText+" "+words[0];
                })
            } else {
                setText(text);
            }
        })
        .finally(() => setIsLoading(false));
    }

    const handlePublish = () => {
        StrawberryBackend.publishPost(dataset.targetGroup.id, textResult)
        .then((status) => {
            switch (status) {
                case 0:
                    showSnackBar({text: "Ура, запись успешно опубликована!", type: "success"});
                    break;
                case 1:
                    showSnackBar({text: "Передумали?", type: "danger"});
                    break;
                default:
                    showSnackBar({text: "Ошибка при публикации записи", type: "danger"});
                    break;
            }
        })
    }

    const onBadResult = e => {
        dataset.showSnackBar({text: `Спасибо за ваш отзыв!`, type: "success"});
    }

    const onGoodResult = e => {
        dataset.showSnackBar({text: `Спасибо за ваш отзыв!`, type: "success"});
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
                                //href={`vk.com/${targetGroup.screen_name}`}
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
                                {service}
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
                                    //stretched
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
                                    //stretched
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
