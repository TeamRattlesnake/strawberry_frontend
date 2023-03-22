import { Avatar, Button, ButtonGroup, Cell, ContentCard, Div, FormItem, Group, Panel, PanelHeader, PanelHeaderBack, Paragraph, ScreenSpinner, Textarea } from "@vkontakte/vkui";
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
        StrawberryBackend.generateText(dataset.showSnackBar, groupId, hint).then((text) => {
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

const WallPost = ({text, imgSrc, onBadResult, onGoodResult}) => {
    return (
        <>
            {
                /*
                <ContentCard
                    disabled
                    //src="http://via.placeholder.com/640x360"
                    alt="Сгенерированный пост"
                    text={text}
                    maxHeight={200}
                />
                */
            }
            <Div weight="3" style={{
                whiteSpace: 'pre-wrap'
            }}>{text}</Div>
            <ButtonGroup
                stretched
                mode="horizontal"
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
    const onBadResult = () => {
        setIsLoading(true);
        StrawberryBackend.generateText(dataset.showSnackBar, dataset.targetGroup.id, dataset.hint).then((text) => {
            if (!text) return
            go({"genres": {"text": text}});
            setIsLoading(false);
        })
    };
    const onGoodResult = () => {
        setIsLoading(true);
        StrawberryBackend.publishPost(dataset.showSnackBar, dataset.targetGroup.id, dataset.genres.text).then((resp) => {
            setIsLoading(false);
        })
    };
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
                    <WallPost text={dataset.genres.text} onBadResult={onBadResult} onGoodResult={onGoodResult}/>
                }
            </Group>
        </Panel>
    )
}
