import API from "./API.js";
import bridge from '@vkontakte/vk-bridge';


class StrawberryBackend extends API {
    static isOK(response) {
        return response.status === 200 && response.data?.status === 0
    }

    static getData(response) {
        return response.data?.data
    }

    static async verifyToken(queryParams, accessToken) {
        return await this.makeRequest({
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
        return await this.makeRequest({
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

    static async getGroups(accessToken, offset, count) {
        const defaultResp = {"count": 0, "groups": []};
        return await this.makeRequest({
            method: "GET",
            url: "get_groups",
            params: {
                vk_token: accessToken,
                offset,
                count
            }
        }).then((resp) => {
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
        }).catch((error) => {
            console.log(error);
            return defaultResp
        })
    }

    static async getGroup(accessToken, groupId) {
        return await this.makeRequest({
            method: "GET",
            url: "get_groups",
            params: {
                vk_token: accessToken,
                group_id: groupId,
            }
        }).then((resp) => {
            if (this.isOK(resp)) {
                let data = this.getData(resp);
                return data ? {id: data.group_id, status: data.group_status} : {}
            }
            return {}
        }).catch((error) => {
            console.log(error);
            return {}
        })
    }

    static async addGroup(accessToken, groupId, texts) {
        return await this.makeRequest({
            method: "POST",
            url: "add_group",
            data: {
                vk_token: accessToken,
                group_id: groupId,
                texts
            }
        }).then((resp) => {
            return this.isOK(resp)
        }).catch((error) => {
            console.log(error);
            return false
        })
    }

    static async generateText(accessToken, groupId) {
        return await this.makeRequest({
            method: "POST",
            url: "generate_text",
            data: {
                group_id: groupId,
                vk_token: accessToken
            }
        }).then((resp) => {
            if (this.isOK(resp)) {
                return this.getData(resp)
            }
        }).catch((error) => {
            console.log(error);
        })
    }

    static async fetchGroupPosts(accessToken, groupId, numPosts) {
        return await bridge.send('VKWebAppCallAPIMethod', {
            method: 'wall.get',
            params: {
                v: '5.131',
                access_token: accessToken,
                owner_id: -groupId,
                count: numPosts,
                offset: 0,
                filter: "owner"
            }
        }).then((resp) => {
            if (resp.response?.items?.length > 0) {
                return resp.response.items.map((item) => item.text);
            }
            return []
        }).catch((error) => {
            console.log(error);
            return []
        })
    }
}

export default StrawberryBackend;
