import API, { queryParams } from "./API.js";
import bridge from '@vkontakte/vk-bridge';


class StrawberryBackend {
    static isOK(response) {
        return response.status === 200 && response.data?.status === 0
    }

    static getData(response) {
        return response.data?.data
    }

    static async renewToken(oldToken, newToken) {
        return API.makeRequest({
            method: "POST",
            url: "renew",
            data: {
                old_vk_token: oldToken,
                new_vk_token: newToken
            }
        }).then((resp) => {
            return StrawberryBackend.isOK(resp)
        }).catch((error) => {
            console.log(error)
            return false
        });
    }

    static async getVKToken() {
        return await bridge.send('VKWebAppGetAuthToken', {
            scope: 'groups,wall',
            app_id: Number(queryParams['vk_app_id']), //51575840
        }).then((data) => {
            return data?.access_token
        }).catch((error) => {
            console.log(error);
            return ""
        })
    }

    /*
    static async getGroups(offset, count) {
        const defaultResp = {"count": 0, "groups": []};
        return API.makeRequest({
            method: "GET",
            url: "get_groups",
            params: {
                offset,
                count
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                let data = StrawberryBackend.getData(resp) || []
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

    static async getGroup(groupId) {
        return API.makeRequest({
            method: "GET",
            url: "get_groups",
            params: {
                group_id: groupId,
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                let data = StrawberryBackend.getData(resp); // returning groups (array)
                return (data && data.length > 0) ? {id: data[0].group_id, status: data[0].group_status} : {}
            }
            return {}
        })
        .catch((error) => {
            console.log(error);
            return {}
        })
    }

    static async addGroup(groupId, texts) {
        return API.makeRequest({
            method: "POST",
            url: "add_group",
            data: {
                group_id: groupId,
                texts
            }
        })
        .then((resp) => {
            return StrawberryBackend.isOK(resp)
        })
        .catch((error) => {
            console.log(error);
            return false
        })
    }
    */

    static async sendFeedback(resultId, score) {
        return API.makeRequest({
            method: "POST",
            url: "send_feedback",
            data: {
                result_id: resultId,
                score,
            }
        })
        .then((resp) => {
            return StrawberryBackend.isOK(resp);
        })
        .catch((error) => {
            console.log(error)
            return false;
        })
    }

    static async appendText(groupId, contextData, hint) {
        return API.makeRequest({
            method: "POST",
            url: "append_text",
            data: {
                context_data: contextData,
                hint,
                group_id: groupId
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                return StrawberryBackend.getData(resp);
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }

    static async rephraseText(groupId, contextData, hint) {
        return API.makeRequest({
            method: "POST",
            url: "rephrase_text",
            data: {
                context_data: contextData,
                hint,
                group_id: groupId
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                return StrawberryBackend.getData(resp);
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }

    static async summarizeText(groupId, contextData, hint) {
        return API.makeRequest({
            method: "POST",
            url: "summarize_text",
            data: {
                context_data: contextData,
                hint,
                group_id: groupId
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                return StrawberryBackend.getData(resp);
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }

    static async unmaskText(groupId, contextData, hint) {
        return API.makeRequest({
            method: "POST",
            url: "unmask_text",
            data: {
                context_data: contextData,
                hint,
                group_id: groupId
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                return StrawberryBackend.getData(resp);
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }

    static async generateText(groupId, contextData, hint) {
        // генерация по теме hint
        return API.makeRequest({
            method: "POST",
            url: "generate_text",
            data: {
                context_data: contextData,
                hint,
                group_id: groupId
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                return StrawberryBackend.getData(resp);
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }

    static async fetchGroupPosts(groupId, numPosts) {
        const accessToken = await StrawberryBackend.getVKToken();
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

    static async publishPost(groupId, text, options) {
        // опубликовать в группе
        return bridge.send('VKWebAppShowWallPostBox', {
            owner_id: -groupId,
            message: text,
            ...options
        })
        .then((data) => {
            return data.post_id ? 0 : 1;
        })
        .catch((error) => {
            // Ошибка
            console.log(error);
            return 2
        });
    }

    /*
    static async getGroupsConnected(currentPage, perPage) {
        const accessToken = await StrawberryBackend.getVKToken();
        let groupsData = await StrawberryBackend.getGroups((currentPage-1)*perPage, perPage).then((resp) => {
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
        groupsData.items = await Promise.all(groupsData.items.map((group) => {
            return StrawberryBackend.getGroup(group.id)
            .then((resp) => {
                group.ready = resp.status === 0
                return group
            })
            .catch((error) => {
                console.log(error);
                group.ready = false;
                return group
            })
        }));
        return groupsData;
    }

    static async getGroupsStatuses(groupIds) {
        return Promise.all(groupIds.map((groupId) => StrawberryBackend.getGroup(groupId)))
        .then((resps) => {
            return resps.map((resp) => resp.status === 0)
        })
    }
    */

    static async searchGroups(query, currentPage, perPage) {
        const accessToken = await StrawberryBackend.getVKToken();
        let groupsData = await bridge.send('VKWebAppCallAPIMethod', {
            method: 'groups.search',
            params: {
                v: '5.131',
                access_token: accessToken,
                q: query,
                offset: (currentPage-1)*perPage,
                count: perPage,
            }
        })
        .then((data) => {
            if (data.response) {
                return {
                    "count": Math.ceil(data.response.count/perPage),
                    "items": data.response.items,
                }
            } else {
                return {
                    "count": 0,
                    "items": [],
                }
            }
        })
        .catch((error) => {
            console.log(error);
            return {
                "count": 0,
                "items": [],
            }
        })
        return groupsData
    }

    static async getGroups(currentPage, perPage, mode) {
        const accessToken = await StrawberryBackend.getVKToken();
        let groupsData = await bridge.send('VKWebAppCallAPIMethod', {
            method: 'groups.get',
            params: {
                filter: mode,
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

        /*
        groupsData.items = await Promise.all(groupsData.items.map((item) => {
            if (!item) return item;
            return StrawberryBackend.getGroup(item.id)
            .then((group) => {
                console.log('item', item, 'group', group);
                item.connected = Boolean(group && Object.keys(group).length > 0 && group.status !== null && group.status !== undefined && group.status != 2);
                return item
            })
            .catch((_) => {
                item.connected = false;
                return item
            })
        }));
        */
        return groupsData;
    }
}

export default StrawberryBackend;
