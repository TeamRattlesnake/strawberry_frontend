import API from "./API.js";
import bridge from '@vkontakte/vk-bridge';


const parseQueryString = (string) => {
	return string.slice(1).split('&')
		.map((queryParam) => {
			let kvp = queryParam.split('=');
			return {key: kvp[0], value: kvp[1]}
		})
		.reduce((query, kvp) => {
			query[kvp.key] = kvp.value;
			return query
		}, {})
};

const queryParams = parseQueryString(window.location.search);


class StrawberryBackend extends API {
    static isOK(response) {
        return response.status === 200 && response.data?.status === 0
    }

    static getData(response) {
        return response.data?.data
    }

    static async verifyToken(queryParams, accessToken) {
        return this.makeRequest({
            method: "POST",
            url: "verify",
            data: {
                request: queryParams,
                vk_token: accessToken
            }
        }).then((resp) => {
            return this.isOK(resp)
        }).catch((error) => {
            console.log(error);
            return false
        });
    }

    static async renewToken(oldToken, newToken) {
        return this.makeRequest({
            method: "POST",
            url: "renew",
            data: {
                old_vk_token: oldToken,
                new_vk_token: newToken
            }
        }).then((resp) => {
            return this.isOK(resp)
        }).catch((error) => {
            console.log(error)
            return false
        });
    }

    static async getToken(showSnackBar) {
        const tokenData = JSON.parse(localStorage.getItem("strawberry_data"));
        const authToken = tokenData?.token;
        const expires = tokenData?.expires;
        const timeStamp = Math.floor(Date.now() / 1000);
        const update = true; // будем насильно обновлять каждый раз //expires && ((expires - 100) < timeStamp); 
        const tokenExists = Boolean(authToken);
        const addToken = (token, expires) => {
            localStorage.setItem("strawberry_data", JSON.stringify({token, expires}));
            return token
        }
        const verifyPromise = (token, expires) => StrawberryBackend.verifyToken(queryParams, token)
        .then((ok) => {
            if (!ok) throw "Ошибка при верификации токена";
            showSnackBar && showSnackBar({
                text: "Успешная авторизация!",
                type: "success",
            });
            return addToken(token, expires);
        })
        .catch((error) => {
            console.log(error);
            showSnackBar && showSnackBar({
                text: "Ошибка при верификации на сервере",
                type: "danger",
            });
        })
        if (tokenExists && !update) {
            await verifyPromise(authToken, expires);
            return authToken;
        } else {
            // токен не существует локально или его нужно обновить
            return await bridge.send('VKWebAppGetAuthToken', {
                scope: 'groups,wall',
                app_id: Number(queryParams['vk_app_id']), //51575840
            }).then((data) => {
                // при успешном запросе на получение токена
                if (!data.access_token) throw "Отсутствует токен"; // если поле токена отсутствует/пустое, выбрасываем ошибку
                if (tokenExists) { // иначе, если предыдущий токен существует
                    // обновляем этот предыдущий токен на новый, при этом при ошибке обновления верифицируем новый
                    return StrawberryBackend.renewToken(authToken, data.access_token)
                        .then((ok) => {
                            if (!ok) throw "Ошибка при обновлении токена";
                            return addToken(data.access_token, data.expires);
                        })
                        .catch((_) => {
                            // произошла ошибка при обновлении токена, тогда верифицируем новый
                            return verifyPromise(data.access_token, data.expires)
                    });
                } else {
                    // предыдущего токена не существует, верифицируем новый
                    return verifyPromise(data.access_token, data.expires);
                }
            }).catch((error) => {
                console.log(error)
                showSnackBar && showSnackBar({
                    text: "Ошибка при авторизации в ВК",
                    type: "danger",
                });
            })
        }
    }

    static async getGroups(showSnackBar, offset, count) {
        const accessToken = await StrawberryBackend.getToken(showSnackBar);
        const defaultResp = {"count": 0, "groups": []};
        return this.makeRequest({
            method: "GET",
            url: "get_groups",
            params: {
                vk_token: accessToken,
                offset,
                count
            }
        })
        .then((resp) => {
            if (this.isOK(resp)) {
                let data = this.getData(resp) || []
                data = {
                    count: resp.data.count || 0,
                    groups: data.map((group) => {
                        return {id: group.group_id, status: group.group_status}
                    })
                }
                return data
            }
            return defaultResp
        })
        .catch((error) => {
            console.log(error);
            return defaultResp
        })
    }

    static async getGroup(showSnackBar, groupId) {
        const accessToken = await StrawberryBackend.getToken(showSnackBar);
        return this.makeRequest({
            method: "GET",
            url: "get_groups",
            params: {
                vk_token: accessToken,
                group_id: groupId,
            }
        })
        .then((resp) => {
            if (this.isOK(resp)) {
                let data = this.getData(resp); // returning groups (array)
                return (data && data.length > 0) ? {id: data[0].group_id, status: data[0].group_status} : {}
            }
            return {}
        })
        .catch((error) => {
            console.log(error);
            return {}
        })
    }

