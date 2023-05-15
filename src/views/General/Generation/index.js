import {Avatar, Button, Div, FormItem, Group, Panel, PanelHeader, PanelHeaderBack, PanelHeaderContent, Progress, Separator, SplitCol, SplitLayout, Textarea, usePlatform } from "@vkontakte/vkui";
import React, {useEffect, useState} from "react";

import { Icon24Fullscreen, Icon24FullscreenExit, Icon24MagicWandOutline, Icon24Switch, Icon24WriteOutline } from '@vkontakte/icons';
import { Icon24ArrowRightCircleOutline } from '@vkontakte/icons';
import { Icon24Shuffle } from '@vkontakte/icons';

import StrawberryBackend, { GenerationMethod } from "../../../api/SBBackend";

import Hint from "./Hint";
import PostHistory from "./PostHistory";
import ServiceList from "./ServiceList";
import PublishBox from "./PublishBox";
import { useLocation, useRouter } from "@happysanta/router";


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const executeWrapper = (execute) => {
    return async function() {
        const data = await execute.apply(this, arguments);
        if (data.status === 7) return {status: 2};
        const textId = data.text_id;
        while (textId) {
            const ok = await StrawberryBackend.getGenStatus(textId);
            if (ok === null) {
                return {status: 1};
            }
            if (ok) {
                const res = await StrawberryBackend.getGenResult(textId);
                return {status: 0, text: res, id: textId}
            }
            await delay(1000);
        }
    };
}

export const FeedbackType = {
    LIKE: 'like',
    DISLIKE: 'dislike',
};

export const Service = {
    TEXTGEN_THEME: {
        id: "textgen_theme",
        alias: "Создать текст по заданной теме",
        textarea_top: "Тема (краткое описание) текста:",
        placeholder: "Ваша тема для текста (о чем он будет?)",
        button_name: "Создать текст",
        icon: <Icon24WriteOutline/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.GENERATE_TEXT, ...args)),
        hint: "В этом режиме можно на основе предоставленной вами темы создать соответствующий текст! Попробуйте ввести тему текста и создать что-то новое."
    },
    TEXTGEN: {
        id: "text_gen",
        alias: "Продолжить текст",
        textarea_top: "Текст, который нужно продолжить:",
        placeholder: "Текст, который вы хотите продолжить",
        button_name: "Продолжить текст",
        icon: <Icon24ArrowRightCircleOutline/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.APPEND_TEXT, ...args)),
        hint: "В этом режиме можно продолжить введенный вами текст. Введите начало текста, который вы хотите написать, и мы его продолжим!"
    },
    REPHRASE: {
        id: "rephrase",
        alias: "Перефразировать текст",
        textarea_top: "Текст, который нужно перефразировать:",
        placeholder: "Текст, который вы хотите перефразировать",
        button_name: "Перефразировать текст",
        icon: <Icon24Switch/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.REPHRASE_TEXT, ...args)),
        hint: "В этом режиме можно перефразировать текст. Введите текст, и мы его перепишем, сохранив при этом основной смысл!"
    },
    SUMMARIZE: {
        id: "summarize",
        alias: "Резюмировать текст",
        textarea_top: "Текст, который нужно сократить:",
        placeholder: "Большой текст, который нужно резюмировать (сократить)",
        button_name: "Резюмировать текст",
        icon: <Icon24FullscreenExit/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.SUMMARIZE_TEXT, ...args)),
        hint: "В этом режиме можно сократить текст, оставив только самое главное, то есть сохранить основной смысл текста! Введите объемный текст, который нужно сократить, об остальном мы позаботимся сами."
    },
    BERT: {
        id: "bert",
        alias: "Заменить часть текста",
        textarea_top: "Текст, в котором нужно заменить его часть:",
        placeholder: "Текст, в котором нужно заменить его часть/части (обязательно с маской <MASK> в местах замены)",
        button_name: "Заменить часть текста",
        icon: <Icon24Shuffle/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.UNMASK_TEXT, ...args)),
        hint: "В этом режиме можно заменить конкретные части текста (слово или слова) на максимально подходящие по смыслу! Чтобы указать место, где нужно выполнить замену, напишите \"<MASK>\". Мы постараемся заменить это ключевое слово на подходящее по смыслу."
    },
    EXTEND: {
        id: "extend",
        alias: "Добавить в текст воды",
        textarea_top: "Текст, в который нужно добавить воды:",
        placeholder: "Небольшой текст, объем которого нужно увеличить",
        button_name: "Добавить воды",
        icon: <Icon24Fullscreen/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.EXTEND_TEXT, ...args)),
        hint: "Если вам захотелось увеличить уже существующий текст, добавив в него воды, тот этот режим для вас. Данный режим позволяет увеличить общий объем текста, при это сохранив его исходный смысл.",
    },
    SCRATCH: {
        id: "scratch",
        alias: "Создать текст с нуля",
        textarea_top: "",
        placeholder: "",
        button_name: "Создать с нуля",
        icon: <Icon24MagicWandOutline/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.SCRATCH, ...args)),
        hint: "Данный режим позволяет создать текст, основываясь только на контексте сообщества. Вам даже не нужно вводить какой-либо текст!",
        allow_generate: (text) => (!text),
        no_input: true,
    }
};

