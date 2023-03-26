import { Avatar, Button, ButtonGroup, Cell, Div, FormItem, Group, Panel, PanelHeader, PanelHeaderBack, ScreenSpinner, Textarea } from "@vkontakte/vkui";
import React, {useState} from "react";

import { Icon20Stars } from '@vkontakte/icons';

import StrawberryBackend from "../api/SBBackend";


export const Generate = ({id, dataset, go}) => {
    const hintPlaceholder = "Сегодня я хочу рассказать о..."
    const targetGroup = dataset.targetGroup;
    const [hint, setHint] = useState(hintPlaceholder);
    const [isGenerating, setIsGenerating] = useState(false);
    const onGenerate = (groupId, hint) => {
        setIsGenerating(true);
        StrawberryBackend.generateText(groupId, hint).then((text) => {
            if (text) {
                go({
                    "to": "generation_result",
                    "genres": {
                        "text": text
                    },
                    "hint": hint,
                })
            } else {
                dataset.showSnackBar({text: "Ошибка генерации: сервер не вернул текст", type: "danger"});
            }
            setIsGenerating(false);
        })
    }
    const handleHintChange = event => {
        setHint(event.target.value);
    };
    return (
        <Panel id={id}>
			<PanelHeader before={<PanelHeaderBack onClick={() => go({
                "to": "home"
            })}/>}>Генерация</PanelHeader>
            <Group>
                {
                    targetGroup &&
                    <Cell
                        before={targetGroup.photo_200 ? <Avatar src={targetGroup.photo_200}/> : null}
                        subtitle={targetGroup.screen_name}
                        //href={`vk.com/${targetGroup.screen_name}`}
                    >
                        {targetGroup.name}
                    </Cell>
                }
                <FormItem top="Напишите начало поста">
                    <Textarea
                        placeholder={hintPlaceholder}
                        onChange={handleHintChange}
                    />
                </FormItem>
                <Div>
                    <Button
                        stretched
                        after={<Icon20Stars/>}
                        onClick={() => onGenerate(targetGroup.id, hint)}
                        loading={isGenerating}
                    >
                        Сгенерировать
                    </Button>
                </Div>
            </Group>
        </Panel>
    )
}

const WallPost = ({text, imgSrc, onBadResult, onGoodResult, onChange}) => {
    return (
        <>
            <Textarea defaultValue={text} onChange={onChange}/>
            <ButtonGroup
                stretched
                mode="horizontal"
                style={{
                    marginTop: "0.5rem",
                }}
            >
                <Button
                    stretched
                    appearance="negative"
                    onClick={onBadResult}
                >
                    Не нравится!
                </Button>
                <Button
                    stretched
                    appearance="positive"
                    onClick={onGoodResult}
                >
                    Пойдет!
                </Button>
            </ButtonGroup>
        </>
    )
}

export const GenerationResult = ({id, dataset, go}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [textResult, setTextResult] = useState(dataset.genres.text);
    const onBadResult = () => {
        setIsLoading(true);
        StrawberryBackend.generateText(dataset.targetGroup.id, dataset.hint).then((text) => {
            if (!text) throw "Отсутствует текст";
            setTextResult(text);
        }).catch((error) => {
            console.log(error);
        }).finally(() => {
            setIsLoading(false);
        })
    };
    const onGoodResult = () => {
        setIsLoading(true);
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
        .finally(() => {
            setIsLoading(false);
        })
    };
    const handleTextChange = e => setTextResult(e.target.value);
    return (
        <Panel id={id}>
            <PanelHeader before={<PanelHeaderBack onClick={() => go({
                "to": "generate"
            })}/>}>Результат</PanelHeader>
            <Group>
                {
                    isLoading ?
                    <ScreenSpinner/>
                    :
                    <WallPost
                        text={textResult}
                        onBadResult={onBadResult}
                        onGoodResult={onGoodResult}
                        onChange={handleTextChange}
                    />
                }
            </Group>
        </Panel>
    )
}
