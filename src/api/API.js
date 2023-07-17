import axios from 'axios';
import bridge from '@vkontakte/vk-bridge';


const API_ENDPOINT = "https://strawberry.adefe.xyz/api/v1/";

const parseQueryString = (string) => {
    return string.slice(1)
}

const parseQueryStringToObj = (qString) => {
	return qString.split('&')
		.map((queryParam) => {
			let kvp = queryParam.split('=');
			return {key: kvp[0], value: kvp[1]}
		})
		.reduce((query, kvp) => {
			query[kvp.key] = kvp.value;
			return query
		}, {})
};

export const queryStr = parseQueryString(window.location.search);
export const queryParams = parseQueryStringToObj(queryStr);


export let APICallbacks = [];

class API {
    static async makeRequest(options) {
        let endpoint = API_ENDPOINT;
        if (!endpoint.endsWith('/')) {
            endpoint += '/';
        }
        options.url = endpoint + options.url;
        let res = await axios({
            ...options,
            headers: {
                Authorization: queryStr,
            }
        });
        APICallbacks.map(cb => {
            res = cb(res);
        });
        return res;
    }

    static async getLSKey(key) {
        //return JSON.parse(localStorage.getItem(key));
        return await bridge.send('VKWebAppStorageGet', {
            keys: [key,]
        })
        .then((data) => {
            if (data.keys) {
                return JSON.parse(data.keys[0].value);
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }

    static async setLSKey(key, value) {
        //localStorage.setItem(key, JSON.stringify(value));
        //return true
        return await bridge.send('VKWebAppStorageSet', {
            key,
            value: JSON.stringify(value),
        })
        .then((data) => {
            if (data.result) {
                return true
            }
            return false
        })
        .catch((error) => {
            console.log(error);
        })
    }
}

export default API;
