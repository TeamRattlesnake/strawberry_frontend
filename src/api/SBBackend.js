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
        return StrawberryBackend.__execute("append_text", groupId, contextData, hint);
    }

    static async rephraseText(groupId, contextData, hint) {
        return StrawberryBackend.__execute("rephrase_text", groupId, contextData, hint);
    }

    static async summarizeText(groupId, contextData, hint) {
        return StrawberryBackend.__execute("summarize_text", groupId, contextData, hint);
    }

    static async unmaskText(groupId, contextData, hint) {
        return StrawberryBackend.__execute("unmask_text", groupId, contextData, hint);
    }

    static async generateText(groupId, contextData, hint) {
        return StrawberryBackend.__execute("generate_text", groupId, contextData, hint);
    }

    static async __execute(methodName, groupId, contextData, hint) {
        // генерация по теме hint
        return API.makeRequest({
            method: "POST",
            url: methodName,
            data: {
                context_data: contextData,
                hint,
                group_id: groupId
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                return StrawberryBackend.getData(resp)?.text_id;
            }
        })
        .catch((error) => {
            console.log(error);
            return false;
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
            if (error?.error_data?.error_code === 10007) return 3;
            console.log(error);
            return 2;
        });
    }

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
        return await bridge.send('VKWebAppCallAPIMethod', {
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
    }

    static async getUserResults(groupId, count, offset) {
        const defaultResp = {count: 0, items: []};
        return API.makeRequest({
            method: "GET",
            url: "get_user_results",
            params: {
                group_id: groupId,
                limit: count,
                offset,
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                return {count: response.data?.count, items: StrawberryBackend.getData(resp)};
            } else {
                return defaultResp;
            }
        })
        .catch((error) => {
            console.log(error);
            return defaultResp;
        })
    }

    static async getGenStatus(textId) {
        return API.makeRequest({
            method: "GET",
            url: "get_gen_status",
            params: {
                text_id: textId
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                const text_status = StrawberryBackend.getData(resp)?.text_status;
                return text_status === 1;
            }
            return false;
        })
        .catch((error) => {
            console.log(error);
            return false;
        })
    }

    static async getGenResult(textId) {
        return API.makeRequest({
            method: "GET",
            url: "get_gen_result",
            params: {
                text_id: textId
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                return StrawberryBackend.getData(resp)?.text_data;
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }
}

export default StrawberryBackend;
