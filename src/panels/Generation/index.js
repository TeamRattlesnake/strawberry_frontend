import {Avatar, Button, Checkbox, DateInput, Div, FormItem, Group, Panel, PanelHeader, PanelHeaderBack, PanelHeaderContent, Separator, Spacing, SplitCol, SplitLayout, Textarea } from "@vkontakte/vkui";
import React, {useEffect, useState} from "react";

import { Icon24WriteOutline } from '@vkontakte/icons';
import { Icon24ArrowRightCircleOutline } from '@vkontakte/icons';
import { Icon24MagicWandOutline } from '@vkontakte/icons';
import { Icon24SubtitlesOutline } from '@vkontakte/icons';
import { Icon24Shuffle } from '@vkontakte/icons';

import moment from 'moment-timezone';
moment.locale('ru');

import StrawberryBackend from "../../api/SBBackend";
import { FilterMode } from "../Home";

import Hint from "./Hint";
import PostHistory from "./PostHistory";
import ServiceList from "./ServiceList";


export const Service = {
    TEXTGEN_THEME: {
        id: "textgen_theme",
        alias: "Создать текст с нуля по заданной теме",
        textarea_top: "Тема (краткое описание) для текста, который нужно создать:",
        //placeholder: "Ваша тема для текста (о чем он будет?)",
        button_name: "Создать текст",
        icon: <Icon24WriteOutline/>,
        execute: StrawberryBackend.generateText,
        hint: "В этом режиме можно с использованием вашего краткого описания текста (темы) создать текст побольше! Попробуйте ввести тему текста и создать что-то новое."
    },
    TEXTGEN: {
        id: "text_gen",
        alias: "Продолжить текст",
        textarea_top: "Текст, который нужно продолжить:",
        //placeholder: "Текст, который вы хотите продолжить",
        button_name: "Продолжить текст",
        icon: <Icon24ArrowRightCircleOutline/>,
        execute: StrawberryBackend.appendText,
        hint: "В этом режиме можно продолжить введенный вами текст. Введите начало текста, который вы хотите написать, и мы его продолжим!"
    },
    REPHRASE: {
        id: "rephrase",
        alias: "Перефразировать текст",
        textarea_top: "Текст, который нужно перефразировать:",
        //placeholder: "Текст, который вы хотите перефразировать",
        button_name: "Перефразировать текст",
        icon: <Icon24MagicWandOutline/>,
        execute: StrawberryBackend.rephraseText,
        hint: "В этом режиме можно перефразировать текст. Введите текст, и мы его перепишем, сохранив при этом основной смысл!"
    },
    SUMMARIZE: {
        id: "summarize",
        alias: "Резюмировать текст",
        textarea_top: "Текст, который нужно сократить (резюмировать):",
        //placeholder: "Большой текст, который нужно резюмировать (сократить)",
        button_name: "Резюмировать текст",
        icon: <Icon24SubtitlesOutline/>,
        execute: StrawberryBackend.summarizeText,
        hint: "В этом режиме можно сократить текст, оставив только самое главное, то есть сохранить основной смысл текста! Введите объемный текст, который нужно сократить, об остальном мы позаботимся сами."
    },
    BERT: {
        id: "bert",
        alias: "Заменить часть текста",
        textarea_top: "Текст, в котором нужно заменить его часть:",
        //placeholder: "Текст, в котором нужно заменить его часть/части (обязательно с маской <MASK> в местах замены)",
        button_name: "Заменить часть текста",
        icon: <Icon24Shuffle/>,
        execute: StrawberryBackend.unmaskText,
        hint: "В этом режиме можно заменить конкретные части текста (слово или слова) на максимально подходящие по смыслу! Чтобы указать место, где нужно выполнить замену, напишите \"<MASK>\". Мы постараемся заменить это ключевое слово на подходящее по смыслу."
    }
};

const serviceStorageDefault = {
    showHint: true,
}