    static async addGroup(showSnackBar, groupId, texts) {
        const accessToken = await StrawberryBackend.getToken(showSnackBar);
        return this.makeRequest({
            method: "POST",
            url: "add_group",
            data: {
                vk_token: accessToken,
                group_id: groupId,
                texts
            }
        })
        .then((resp) => {
            return this.isOK(resp)
        })
        .catch((error) => {
            console.log(error);
            return false
        })
    }

    static async generateText(showSnackBar, groupId) {
        const accessToken = await StrawberryBackend.getToken(showSnackBar);
        return this.makeRequest({
            method: "POST",
            url: "generate_text",
            data: {
                group_id: groupId,
                vk_token: accessToken
            }
        })
        .then((resp) => {
            if (this.isOK(resp)) {
                return this.getData(resp)
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }

    static async fetchGroupPosts(showSnackBar, groupId, numPosts) {
        const accessToken = await StrawberryBackend.getToken(showSnackBar);
        return bridge.send('VKWebAppCallAPIMethod', {
            method: 'wall.get',
            params: {
                v: '5.131',
                access_token: accessToken,
                owner_id: -groupId,
                count: numPosts,
                offset: 0,
                filter: "owner"
            }
        })
        .then((resp) => {
            if (resp.response?.items?.length > 0) {
                return resp.response.items.map((item) => item.text).filter((text) => Boolean(text));
            }
            return []
        })
        .catch((error) => {
            console.log(error);
            return []
        })
    }

    static async publishPost(showSnackBar, groupId, text) {
        // опубликовать в группе
        return bridge.send("VKWebAppGetCommunityToken", {
            app_id: Number(queryParams['vk_app_id']), //51575840,
            group_id: groupId,
            scope: 'manage'
            })
        .then((data) => { 
            if (!data.access_token) return;
            return bridge.send('VKWebAppCallAPIMethod', {
                method: 'wall.post',
                params: {
                    v: '5.131',
                    access_token: data.access_token,
                    owner_id: -groupId,
                    message: text
                }
            })
            .then((vkResp) => {
                if (vkResp.response) {
                    showSnackBar({text: "Ура, запись успешно опубликована!", type: "success"});
                } else {
                    showSnackBar({text: "Ошибка при публикации записи", type: "danger"});
                }
                return vkResp.response ? true : false
            });
        })
        .catch((error) => {
            // Ошибка
            console.log(error);
            showSnackBar({text: "Ошибка при подключении сообщества", type: "danger"});
            return false
        });
    }

    static async getGroupsConnected(showSnackBar, currentPage, perPage) {
        const accessToken = await StrawberryBackend.getToken(showSnackBar);
        return StrawberryBackend.getGroups(showSnackBar, (currentPage-1)*perPage, perPage).then((resp) => {
            if (!resp?.groups || (resp?.groups?.length <= 0)) {
                return {"count": 0, "items": []}
            }
            return bridge.send('VKWebAppCallAPIMethod', {
                method: 'groups.getById',
                params: {
                    v: '5.131',
                    group_ids: resp.groups.map(({id}) => id).join(','),
                    access_token: accessToken
                }
            })
            .then((vkResp) => {
                if (vkResp.response) {
                    const groups = resp.groups.map((group, idx) => {
                        return {...group, ...vkResp.response[idx]}
                    });
                    return {"count": resp.count, "items": groups}
                } else {
                    return {"count": 0, "items": []}
                }
            })
            .catch((error) => {
                console.log(error);
                return {"count": 0, "items": []}
            })
        });
    }

    static async getGroupsManaged(showSnackBar, currentPage, perPage) {
        const accessToken = await StrawberryBackend.getToken(showSnackBar);
        return bridge.send('VKWebAppCallAPIMethod', {
            method: 'groups.get',
            params: {
                filter: "moder",
                extended: 1,
                v: '5.131',
                access_token: accessToken,
                offset: (currentPage-1)*perPage,
                count: perPage
            }})
            .then((data) => { 
                if (data.response) {
                    return {
                        "count": Math.ceil(data.response.count/perPage),
                        "items": data.response.items
                    }
                    /*.map(async function (item) {
                        return await StrawberryBackend.getGroup(accessToken, item.id)
                        .then((group) => {
                            item.connected = Boolean(group);
                            return item
                        })
                        .catch((error) => {
                            console.log(error);
                            item.connected = false;
                            return item
                        })
                    }));
                    */
                } else {
                    return {
                        "count": 0,
                        "items": []
                    }
                }
            })
            .catch((error) => {
                console.log(error);
                return {
                    "count": 0,
                    "items": []
                }
            }
        );
    }
}

export default StrawberryBackend;
