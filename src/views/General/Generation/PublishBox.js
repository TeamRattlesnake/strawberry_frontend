import { useState } from "react";
import StrawberryBackend from "../../../api/SBBackend";
import { Button, Checkbox, DateInput, Div, FormItem, Group, Headline } from "@vkontakte/vkui";


const PublishBox = ({groupId, postId, text, showSnackBar, onPostPublish, attachments, setAttachments}) => {
    const [fromGroup, setFromGroup] = useState(true);
    const [usePublishDate, setUsePublishDate] = useState(false);
    const [publishDate, setPublishDate] = useState(() => new Date());
    const handlePublish = () => {
        let payload = {
            from_group: fromGroup ? 1 : 0, // от имени группы или нет
            signed: fromGroup ? 0 : 1, // подпись снизу
            attachments: attachments.map((attachment) => `${attachment.type}${attachment.owner_id}_${attachment.id}`).join(',')
        }
        if (usePublishDate) {
            payload['publish_date'] = Math.floor(publishDate.getTime() / 1000)
        }
        StrawberryBackend.postPublish(groupId, text, payload)
        .then((status) => {
            switch (status) {
                case 0: // пользователь нажал кнопку "Разместить запись"
                    showSnackBar({
                        text: usePublishDate ?
                        "Ура, в скором времени запись будет опубликована!"
                        :
                        "Ура, запись успешно опубликована!",
                        type: "success"});
                    StrawberryBackend.postSetPublished(postId); // отправляем информацию о том что пост был опубликован
                    onPostPublish && onPostPublish({postId});
                    setAttachments([]);
                    break;
                case 3: // пользователь отменил процесс публикации
                    showSnackBar({text: "Передумали?", type: "info"});
                    break;
                default: // при публикации произошла необработанная ошибка
                    showSnackBar({text: "Ошибка при публикации записи", type: "danger"});
                    break;
            }
        })
    }
    return (
        <Group mode="plain">
            <Div>
                <Checkbox
                    defaultChecked={usePublishDate}
                    onChange={(e) => setUsePublishDate(e.target.checked)}
                >
                    Отложенная публикация
                </Checkbox>
                {
                    usePublishDate &&
                    <FormItem top="Дата публикации">
                        <DateInput
                            value={publishDate}
                            onChange={setPublishDate}
                            enableTime
                            disablePast
                            closeOnChange
                        />
                    </FormItem>
                }
                <Checkbox
                    defaultChecked={fromGroup}
                    onChange={(e) => setFromGroup(e.target.checked)}
                >
                    От имени сообщества
                </Checkbox>
            </Div>
            <Div>
                <Button
                    stretched
                    appearance="positive"
                    onClick={handlePublish}
                    disabled={!text || text.length === 0 || postId === undefined || postId === null}
                >
                    <Headline>Опубликовать</Headline>
                </Button>
            </Div>
        </Group>
    )
}

export default PublishBox;
