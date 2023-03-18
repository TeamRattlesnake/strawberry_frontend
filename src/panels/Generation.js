import { Avatar, Button, ButtonGroup, Cell, ContentCard, Div, FormItem, Gallery, Group, IconButton, Panel, PanelHeader, PanelHeaderBack, ScreenSpinner, Snackbar, Textarea } from "@vkontakte/vkui";
import React, {useState, useEffect } from "react";

import bridge from '@vkontakte/vk-bridge';

import { Icon20Stars, Icon28CheckCircleOutline, Icon28ThumbsDownOutline, Icon28ThumbsUpOutline } from '@vkontakte/icons';

import { Virtual } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/virtual';
import StrawberryBackend from "../api/SBBackend";


export const Generate = ({id, accessToken, dataset, go}) => {
    const targetGroup = dataset.targetGroup;
    const onGenerate = (groupId) => {
        StrawberryBackend.generateText(accessToken, groupId).then((text) => {
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
                    Говно!
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

export const GenerationResult = ({id, dataset, go, accessToken}) => {
    const [isLoading, setIsLoading] = useState(false);
    const onBadResult = () => {
        setIsLoading(true);
        StrawberryBackend.generateText(accessToken, dataset.targetGroup.id).then((text) => {
            if (!text) return
            go({"genres": {"text": text}});
            setIsLoading(false);
        })
    };
    const onGoodResult = () => {
        // опубликовать в группе
        bridge.send("VKWebAppGetCommunityToken", {
            app_id: 51575840,
            group_id: dataset.targetGroup.id,
            scope: 'manage'
            })
        .then((data) => { 
            if (!data.access_token) return;
            bridge.send('VKWebAppCallAPIMethod', {
                method: 'wall.post',
                params: {
                    v: '5.131',
                    access_token: data.access_token,
                    owner_id: `-${dataset.targetGroup.id}`,
                    message: dataset.genres.text
                }
            }).then((vkResp) => {
                if (vkResp.response) {
                    dataset.showSnackBar({text: "Ура, запись успешно опубликована!", type: "success"});
                } else {
                    dataset.showSnackBar({text: "Ошибка при публикации записи", type: "danger"});
                }
            });
        })
        .catch((error) => {
            // Ошибка
            console.log(error);
            dataset.showSnackBar({text: "Ошибка при подключении сообщества", type: "danger"});
        });
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
