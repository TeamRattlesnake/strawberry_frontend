import {Avatar, Div, Group, IconButton, ModalPageHeader, ModalPage, Panel, PanelHeader, PanelHeaderBack, PanelHeaderContent, Progress, Separator, SplitCol, SplitLayout, ModalRoot, Header, Text } from "@vkontakte/vkui";
import React, {useCallback, useEffect, useState} from "react";

import StrawberryBackend from "../../../api/SBBackend";

import PostHistory from "./PostHistory";
import PublishBox from "./PublishBox";
import { useLocation, useRouter } from "@happysanta/router";
import MediaBox from "./MediaBox";
import Editor from "./Editor";
import { Icon24InfoCircleOutline } from "@vkontakte/icons";
import Service from "../../../api/Service";


export const FeedbackType = {
    LIKE: 'like',
    DISLIKE: 'dislike',
};

const GenerationPage = ({ id, go, dataset}) => {

    const params = useLocation().getParams();
    const group = params?.group;

    const router = useRouter();

    const [text, setText] = useState("");
    const [postId, setPostId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timeTarget, setTimeTarget] = useState(null);
    const [progressPercent, setProgressPercent] = useState(0);
    const timeTotal = 15; // секунд
    const [posts, setPosts] = useState([]);

    const [activeModal, setActiveModal] = useState(null);
    const modal = (
        <ModalRoot activeModal={activeModal}>
            <ModalPage
                id="editorInfo"
                onClose={() => setActiveModal(null)}
                header={
                    <ModalPageHeader>
                        Как пользоваться редактором?
                    </ModalPageHeader>
                }
            >
                <Group>
                    {
                        Object.values(Service).map((service) => {
                            return (
                                <>
                                    <Div>
                                        <div style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                        }}>{service.icon}<Header>{service.alias}</Header></div>
                                        <Text>{service.hint}</Text>
                                    </Div>
                                    <Separator/>
                                </>
                            )
                        })
                    }
                </Group>
            </ModalPage>
        </ModalRoot>
    );

    const [uploadedFiles, setUploadedFiles] = useState([]);

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

    const updateHistory = () => {
        StrawberryBackend.getUserResults(group.id, 50, 0)
        .then(({items}) => {
            setPosts(items);
        })
        .catch((error) => {
            console.log(error);
        })
    };

    const handleShowEditorInfo = () => {
        setActiveModal("editorInfo");
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

    const executeTextWrapper = useCallback((exec) => {
        return async (inputText) => {
            setTimeTarget(new Date().getTime() / 1000 + timeTotal);
            setIsLoading(true);
            return await exec(group.id, group.texts, inputText)
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
                return text;
            })
            .catch((error) => {
                console.log(error);
                dataset.showSnackBar({text: "Неизвестная ошибка :(", type: "danger"});
            })
            .finally(() => setIsLoading(false));
        };
    }, []);

    const handleEditPost = (post) => {
        const text = post.text;
        const id = post.post_id;
        setPostId(id);
        setText(text);
    };

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
            <SplitLayout modal={modal}>
                <SplitCol>
                    <Group>
                        <Div>
                            <Editor
                                executeTextWrapper={executeTextWrapper}
                                rows={7}
                                text={text}
                                setText={setText}
                                onShowEditorInfo={handleShowEditorInfo}

                            />
                        </Div>
                        <Div>
                            <Progress aria-labelledby="progresslabel" value={progressPercent} />
                        </Div>
                        {
                            group?.is_admin === 1 &&
                            (
                                <>
                                    <Div>
                                        <MediaBox
                                            uploadedFiles={uploadedFiles}
                                            setUploadedFiles={setUploadedFiles}
                                        />
                                    </Div>
                                    <Separator/>
                                    <PublishBox
                                        groupId={group?.id}
                                        postId={postId}
                                        text={text}
                                        showSnackBar={dataset.showSnackBar}
                                        attachments={uploadedFiles}
                                        setAttachments={setUploadedFiles}
                                        onPostPublish={(_) => setText('')}
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
