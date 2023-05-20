import { CardScroll, File, FormItem, usePlatform, Image, Card, Div, Text, Spinner } from "@vkontakte/vkui"

import styles from "./MediaBox.module.css";
import { Icon24Document, Icon56AddCircleOutline } from '@vkontakte/icons';

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
        <div className={styles.container}>
            {
                uploadedFiles && uploadedFiles.length > 0 ?
                (
                    <CardScroll
                        size={false}
                        style={{
                            flex: 1,
                        }}
                    >
                        {
                            uploadedFiles.map((file) => 
                                {
                                    let {id, src, title} = file;
                                    const maxTitleSize = 15;
                                    if (title && title.length > maxTitleSize) {
                                        title = title.slice(0, maxTitleSize) + "...";
                                    }
                                    return (
                                        <Card>
                                            <div className={styles.card_container}>
                                                <Div style={{
                                                    marginTop: '5%',
                                                }}>
                                                    <Image
                                                        key={id}
                                                        size={75}
                                                        src={src}
                                                        fallbackIcon={<Icon24Document/>}
                                                    />
                                                </Div>
                                                <Div style={{
                                                    margin: '5%',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                }}>{title}</Div>
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
                        }}
                    >
                        Нет вложений
                    </Text>
                )
            }
            <FormItem className={styles.upload_container}>
                <File
                    size="m"
                    //accept="image/png, image/jpeg"
                    onChange={handleFilesChange}
                    style={{
                        height: '100%'
                    }}
                    disabled={isUploading}
                >
                    {isUploading ? <Div style={{ marginLeft: 'auto', marginRight: 'auto'}}><Spinner size="medium"/></Div> : <Icon56AddCircleOutline role="presentation"/>}
                </File>
            </FormItem>
        </div>
    )
}

export default MediaBox;
