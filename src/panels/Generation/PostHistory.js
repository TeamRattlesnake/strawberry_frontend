import { Icon56RecentOutline } from "@vkontakte/icons";
import { Button, ButtonGroup, Card, CardScroll, Div, Group, Header, Textarea } from "@vkontakte/vkui";
import { useEffect } from "react";

import moment from 'moment-timezone';
moment.locale('ru');


const PostHistory = ({items, maxLen, onFeedback}) => {
    maxLen = maxLen || 50;
    useEffect(() => {
        items = items.slice(items.length-maxLen);
        localStorage.setItem("sb_post_history", JSON.stringify(items))
    });
    return (
        <Group header={<Header>История запросов</Header>}>
            <Div>
                {
                    items && items.length > 0
                    ?
                    <CardScroll size="l">
                        {
                            items.map((item) => {
                                const onBadResult = () => onFeedback(item.id, -1);
                                const onGoodResult = () => onFeedback(item.id, 1);
                                return (
                                    <Card
                                        key={item.id}
                                        mode="shadow"
                                        style={{
                                            flex: '2 2 auto',
                                            paddingTop: '24px',
                                            paddingBottom: '24px',
                                            minWidth: '40vw'
                                        }}
                                    >
                                        <div>
                                            <Div>Создано: {moment.unix(item.datetime).tz("Europe/Moscow").format('YYYY-MM-DD HH:mm:ss')}</Div>
                                            <Div>
                                                <Textarea
                                                    id={item.id}
                                                    value={item.text}
                                                    defaultValue={item.text}
                                                    rows={6}
                                                    readOnly
                                                />
                                            </Div>
                                            <Div>
                                                <ButtonGroup stretched>
                                                    <Button
                                                        stretched
                                                        appearance="negative"
                                                        onClick={onBadResult}
                                                    >👎</Button>
                                                    <Button
                                                        stretched
                                                        appearance="positive"
                                                        onClick={onGoodResult}
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
