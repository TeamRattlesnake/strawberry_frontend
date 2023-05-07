import { Button, Image, Panel, PanelHeader, PanelHeaderBack, Placeholder, View } from "@vkontakte/vkui";
import { useState } from "react";
import StrawberryBackend from "../../api/SBBackend";

import imgHi from "../../media/hi.gif";
import imgCrying from "../../media/crying.gif";
import imgCute from "../../media/cute.gif";


const Screen = ({id, back, go, dataset, title, goTitle, imgSrc, ...props}) => {
    return (
        <Panel id={id}>
            {
                <PanelHeader before={back && <PanelHeaderBack onClick={back}/>}>
                    {title}
                </PanelHeader>
            }
            <Placeholder
                icon={imgSrc && <Image
                    size={128}
                    src={imgSrc}
                />}
                action={
                    <Button size="m" mode="primary" onClick={go}>
                    {
                        goTitle ? goTitle : "Продолжить"
                    }
                    </Button>
                }
                stretched
            >
                {props.children}
            </Placeholder>
        </Panel>
    )
}

export const PANEL_SCREEN = "panel_screen";


const WelcomeView = ({ id, go, dataset }) => {
    const [to, setTo] = useState("startup");
    const goStartup = () => {
        StrawberryBackend.hasScope("groups")
        .then((ok) => {
            if (ok) {
                StrawberryBackend.hasScope("wall")
                .then((ok) => {
                    if (ok) {
                        setTo("final");
                    } else {
                        setTo("scope2");
                    }
                })
                .catch((error) => {
                    console.log(error);
                })
            } else {
                setTo("scope1");
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }
    const goScope1 = () => {
        StrawberryBackend.askScope("groups")
        .then((ok) => {
            if (ok) {
                StrawberryBackend.hasScope("wall")
                .then((ok) => {
                    if (ok) {
                        setTo("final");
                    } else {
                        setTo("scope2");
                    }
                })
                .catch((error) => {
                    console.log(error);
                })
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }
    const goScope2 = () => {
        StrawberryBackend.askScope("wall")
        .then((ok) => {
            ok && setTo("final");
        })
        .catch((error) => {
            console.log(error);
        })
    }
	return (
        <View id={id} activePanel={to}>
            <Screen
                id="startup"
                go={goStartup}
                dataset={dataset}
                title="Добро пожаловать"
                goTitle="Продолжить"
                imgSrc={imgHi}
            >
                Добро пожаловать в Strawberry - ваш личный помощник в создании постов!
                <br/>
                Перед тем, как начать работу, тебе необходимо кое-что узнать.
                <br/>
                Нажми "Продолжить".
            </Screen>
            <Screen
                id="scope1"
                go={goScope1}
                dataset={dataset}
                title="Права доступа"
                goTitle="Разрешить"
                imgSrc={imgCrying}
            >
                Мы работаем с группами, в том числе с теми, на которые ты подписан.
                <br/>
                {"Для продолжения работы тебе нужно разрешить нам доступ к группам, на которые ты подписан, иначе твой помощник не сможет тебе помочь :("}
            </Screen>
            <Screen
                id="scope2"
                go={goScope2}
                dataset={dataset}
                title="Права доступа"
                goTitle="Разрешить"
                imgSrc={imgCrying}
            >
                Кстати, у нас есть возможность публикации созданных постов!
                <br/>
                Вот только без доступа к публикации мы ничего сделать не сможем... Разреши нам это делать, пожалуйста!
            </Screen>
            <Screen
                id="final"
                go={go}
                dataset={dataset}
                title="Вот и всё!"
                goTitle="Погнали!"
                imgSrc={imgCute}
            >
                Ура, всё готово! Теперь можно начинать работать.
                <br/>
                Вперёд, к исследованиям!
            </Screen>
        </View>
	);
};


export const VIEW_WELCOME = "view_welcome";

export default WelcomeView;