const serviceStorageDefault = {
    showHint: true,
}


const GenerationPage = ({ id, go, dataset}) => {

    const params = useLocation().getParams();
    const group = params?.group;

    const router = useRouter();

    const serviceKeyDefault = Object.keys(Service)[0]
    const [serviceKey, setServiceKey] = useState(serviceKeyDefault);
    const service = Service[serviceKey];
    const [text, setText] = useState("");
    const [postId, setPostId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timeTarget, setTimeTarget] = useState(null);
    const [progressPercent, setProgressPercent] = useState(0);
    const timeTotal = 90; // 2 mins
    const [posts, setPosts] = useState([]);

    const getServiceStorage = (serviceKey) => {
        const data = JSON.parse(localStorage.getItem("sb_service_data"));
        const serviceData = data?.[serviceKey] ? {...serviceStorageDefault, ...data?.[serviceKey]} : serviceStorageDefault;
        return serviceData;
    }

    const [serviceData, setServiceData] = useState(getServiceStorage(serviceKey));

    useEffect(() => {
        if (isLoading) {
            const intId = setInterval(() => {
                const timeLeft = timeTarget - new Date().getTime() / 1000;
                setProgressPercent(100-timeLeft/timeTotal*100);
            }, 1000)
            return () => clearInterval(intId);
        } else {
            setProgressPercent(100);
        }
    }, [isLoading])

    const saveServiceStorage = (serviceKey, data) => {
        const oldData = JSON.parse(localStorage.getItem("sb_service_data"));
        const newServiceData = {...oldData?.[serviceKey], ...data};
        const newData = {...oldData, [serviceKey]: newServiceData};
        localStorage.setItem("sb_service_data", JSON.stringify(newData));
        setServiceData((prev) => ({...prev, ...newServiceData}));
    }

    const updateHistory = () => {
        StrawberryBackend.getUserResults(group.id, 50, 0)
        .then(({items}) => {
            setPosts(items);
        })
        .catch((error) => {
            console.log(error);
        })
    }

    const handleRecover = (postId, setRecoverable) => {
        StrawberryBackend.postRecover(postId)
        .then((ok) => {
            ok && updateHistory();
            setRecoverable((prev) => {
                let index = prev.indexOf(postId);
                if (index !== -1) {
                    prev.splice(index, 1);
                }
                return prev;
            });
        })
    }

    const handleFeedback = (id, feedbackType, callback) => {
        if (!id) return;
        let promise;
        switch (feedbackType) {
            case FeedbackType.LIKE:
                promise = StrawberryBackend.postLike(id);
                break;
            case FeedbackType.DISLIKE:
                promise = StrawberryBackend.postDislike(id);
                break;
            default:
                return;
        }
        promise.then((ok) => {
            const showInfo = (isOK) => {
                dataset.showSnackBar(
                    isOK
                    ?
                    {text: `Спасибо за ваш отзыв!`, type: "success"}
                    :
                    {text: `Не удалось отправить отзыв`, type: "danger"}
                );
            };
            if (feedbackType === FeedbackType.DISLIKE) {
                StrawberryBackend.postDelete(id)
                .then((okDelete) => {
                    showInfo(okDelete);
                    //okDelete && updateHistory();
                    okDelete && callback && callback();
                })
            } else {
                showInfo(ok);
                ok && updateHistory();
            }
        })
    }

    const handleTextChange = (e) => {
        setText(e.target.value);
    }

    const handleServiceClick = (e) => {
        setServiceKey(e.target.value);
        setServiceData(getServiceStorage(e.target.value));
    }

    const handleExecute = () => {
        setTimeTarget(new Date().getTime() / 1000 + timeTotal);
        setIsLoading(true);
        service.execute(group.id, group.texts, text)
        .then((data) => {
            switch (data?.status) {
                case 0:
                    break;
                case 2:
                    dataset.showSnackBar({text: "Слишком много запросов на генерацию! Попробуйте позже.", type: "danger"});
                    return;
                default:
                    dataset.showSnackBar({text: "При генерации контента произошла ошибка", type: "danger"});
                    return;
            }
            const {text, id} = data;
            if (text === null) {
                dataset.showSnackBar({text: "При генерации контента произошла ошибка", type: "danger"});
                return
            }
            setText(text);
            setPostId(id);
            updateHistory();
            Math.random() <= 0.3
            &&
            setTimeout(
                () => dataset.showSnackBar({
                    text: 'Мы будем признательны, если вы оставите обратную связь. Для этого оцените созданный текст в истории запросов.',
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

    const handleEditPost = (post) => {
        const text = post.text;
        const id = post.post_id;
        setPostId(id);
        setText(text);
    }

    return (
        <Panel id={id}>
            <PanelHeader
                before={<PanelHeaderBack onClick={() => router.popPage()}/>}
            >
                <PanelHeaderContent
                    before={group?.photo_200 ? <Avatar size={36} src={group?.photo_200}/> : null}
                    status={group?.screen_name}
                    onClick={() => group?.screen_name && window.open(`https://vk.com/${group?.screen_name}`, "_blank")}
                >
                    {group?.name}
                </PanelHeaderContent>
            </PanelHeader>
            <SplitLayout>
                <SplitCol>
                    <Group>
                        <Div>
                            <ServiceList
                                activeServiceKey={serviceKey}
                                onServiceClick={handleServiceClick}
                                options={
                                    Object.entries(Service)
                                    //.filter(([key, _]) => ((text && key !== "SCRATCH") || !text))
                                    .map(([key, item]) => ({label: item.alias, value: key, ...item}))
                                }
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
                        {
                            (!service.no_input || (service.no_input && text)) &&
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
                        }
                        <Div>
                            <Progress aria-labelledby="progresslabel" value={progressPercent} />
                        </Div>
                        <Div>
                            {
                                <Button
                                    stretched
                                    loading={isLoading}
                                    onClick={handleExecute}
                                    disabled={
                                        (service.allow_generate && !service.allow_generate(text))
                                        ||
                                        (!service.allow_generate && (!text || text.length === 0))
                                    }
                                >
                                    {service.button_name}
                                </Button>
                            }
                        </Div>
                        {
                            group?.is_admin === 1 &&
                            (
                                <>
                                    <Separator/>
                                    <PublishBox
                                        groupId={group?.id}
                                        postId={postId}
                                        text={text}
                                        showSnackBar={dataset.showSnackBar}
                                    />
                                </>
                            )
                        }
                    </Group>
                    <PostHistory
                        onFeedback={handleFeedback}
                        onRecover={handleRecover}
                        onEditPost={handleEditPost}
                        posts={posts}
                        updateHistory={updateHistory}
                    />
                </SplitCol>
            </SplitLayout>
        </Panel>
    )
}

export default GenerationPage;