const PublishBox = ({groupId, text, showSnackBar}) => {
    const [fromGroup, setFromGroup] = useState(true);
    const [usePublishDate, setUsePublishDate] = useState(false);
    const [publishDate, setPublishDate] = useState(() => new Date());
    const handlePublish = () => {
        StrawberryBackend.publishPost(groupId, text, {
            from_group: fromGroup,
            publish_date: usePublishDate && Math.floor(publishDate.getTime() / 1000),
        })
        .then((status) => {
            switch (status) {
                case 0:
                    showSnackBar({
                        text: usePublishDate ?
                        "Ура, в скором времени запись будет опубликована!"
                        :
                        "Ура, запись успешно опубликована!",
                        type: "success"});
                    break;
                case 3:
                    showSnackBar({text: "Передумали?", type: "danger"});
                    break;
                default:
                    showSnackBar({text: "Ошибка при публикации записи", type: "danger"});
                    break;
            }
        })
    }
    return (
        <Group mode="plain">
            <Div>
                <Checkbox
                    defaultChecked={usePublishDate}
                    onChange={(e) => setUsePublishDate(e.target.checked)}
                >
                    Отложенная запись
                </Checkbox>
                {
                    usePublishDate &&
                    <FormItem top="Дата публикации">
                        <DateInput
                            value={publishDate}
                            onChange={setPublishDate}
                            enableTime
                            disablePast
                            closeOnChange
                        />
                    </FormItem>
                }
                <Checkbox
                    defaultChecked={fromGroup}
                    onChange={(e) => setFromGroup(e.target.checked)}
                >
                    От имени сообщества
                </Checkbox>
            </Div>
            <Div>
                <Button
                    stretched
                    appearance="positive"
                    onClick={handlePublish}
                >
                    Опубликовать
                </Button>
            </Div>
        </Group>
    )
}

const GenerationPage = ({id, go, dataset}) => {
    const group = dataset.targetGroup;
    const [serviceKeyDefault, serviceItemDefault] = Object.entries(Service)[0]
    const [serviceKey, setServiceKey] = useState(serviceKeyDefault);
    const [service, setService] = useState(serviceItemDefault);
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [postHistory, setPostHistory] = useState(JSON.parse(localStorage.getItem("sb_post_history")) || []);

    const getServiceStorage = (serviceKey) => {
        const data = JSON.parse(localStorage.getItem("sb_service_data"));
        const serviceData = data?.[serviceKey] ? {...serviceStorageDefault, ...data?.[serviceKey]} : serviceStorageDefault;
        return serviceData;
    }

    const [serviceData, setServiceData] = useState(getServiceStorage(serviceKey));

    const saveServiceStorage = (serviceKey, data) => {
        const oldData = JSON.parse(localStorage.getItem("sb_service_data"));
        const newServiceData = {...oldData?.[serviceKey], ...data};
        const newData = {...oldData, [serviceKey]: newServiceData};
        localStorage.setItem("sb_service_data", JSON.stringify(newData));
        console.log('newServiceData', newServiceData);
        setServiceData((prev) => ({...prev, ...newServiceData}));
    }

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
        setServiceData(getServiceStorage(e.target.value));
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
            Math.random() <= 0.3
            &&
            setTimeout(
                () => dataset.showSnackBar({
                    text: 'Мы будем признательны, если вы оставите фидбэк. Для этого оцените созданный текст в истории запросов.',
                    type: 'info'
                }),
                3000
            );
        })
        .catch((error) => {
            console.log(error);
            dataset.showSnackBar({text: "Неизвестная ошибка :(", type: "danger"});
        })
        .finally(() => setIsLoading(false));
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
                    <Group>
                        <Div>
                            <ServiceList
                                activeServiceKey={serviceKey}
                                onServiceClick={handleServiceClick}    
                            />
                        </Div>
                        {
                            console.log('sd', serviceData)
                        }
                        {
                            serviceData.showHint &&
                            <Div>
                                <Hint text={service.hint} onClose={() => {
                                    saveServiceStorage(serviceKey, {showHint: false});
                                }}/>
                            </Div>
                        }
                        <Div>
                            <FormItem top={service.textarea_top}>
                                <Textarea
                                    rows={7}
                                    value={text}
                                    placeholder={service.placeholder}
                                    onChange={handleTextChange}
                                />
                            </FormItem>
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
                            (
                                <>
                                    <Separator/>
                                    <PublishBox groupId={group.id} text={text} showSnackBar={dataset.showSnackBar}/>
                                </>
                            )
                        }
                    </Group>
                    <PostHistory items={postHistory} onFeedback={handleFeedback}/>
                </SplitCol>
            </SplitLayout>
        </Panel>
    )
}

export default GenerationPage;
