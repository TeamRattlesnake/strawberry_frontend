import API, { queryParams } from "./API.js";
import bridge from '@vkontakte/vk-bridge';


export const GenerationMethod = {
    GENERATE_TEXT: 'generate_text',
    APPEND_TEXT: 'append_text',
    SUMMARIZE_TEXT: 'summarize_text',
    EXTEND_TEXT: 'extend_text',
    REPHRASE_TEXT: 'rephrase_text',
    UNMASK_TEXT: 'unmask_text',
    SCRATCH: "gen_from_scratch",
    FIX_GRAMMAR: "fix_grammar",
};

class StrawberryBackend {

    static isOK(response, isSoft = false) {
        return response.status === 200 && (isSoft || (!isSoft && response.data?.status === 0))
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

    static async getVKToken(scope='groups,wall') {
        const info = await API.getLSKey("access_token_data") || {};
        return await bridge.send('VKWebAppGetAuthToken', {
            scope,
            app_id: Number(queryParams['vk_app_id']), //51575840
        }).then((data) => {
            if (data?.access_token) {
                const newInfo = {...info, [scope]: data?.access_token};
                API.setLSKey("access_token_data", newInfo);
            }
            return data?.access_token
        }).catch((error) => {
            console.log(error);
            return ""
        })
    }

    static async postLike(resultId) {
        return API.makeRequest({
            method: "POST",
            url: `post/${resultId}/like`,
        })
        .then((resp) => {
            return StrawberryBackend.isOK(resp);
        })
        .catch((error) => {
            console.log(error)
            return false;
        })
    }

    static async postDislike(resultId) {
        return API.makeRequest({
            method: "POST",
            url: `post/${resultId}/dislike`,
        })
        .then((resp) => {
            return StrawberryBackend.isOK(resp);
        })
        .catch((error) => {
            console.log(error)
            return false;
        })
    }

    static async postSetPublished(resultId) {
        return API.makeRequest({
            method: "POST",
            url: `post/${resultId}/publish`,
        })
        .then((resp) => {
            return StrawberryBackend.isOK(resp);
        })
        .catch((error) => {
            console.log(error)
            return false;
        })
    }

    static async postRecover(resultId) {
        return API.makeRequest({
            method: "POST",
            url: `post/${resultId}/recover`,
        })
        .then((resp) => {
            return StrawberryBackend.isOK(resp);
        })
        .catch((error) => {
            console.log(error)
            return false;
        })
    }

    static async postDelete(resultId) {
        return API.makeRequest({
            method: "DELETE",
            url: `post/${resultId}`,
        })
        .then((resp) => {
            return StrawberryBackend.isOK(resp);
        })
        .catch((error) => {
            console.log(error)
            return false;
        })
    }

    static async generate(methodName, groupId, contextData, hint) {
        return await API.makeRequest({
            method: "POST",
            url: "generation/generate",
            data: {
                method: methodName,
                context_data: contextData,
                hint,
                group_id: groupId
            }
        })
        .then((resp) => {
            if (!StrawberryBackend.isOK(resp, true)) return {};
            console.log(resp.data);
            return {
                status: resp.data?.status,
                text_id: StrawberryBackend.getData(resp)?.text_id,
            }
        })
        .catch((error) => {
            console.log(error);
            return {};
        })
    }

    static async fetchGroupPosts(groupId, numPosts) {
        const accessToken = await StrawberryBackend.getVKToken('groups');
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

    static async postPublish(groupId, text, options, showPost = true) {
        // опубликовать в группе
        return bridge.send('VKWebAppShowWallPostBox', {
            owner_id: -groupId,
            message: text,
            ...options
        })
        .then((data) => {
            if (!data.post_id) return 1;
            showPost && bridge.send("VKWebAppOpenWallPost", {"owner_id": -groupId, "post_id": data.post_id}); // показать пост
            return 0;
        })
        .catch((error) => {
            if (error?.error_data?.error_code === 10007) return 3;
            console.log(error);
            return 2;
        });
    }

    static async searchGroups(query, currentPage, perPage) {
        const accessToken = await StrawberryBackend.getVKToken('groups');
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
        const accessToken = await StrawberryBackend.getVKToken('groups');
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
            url: "posts",
            params: {
                group_id: groupId,
                limit: count,
                offset,
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                return {count: resp.data?.count, items: StrawberryBackend.getData(resp)};
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
            url: "generation/status",
            params: {
                text_id: textId
            }
        })
        .then((resp) => {
            if (StrawberryBackend.isOK(resp)) {
                const text_status = StrawberryBackend.getData(resp)?.text_status;
                return text_status === 2 ? null : text_status === 1;
            }
            return null;
        })
        .catch((error) => {
            console.log(error);
            return null;
        })
    }

    static async getGenResult(textId) {
        return API.makeRequest({
            method: "GET",
            url: "generation/result",
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

    static async hasScope(scope) {
        return API.getLSKey("access_token_data")
        .then((data) => {
            const val = data?.[scope]
            const out = val !== null && val !== undefined;
            return out
        })
    }
    
    static async uploadFile(uploadUrl, file) {
        const formData = new FormData();
        formData.append("upload_url", uploadUrl);
        formData.append("file", file);
        return API.makeRequest({
            method: 'POST',
            url: 'files/upload',
            data: formData
        })
    }
}

export default StrawberryBackend;
