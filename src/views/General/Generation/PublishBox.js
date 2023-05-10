import { useState } from "react";
import StrawberryBackend from "../../../api/SBBackend";
import { Button, Checkbox, DateInput, Div, FormItem, Group } from "@vkontakte/vkui";


const PublishBox = ({groupId, text, showSnackBar, onPostPublish}) => {
    const [fromGroup, setFromGroup] = useState(true);
    const [usePublishDate, setUsePublishDate] = useState(false);
    const [publishDate, setPublishDate] = useState(() => new Date());
    const handlePublish = () => {
        let payload = {
            from_group: fromGroup ? 1 : 0, // от имени группы или нет
            signed: fromGroup ? 0 : 1, // подпись снизу
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
                    break;
                case 3: // пользователь отменил процесс публикации
                    showSnackBar({text: "Передумали?", type: "info"});
                    break;
                default: // при публикации произошла необработанная ошибка
                    showSnackBar({text: "Ошибка при публикации записи", type: "danger"});
                    break;
            }
        })
        onPostPublish && onPostPublish();
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
                >
                    Опубликовать
                </Button>
            </Div>
        </Group>
    )
}

export default PublishBox;
