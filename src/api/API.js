import axios from 'axios';

const API_ENDPOINT = "https://strawberry.adefe.xyz/";

class API {
    static makeRequest(options) {
        let endpoint = API_ENDPOINT;
        if (!endpoint.endsWith('/')) {
            endpoint += '/';
        }
        options.url = endpoint + options.url;
        return axios(options);
    }
}

export default API;
