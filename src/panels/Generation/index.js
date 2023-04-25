import {Avatar, Button, Checkbox, DateInput, Div, FormItem, Group, Panel, PanelHeader, PanelHeaderBack, PanelHeaderContent, Separator, Spacing, SplitCol, SplitLayout, Textarea } from "@vkontakte/vkui";
import React, {useEffect, useState} from "react";

import { Icon24WriteOutline } from '@vkontakte/icons';
import { Icon24ArrowRightCircleOutline } from '@vkontakte/icons';
import { Icon24MagicWandOutline } from '@vkontakte/icons';
import { Icon24SubtitlesOutline } from '@vkontakte/icons';
import { Icon24Shuffle } from '@vkontakte/icons';

import StrawberryBackend from "../../api/SBBackend";
import { FilterMode } from "../Home";

import Hint from "./Hint";
import PostHistory from "./PostHistory";
import ServiceList from "./ServiceList";
import PublishBox from "./PublishBox";


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const executeWrapper = (execute) => {
    return async function() {
        const textId = await execute.apply(this, arguments)
        while (textId) {
            const ok = await StrawberryBackend.getGenStatus(textId);
            console.log('ok', ok);
            if (ok) {
                const res = await StrawberryBackend.getGenResult(textId);
                console.log('res', res);
                return res
            }
            await delay(1000);
        }
    };
}

export const Service = {
    TEXTGEN_THEME: {
        id: "textgen_theme",
        alias: "Создать текст с нуля по заданной теме",
        textarea_top: "Тема (краткое описание) для текста, который нужно создать:",
        //placeholder: "Ваша тема для текста (о чем он будет?)",
        button_name: "Создать текст",
        icon: <Icon24WriteOutline/>,
        execute: executeWrapper(StrawberryBackend.generateText),
        hint: "В этом режиме можно с использованием вашего краткого описания текста (темы) создать текст побольше! Попробуйте ввести тему текста и создать что-то новое."
    },
    TEXTGEN: {
        id: "text_gen",
        alias: "Продолжить текст",
        textarea_top: "Текст, который нужно продолжить:",
        //placeholder: "Текст, который вы хотите продолжить",
        button_name: "Продолжить текст",
        icon: <Icon24ArrowRightCircleOutline/>,
        execute: executeWrapper(StrawberryBackend.appendText),
        hint: "В этом режиме можно продолжить введенный вами текст. Введите начало текста, который вы хотите написать, и мы его продолжим!"
    },
    REPHRASE: {
        id: "rephrase",
        alias: "Перефразировать текст",
        textarea_top: "Текст, который нужно перефразировать:",
        //placeholder: "Текст, который вы хотите перефразировать",
        button_name: "Перефразировать текст",
        icon: <Icon24MagicWandOutline/>,
        execute: executeWrapper(StrawberryBackend.rephraseText),
        hint: "В этом режиме можно перефразировать текст. Введите текст, и мы его перепишем, сохранив при этом основной смысл!"
    },
    SUMMARIZE: {
        id: "summarize",
        alias: "Резюмировать текст",
        textarea_top: "Текст, который нужно сократить (резюмировать):",
        //placeholder: "Большой текст, который нужно резюмировать (сократить)",
        button_name: "Резюмировать текст",
        icon: <Icon24SubtitlesOutline/>,
        execute: executeWrapper(StrawberryBackend.summarizeText),
        hint: "В этом режиме можно сократить текст, оставив только самое главное, то есть сохранить основной смысл текста! Введите объемный текст, который нужно сократить, об остальном мы позаботимся сами."
    },
    BERT: {
        id: "bert",
        alias: "Заменить часть текста",
        textarea_top: "Текст, в котором нужно заменить его часть:",
        //placeholder: "Текст, в котором нужно заменить его часть/части (обязательно с маской <MASK> в местах замены)",
        button_name: "Заменить часть текста",
        icon: <Icon24Shuffle/>,
        execute: executeWrapper(StrawberryBackend.unmaskText),
        hint: "В этом режиме можно заменить конкретные части текста (слово или слова) на максимально подходящие по смыслу! Чтобы указать место, где нужно выполнить замену, напишите \"<MASK>\". Мы постараемся заменить это ключевое слово на подходящее по смыслу."
    }
};

const serviceStorageDefault = {
    showHint: true,
}

const GenerationPage = ({id, go, dataset}) => {
    const group = dataset.targetGroup;
    const [serviceKeyDefault, serviceItemDefault] = Object.entries(Service)[0]
    const [serviceKey, setServiceKey] = useState(serviceKeyDefault);
    const [service, setService] = useState(serviceItemDefault);
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
        .then((text_data) => {
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
                    <PostHistory groupId={group.id} onFeedback={handleFeedback}/>
                </SplitCol>
            </SplitLayout>
        </Panel>
    )
}

export default GenerationPage;
