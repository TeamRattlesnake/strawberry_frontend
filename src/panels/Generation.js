import { Avatar, Button, ButtonGroup, Cell, ContentCard, Div, Group, Panel, PanelHeader, PanelHeaderBack, ScreenSpinner } from "@vkontakte/vkui";
import React, {useState} from "react";

import { Icon20Stars } from '@vkontakte/icons';

import 'swiper/css';
import 'swiper/css/virtual';
import StrawberryBackend from "../api/SBBackend";


export const Generate = ({id, dataset, go}) => {
    const targetGroup = dataset.targetGroup;
    const onGenerate = (groupId) => {
        StrawberryBackend.generateText(dataset.showSnackBar, groupId).then((text) => {
            if (text) {
                go({
                    "to": "generation_result",
                    "genres": {
                        "text": text
                    }
                })
            } else {
                dataset.showSnackBar({text: "Ошибка генерации: сервер не вернул текст", type: "danger"});
            }
        })
    }
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
                {
                    /*
                    <FormItem top="Кратко опишите ваш пост">
                        <Textarea placeholder="Описание поста"/>
                    </FormItem>
                    */
                }
                <Div>
                    <Button
                        stretched
                        after={<Icon20Stars/>}
                        onClick={() => onGenerate(targetGroup.id)}
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
            <ContentCard
                disabled
                src="http://via.placeholder.com/640x360"
                alt="Сгенерированный пост"
                text={text}
                maxHeight={200}
            />
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
        StrawberryBackend.generateText(dataset.showSnackBar, dataset.targetGroup.id).then((text) => {
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
            {snackbar}
        </Panel>
    )
}
