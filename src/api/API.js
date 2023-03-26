import axios from 'axios';


const API_ENDPOINT = "https://strawberry.adefe.xyz/";

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

export const quesryStr = parseQueryString(window.location.search);
export const queryParams = parseQueryStringToObj(quesryStr);

class API {
    static makeRequest(options) {
        let endpoint = API_ENDPOINT;
        if (!endpoint.endsWith('/')) {
            endpoint += '/';
        }
        options.url = endpoint + options.url;
        return axios({
            ...options,
            headers: {
                Authorization: queryStr,
            }
        });
    }
}

export default API;
