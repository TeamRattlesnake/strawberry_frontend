import { Icon56RecentOutline } from "@vkontakte/icons";
import { Button, ButtonGroup, Card, CardScroll, Div, Group, Header, Separator, Textarea } from "@vkontakte/vkui";
import { useEffect, useState } from "react";

import moment from 'moment-timezone';

moment.locale('ru');


const PostHistory = ({onFeedback, posts, updateHistory}) => {
    useEffect(() => {
        updateHistory()
    }, []);
    return (
        <Group header={<Header>История запросов</Header>}>
            <Div>
                {
                    posts && posts.length > 0
                    ?
                    <CardScroll size="l">
                        {
                            posts.map((post) => {
                                const onBadResult = () => {
                                    onFeedback(post.post_id, -1);
                                    updateHistory();
                                }
                                const onGoodResult = () => {
                                    onFeedback(post.post_id, 1);
                                    updateHistory();
                                }
                                return (
                                    <Card
                                        key={post.id}
                                        mode="shadow"
                                        style={{
                                            flex: '2 2 auto',
                                            paddingTop: '24px',
                                            paddingBottom: '24px',
                                            minWidth: '40vw'
                                        }}
                                    >
                                        <div>
                                            <Div>Создано: {moment.unix(post.date).tz("Europe/Moscow").format('YYYY-MM-DD HH:mm:ss')}</Div>
                                            <Separator/>
                                            <Div>
                                                <Textarea
                                                    value={post.text}
                                                    defaultValue={post.text}
                                                    rows={6}
                                                    readOnly
                                                />
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
