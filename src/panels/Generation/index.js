import {Avatar, Button, Div, Group, Panel, PanelHeader, PanelHeaderBack, PanelHeaderContent, SplitCol, SplitLayout, Textarea } from "@vkontakte/vkui";
import React, {useEffect, useState} from "react";

import { Icon24WriteOutline } from '@vkontakte/icons';
import { Icon24ArrowRightCircleOutline } from '@vkontakte/icons';
import { Icon24MagicWandOutline } from '@vkontakte/icons';
import { Icon24SubtitlesOutline } from '@vkontakte/icons';
import { Icon24Shuffle } from '@vkontakte/icons';

import StrawberryBackend from "../../api/SBBackend";
import { FilterMode } from "../Home";

import moment from 'moment-timezone';
moment.locale('ru');

import Hint from "./Hint";
import PostHistory from "./PostHistory";
import ServiceList from "./ServiceList";


export const Service = {
    TEXTGEN_THEME: {
        id: "textgen_theme",
        alias: "Создать текст с нуля по заданной теме",
        placeholder: "Ваша тема для текста (о чем он будет?)",
        button_name: "Создать текст",
        icon: <Icon24WriteOutline/>,
        execute: StrawberryBackend.generateText,
        hint: "Напишите ниже о чем будет ваш текст (его тему)"
    },
    TEXTGEN: {
        id: "text_gen",
        alias: "Продолжить текст",
        placeholder: "Текст, который вы хотите продолжить",
        button_name: "Продолжить текст",
        icon: <Icon24ArrowRightCircleOutline/>,
        execute: StrawberryBackend.appendText,
        hint: "Напишите ниже текст, который вы хотите продолжить"
    },
    REPHRASE: {
        id: "rephrase",
        alias: "Перефразировать текст",
        placeholder: "Текст, который вы хотите перефразировать",
        button_name: "Перефразировать текст",
        icon: <Icon24MagicWandOutline/>,
        execute: StrawberryBackend.rephraseText,
        hint: "Напишите ниже текст, который вы хотите перефразировать"
    },
    SUMMARIZE: {
        id: "summarize",
        alias: "Резюмировать текст",
        placeholder: "Большой текст, который нужно резюмировать (сократить)",
        button_name: "Резюмировать текст",
        icon: <Icon24SubtitlesOutline/>,
        execute: StrawberryBackend.summarizeText,
        hint: "Напишите ниже большой текст, который нужно резюмировать (сократить)"
    },
    BERT: {
        id: "bert",
        alias: "Заменить часть текста",
        placeholder: "Текст, в котором нужно заменить его часть/части (обязательно с маской <MASK> в местах замены)",
        button_name: "Заменить часть текста",
        icon: <Icon24Shuffle/>,
        execute: StrawberryBackend.unmaskText,
        hint: "Напишите ниже текст, в котором нужно заменить его часть/части (обязательно с маской <MASK> в местах замены)"
    }
};

const serviceStorageDefault = {
    showHint: true,
}

const saveServiceStorage = (serviceKey, data) => {
    const oldData = localStorage.getItem("sb_service_data")
    localStorage.setItem("sb_service_data", {...oldData, serviceKey: {...oldData?.[serviceKey], ...data}})
}


const GenerationPage = ({id, go, dataset}) => {
    const group = dataset.targetGroup;
    const [serviceKeyDefault, serviceItemDefault] = Object.entries(Service)[0]
    const [serviceKey, setServiceKey] = useState(serviceKeyDefault);
    const [service, setService] = useState(serviceItemDefault);
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [postHistory, setPostHistory] = useState(JSON.parse(localStorage.getItem("sb_post_history")) || []);

    let serviceData = localStorage.getItem("sb_service_data")?.[serviceKey] || serviceStorageDefault;

    const handleFeedback = (id, score) => {
        if (!id) return;
        StrawberryBackend.sendFeedback(id, score)
        .then((ok) => {
            dataset.showSnackBar(
                ok
                ?
                {text: `Спасибо за ваш отзыв!`, type: "success"}
                :
                {text: `Не удалось отправить отзыв`, type: "danger"}
            );
        })
    }

    const handleTextChange = (e) => {
        setText(e.target.value);
    }

    const handleServiceClick = (e) => {
        setServiceKey(e.target.value);
        setService(Service[e.target.value]);
    }

    const handleExecute = () => {
        setIsLoading(true);
        service.execute(dataset.targetGroup.id, dataset.targetGroup.texts, text)
        .then(({text_data, result_id}) => {
            setPostHistory((prev) => {
                const post = {
                    id: result_id,
                    text: text_data,
                    datetime: moment().unix()
                }
                return [post, ...prev]
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
            <SplitLayout>
                <SplitCol>
                    { service.hint && serviceData.showHint && <Hint text={service.hint} onClose={() => {
                        serviceData.showHint = false;
                        saveServiceStorage(serviceKey, {showHint: false});
                    }}/> }
                    <Group>
                        <Div>
                            <ServiceList
                                activeServiceKey={serviceKey}
                                onServiceClick={handleServiceClick}    
                            />
                        </Div>
                        <Div>
                            <Textarea
                                rows={7}
                                value={text}
                                placeholder={service.placeholder}
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
                    <PostHistory items={postHistory} onFeedback={handleFeedback}/>
                </SplitCol>
            </SplitLayout>
        </Panel>
    )
}

export default GenerationPage;
