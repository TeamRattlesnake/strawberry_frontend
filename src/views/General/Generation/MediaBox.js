import { CardScroll, File, usePlatform, Image, Card, Div, Text, Spinner, Button } from "@vkontakte/vkui"

import styles from "./MediaBox.module.css";
import { Icon12Cancel, Icon24Document, Icon36Add } from '@vkontakte/icons';

import bridge from '@vkontakte/vk-bridge';
import StrawberryBackend from "../../../api/SBBackend";
import { useEffect, useState } from "react";


const PHOTO_TYPES = [
    'image/png',
    'image/jpeg',
    'image/gif',
];

const MediaType = {
    PHOTO: 'photo',
    DOC: 'doc',
};

const MediaBox = ({uploadedFiles, setUploadedFiles}) => {
    
    const [isUploading, setIsUploading] = useState(false);

    const isMobile = usePlatform() === 'ios' || usePlatform() === 'android';

    const handleFilesChange = (e) => {
        if (!e.target.files?.length > 0) return;
        setIsUploading(true);
        const file = e.target.files[0];
        const isPhoto = PHOTO_TYPES.includes(file.type);
        const uploadMethod = isPhoto ? 'photos.getWallUploadServer' : 'docs.getUploadServer';
        const scope = isPhoto ? 'photos' : 'docs';
        StrawberryBackend.getVKToken(scope)
        .then((token) => {
            const uploadParams = {
                v: '5.131',
                access_token: token,
            };
            //if (isPhoto) {
            //    uploadParams['group_id'] = groupId;
            //}
            bridge.send('VKWebAppCallAPIMethod', {
                method: uploadMethod,
                params: uploadParams,
            }).then((data) => {
                return data?.response?.upload_url;
            }).then((url) => {
                if (!url) throw "Ошибка получения ссылки для загрузки";
                StrawberryBackend.uploadFile(url, file)
                .then((res) => {
                    return res.data.status === 0 ? JSON.parse(res.data.upload_result) : null;
                })
                .then((res) => {
                    if (!res) throw "Ошибка загрузки файла";
                    const saveMethod = isPhoto ? 'photos.saveWallPhoto' : 'docs.save';
                    bridge.send('VKWebAppCallAPIMethod', {
                        method: saveMethod,
                        params: {
                            v: '5.131',
                            access_token: token,
                            ...res,
                        }
                    }).then((res) => {
                        if (!res.response) throw "Ошибка сохранения файла";
                        let owner_id, id, type, src, title;
                        if (isPhoto) {
                            owner_id = res.response[0].owner_id;
                            id = res.response[0].id;
                            type = MediaType.PHOTO;
                            src = res.response[0].sizes[1].url;
                            title = file.name;
                        } else {
                            owner_id = res.response.doc.owner_id;
                            id = res.response.doc.id;
                            type = MediaType.DOC;
                            src = null;
                            title = res.response.doc.title;
                        }
                        setUploadedFiles((pred) => [...pred, {type, id, owner_id, src, title}]);
                    }).catch((error) => console.log(error))
                    .finally(() => setIsUploading(false));
                })
                .catch((err) => {
                    console.log(err);
                    setIsUploading(false);
                })
            }).catch((err) => {
                console.log(err);
                setIsUploading(false);
            });
        })
    }

    return (
        <div className={styles.container} style={{
            flexDirection: isMobile ? 'column' : 'row',
        }}>
            {
                uploadedFiles && uploadedFiles.length > 0 ?
                (
                    <CardScroll
                        size={false}
                        className={styles.card_scroll_container}
                        style={{
                            width: isMobile ? '100%' : '80%',
                        }}
                    >
                        {
                            uploadedFiles.map((file, idx) => 
                                {
                                    let {id, src, title} = file;
                                    return (
                                        <Card>
                                            <div className={styles.card_container}>
                                                <div
                                                    className={styles.card_child}
                                                    style={{
                                                        marginTop: '10%',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    <Image
                                                        key={id}
                                                        size={100}
                                                        src={src}
                                                        fallbackIcon={<Icon24Document/>}
                                                    />
                                                    <Button
                                                        size="s"
                                                        appearance="negative"
                                                        before={<Icon12Cancel/>}
                                                        className={styles.remove_button}
                                                        onClick={() => setUploadedFiles((pred) => [...pred.slice(0, idx), ...pred.slice(idx+1,)])}
                                                    />
                                                </div>
                                                <div
                                                    className={styles.card_child}
                                                    style={{
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    <span className={styles.attachment_title}>{title}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                }
                            )
                        }
                    </CardScroll>
                )
                :
                (
                    <Text
                        style={{
                            marginRight: 'auto',
                            marginLeft: 'auto',
                            marginTop: '2rem',
                            marginBottom: '2rem',
                        }}
                    >
                        Нет вложений
                    </Text>
                )
            }
            <File
                size="m"
                //accept="image/png, image/jpeg"
                onChange={handleFilesChange}
                className={styles.upload_container}
                style={{
                    width: isMobile ? '100%' : '20%',
                    borderRadius: isMobile ? 'none !important' : 'inherit',
                }}
                disabled={isUploading}
            >
                <Div style={{ marginLeft: 'auto', marginRight: 'auto'}}>{isUploading ? <Spinner size="medium"/> : <Icon36Add role="presentation"/>}</Div>
            </File>
        </div>
    )
}

export default MediaBox;
