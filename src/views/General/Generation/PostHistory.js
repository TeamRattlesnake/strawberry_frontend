import { Icon56RecentOutline } from "@vkontakte/icons";
import { Button, ButtonGroup, Card, CardScroll, Div, FormItem, Group, Header, Separator, Textarea, usePlatform } from "@vkontakte/vkui";
import { useEffect, useState } from "react";

import moment from 'moment-timezone';
import { FeedbackType } from ".";

import styles from "./PostHistory.module.css";

moment.locale('ru');


const PostHistory = ({onFeedback, onRecover, onEditPost, posts, updateHistory}) => {
    useEffect(() => {
        updateHistory()
    }, []);
    const [recoverablePosts, setRecoverablePosts] = useState([]);
    return (
        <Group header={<Header>История запросов</Header>}>
            <Div>
                {
                    posts && posts.length > 0
                    ?
                    <CardScroll
                        size={(usePlatform() === "ios" || usePlatform() === "android") ? "l" : "s"}
                        className={styles.card_scroll}
                    >
                        {
                            posts.map((post) => {
                                const onBadResult = () => {
                                    onFeedback(post.post_id, FeedbackType.DISLIKE, () => setRecoverablePosts((prev) => {
                                        if (prev.includes(post.post_id)) return prev;
                                        return [...prev, post.post_id];
                                    }));
                                }
                                const onGoodResult = () => {
                                    onFeedback(post.post_id, FeedbackType.LIKE);
                                }
                                const onEdit = () => {
                                    onEditPost(post);
                                }
                                return (
                                    <Card
                                        key={post.post_id}
                                        mode="shadow"
                                        style={{
                                            //flex: '2 2 auto',
                                            //paddingTop: '24px',
                                            //paddingBottom: '24px',
                                            //minWidth: '20vw',
                                            //width: '100%',
                                            position: "relative",
                                            overflow: 'hidden',
                                            //height: '10em',
                                        }}
                                    >
                                        {
                                            recoverablePosts.includes(post.post_id) &&
                                            <div className={styles.blocking_element}>
                                                <div className={styles.blocking_element_message}>
                                                    <span>Запрос удалён</span>
                                                </div>
                                                <Button
                                                    onClick={() => onRecover && onRecover(post.post_id, setRecoverablePosts)}
                                                >
                                                    Восстановить
                                                </Button>
                                            </div>
                                        }
                                        <div className={styles.content}>
                                            <Div>Создано: {moment.unix(post.date).tz("Europe/Moscow").format('YYYY-MM-DD HH:mm:ss')}</Div>
                                            <Div>Метод: {post.method}</Div>
                                            <Div>Опубликовано: {post.published ? 'Да': 'Нет'}</Div>
                                            <Separator/>
                                            <Div>
                                                <FormItem>
                                                    <Textarea
                                                        rows={7}
                                                        value={post.text}
                                                        defaultValue={post.text}
                                                        readOnly
                                                    />
                                                </FormItem>
                                            </Div>
                                            <Separator/>
                                            <Div>
                                                <ButtonGroup stretched>
                                                    <Button
                                                        stretched
                                                        appearance="negative"
                                                        onClick={onBadResult}
                                                        after={post.rating < 0 && '+1'}
                                                    >👎</Button>
                                                    <Button
                                                        stretched
                                                        appearance="positive"
                                                        onClick={onGoodResult}
                                                        after={post.rating > 0 && '+1'}
                                                    >👍</Button>
                                                </ButtonGroup>
                                            </Div>
                                            <Div>
                                                <Button
                                                    stretched
                                                    onClick={onEdit}
                                                >
                                                    Редактировать
                                                </Button>
                                            </Div>
                                        </div>
                                    </Card>
                                )
                            })
                        }
                    </CardScroll>
                    :
                    <div style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
						textAlign: "center",
						width: "100%"
					}}>
                        <Icon56RecentOutline/>
                        <span>Нет данных</span>
                    </div>
                }
            </Div>
        </Group>
    )
}

export default PostHistory;
